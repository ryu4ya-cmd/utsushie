// 一文を辞書（lexicon.ts）で読み解く。長い言葉から先に当て、当たった所は二度使わない。
// 「」の中はセリフか画面の文字として取り出し、辞書には当てない。辞書にない言葉は unknown に残す。

import { LEXICON, type Entry } from "@/lib/plan/lexicon";

export interface Hit {
  entry: Entry;
  ja: string;
  start: number;
  end: number;
  /** implies で足した言葉（一文には書かれていない） */
  implied?: boolean;
}

export interface Quote {
  text: string;
  start: number;
  end: number;
}

export interface Analysis {
  sentence: string;
  hits: Hit[];
  lines: Quote[];
  signs: Quote[];
  /** 辞書になかった言葉（漢字・カタカナ・英数字のかたまり） */
  unknown: string[];
}

const PATTERNS: { entry: Entry; ja: string }[] = LEXICON.flatMap((entry) => entry.ja.map((ja) => ({ entry, ja }))).sort(
  (a, b) => Array.from(b.ja).length - Array.from(a.ja).length,
);

// 「X」と書かれた看板、「X」の看板 など → 画面の文字
const SIGN_AFTER = /^(?:と|って)?(?:書かれた|書かれている|書かれてる|書いてある|書いた|書いて|描かれた|大きく書かれた)/;
const SIGN_NOUN_AFTER = /^の(?:看板|文字|旗|横断幕|垂れ幕|張り紙|貼り紙|ポスター|ボード|プレート|のぼり|ロゴ)/;
const SIGN_BEFORE = /(?:看板|黒板|旗|横断幕|垂れ幕|ポスター|ボード|画面)(?:に|には)$/;

function lookupImplied(ja: string): Entry | undefined {
  return LEXICON.find((e) => e.kind !== "verb" && e.ja.includes(ja));
}

export function analyze(sentence: string): Analysis {
  const text = sentence;
  const used = new Array<boolean>(text.length).fill(false);
  const lines: Quote[] = [];
  const signs: Quote[] = [];

  for (const m of text.matchAll(/「([^」]*)」/g)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const inner = m[1].trim();
    for (let i = start; i < end; i++) used[i] = true;
    if (!inner) continue;
    const after = text.slice(end);
    const signAfter = after.match(SIGN_AFTER);
    if (signAfter) {
      for (let i = end; i < end + signAfter[0].length; i++) used[i] = true;
      signs.push({ text: inner, start, end });
    } else if (SIGN_NOUN_AFTER.test(after) || SIGN_BEFORE.test(text.slice(0, start))) {
      signs.push({ text: inner, start, end });
    } else {
      lines.push({ text: inner, start, end });
    }
  }

  const hits: Hit[] = [];
  for (const { entry, ja } of PATTERNS) {
    let from = 0;
    for (;;) {
      const at = text.indexOf(ja, from);
      if (at < 0) break;
      from = at + 1;
      const end = at + ja.length;
      let free = true;
      for (let i = at; i < end; i++) if (used[i]) free = false;
      if (!free) continue;
      for (let i = at; i < end; i++) used[i] = true;
      if (entry.kind !== "stop") hits.push({ entry, ja, start: at, end });
    }
  }

  // implies：「花火」→ 夜、「雪が降る」→ 雪 など。書かれていない言葉を同じ位置に足す
  for (const h of [...hits]) {
    const implies = "implies" in h.entry ? h.entry.implies : undefined;
    for (const ja of implies ?? []) {
      const e = lookupImplied(ja);
      if (e && !hits.some((x) => x.entry.kind === e.kind)) hits.push({ entry: e, ja, start: h.start, end: h.start, implied: true });
    }
  }
  hits.sort((a, b) => a.start - b.start || a.end - b.end);

  // 残り：ひらがな・記号・空白は助詞や送り仮名なので無視し、漢字・カタカナ・英数字のかたまりを辞書にない言葉とする
  const unknown: string[] = [];
  let run = "";
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i] ?? "";
    const keep = ch && !used[i] && /[一-鿿々゠-ヿA-Za-z0-9Ａ-Ｚａ-ｚ０-９]/.test(ch) && ch !== "・";
    if (keep) run += ch;
    else if (run) {
      if (!/^[ー\d０-９]+$/.test(run)) unknown.push(run);
      run = "";
    }
  }

  return { sentence, hits, lines, signs, unknown: Array.from(new Set(unknown)) };
}
