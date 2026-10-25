// 練習モード用の設計図づくり。LLM を呼ばずに、一文を辞書（lexicon.ts）で読み解いて設計図を組み立てる。
// 場所・時間・天気・人物・動物・動き・音・画面の文字を英語の指示にし、動きの順にカットを分ける。
// 辞書にない言葉は日本語のまま指示文に残すので、一文の要素は落ちない（system-prompt.md のルール1）。
// 本番では tools/prompt-expander/system-prompt.md を LLM に渡して設計図を作る。

import { analyze, type Hit, type Quote } from "@/lib/plan/analyze";
import type { Framing, ObjectDef, SubjectDef, VerbDef } from "@/lib/plan/lexicon";
import { SUBJECTS } from "@/lib/plan/lexicon";
import type { Brief, Character, Dialogue, Mood, Plan, Shot } from "@/lib/types";

const MOOD_STYLE: Record<Mood, string> = {
  cute: "soft pastel colors, gentle diffused light",
  cinematic: "cinematic, shallow depth of field, subtle film grain",
  anime: "Japanese anime style, clean cel shading",
  auto: "photorealistic, natural light",
};

// 写真から作るときの「おまかせ」は、写真の見た目を変えない
const IMAGE_AUTO_STYLE = "keep the look, colors and lighting of the input image";

const BASE_NEGATIVE = ["subtitles", "captions", "watermark", "logo", "distorted hands", "extra limbs"];

const MAX_CHARACTERS = 3;
const IDS = ["A", "B", "C"];

// 性的・暴力的な内容は作らない（system-prompt.md のルール11）
const NG = /裸|ヌード|エロ|性行為|セックス|殺害|殺す|殺し|惨殺|血まみれ|流血|自殺|爆弾|(?<!飯)テロ|虐待/;

/** 一文の中の「」で囲まれたセリフを取り出す（画面の文字は除く） */
export function extractLines(sentence: string): string[] {
  return analyze(sentence).lines.map((l) => l.text);
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const sentenceOf = (s: string) => {
  const t = capitalize(s.trim());
  return /[.!?」]$/.test(t) ? t : t + ".";
};

/** 英語の動詞句（原形）を三人称単数にする（先頭の語だけ） */
function thirdPerson(phrase: string): string {
  const [first, ...rest] = phrase.split(" ");
  let v: string;
  if (first === "be") v = "is";
  else if (first === "have") v = "has";
  else if (/(s|sh|ch|x|z|o)$/.test(first)) v = first + "es";
  else if (/[^aeiou]y$/.test(first)) v = first.slice(0, -1) + "ies";
  else v = first + "s";
  return [v, ...rest].join(" ");
}
const plural = (phrase: string) => phrase.replace(/^be\b/, "are");
/** 名詞句が複数か（前置詞や分詞の前までの語で見る） */
function isPlural(noun: string): boolean {
  if (/^(a|an|the) /i.test(noun)) return false;
  const head: string[] = [];
  for (const w of noun.split(" ")) {
    if (/^(with|of|in|on|at|from|topped|hanging|floating)$/.test(w) || /ing$/.test(w)) break;
    head.push(w);
  }
  return /[^s]s$/.test(head[head.length - 1] ?? "");
}

const withArticle = (color: string, en: string) => {
  const body = en.replace(/^(a|an) /, "");
  const article = /^[aeiou]/.test(color) ? "an" : "a";
  return /^(a|an) /.test(en) ? `${article} ${color} ${body}` : `${color} ${body}`;
};

interface Cast {
  id: string;
  def: SubjectDef;
  clothes?: string;
  props: string[];
  cartoon: boolean;
}

interface Unit {
  hit: Hit;
  verb: VerbDef;
  actors: string[];
  object?: string;
  objectHit?: Hit;
  /** 「〜に」でつながっている（「黒板に書く」） */
  on?: boolean;
  /** 物が主語のとき（「香水が光る」）の英語 */
  thing?: string;
  /** 主語がなく、alone の文にするとき */
  alone?: boolean;
  adverb?: string;
  /** 「学校へ走る」の行き先 */
  dest?: string;
  sfx?: string;
  shot: number;
}

// 写真から作るとき、一文に主語がない場合の主役
const IMAGE_SUBJECT: SubjectDef = {
  kind: "subject", ja: [], key: "image_subject", label: "写真の主役", noun: "main subject", gender: "n",
  base: "the main subject of the input image", voice: "natural voice that fits the subject",
};

const near = (a: Hit | Quote, b: Hit | Quote) => Math.abs(a.start - b.start);

export function mockPlan(brief: Brief): Plan {
  const sentence = brief.sentence_ja.trim();
  const fromImage = brief.from_image === true;
  const vertical = brief.purpose === "sns_vertical";
  const a = analyze(sentence);
  const of = <K extends Hit["entry"]["kind"]>(kind: K) =>
    a.hits.filter((h) => h.entry.kind === kind) as (Hit & { entry: Extract<Hit["entry"], { kind: K } > })[];

  const base = {
    title_ja: Array.from(sentence).slice(0, 20).join(""),
    aspect_ratio: (vertical ? "9:16" : "16:9") as Plan["aspect_ratio"],
    duration_sec: brief.duration_sec,
  };

  if (NG.test(sentence)) {
    return {
      ...base, style: "", setting: "", characters: [], shots: [], music: null, on_screen_text: [], negative: BASE_NEGATIVE,
      elements_ja: [], assumptions_ja: [],
      safety: { ok: false, notes_ja: "性的・暴力的な内容は作れません。別の一文にしてください" },
    };
  }

  const assumptions: string[] = [];
  const assume = (s?: string) => s && !assumptions.includes(s) && assumptions.push(s);

  // ── 登場人物 ──
  const cast: Cast[] = [];
  const hitIds = new Map<Hit, string[]>();
  const addCast = (def: SubjectDef): string | undefined => {
    const found = cast.find((c) => c.def.key === def.key);
    if (found) return found.id;
    if (cast.length >= MAX_CHARACTERS) return undefined;
    const id = IDS[cast.length];
    cast.push({ id, def, props: [], cartoon: false });
    if (!fromImage) assume(def.assume);
    return id;
  };
  const subjectHits = a.hits.filter((h) => h.entry.kind === "subject" || h.entry.kind === "pair");
  const singles = subjectHits.filter((h) => h.entry.kind === "subject");
  for (const h of subjectHits) {
    if (h.entry.kind === "subject") {
      const id = addCast(h.entry);
      if (id) hitIds.set(h, [id]);
    } else if (h.entry.kind === "pair") {
      const persons = singles.filter((s) => s.entry.kind === "subject" && !s.entry.animal);
      if (persons.length >= 2) continue; // 「女性と男性の二人」は2人を指すだけ
      const ids = h.entry.members.map((k) => addCast(SUBJECTS.find((s) => s.key === k)!)).filter((x): x is string => !!x);
      hitIds.set(h, ids);
      if (!fromImage) assume(h.entry.assume);
    }
  }
  for (const [h, ids] of hitIds) if (h.entry.kind === "pair") hitIds.set(h, Array.from(new Set(ids)));
  const castHits = [...hitIds.keys()].sort((x, y) => x.start - y.start);

  /** その言葉の主語（直前の人物、なければ直後の人物） */
  const actorOf = (h: Hit): string[] => {
    const before = castHits.filter((c) => c.start <= h.start);
    if (before.length) return hitIds.get(before[before.length - 1])!;
    const after = castHits.find((c) => c.start > h.start);
    return after ? hitIds.get(after)! : [];
  };

  // ── 動き ──
  const objectish = a.hits.filter((h) => ["object", "prop", "place", "subject"].includes(h.entry.kind));
  const consumed = new Set<Hit>();
  const units: Unit[] = [];
  const speechHits: Hit[] = [];
  const cryObjects: Hit[] = [];
  const destinations = new Set<Hit>();
  const modifiers = of("modifier");
  const colors = of("color");

  const colored = (h: Hit, en: string) => {
    const c = colors.find((x) => x.end <= h.start && h.start - x.end <= 1);
    return c ? withArticle(c.entry.en, en) : en;
  };
  const nameOf = (h: Hit): string => {
    if (hitIds.has(h)) return hitIds.get(h)!.join(" and ");
    const e = h.entry;
    if (e.kind === "prop") return colored(h, e.en.replace(/^holding /, ""));
    if ("en" in e) return colored(h, e.en);
    return h.ja;
  };

  // 間の擬音や「ゆっくり」などは飛ばして「〜を」を見る
  const gapOf = (from: number, to: number) => {
    let gap = sentence.slice(from, to);
    for (const x of a.hits) if ((x.entry.kind === "sound" || x.entry.kind === "modifier") && x.start >= from && x.end <= to) gap = gap.replace(x.ja, "");
    return gap.replace(/「[^」]*」/g, "").replace(/と$/, "");
  };
  for (const h of of("verb")) {
    const verb = h.entry;
    if (verb.speech && a.lines.length) {
      speechHits.push(h);
      continue;
    }
    if (verb.cry) {
      // 直前が音の出る物（風鈴など）なら物の音、動物なら鳴き声
      const prev = a.hits.filter(
        (x) => x.start < h.start && !x.implied && (hitIds.has(x) || (x.entry.kind === "object" && x.entry.sound) || x.entry.kind === "sound"),
      ).pop();
      if (!prev || !hitIds.has(prev)) {
        if (prev) cryObjects.push(prev);
        continue;
      }
      const actor = cast.find((c) => c.id === hitIds.get(prev)![0]);
      if (!actor?.def.animal) continue;
      units.push({ hit: h, verb, actors: [actor.id], sfx: actor.def.cry, shot: 0 });
      continue;
    }
    const unit: Unit = { hit: h, verb, actors: verb.tpl && !verb.tpl.includes("{s}") ? [] : actorOf(h), shot: 0 };
    // 直前の「〇〇が」が物なら、物を主語にする（「香水が光る」「風船が飛んでいく」）
    if (!verb.tpl) {
      const subj = a.hits
        .filter((x) => x.end <= h.start && (hitIds.has(x) || ["object", "prop", "genre"].includes(x.entry.kind)) && /^[がはも]/.test(sentence.slice(x.end)))
        .pop();
      if (subj && !hitIds.has(subj)) {
        unit.actors = [];
        unit.thing = subj.entry.kind === "genre" ? (subj.entry.genre === "food" ? "the dish" : "the product") : nameOf(subj);
        consumed.add(subj);
      }
    }
    if (verb.en.includes("{o}")) {
      const obj = objectish
        .filter((o) => o.end <= h.start && /^(?:を|に|へ|の方を|に向かって|を目指して)?$/.test(gapOf(o.end, h.start)))
        .pop();
      if (obj) {
        unit.object = nameOf(obj);
        unit.on = gapOf(obj.end, h.start).startsWith("に");
        unit.objectHit = obj;
        if (!hitIds.has(obj)) consumed.add(obj);
      }
    }
    const dest = a.hits
      .filter((p) => p.entry.kind === "place" && p.end <= h.start && /^(?:へ|に向かって|に向け|まで)$/.test(sentence.slice(p.end, h.start)))
      .pop();
    if (dest && dest.entry.kind === "place") {
      unit.dest = dest.entry.en;
      destinations.add(dest);
    }
    const mod = modifiers.filter((m) => m.end <= h.start && h.start - m.end <= 3 && m.entry.adverb).pop();
    if (mod) unit.adverb = mod.entry.adverb;
    units.push(unit);
  }

  // 主語が要るのに人物がいない → 人物を決める（写真から作るときは写真の主役）
  const isScene = (u: Unit) => !!u.thing || (!!u.verb.tpl && !u.verb.tpl.includes("{s}"));
  if (!cast.length && !a.lines.length) for (const u of units) if (!isScene(u) && u.verb.alone) u.alone = true;
  const needsActor = units.some((u) => u.actors.length === 0 && !isScene(u) && !u.alone) || a.lines.length > 0;
  if (!cast.length && needsActor && fromImage) {
    cast.push({ id: "A", def: IMAGE_SUBJECT, props: [], cartoon: false });
  } else if (!cast.length && needsActor) {
    const dogLike = units.some((u) => /吠え|ほえ|尻尾|しっぽ/.test(u.hit.ja));
    const def = SUBJECTS.find((s) => s.key === (dogLike ? "dog" : "woman"))!;
    addCast(def);
    if (!fromImage) assume(dogLike ? "一文に動物の種類がないため、ゴールデンレトリバーにしました" : "一文に人物が書かれていないため、20代後半の女性にしました");
  }
  for (const u of units) if (!u.actors.length && !isScene(u) && !u.alone && cast.length) u.actors = [cast[0].id];

  // 服・小物
  for (const w of of("wardrobe")) {
    for (const c of cast) {
      const clothes = colored(w, w.entry[c.def.gender]);
      c.clothes = c.clothes ? `${c.clothes} and ${clothes}` : clothes;
    }
  }
  for (const p of of("prop")) {
    if (consumed.has(p) || !cast.length) continue;
    const target = castHits.length ? castHits.reduce((best, c) => (near(c, p) < near(best, p) ? c : best)) : undefined;
    const id = target ? hitIds.get(target)![0] : cast[0].id;
    cast.find((c) => c.id === id)!.props.push(colored(p, p.entry.en));
    consumed.add(p);
  }

  // 人のように暮らす動物 → 3Dアニメ風（おまかせのときだけ）
  const humanPlace = of("place").some((p) => p.entry.human);
  for (const c of cast) {
    if (!c.def.animal) continue;
    const humanAct = units.some((u) => u.actors.includes(c.id) && u.verb.human);
    const speaks = a.lines.length > 0 && cast.length === 1;
    if (humanAct || humanPlace || speaks || c.clothes) c.cartoon = true;
  }
  const cartoon = !fromImage && brief.mood === "auto" && cast.some((c) => c.cartoon);
  if (cartoon) assume("人のように動く動物なので、3Dアニメ風にしました");

  // ── カット割り ──
  const ranges = cutRanges(brief.duration_sec, units.length, a.lines.length > 0);
  assignShots(units, ranges.length);

  // ── セリフ ──
  const verbHits = of("verb");
  const followingVerb = (q: Quote) => verbHits.find((v) => v.start >= q.end && v.start - q.end <= 8 && (v.entry.speaks || v.entry.speech));
  const lineShot = (q: Quote): number => {
    const v = followingVerb(q);
    const u = v && units.find((x) => x.hit === v);
    if (u) return u.shot;
    const prev = units.filter((x) => x.hit.start < q.start).pop();
    if (prev) return prev.shot;
    const next = units.find((x) => x.hit.start > q.start);
    // 動きより前のセリフ（「行ってらっしゃい」と言い、男の子が走る）は、紹介のカットで言う
    const intro = ranges.findIndex((_, i) => !units.some((u) => u.shot === i));
    if (next && intro >= 0 && intro < next.shot) return intro;
    return next ? next.shot : ranges.length - 1;
  };
  let ambiguousTurn = 0;
  const speakerOf = (q: Quote): string => {
    const v = followingVerb(q);
    const ids = v ? (units.find((x) => x.hit === v)?.actors ?? actorOf(v)) : [];
    const quotedLater = a.lines.some((l) => l.start > q.end && l.start - q.end <= 1);
    if (ids.length === 1 && !quotedLater) return ids[0];
    // 直前に「〇〇が」があり、その間にほかのセリフがなければ、その人
    const prevCast = castHits.filter((c) => c.start < q.start).pop();
    if (prevCast && hitIds.get(prevCast)!.length === 1 && !a.lines.some((l) => l.start > prevCast.start && l.start < q.start)) {
      return hitIds.get(prevCast)![0];
    }
    if (cast.length >= 2) return cast[ambiguousTurn++ % 2].id;
    const before = actorOf({ entry: SUBJECTS[0], ja: "", start: q.start, end: q.start });
    return before[0] ?? cast[0]?.id ?? "A";
  };
  const deliveryOf = (q: Quote, speaker: string): string => {
    const v = followingVerb(q);
    const mod = modifiers.find((m) => m.start >= q.end && m.start - q.end <= 6 && m.entry.delivery);
    const vd = v?.entry.delivery;
    const md = mod?.entry.delivery;
    if (vd || md) return vd && md && !vd.includes(md) ? `${md}, ${vd}` : (vd ?? md)!;
    if (/[！!]$/.test(q.text)) return "energetic, exclaiming";
    if (/[？?]$/.test(q.text)) return "curious, questioning";
    if (/[…。]$/.test(q.text)) return "soft and thoughtful";
    return cast.find((c) => c.id === speaker)?.def.animal ? "cute and playful" : "natural and friendly";
  };
  const shotLines: { q: Quote; speaker: string; delivery: string }[][] = ranges.map(() => []);
  for (const q of a.lines) {
    const speaker = speakerOf(q);
    shotLines[lineShot(q)].push({ q, speaker, delivery: deliveryOf(q, speaker) });
  }

  // ── 場所・時間・天気 ──
  const places = of("place").filter((p) => !destinations.has(p));
  const mainPlace = places[0];
  const time = of("time")[0];
  const weather = of("weather")[0];
  const seasons = of("season");
  const objects = of("object");
  const genreHit = of("genre")[0];
  const product = (genreHit?.entry.genre === "product" || objects.some((o) => o.entry.product)) && !cast.length;
  const food = !product && (genreHit?.entry.genre === "food" || objects.some((o) => o.entry.food)) && !cast.length;

  const dish = food ? objects.find((x) => x.entry.kind === "object" && x.entry.food) : undefined;
  const dishName = dish ? nameOf(dish) : undefined;

  // 画面の文字・物・人混みを、どのカットに入れるか
  const establishing = ranges.findIndex((_, i) => !units.some((u) => u.shot === i));
  const shotNear = (h: Hit | Quote) => {
    if (establishing >= 0) return establishing;
    if (!units.length) return 0;
    return units.reduce((best, u) => (near(u.hit, h) < near(best.hit, h) ? u : best)).shot;
  };
  const signObjects = objects.filter((o) => o.entry.sign);
  const signShot = (s: Quote) => {
    const obj = signObjects.reduce<Hit | undefined>((best, o) => (!best || near(o, s) < near(best, s) ? o : best), undefined);
    return obj ? shotNear(obj) : shotNear(s);
  };
  const details: string[][] = ranges.map(() => []);
  for (const o of [...objects, ...of("prop")]) {
    if (consumed.has(o) || (o.entry.kind === "object" && o.entry.sign && a.signs.length)) continue;
    if (o.implied) continue;
    if (food && o === dish && establishing >= 0) continue; // 紹介の文で名前を出す
    // 「風鈴がチリンと鳴る」の風鈴は、音と同じカットに映す
    const sound = of("sound").find((x) => x.start > o.start && x.start - o.end <= 6);
    const i = sound ? sfxShotOf(sound) : shotNear(o);
    details[i].push(nameOf(o));
  }
  const crowd = of("crowd")[0];
  function sfxShotOf(s: Hit) {
    return units.length ? units.reduce((b, u) => (near(u.hit, s) < near(b.hit, s) ? u : b)).shot : ranges.length - 1;
  }

  // 2つめ以降の場所は、近い動きのカットに入れる
  const subPlaces = new Map<number, string>();
  for (const p of places.slice(1)) {
    if (units.length) {
      const u = units.filter((x) => x.hit.start > p.start)[0] ?? units[units.length - 1];
      if (!subPlaces.has(u.shot)) subPlaces.set(u.shot, p.entry.en);
    }
  }

  // ── 音 ──
  const sfxByShot: string[][] = ranges.map(() => []);
  const addSfx = (i: number, s?: string) => s && !sfxByShot[i].includes(s) && sfxByShot[i].length < 3 && sfxByShot[i].push(s);
  if (brief.sound) {
    for (const u of units) addSfx(u.shot, u.sfx ?? (u.thing ? undefined : u.verb.sfx));
    const soundHits = of("sound");
    for (const s of soundHits) addSfx(sfxShotOf(s), s.entry.en);
    for (const o of objects) {
      const entry = o.entry as ObjectDef;
      if (!entry.sound) continue;
      if (soundHits.some((s) => s.start > o.start && s.start - o.end <= 6)) continue; // 「風鈴がチリン」はチリンで足りる
      const i = cryObjects.includes(o) && units.length ? units.reduce((b, u) => (near(u.hit, o) < near(b.hit, o) ? u : b)).shot : shotNear(o);
      addSfx(cryObjects.includes(o) ? ranges.length - 1 : i, entry.sound);
    }
  }
  const ambience: string[] = [];
  if (brief.sound) {
    const pool = [
      ...(weather?.entry.ambience ?? []),
      ...(mainPlace?.entry.ambience ?? []),
      ...(time?.entry.ambience ?? []),
      ...seasons.flatMap((s) => (time?.entry.night ? (s.entry.nightAmbience ?? []) : (s.entry.ambience ?? []))),
    ];
    const allSfx = sfxByShot.flat();
    for (const s of pool) if (ambience.length < 2 && !ambience.includes(s) && !allSfx.includes(s)) ambience.push(s);
    if (!ambience.length) ambience.push(fromImage ? "natural ambient sound that fits the place in the image" : "ambient sound that fits the place");
  }

  // ── 登場人物の固定文 ──
  const characters: Character[] = cast.map((c) => ({
    id: c.id,
    label_ja: c.def.label,
    sheet: sheetOf(c, fromImage, cartoon),
    voice: a.lines.length ? c.def.voice : null,
  }));

  // ── カットの組み立て ──
  const ref = (ids: string[]) => ids.join(" and ");
  const shots: Shot[] = ranges.map(([start, end], i) => {
    const mine = units.filter((u) => u.shot === i);
    const lines = shotLines[i];
    const parts: string[] = [];

    if (fromImage) {
      parts.push(
        i === 0
          ? "Animate the input image as the first frame, keeping its subject, composition and lighting."
          : "The same continuous take goes on with no cut.",
      );
    }
    if (subPlaces.has(i)) parts.push(`Now at ${subPlaces.get(i)}.`);

    const idle = i === 0 && mine.length > 0 && cast.length > 0 && mine.every((u) => isScene(u)) && !units.some((u) => u.actors.length);
    if (!mine.length || idle) parts.push(establishingText(i, { fromImage, cast: cast.map((c) => c.id), product, food, dish: dishName, lines: lines.length > 0 }));
    parts.push(...renderUnits(mine, ref));

    if (i === 0 && crowd) parts.push(sentenceOf(crowd.entry.en));
    if (details[i].length) parts.push(`Visible details: ${details[i].join(", ")}.`);
    for (const s of a.signs) {
      if (signShot(s) !== i) continue;
      const obj = signObjects[0];
      parts.push(`${obj ? capitalize(colored(obj, obj.entry.en)) : "A large sign facing the camera"} shows the Japanese text 「${s.text}」 in big, clear, flat letters.`);
    }
    if (i === 0 && a.unknown.length) {
      parts.push(`Also follow this detail from the original Japanese request: 「${a.sentence.replace(/「[^」]*」/g, "「…」")}」.`);
    }

    const dialogue = timeLines(lines, start, end);
    const first = mine.find((u) => u.verb.framing);
    let framing: string;
    let camera: string;
    if (fromImage) {
      framing = i === 0 ? "same framing as the input image" : "same framing, continuous take";
      camera = i === 0 ? "slow push-in" : "static";
    } else if (first) {
      framing = first.verb.framing as Framing;
      camera = first.verb.camera ?? "static";
      if (dialogue.length && framing === "wide shot") framing = "medium shot";
    } else if (product) {
      [framing, camera] = i === 0 ? ["close-up", "slow orbit around the product"] : ["extreme close-up", "slow push-in"];
    } else if (food) {
      [framing, camera] = i === 0 ? ["close-up", "slow push-in"] : ["extreme close-up", "static"];
    } else if (cast.length) {
      [framing, camera] = i === 0 && !dialogue.length ? ["wide shot", "slow push-in"] : i === 0 ? ["medium shot", "slow push-in"] : ["medium close-up", "static"];
    } else {
      [framing, camera] = i === 0 ? ["wide shot", "slow pan"] : ["medium shot", "slow push-in"];
    }

    const ids = new Set<string>();
    if (!mine.length || idle) cast.forEach((c) => ids.add(c.id));
    mine.forEach((u) => u.actors.forEach((x) => ids.add(x)));
    dialogue.forEach((d) => ids.add(d.speaker));

    return {
      start,
      end,
      framing,
      camera,
      characters: cast.map((c) => c.id).filter((x) => ids.has(x)),
      wardrobe: {},
      action: parts.join(" "),
      dialogue,
      sfx: sfxByShot[i],
      ambience: [...ambience],
    };
  });

  // ── スタイル・場所 ──
  const light = [time?.entry.light, weather?.entry.light].filter((x): x is string => !!x);
  let style: string;
  if (fromImage) style = brief.mood === "auto" ? IMAGE_AUTO_STYLE : MOOD_STYLE[brief.mood];
  else if (brief.mood !== "auto") style = [MOOD_STYLE[brief.mood], ...light].join(", ");
  else if (cartoon) style = ["3D animated feature film style", ...(light.length ? light : ["soft natural light"])].join(", ");
  else style = ["photorealistic", ...(light.length ? light : ["natural light"])].join(", ");
  if (!fromImage && product) style += mainPlace ? ", clean commercial look" : ", clean commercial product look, soft studio lighting, crisp reflections";
  if (!fromImage && food) style += ", appetizing food close-up, glistening details";
  if (vertical && !fromImage && (cast.length || product || food)) style += ", subject centered in the vertical frame";

  const conditions = [time?.entry.en, weather?.entry.en, ...seasons.map((s) => s.entry.en)].filter((x): x is string => !!x);
  const sceneOnly = units.some((u) => u.verb.tpl && !u.verb.tpl.includes("{s}"));
  const where = fromImage
    ? "the place shown in the input image"
    : mainPlace
      ? mainPlace.entry.en
      : product
        ? "a clean seamless studio backdrop"
        : sceneOnly && !cast.length
          ? "an open outdoor landscape"
          : cast.length
            ? "a simple, uncluttered place that fits the scene"
            : "a place that fits the scene";
  const setting = sentenceOf([where, ...conditions].join(", "));
  if (!fromImage && !mainPlace && cast.length) assume("場所が書かれていないため、背景はシンプルにしています");

  // ── 避けるもの ──
  const negative = [...BASE_NEGATIVE];
  if (cast.length && !crowd && !fromImage) negative.push("other people in focus");
  for (const c of cast) {
    if (c.def.animal && ranges.length > 1) negative.push(`a different ${c.def.noun}`, "changing fur pattern");
  }
  if (a.signs.length) negative.push("garbled characters", "extra text on the sign");
  if (product) negative.push("brand names", "extra products");
  if (!cast.length && !fromImage && !product && !food && !crowd) negative.push("people");
  if (fromImage) negative.push("changing the face or identity of the subject", "new people appearing", "sudden scene changes");

  // ── 一文の要素と、どのカットに入れたか ──
  const elements: { element: string; shot: number }[] = [];
  const addElement = (element: string, shot: number) => {
    if (!elements.some((e) => e.element === element)) elements.push({ element, shot: shot + 1 });
  };
  const unitShot = new Map(units.map((u) => [u.hit, u.shot] as const));
  const firstShotOf = (id: string) => Math.max(0, shots.findIndex((s) => s.characters.includes(id)));
  for (const h of a.hits) {
    if (h.implied || h.entry.kind === "modifier" || h.entry.kind === "color") continue;
    let shot = 0;
    if (unitShot.has(h)) shot = unitShot.get(h)!;
    else if (hitIds.has(h)) shot = firstShotOf(hitIds.get(h)![0]);
    else if (h.entry.kind === "verb") {
      const u = units.find((x) => x.hit.start >= h.start) ?? units[units.length - 1];
      shot = u ? u.shot : 0;
    } else if (h.entry.kind === "object" || h.entry.kind === "prop") {
      const u = units.find((x) => x.objectHit === h);
      shot = u ? u.shot : h.entry.kind === "object" && h.entry.sign && a.signs.length ? signShot(a.signs[0]) : shotNear(h);
    } else if (h.entry.kind === "sound") shot = shots.findIndex((s) => s.sfx.includes((h.entry as { en: string }).en));
    addElement(h.ja, Math.max(0, shot));
  }
  shotLines.forEach((ls, i) => ls.forEach((l) => addElement(`「${l.q.text}」`, i)));
  for (const s of a.signs) addElement(`「${s.text}」（画面の文字）`, signShot(s));
  for (const u of a.unknown) addElement(u, 0);
  elements.sort((x, y) => sentence.indexOf(x.element.replace(/（画面の文字）$/, "")) - sentence.indexOf(y.element.replace(/（画面の文字）$/, "")));

  if (a.unknown.length) assume(`「${a.unknown.join("」「")}」は辞書にないため、日本語のまま動画AIに渡しています`);
  if (fromImage) assume("選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします");
  if (fromImage && !units.length) assume("動きの指定がないため、髪や服・背景が自然にゆっくり動くようにしました");

  return {
    ...base,
    style,
    setting,
    characters,
    shots,
    music: of("music")[0]?.entry.en ?? null,
    on_screen_text: a.signs.map((s) => ({ text_ja: s.text, shot: signShot(s) + 1 })),
    negative,
    elements_ja: elements,
    assumptions_ja: assumptions,
    safety: { ok: true, notes_ja: "" },
  };
}

/** 尺と動きの数でカットの区切りを決める（各4秒以上、15秒は8秒で区切る。Veo が8秒ずつ作るため） */
function cutRanges(duration: number, units: number, hasLines: boolean): [number, number][] {
  if (duration === 15) return units >= 3 ? [[0, 4], [4, 8], [8, 15]] : [[0, 8], [8, 15]];
  return units <= 1 && !hasLines ? [[0, 10]] : [[0, 5], [5, 10]];
}

/** 動きを順にカットへ割り振る。動きがカットより少なければ、前のカットを場面の紹介にする */
function assignShots(units: Unit[], n: number) {
  if (units.length < n) {
    units.forEach((u, i) => (u.shot = n - units.length + i));
    return;
  }
  const size = Math.floor(units.length / n);
  const extra = units.length % n;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const count = size + (i >= n - extra ? 1 : 0);
    for (let j = 0; j < count; j++) units[k++].shot = i;
  }
}

function sheetOf(c: Cast, fromImage: boolean, cartoon: boolean): string {
  const d = c.def;
  if (fromImage) {
    const look = d.animal
      ? "same face, fur pattern, colors and proportions"
      : d.key === "image_subject"
        ? "same face, hair or fur, clothing, colors and proportions"
        : "same face, hairstyle, clothing, colors and proportions";
    let sheet = `the ${d.noun} in the input image, exactly as shown: ${look}`;
    if (c.clothes) sheet += `, wearing ${c.clothes}`;
    if (c.props.length) sheet += `, with ${c.props.join(", ")}`;
    return sheet;
  }
  let sheet = d.base;
  if (d.animal && cartoon && c.cartoon) sheet = sheet.replace(/^an? /, "an anthropomorphic, upright-walking ");
  const clothes = c.clothes ?? d.clothes;
  if (clothes) sheet += d.animal ? `, wearing ${clothes}` : `, ${clothes}`;
  if (c.props.length) sheet += `, ${c.props.join(", ")}`;
  return sheet;
}

function establishingText(
  i: number,
  o: { fromImage: boolean; cast: string[]; product: boolean; food: boolean; dish?: string; lines: boolean },
): string {
  if (o.fromImage) {
    return o.cast.length && o.lines
      ? `${o.cast.join(" and ")} ${o.cast.length > 1 ? "look" : "looks"} toward the camera with small natural movements.`
      : "Natural, subtle motion: the subject breathes and blinks, hair and clothes move slightly, and the background stays gently alive.";
  }
  if (o.cast.length) {
    const who = o.cast.join(" and ");
    return i === 0
      ? `The camera reveals the scene with ${who} in the middle of it, calm and natural.`
      : `${who} ${o.cast.length > 1 ? "face" : "faces"} the camera with a natural expression.`;
  }
  if (o.product) {
    return i === 0
      ? "The product stands at the center on a clean surface while a soft highlight glides across it."
      : "Close details of the product: texture, edges and reflections in crisp focus.";
  }
  if (o.food) {
    return i === 0
      ? `${capitalize(o.dish ?? "the dish")} ${o.dish && isPlural(o.dish) ? "sit" : "sits"} at the center, glistening and appetizing, with gentle steam or light drifting over it.`
      : "Close details of the food: glossy textures, steam and tiny movements.";
  }
  return i === 0
    ? "An establishing view of the scene with gentle natural motion: light shifting, air and leaves moving softly."
    : "A closer view of the same scene, small details moving gently.";
}

/** 同じ主語の動きは「, then」でつなぎ、自然の動きは1文にする */
function renderUnits(units: Unit[], ref: (ids: string[]) => string): string[] {
  const out: string[] = [];
  let group: { who: string; many: boolean; verbs: string[] } | undefined;
  const flush = () => {
    if (group) out.push(`${group.who} ${group.verbs.join(", then ")}.`);
    group = undefined;
  };
  for (const u of units) {
    if (u.alone && u.verb.alone) {
      flush();
      out.push(sentenceOf(u.verb.alone));
      continue;
    }
    if (u.verb.tpl) {
      flush();
      out.push(sentenceOf(u.verb.tpl.replace("{s}", ref(u.actors) || "the subject")));
      continue;
    }
    const en = u.on && u.verb.enOn ? u.verb.enOn : u.verb.en;
    let phrase = en.includes("{o}") ? (u.object ? en.replace("{o}", u.object) : (u.verb.bare ?? u.verb.en.replace(" {o}", ""))) : u.verb.en;
    if (u.dest) phrase += ` toward ${u.dest}`;
    if (u.adverb && !phrase.includes(u.adverb.slice(0, 5))) phrase += ` ${u.adverb}`;
    if (u.thing) {
      flush();
      out.push(`${capitalize(u.thing)} ${isPlural(u.thing) ? plural(phrase) : thirdPerson(phrase)}.`);
      continue;
    }
    const who = ref(u.actors);
    const many = u.actors.length > 1;
    const conj = many ? plural(phrase) : thirdPerson(phrase);
    if (group && group.who === who) group.verbs.push(conj);
    else {
      flush();
      group = { who, many, verbs: [conj] };
    }
  }
  flush();
  return out;
}

/** セリフの時刻を決める。前に少し間を置き、1秒あたり7文字に収まるようにする */
function timeLines(lines: { q: Quote; speaker: string; delivery: string }[], start: number, end: number): Dialogue[] {
  if (!lines.length) return [];
  const need = lines.map((l) => Math.max(1, Math.ceil((Array.from(l.q.text).length / 6) * 2) / 2));
  const total = need.reduce((x, y) => x + y, 0);
  const room = end - start;
  let at = start + Math.max(0, Math.min(room >= 6 ? 2 : 1, room - total));
  return lines.map((l, i) => {
    const d: Dialogue = { speaker: l.speaker, line_ja: l.q.text, delivery: l.delivery, at };
    at += need[i];
    return d;
  });
}

