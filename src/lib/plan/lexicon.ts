// 一文を読み解くための辞書（練習モードの設計図づくりで使う。LLM は呼ばない）。
// 日本語の言葉 → 英語の映像・音の言い回し。長い言葉から先に当てるので、「三毛猫」は「猫」より先に決まる。
// 英語は system-prompt.md のルール（人物の固定文は25〜50語、カメラは1カット1つ）に合わせてある。

export type Framing = "wide shot" | "medium wide shot" | "medium shot" | "medium close-up" | "close-up";

export interface PlaceDef {
  kind: "place";
  ja: string[];
  en: string;
  ambience?: string[];
  /** 人のように暮らす動物でないと行かない場所（学校など） */
  human?: boolean;
  implies?: string[];
}
export interface TimeDef {
  kind: "time";
  ja: string[];
  en: string; // setting に足す句
  light: string; // style に足す光
  night?: boolean;
  ambience?: string[];
}
export interface WeatherDef {
  kind: "weather";
  ja: string[];
  en: string;
  light?: string;
  ambience?: string[];
}
export interface SeasonDef {
  kind: "season";
  ja: string[];
  en: string;
  ambience?: string[];
  nightAmbience?: string[];
}
export interface SubjectDef {
  kind: "subject";
  ja: string[];
  key: string;
  label: string;
  noun: string;
  /** 年齢・顔・髪（または毛並み） */
  base: string;
  /** 服（人）。浴衣などの言葉があれば差し替える */
  clothes?: string;
  voice: string;
  gender: "f" | "m" | "n";
  animal?: boolean;
  /** 鳴き声（「鳴く」のとき） */
  cry?: string;
  /** 一文に年齢が出ないときに決めたこと（assumptions_ja に入れる） */
  assume?: string;
}
export interface PairDef {
  kind: "pair";
  ja: string[];
  members: [string, string];
  assume: string;
}
export interface VerbDef {
  kind: "verb";
  ja: string[];
  /** 英語の動詞句（原形）。{o} があれば直前の「〜を」の物で埋める */
  en: string;
  /** 「〜に」のときの句（「黒板に書く」） */
  enOn?: string;
  /** 物がないときの句（en に {o} があるとき） */
  bare?: string;
  /** 主語なしの文（自然の動き）。{s} があれば主語で埋める（活用しない） */
  tpl?: string;
  framing?: Framing;
  camera?: string;
  sfx?: string;
  /** 人のような動き（動物がすると 3D アニメ風にする） */
  human?: boolean;
  /** セリフを言う動作（「〜と言う」）。セリフがあれば動作としては書かない */
  speech?: boolean;
  /** セリフと同時にする動作（「〜と笑う」「〜と叫ぶ」）。直前のセリフをこのカットに入れる */
  speaks?: boolean;
  delivery?: string;
  /** 人物も物も主語にないときの文（「動き出す」だけのときなど） */
  alone?: string;
  /** 「鳴く」「鳴る」：話し手の鳴き声か、物の音にする */
  cry?: boolean;
  implies?: string[];
}
export interface ObjectDef {
  kind: "object";
  ja: string[];
  en: string;
  sound?: string;
  product?: boolean;
  food?: boolean;
  /** 看板など、画面の文字を載せる物 */
  sign?: boolean;
  implies?: string[];
}
export interface PropDef {
  kind: "prop";
  ja: string[];
  en: string;
}
export interface WardrobeDef {
  kind: "wardrobe";
  ja: string[];
  f: string;
  m: string;
  n: string;
}
export interface SoundDef {
  kind: "sound";
  ja: string[];
  en: string;
  key: string;
}
export interface ModifierDef {
  kind: "modifier";
  ja: string[];
  adverb?: string;
  delivery?: string;
}
export interface ColorDef {
  kind: "color";
  ja: string[];
  en: string;
}
export interface MusicDef {
  kind: "music";
  ja: string[];
  en: string;
}
export interface CrowdDef {
  kind: "crowd";
  ja: string[];
  en: string;
}
/** 映像に関係しない言葉（「前」「同じ」など）。辞書にない言葉の検出から外す */
export interface StopDef {
  kind: "stop";
  ja: string[];
}
/** 商品紹介・料理などの見せ方を決める言葉 */
export interface GenreDef {
  kind: "genre";
  ja: string[];
  genre: "product" | "food";
}

export type Entry =
  | PlaceDef
  | TimeDef
  | WeatherDef
  | SeasonDef
  | SubjectDef
  | PairDef
  | VerbDef
  | ObjectDef
  | PropDef
  | WardrobeDef
  | SoundDef
  | ModifierDef
  | ColorDef
  | MusicDef
  | CrowdDef
  | StopDef
  | GenreDef;

// ───────── 人物・動物（固定文は base + clothes で25〜50語） ─────────

export const SUBJECTS: SubjectDef[] = [
  { kind: "subject", key: "hs_girl", ja: ["女子高生", "女子高校生"], label: "女子高生", noun: "high school girl", gender: "f",
    base: "a Japanese high school girl about 17 years old, soft round face, shoulder-length straight black hair with bangs",
    clothes: "navy blazer school uniform with a red ribbon tie and a gray pleated skirt", voice: "bright, friendly young female voice" },
  { kind: "subject", key: "hs_boy", ja: ["男子高校生", "男子高生", "高校生"], label: "高校生", noun: "high school boy", gender: "m",
    base: "a Japanese high school boy about 17 years old, slim face, short neat black hair",
    clothes: "black gakuran school uniform with gold buttons and white sneakers", voice: "clear young male voice" },
  { kind: "subject", key: "girl", ja: ["女の子", "少女", "娘"], label: "女の子", noun: "girl", gender: "f",
    base: "a Japanese girl about 8 years old, round cheeks, big dark eyes, black hair in two low pigtails",
    clothes: "yellow T-shirt, denim overall skirt and white sneakers", voice: "cheerful little girl's voice", assume: "女の子は8歳くらい" },
  { kind: "subject", key: "boy", ja: ["男の子", "少年", "息子"], label: "男の子", noun: "boy", gender: "m",
    base: "a Japanese boy about 8 years old, round face, bright eyes, short black hair",
    clothes: "blue-and-white striped T-shirt, khaki shorts and white sneakers", voice: "lively little boy's voice", assume: "男の子は8歳くらい" },
  { kind: "subject", key: "child", ja: ["子ども", "子供", "こども", "キッズ"], label: "子ども", noun: "child", gender: "n",
    base: "a Japanese child about 7 years old, round rosy cheeks, bright eyes, short black bob hair",
    clothes: "red hoodie, navy shorts and white sneakers", voice: "cheerful child's voice", assume: "子どもは7歳くらい" },
  { kind: "subject", key: "baby", ja: ["赤ちゃん", "赤ん坊"], label: "赤ちゃん", noun: "baby", gender: "n",
    base: "a Japanese baby about 1 year old, chubby rosy cheeks, big round dark eyes, soft thin black hair",
    clothes: "pale yellow cotton romper with tiny white socks", voice: "soft babbling baby voice" },
  { kind: "subject", key: "woman", ja: ["女性", "お姉さん", "彼女", "女の人", "OL"], label: "女性", noun: "woman", gender: "f",
    base: "a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair",
    clothes: "cream knit sweater, light blue jeans and small gold earrings", voice: "soft, clear female voice", assume: "女性は20代後半" },
  { kind: "subject", key: "man", ja: ["男性", "お兄さん", "彼", "男の人"], label: "男性", noun: "man", gender: "m",
    base: "a Japanese man in his late 20s, friendly face, short black hair",
    clothes: "navy casual jacket over a white T-shirt and beige chinos", voice: "calm, warm male voice", assume: "男性は20代後半" },
  { kind: "subject", key: "owner_pet", ja: ["飼い主"], label: "飼い主", noun: "pet owner", gender: "f",
    base: "a Japanese woman in her 30s, kind face, shoulder-length black hair",
    clothes: "soft gray hoodie, light blue jeans and white canvas sneakers", voice: "warm, happy female voice", assume: "飼い主は30代の女性" },
  { kind: "subject", key: "grandpa", ja: ["おじいさん", "おじいちゃん", "祖父", "老人"], label: "おじいさん", noun: "elderly man", gender: "m",
    base: "an elderly Japanese man in his 70s, kind wrinkled face, short white hair, round glasses",
    clothes: "beige cardigan over a checked shirt and gray trousers", voice: "gentle, slightly husky elderly male voice" },
  { kind: "subject", key: "grandma", ja: ["おばあさん", "おばあちゃん", "祖母"], label: "おばあさん", noun: "elderly woman", gender: "f",
    base: "an elderly Japanese woman in her 70s, kind smiling face, short curly gray hair",
    clothes: "lavender cardigan over a white blouse and a long navy skirt", voice: "warm, gentle elderly female voice" },
  { kind: "subject", key: "mother", ja: ["お母さん", "母親", "ママ", "母"], label: "お母さん", noun: "mother", gender: "f",
    base: "a Japanese mother in her 30s, warm face, dark brown hair tied in a low ponytail",
    clothes: "white blouse, beige apron and light gray trousers", voice: "warm, gentle female voice" },
  { kind: "subject", key: "father", ja: ["お父さん", "父親", "パパ", "父"], label: "お父さん", noun: "father", gender: "m",
    base: "a Japanese father in his 30s, friendly face, short black hair",
    clothes: "light blue shirt with rolled sleeves and dark gray trousers", voice: "warm, steady male voice" },
  { kind: "subject", key: "ramen_chef", ja: ["大将", "ラーメン屋の店主"], label: "大将", noun: "ramen chef", gender: "m",
    base: "a Japanese ramen chef in his 50s, square face with a short stubble beard, buzz-cut black hair",
    clothes: "white twisted headband, black T-shirt, dark navy apron, thick forearms", voice: "loud, gruff, energetic middle-aged male voice", assume: "大将は50代の男性" },
  { kind: "subject", key: "chef", ja: ["料理人", "シェフ", "コック", "板前"], label: "料理人", noun: "chef", gender: "m",
    base: "a Japanese chef in his 40s, focused calm face, short black hair",
    clothes: "crisp white chef's jacket, black apron and a tall white chef's hat", voice: "calm, confident male voice", assume: "料理人は40代の男性" },
  { kind: "subject", key: "owner", ja: ["店主", "店長", "マスター", "オーナー"], label: "店主", noun: "shop owner", gender: "m",
    base: "a Japanese shop owner, a man in his 40s, kind face, short neat black hair",
    clothes: "crisp white shirt with rolled sleeves and a dark green apron", voice: "warm, polite male voice", assume: "店主は40代の男性" },
  { kind: "subject", key: "clerk", ja: ["店員", "スタッフ"], label: "店員", noun: "shop clerk", gender: "f",
    base: "a young Japanese shop clerk, a woman in her 20s, cheerful face, short brown hair",
    clothes: "white shirt, dark green apron with a small name tag", voice: "bright, polite female voice", assume: "店員は20代の女性" },
  { kind: "subject", key: "teacher", ja: ["先生", "教師"], label: "先生", noun: "teacher", gender: "f",
    base: "a Japanese teacher, a woman in her 30s, friendly face, black hair in a neat bob",
    clothes: "white blouse, navy cardigan and a gray skirt", voice: "clear, kind female voice", assume: "先生は30代の女性" },
  { kind: "subject", key: "office", ja: ["サラリーマン", "会社員", "ビジネスマン"], label: "会社員", noun: "office worker", gender: "m",
    base: "a Japanese office worker, a man in his 30s, tired but kind face, short black hair",
    clothes: "dark navy suit, white shirt, blue tie and a black leather briefcase", voice: "calm, slightly tired male voice" },
  { kind: "subject", key: "student", ja: ["学生", "大学生"], label: "学生", noun: "college student", gender: "f",
    base: "a Japanese college student, a woman about 20 years old, bright face, long straight black hair",
    clothes: "oversized beige hoodie, black wide pants and a canvas tote bag", voice: "bright, casual young female voice", assume: "学生は20歳くらいの女性" },
  { kind: "subject", key: "idol", ja: ["アイドル"], label: "アイドル", noun: "pop idol", gender: "f",
    base: "a Japanese female pop idol in her early 20s, bright smile, long black hair with a pink ribbon",
    clothes: "frilly pink-and-white stage costume and white boots", voice: "bright, cute female voice" },
  { kind: "subject", key: "samurai", ja: ["侍", "武士", "サムライ"], label: "侍", noun: "samurai", gender: "m",
    base: "a Japanese samurai in his 30s, stern face, black hair tied in a topknot",
    clothes: "dark indigo kimono and hakama, a katana in a black scabbard at his waist", voice: "deep, calm male voice" },
  { kind: "subject", key: "ninja", ja: ["忍者"], label: "忍者", noun: "ninja", gender: "n",
    base: "a ninja with sharp dark eyes, a black hood and a mask covering the lower face",
    clothes: "black fitted ninja outfit, gray hand wraps and black split-toe tabi boots", voice: "low, quiet voice" },
  { kind: "subject", key: "astronaut", ja: ["宇宙飛行士"], label: "宇宙飛行士", noun: "astronaut", gender: "n",
    base: "an astronaut whose face is hidden behind a reflective gold visor",
    clothes: "white spacesuit with a round mission patch on the shoulder, bulky white gloves and boots", voice: "calm voice over a radio" },
  { kind: "subject", key: "witch", ja: ["魔女", "魔法使い"], label: "魔法使い", noun: "young witch", gender: "f",
    base: "a young witch about 18 years old, long silver hair, violet eyes",
    clothes: "pointed black hat, long black robe with gold trim, holding a slim wooden wand", voice: "clear, playful female voice" },
  { kind: "subject", key: "robot", ja: ["ロボット"], label: "ロボット", noun: "robot", gender: "n",
    base: "a small friendly white robot with a round head, two glowing blue circular eyes, a smooth glossy body, short arms with three-fingered hands, rolling on a single wheel",
    voice: "cheerful, slightly electronic voice" },

  // 動物（服なし）
  { kind: "subject", key: "calico", ja: ["三毛猫"], label: "三毛猫", noun: "calico cat", gender: "n", animal: true, cry: "a short meow",
    base: "a calico cat with white fur and large orange and black patches, a black patch over the left ear, an orange patch around the right eye, big green eyes, a small pink nose",
    voice: "cute, high-pitched cat-like voice" },
  { kind: "subject", key: "black_cat", ja: ["黒猫"], label: "黒猫", noun: "black cat", gender: "n", animal: true, cry: "a short meow",
    base: "a sleek black cat with short glossy fur, bright yellow-green eyes, a small black nose, pointed ears and a long thin tail",
    voice: "cute, high-pitched cat-like voice" },
  { kind: "subject", key: "white_cat", ja: ["白猫"], label: "白猫", noun: "white cat", gender: "n", animal: true, cry: "a short meow",
    base: "a fluffy white cat with long soft fur, light blue eyes, a pink nose, pink inner ears and a bushy tail",
    voice: "cute, high-pitched cat-like voice" },
  { kind: "subject", key: "kitten", ja: ["子猫", "仔猫", "こねこ"], label: "子猫", noun: "kitten", gender: "n", animal: true, cry: "a tiny high-pitched mew",
    base: "a tiny tabby kitten with soft brown-and-gray striped fur, white paws, big round amber eyes, a small pink nose and a short fluffy tail",
    voice: "tiny, sweet kitten-like voice" },
  { kind: "subject", key: "cat", ja: ["猫", "ねこ", "ネコ", "にゃんこ"], label: "猫", noun: "cat", gender: "n", animal: true, cry: "a short meow",
    base: "an orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail",
    voice: "cute, high-pitched cat-like voice", assume: "猫は茶トラ" },
  { kind: "subject", key: "shiba", ja: ["柴犬"], label: "柴犬", noun: "Shiba Inu", gender: "n", animal: true, cry: "a short happy bark",
    base: "a red-and-white Shiba Inu dog with a fox-like face, upright triangular ears, cream cheeks and chest, a tightly curled tail, wearing a thin red collar",
    voice: "playful, bright dog-like voice" },
  { kind: "subject", key: "puppy", ja: ["子犬", "仔犬", "こいぬ"], label: "子犬", noun: "puppy", gender: "n", animal: true, cry: "a tiny excited yip",
    base: "a fluffy cream-colored puppy with floppy ears, round dark eyes, a black button nose, short legs and a small blue collar",
    voice: "tiny, excited puppy-like voice" },
  { kind: "subject", key: "dog", ja: ["犬", "いぬ", "イヌ", "ワンちゃん", "わんこ"], label: "犬", noun: "dog", gender: "n", animal: true, cry: "a happy bark",
    base: "a friendly golden retriever with a soft golden coat, floppy ears, warm brown eyes, a black nose, a feathery tail and a red collar",
    voice: "warm, friendly dog-like voice", assume: "犬はゴールデンレトリバー" },
  { kind: "subject", key: "rabbit", ja: ["うさぎ", "ウサギ", "兎"], label: "うさぎ", noun: "rabbit", gender: "n", animal: true, cry: "a soft sniffing sound",
    base: "a small white rabbit with soft fluffy fur, long upright ears with pink insides, red-brown eyes, a twitching pink nose and a round cotton tail",
    voice: "small, gentle voice" },
  { kind: "subject", key: "hamster", ja: ["ハムスター"], label: "ハムスター", noun: "hamster", gender: "n", animal: true, cry: "a tiny squeak",
    base: "a round golden hamster with soft orange-and-white fur, tiny shiny black eyes, small rounded ears, twitching whiskers, small pink paws and chubby cheek pouches",
    voice: "tiny, squeaky voice" },
  { kind: "subject", key: "panda", ja: ["パンダ"], label: "パンダ", noun: "panda", gender: "n", animal: true, cry: "a soft bleat",
    base: "a giant panda with fluffy black-and-white fur, black patches around the eyes, round black ears, black legs and shoulders and a chubby round body",
    voice: "soft, sleepy voice" },
  { kind: "subject", key: "penguin", ja: ["ペンギン"], label: "ペンギン", noun: "penguin", gender: "n", animal: true, cry: "a short squawk",
    base: "a small penguin with a glossy black back and head, a white belly, white rings around the eyes, small flippers and short pink feet",
    voice: "small, chirpy voice" },
  { kind: "subject", key: "bird", ja: ["小鳥", "スズメ", "すずめ", "鳥"], label: "小鳥", noun: "small bird", gender: "n", animal: true, cry: "a bright chirp",
    base: "a small round sparrow with brown and cream feathers, a black bib, dark round eyes, a short beak and tiny pink feet",
    voice: "tiny, chirpy voice" },
  { kind: "subject", key: "goldfish", ja: ["金魚"], label: "金魚", noun: "goldfish", gender: "n", animal: true,
    base: "a small bright orange goldfish with shiny metallic scales, a white patch on the head, round black eyes and a long, flowing, see-through double tail fin",
    voice: "tiny, bubbly voice" },
  { kind: "subject", key: "bear", ja: ["くま", "クマ", "熊"], label: "くま", noun: "bear", gender: "n", animal: true, cry: "a low growl",
    base: "a brown bear with thick shaggy brown fur, small round ears, dark eyes, a big black nose and heavy paws",
    voice: "deep, gentle voice" },
  { kind: "subject", key: "fox", ja: ["きつね", "キツネ", "狐"], label: "きつね", noun: "fox", gender: "n", animal: true, cry: "a short yip",
    base: "a red fox with bright orange fur, a white chest and tail tip, black legs, pointed ears, amber eyes and a bushy tail",
    voice: "light, clever voice" },
  { kind: "subject", key: "tanuki", ja: ["たぬき", "タヌキ", "狸"], label: "たぬき", noun: "tanuki", gender: "n", animal: true,
    base: "a tanuki (raccoon dog) with fluffy brown-gray fur, black mask-like markings around the eyes, small round ears and a bushy tail",
    voice: "round, friendly voice" },
  { kind: "subject", key: "dolphin", ja: ["イルカ"], label: "イルカ", noun: "dolphin", gender: "n", animal: true, cry: "a high clicking whistle",
    base: "a young bottlenose dolphin with smooth glossy gray skin, a pale pink-white belly, a curved dorsal fin, bright dark eyes and a friendly smiling face",
    voice: "bright, clicking voice" },
  { kind: "subject", key: "frog", ja: ["カエル", "かえる", "蛙"], label: "カエル", noun: "frog", gender: "n", animal: true, cry: "a cheerful croak",
    base: "a small bright green tree frog with big round golden eyes, a pale cream throat, smooth shiny skin, thin legs and sticky round toe pads",
    voice: "croaky, cheerful voice" },
  { kind: "subject", key: "horse", ja: ["馬"], label: "馬", noun: "horse", gender: "n", animal: true, cry: "a soft whinny",
    base: "a chestnut horse with a glossy coat, a black mane and tail, a white blaze on the face and strong legs",
    voice: "deep, breathy voice" },
  { kind: "subject", key: "dinosaur", ja: ["恐竜"], label: "恐竜", noun: "dinosaur", gender: "n", animal: true, cry: "a playful roar",
    base: "a small green dinosaur like a young T-rex, bumpy green scales, a cream belly, big round friendly eyes, tiny arms and a thick tail",
    voice: "playful, rumbling voice" },
  { kind: "subject", key: "dragon", ja: ["ドラゴン", "竜", "龍"], label: "ドラゴン", noun: "dragon", gender: "n", animal: true, cry: "a mighty roar",
    base: "a large dragon with shimmering emerald scales, a pale gold belly, glowing golden eyes, two curved horns, wide bat-like wings and a long spiked tail",
    voice: "deep, booming voice" },
];

export const PAIRS: PairDef[] = [
  { kind: "pair", ja: ["二人", "ふたり", "カップル", "恋人"], members: ["woman", "man"], assume: "二人は20代の女性と男性（声を分けやすくするため）" },
  { kind: "pair", ja: ["親子"], members: ["mother", "child"], assume: "親子は母親と7歳くらいの子ども" },
  { kind: "pair", ja: ["姉妹"], members: ["woman", "girl"], assume: "姉妹は20代の姉と8歳くらいの妹" },
  { kind: "pair", ja: ["兄弟"], members: ["man", "boy"], assume: "兄弟は20代の兄と8歳くらいの弟" },
  { kind: "pair", ja: ["友達", "友だち", "親友"], members: ["woman", "student"], assume: "友達は20代の女性二人" },
];

// ───────── 場所・時間・天気・季節 ─────────

export const PLACES: PlaceDef[] = [
  { kind: "place", ja: ["渋谷の交差点", "スクランブル交差点"], en: "the Shibuya scramble crossing in Tokyo, crowds with umbrellas or bags crossing in every direction", ambience: ["pedestrian crossing signal beeping", "distant city traffic"] },
  { kind: "place", ja: ["交差点", "横断歩道"], en: "a busy city crosswalk", ambience: ["pedestrian crossing signal beeping", "distant city traffic"] },
  { kind: "place", ja: ["渋谷"], en: "a busy street in Shibuya, Tokyo, with tall buildings and big screens", ambience: ["city crowd murmur", "distant traffic"] },
  { kind: "place", ja: ["東京"], en: "a lively street in Tokyo", ambience: ["city crowd murmur", "distant traffic"] },
  { kind: "place", ja: ["京都"], en: "a traditional stone-paved street in Kyoto lined with old wooden houses", ambience: ["soft footsteps on stone"] },
  { kind: "place", ja: ["海辺", "浜辺", "砂浜", "ビーチ"], en: "a sandy beach by the sea", ambience: ["waves washing ashore", "seagulls in the distance"] },
  { kind: "place", ja: ["海"], en: "the wide blue sea", ambience: ["waves washing ashore", "seagulls in the distance"] },
  { kind: "place", ja: ["港"], en: "a small harbor with fishing boats", ambience: ["water lapping against boats", "seagulls"] },
  { kind: "place", ja: ["縁側"], en: "the wooden veranda (engawa) of an old Japanese house, a green garden beyond", ambience: ["soft breeze through the garden"] },
  { kind: "place", ja: ["公園"], en: "a green city park with trees and benches", ambience: ["birds chirping", "children playing in the distance"] },
  { kind: "place", ja: ["駅のホーム"], en: "a train station platform", ambience: ["distant train announcement", "a train passing"] },
  { kind: "place", ja: ["駅"], en: "a busy train station", ambience: ["distant train announcement", "footsteps of commuters"] },
  { kind: "place", ja: ["電車の中", "電車内", "車内"], en: "inside a quiet commuter train, city scenery passing in the windows", ambience: ["rhythmic train rumble"] },
  { kind: "place", ja: ["車の中"], en: "inside a car, the road passing outside the windows", ambience: ["soft engine hum"] },
  { kind: "place", ja: ["教室"], en: "a bright school classroom with wooden desks and a blackboard", ambience: ["students chatting quietly"], human: true },
  { kind: "place", ja: ["校庭", "グラウンド"], en: "a wide school sports ground", ambience: ["students cheering in the distance"], human: true },
  { kind: "place", ja: ["体育館"], en: "a school gymnasium with a polished wooden floor", ambience: ["sneakers squeaking"], human: true },
  { kind: "place", ja: ["学校"], en: "a Japanese school building", ambience: ["a school chime in the distance"], human: true },
  { kind: "place", ja: ["図書館"], en: "a quiet library with tall wooden bookshelves", ambience: ["pages turning softly"] },
  { kind: "place", ja: ["カフェ", "喫茶店"], en: "a cozy cafe with warm wooden interiors", ambience: ["soft cafe chatter", "cups clinking"] },
  { kind: "place", ja: ["ラーメン屋"], en: "the open kitchen behind the wooden counter of a small Japanese ramen shop, big pots of boiling water", ambience: ["low chatter of customers"] },
  { kind: "place", ja: ["屋台"], en: "a small street food stall glowing with warm light", ambience: ["food sizzling", "festival crowd murmur"] },
  { kind: "place", ja: ["コンビニ"], en: "a brightly lit convenience store", ambience: ["a door chime", "soft store music"] },
  { kind: "place", ja: ["お店", "店"], en: "a small neighborhood shop", ambience: ["quiet street outside"] },
  { kind: "place", ja: ["商店街"], en: "a lively shopping street with small shops and hanging banners", ambience: ["shoppers chatting", "bicycle bells"] },
  { kind: "place", ja: ["キッチン", "台所"], en: "a bright home kitchen", ambience: ["a pot simmering"] },
  { kind: "place", ja: ["寝室", "ベッド"], en: "a cozy bedroom with a soft bed", ambience: ["quiet room tone"] },
  { kind: "place", ja: ["リビング", "居間"], en: "a warm living room with a sofa", ambience: ["quiet room tone"] },
  { kind: "place", ja: ["部屋", "家"], en: "a cozy home interior", ambience: ["quiet room tone"] },
  { kind: "place", ja: ["窓辺", "窓際"], en: "a sunny spot by a window, sheer curtains moving slightly", ambience: ["faint birdsong outside"] },
  { kind: "place", ja: ["オフィス", "会社"], en: "a modern office with desks and large windows", ambience: ["keyboards typing", "air conditioning hum"] },
  { kind: "place", ja: ["屋上"], en: "a school or building rooftop with a wire fence and a wide sky", ambience: ["wind blowing"] },
  { kind: "place", ja: ["雪山"], en: "a snowy mountain slope", ambience: ["cold wind"] },
  { kind: "place", ja: ["山頂"], en: "a mountain summit above a sea of clouds", ambience: ["strong wind"] },
  { kind: "place", ja: ["山"], en: "a green mountain trail", ambience: ["birds chirping", "wind in the trees"] },
  { kind: "place", ja: ["森", "林"], en: "a lush green forest with sunbeams through the trees", ambience: ["birds chirping", "leaves rustling"] },
  { kind: "place", ja: ["川沿い", "河原", "川辺"], en: "a riverside path along a gently flowing river", ambience: ["a gently flowing river"] },
  { kind: "place", ja: ["川"], en: "a clear, gently flowing river", ambience: ["a gently flowing river"] },
  { kind: "place", ja: ["湖"], en: "a calm lake surrounded by trees", ambience: ["soft lapping water"] },
  { kind: "place", ja: ["滝"], en: "a tall waterfall in a green valley", ambience: ["roaring waterfall"] },
  { kind: "place", ja: ["神社"], en: "a Shinto shrine with a red torii gate and stone lanterns", ambience: ["wind through tall trees"] },
  { kind: "place", ja: ["お寺", "寺"], en: "an old Buddhist temple with a wooden main hall", ambience: ["a distant temple bell"] },
  { kind: "place", ja: ["城"], en: "a white Japanese castle with layered roofs", ambience: ["wind blowing"] },
  { kind: "place", ja: ["路地"], en: "a narrow alley with lanterns and potted plants", ambience: ["distant city murmur"] },
  { kind: "place", ja: ["坂道"], en: "a sloping residential street", ambience: ["distant city murmur"] },
  { kind: "place", ja: ["田んぼのあぜ道", "あぜ道"], en: "a narrow dirt path between green rice paddies", ambience: ["frogs croaking", "soft wind"] },
  { kind: "place", ja: ["満員電車"], en: "inside a packed commuter train", ambience: ["rhythmic train rumble"] },
  { kind: "place", ja: ["水槽"], en: "inside a clear glass aquarium tank with water plants", ambience: ["soft bubbling water"] },
  { kind: "place", ja: ["田んぼ"], en: "green rice paddies stretching to the hills", ambience: ["frogs croaking", "soft wind"] },
  { kind: "place", ja: ["ひまわり畑"], en: "a vast sunflower field", ambience: ["soft wind", "bees buzzing"] },
  { kind: "place", ja: ["花畑"], en: "a colorful field of flowers", ambience: ["soft wind", "bees buzzing"] },
  { kind: "place", ja: ["草原"], en: "a wide grassy meadow under a big sky", ambience: ["wind through the grass"] },
  { kind: "place", ja: ["砂漠"], en: "a vast sand desert with rolling dunes", ambience: ["dry wind"] },
  { kind: "place", ja: ["月面", "月の上"], en: "the gray, dusty surface of the Moon, the Earth hanging in a black sky", ambience: [] },
  { kind: "place", ja: ["夜空"], en: "the open night sky high above the rooftops", ambience: ["soft wind"], implies: ["夜"] },
  { kind: "place", ja: ["宇宙"], en: "outer space with the Earth glowing below", ambience: [] },
  { kind: "place", ja: ["遊園地"], en: "an amusement park with a Ferris wheel and colorful rides", ambience: ["cheerful crowd", "distant ride music"] },
  { kind: "place", ja: ["水族館"], en: "an aquarium in front of a huge blue tank full of fish", ambience: ["soft bubbling water"] },
  { kind: "place", ja: ["動物園"], en: "a sunny zoo", ambience: ["visitors chatting"] },
  { kind: "place", ja: ["温泉"], en: "an outdoor hot spring bath surrounded by rocks, steam rising", ambience: ["hot water trickling"] },
  { kind: "place", ja: ["舞台", "ステージ"], en: "a stage under bright spotlights", ambience: ["an excited audience"] },
  { kind: "place", ja: ["夏祭り", "お祭り", "祭り"], en: "a Japanese summer festival with paper lanterns and glowing food stalls", ambience: ["festival crowd murmur", "taiko drums in the distance"] },
  { kind: "place", ja: ["花火大会"], en: "a fireworks festival by a riverbank, crowds and paper lanterns", ambience: ["festival crowd murmur"] },
  { kind: "place", ja: ["夜景"], en: "a high place overlooking a glittering city at night", ambience: ["soft wind", "distant city hum"] },
  { kind: "place", ja: ["空港"], en: "a bright airport terminal with large windows", ambience: ["distant boarding announcement"] },
  { kind: "place", ja: ["橋"], en: "a bridge over a river", ambience: ["wind blowing"] },
  { kind: "place", ja: ["庭"], en: "a small green garden", ambience: ["birds chirping"] },
  { kind: "place", ja: ["街", "町", "都会"], en: "a city street", ambience: ["distant city traffic"] },
  { kind: "place", ja: ["道", "道路"], en: "a quiet road", ambience: ["soft wind"] },
  { kind: "place", ja: ["スタジオ", "白い背景"], en: "a clean photo studio with a seamless white backdrop", ambience: [] },
];

export const TIMES: TimeDef[] = [
  { kind: "time", ja: ["夕焼け", "夕日"], en: "at sunset, the sky glowing orange", light: "golden sunset light" },
  { kind: "time", ja: ["夕方", "夕暮れ", "黄昏"], en: "at dusk", light: "warm dusk light" },
  { kind: "time", ja: ["明け方", "夜明け", "日の出", "朝焼け"], en: "at dawn", light: "pale dawn light" },
  { kind: "time", ja: ["真夜中", "深夜"], en: "late at night", light: "late night darkness with a few soft lights", night: true, ambience: ["deep night quiet"] },
  { kind: "time", ja: ["夜", "晩"], en: "at night", light: "night, soft artificial light", night: true },
  { kind: "time", ja: ["朝"], en: "in the morning", light: "soft morning light", ambience: ["birds chirping"] },
  { kind: "time", ja: ["お昼", "昼間", "昼"], en: "at midday", light: "bright midday light" },
  { kind: "time", ja: ["午後"], en: "in the afternoon", light: "warm afternoon light" },
];

export const WEATHERS: WeatherDef[] = [
  { kind: "weather", ja: ["大雨", "土砂降り", "どしゃ降り"], en: "in pouring rain, wet surfaces reflecting light", light: "rainy, overcast light", ambience: ["heavy rain pouring"] },
  { kind: "weather", ja: ["雨"], en: "in steady rain, wet surfaces reflecting light", light: "rainy, overcast light", ambience: ["steady rain"] },
  { kind: "weather", ja: ["大雪", "吹雪"], en: "in a heavy snowstorm", light: "cold white light", ambience: ["howling wind"] },
  { kind: "weather", ja: ["雪"], en: "with snow gently falling, everything covered in white", light: "soft, cold winter light", ambience: ["muffled snowy quiet"] },
  { kind: "weather", ja: ["快晴", "晴天", "晴れ"], en: "under a clear blue sky", light: "bright sunshine" },
  { kind: "weather", ja: ["曇り", "くもり"], en: "under an overcast sky", light: "soft overcast light" },
  { kind: "weather", ja: ["霧"], en: "in soft drifting fog", light: "hazy, diffused light" },
  { kind: "weather", ja: ["嵐", "台風"], en: "in a fierce storm with strong wind and rain", light: "dark stormy light", ambience: ["howling wind", "heavy rain"] },
  { kind: "weather", ja: ["雷"], en: "with lightning flashing in dark clouds", light: "dark stormy light with lightning flashes", ambience: ["rolling thunder"] },
  { kind: "weather", ja: ["そよ風", "風"], en: "with a gentle breeze", ambience: ["soft wind"] },
];

export const SEASONS: SeasonDef[] = [
  { kind: "season", ja: ["春"], en: "in spring" },
  { kind: "season", ja: ["夏"], en: "in summer", ambience: ["cicadas singing"], nightAmbience: ["crickets chirping"] },
  { kind: "season", ja: ["秋"], en: "in autumn", ambience: ["dry leaves rustling"], nightAmbience: ["autumn insects chirping"] },
  { kind: "season", ja: ["冬"], en: "in winter", ambience: ["cold wind"] },
  { kind: "season", ja: ["桜", "さくら", "お花見", "花見"], en: "with cherry blossoms in full bloom" },
  { kind: "season", ja: ["紅葉"], en: "with trees in bright red and yellow autumn leaves", ambience: ["dry leaves rustling"] },
  { kind: "season", ja: ["クリスマス"], en: "at Christmas time, with twinkling string lights", ambience: ["distant sleigh bells"] },
  { kind: "season", ja: ["お正月", "正月"], en: "on New Year's Day, with New Year decorations" },
];

// ───────── 動き ─────────

export const VERBS: VerbDef[] = [
  // 自然・景色の動き（主語なし）
  { kind: "verb", ja: ["波が打ち寄せ", "波が寄せ", "波打ち際"], en: "", tpl: "Waves roll gently onto the shore", framing: "wide shot", camera: "slow pan", sfx: "waves washing ashore" },
  { kind: "verb", ja: ["桜が散", "桜が舞", "花びらが舞", "花びらが散", "桜吹雪"], en: "", tpl: "Cherry blossom petals swirl down through the air", framing: "wide shot", camera: "slow pan", implies: ["桜"] },
  { kind: "verb", ja: ["落ち葉", "紅葉が舞", "葉が舞", "葉が落ち"], en: "", tpl: "Autumn leaves flutter down", framing: "wide shot", camera: "slow pan", sfx: "dry leaves rustling", implies: ["秋"] },
  { kind: "verb", ja: ["雪が降", "雪が舞"], en: "", tpl: "Snowflakes drift slowly down", framing: "wide shot", camera: "slow pan", implies: ["雪"] },
  { kind: "verb", ja: ["雨が降"], en: "", tpl: "Rain begins to fall, drops rippling on every surface", framing: "wide shot", camera: "static", sfx: "raindrops pattering", implies: ["雨"] },
  { kind: "verb", ja: ["花が咲", "咲き誇", "咲く", "咲い"], en: "", tpl: "Flowers slowly open into full bloom", framing: "close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["湯気が立", "湯気が上が"], en: "", tpl: "Steam rises and curls in the light", framing: "close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["木が揺れ", "木々が揺れ", "葉が揺れ", "揺れる木"], en: "", tpl: "Leaves sway in the breeze", framing: "wide shot", camera: "slow pan", sfx: "leaves rustling" },
  { kind: "verb", ja: ["雲が流れ"], en: "", tpl: "Clouds drift across the sky", framing: "wide shot", camera: "static" },
  { kind: "verb", ja: ["日が昇", "朝日が昇", "太陽が昇"], en: "", tpl: "The sun rises slowly over the horizon", framing: "wide shot", camera: "static", implies: ["夜明け"] },
  { kind: "verb", ja: ["日が沈", "夕日が沈", "太陽が沈"], en: "", tpl: "The sun sinks slowly below the horizon", framing: "wide shot", camera: "static", implies: ["夕日"] },
  { kind: "verb", ja: ["流れ星が流れ", "流れ星"], en: "", tpl: "A shooting star streaks across the night sky", framing: "wide shot", camera: "static", implies: ["夜"] },
  { kind: "verb", ja: ["星空", "満天の星", "星が輝"], en: "", tpl: "Countless stars twinkle in the night sky", framing: "wide shot", camera: "slow upward tilt", implies: ["夜"] },
  { kind: "verb", ja: ["花火が上が", "花火が打ち上が", "花火が咲", "打ち上げ花火"], en: "", tpl: "Fireworks shoot up and burst into colorful blooms in the night sky", framing: "wide shot", camera: "slow upward tilt", sfx: "deep firework booms and crackling", implies: ["夜"] },
  { kind: "verb", ja: ["焚き火", "炎が揺れ", "たき火"], en: "", tpl: "A campfire crackles and flickers", framing: "medium shot", camera: "slow push-in", sfx: "crackling fire" },
  { kind: "verb", ja: ["虹がかか", "虹が出", "虹"], en: "", tpl: "A rainbow arcs across the sky", framing: "wide shot", camera: "slow upward tilt" },
  { kind: "verb", ja: ["オーロラ"], en: "", tpl: "Green auroras ripple across the night sky", framing: "wide shot", camera: "slow pan", implies: ["夜"] },
  { kind: "verb", ja: ["髪が風になび", "髪がなび", "髪が風に", "髪が揺れ", "風に髪がなび"], en: "", tpl: "{s}'s hair flows gently in the breeze", framing: "medium close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["尻尾を振", "しっぽを振"], en: "wag the tail happily", framing: "medium shot", camera: "static" },

  // 人や動物の動き
  { kind: "verb", ja: ["動き出", "動き始", "動きだ"], en: "start to move naturally and gently", alone: "Everything in the scene starts to move naturally and gently: hair, clothes, leaves, water and light", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["手を合わせ"], en: "put both hands together in a quiet prayer", framing: "medium shot", camera: "slow push-in", human: true },
  { kind: "verb", ja: ["こちらを見", "こっちを見", "カメラを見", "カメラ目線"], en: "look straight at the camera", framing: "close-up", camera: "static" },
  { kind: "verb", ja: ["振り返", "振り向", "ふりかえ"], en: "turn around toward the camera", framing: "medium close-up", camera: "static" },
  { kind: "verb", ja: ["にっこり", "微笑", "ほほえ", "ほほ笑", "笑顔", "笑"], en: "smile warmly", framing: "close-up", camera: "slow push-in", speaks: true, delivery: "cheerful, with a light laugh" },
  { kind: "verb", ja: ["ウインク", "ウィンク"], en: "wink at the camera", framing: "close-up", camera: "static" },
  { kind: "verb", ja: ["まばたき", "瞬き"], en: "blink slowly", framing: "close-up", camera: "static" },
  { kind: "verb", ja: ["見上げ"], en: "look up at {o}", bare: "look up at the sky", framing: "wide shot", camera: "slow upward tilt" },
  { kind: "verb", ja: ["見つめ", "眺め", "見て", "見る", "見守"], en: "gaze at {o}", bare: "gaze into the distance", framing: "medium close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["覗", "のぞ"], en: "peek out curiously", framing: "medium close-up", camera: "static" },
  { kind: "verb", ja: ["驚", "びっくり"], en: "be startled, eyes wide", framing: "medium shot", camera: "static", delivery: "surprised" },
  { kind: "verb", ja: ["泣", "涙"], en: "cry softly, tears rolling down", framing: "close-up", camera: "slow push-in", speaks: true, delivery: "tearful, trembling" },
  { kind: "verb", ja: ["照れ"], en: "blush shyly, looking down", framing: "close-up", camera: "static", speaks: true, delivery: "shy and quiet" },
  { kind: "verb", ja: ["怒"], en: "frown with anger", framing: "medium close-up", camera: "static", speaks: true, delivery: "angry" },
  { kind: "verb", ja: ["喜", "はしゃ"], en: "jump for joy", framing: "medium shot", camera: "static", speaks: true, delivery: "overjoyed" },
  { kind: "verb", ja: ["あくび"], en: "give a big yawn", framing: "medium close-up", camera: "static", sfx: "a small yawn" },
  { kind: "verb", ja: ["伸び"], en: "stretch with both arms up", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["叫", "さけ"], en: "shout with the mouth wide open", framing: "medium shot", camera: "static", speaks: true, delivery: "shouted, loud and energetic" },
  { kind: "verb", ja: ["ささや", "囁", "つぶや", "呟"], en: "murmur quietly", framing: "close-up", camera: "static", speech: true, speaks: true, delivery: "whispering softly" },
  { kind: "verb", ja: ["呼び", "呼ん", "呼ぶ"], en: "call out", framing: "medium shot", camera: "static", speaks: true, delivery: "calling out" },
  { kind: "verb", ja: ["答え", "返事"], en: "answer", framing: "medium close-up", camera: "static", speech: true, speaks: true },
  { kind: "verb", ja: ["言", "話", "しゃべ", "喋"], en: "talk", framing: "medium close-up", camera: "static", speech: true, speaks: true },
  { kind: "verb", ja: ["歌"], en: "sing with feeling", framing: "medium close-up", camera: "slow push-in", human: true, speaks: true, delivery: "sung melodically" },
  { kind: "verb", ja: ["吠え", "ほえ"], en: "bark", framing: "medium shot", camera: "static", sfx: "a dog barking", speaks: true },
  { kind: "verb", ja: ["鳴"], en: "let out a cry", framing: "medium shot", camera: "static", cry: true, speaks: true },
  { kind: "verb", ja: ["散歩"], en: "take a relaxed stroll", framing: "wide shot", camera: "handheld follow", sfx: "light footsteps" },
  { kind: "verb", ja: ["走り回", "駆け回", "かけ回"], en: "run around happily", framing: "wide shot", camera: "handheld follow", sfx: "quick footsteps" },
  { kind: "verb", ja: ["ほうきで飛", "ほうきに乗", "箒で飛", "箒に乗"], en: "fly on a wooden broomstick", framing: "wide shot", camera: "slow pan", sfx: "wind rushing past" },
  { kind: "verb", ja: ["カメラが寄", "カメラが近づ", "ズームイン", "寄っ", "寄る", "寄り"], en: "", tpl: "The camera slowly moves in closer", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["走", "駆け", "かけっこ", "ダッシュ"], en: "run", framing: "wide shot", camera: "handheld follow", sfx: "quick footsteps" },
  { kind: "verb", ja: ["歩"], en: "walk", framing: "wide shot", camera: "handheld follow", sfx: "footsteps" },
  { kind: "verb", ja: ["ジャンプ", "跳", "飛び跳ね", "飛び上が"], en: "jump high", framing: "medium wide shot", camera: "static", sfx: "a soft thud on landing" },
  { kind: "verb", ja: ["踊", "ダンス"], en: "dance happily", framing: "medium wide shot", camera: "static", human: true, sfx: "light rhythmic steps" },
  { kind: "verb", ja: ["回転", "くるくる回", "くるっと回", "くるりと回", "回っ", "回る"], en: "spin around", framing: "medium wide shot", camera: "static" },
  { kind: "verb", ja: ["泳"], en: "swim", framing: "wide shot", camera: "handheld follow", sfx: "water splashing" },
  { kind: "verb", ja: ["飛ん", "飛ぶ", "飛び", "羽ばた"], en: "fly through the air", framing: "wide shot", camera: "slow pan", sfx: "wings fluttering" },
  { kind: "verb", ja: ["座", "腰かけ", "腰掛け"], en: "sit down", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["立ち上が"], en: "stand up", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["寝転", "寝そべ"], en: "lie down to relax", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["寝", "眠", "すやすや"], en: "sleep peacefully", framing: "medium shot", camera: "slow push-in", sfx: "soft breathing" },
  { kind: "verb", ja: ["目を覚", "目覚め", "起き"], en: "wake up in bed with a big stretch and a yawn", framing: "medium shot", camera: "static", sfx: "a small yawn" },
  { kind: "verb", ja: ["歯をみが", "歯を磨", "歯みがき", "歯磨き", "歯ブラシ"], en: "brush teeth at the sink, foam around the mouth", framing: "medium close-up", camera: "static", human: true, sfx: "brisk toothbrush scrubbing" },
  { kind: "verb", ja: ["顔を洗"], en: "splash water on the face at the sink", framing: "medium close-up", camera: "static", human: true, sfx: "water splashing" },
  { kind: "verb", ja: ["着替え"], en: "change into fresh clothes", framing: "medium shot", camera: "static", human: true },
  { kind: "verb", ja: ["メイク", "化粧"], en: "put on makeup in front of a mirror", framing: "close-up", camera: "static", human: true },
  { kind: "verb", ja: ["手を振", "手をふ", "バイバイ"], en: "wave a hand", framing: "medium shot", camera: "static", speaks: true },
  { kind: "verb", ja: ["お辞儀", "おじぎ", "頭を下げ", "一礼"], en: "bow deeply, holding the bow for a moment before straightening up", framing: "medium wide shot", camera: "static", human: true, sfx: "soft rustle of clothes" },
  { kind: "verb", ja: ["拍手"], en: "clap hands", framing: "medium shot", camera: "static", sfx: "clapping" },
  { kind: "verb", ja: ["乾杯"], en: "raise a glass in a toast", framing: "medium shot", camera: "static", human: true, sfx: "glasses clinking", speaks: true },
  { kind: "verb", ja: ["抱きし", "抱きつ", "抱っこ", "ハグ"], en: "hug tightly", framing: "medium close-up", camera: "static" },
  { kind: "verb", ja: ["ポーズ"], en: "strike a pose for the camera", framing: "medium wide shot", camera: "static" },
  { kind: "verb", ja: ["湯切り"], en: "snap a deep mesh noodle strainer down to shake off the water, steam bursting up", framing: "close-up", camera: "static", human: true, sfx: "water splashing from the strainer" },
  { kind: "verb", ja: ["料理を作", "料理する", "料理して", "料理し"], en: "cook in a frying pan", framing: "medium close-up", camera: "static", human: true, sfx: "food sizzling in a pan" },
  { kind: "verb", ja: ["焼い", "焼く"], en: "grill {o}", bare: "grill food", framing: "close-up", camera: "slow push-in", sfx: "sizzling" },
  { kind: "verb", ja: ["食べ", "かじ", "頬張", "ほおば", "もぐもぐ"], en: "eat {o} happily", bare: "eat happily", framing: "close-up", camera: "slow push-in", sfx: "happy chewing" },
  { kind: "verb", ja: ["すす", "啜"], en: "slurp {o}", bare: "slurp noodles", framing: "close-up", camera: "static", sfx: "noisy noodle slurping" },
  { kind: "verb", ja: ["飲"], en: "drink {o}", bare: "take a drink", framing: "medium close-up", camera: "static", sfx: "a satisfied sip" },
  { kind: "verb", ja: ["弾"], en: "play {o}", bare: "play an instrument", framing: "medium close-up", camera: "slow push-in", human: true },
  { kind: "verb", ja: ["読"], en: "read {o}", bare: "read a book", framing: "medium shot", camera: "static", sfx: "pages turning" },
  { kind: "verb", ja: ["書い", "書く", "書き"], en: "write {o}", enOn: "write on {o}", bare: "write in a notebook", framing: "close-up", camera: "static", human: true, sfx: "pencil scratching on paper" },
  { kind: "verb", ja: ["勉強"], en: "study hard at a desk", framing: "medium shot", camera: "static", human: true, sfx: "pencil scratching on paper" },
  { kind: "verb", ja: ["掃除"], en: "clean up the room", framing: "medium wide shot", camera: "static", human: true },
  { kind: "verb", ja: ["撮"], en: "take a photo with a phone", framing: "medium shot", camera: "static", sfx: "a camera shutter click" },
  { kind: "verb", ja: ["投げ"], en: "throw {o}", bare: "throw a ball", framing: "medium wide shot", camera: "static" },
  { kind: "verb", ja: ["蹴"], en: "kick {o}", bare: "kick a ball", framing: "medium wide shot", camera: "static", sfx: "a solid kick" },
  { kind: "verb", ja: ["拾"], en: "pick up {o}", bare: "pick something up", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["持ち上げ", "掲げ"], en: "lift {o} up high", bare: "lift both arms up high", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["渡す", "渡し", "手渡"], en: "hand over {o}", bare: "hand something over", framing: "medium close-up", camera: "static" },
  { kind: "verb", ja: ["渡る", "渡っ", "渡り"], en: "cross {o}", bare: "cross the street", framing: "wide shot", camera: "handheld follow", sfx: "footsteps" },
  { kind: "verb", ja: ["開け", "開く", "開い"], en: "open {o}", bare: "open the door", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["閉め", "閉じ"], en: "close {o}", bare: "close the door", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["作っ", "作る", "作り"], en: "make {o}", bare: "make something carefully", framing: "medium close-up", camera: "static", human: true },
  { kind: "verb", ja: ["乗っ", "乗る", "乗り"], en: "ride {o}", bare: "ride along", framing: "wide shot", camera: "handheld follow" },
  { kind: "verb", ja: ["追いかけ", "追いか", "追っ"], en: "chase {o}", bare: "chase after something", framing: "wide shot", camera: "handheld follow", sfx: "quick footsteps" },
  { kind: "verb", ja: ["探"], en: "search for {o}", bare: "look around searching", framing: "medium shot", camera: "slow pan" },
  { kind: "verb", ja: ["見つけ"], en: "find {o}", bare: "find something, lighting up with joy", framing: "medium close-up", camera: "static" },
  { kind: "verb", ja: ["登"], en: "climb {o}", bare: "climb up", framing: "wide shot", camera: "slow upward tilt" },
  { kind: "verb", ja: ["待"], en: "wait for {o}", bare: "wait patiently", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["隠れ"], en: "hide, peeking out", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["転ん", "転ぶ", "転び"], en: "trip, tumbling softly", framing: "medium wide shot", camera: "static", sfx: "a soft thump" },
  { kind: "verb", ja: ["釣"], en: "fish with a rod", framing: "wide shot", camera: "static", sfx: "a fishing line whirring" },
  { kind: "verb", ja: ["サーフィン"], en: "surf a big wave", framing: "wide shot", camera: "handheld follow", sfx: "waves crashing" },
  { kind: "verb", ja: ["スキー"], en: "ski down the slope", framing: "wide shot", camera: "handheld follow", sfx: "skis carving through snow" },
  { kind: "verb", ja: ["スノボ", "スノーボード"], en: "snowboard down the slope", framing: "wide shot", camera: "handheld follow", sfx: "snow spraying" },
  { kind: "verb", ja: ["スケボー", "スケートボード"], en: "ride a skateboard", framing: "wide shot", camera: "handheld follow", sfx: "skateboard wheels rolling" },
  { kind: "verb", ja: ["運転"], en: "drive the car", framing: "medium shot", camera: "static", human: true, sfx: "engine hum" },
  { kind: "verb", ja: ["電話する", "電話して", "電話を"], en: "talk on a smartphone", framing: "medium close-up", camera: "static", human: true },
  { kind: "verb", ja: ["働", "仕事"], en: "work busily", framing: "medium shot", camera: "static", human: true },
  { kind: "verb", ja: ["洗"], en: "wash {o}", bare: "wash the dishes", framing: "medium close-up", camera: "static", sfx: "water running" },
  { kind: "verb", ja: ["置"], en: "put down {o}", bare: "put something down", framing: "close-up", camera: "static" },
  { kind: "verb", ja: ["注"], en: "pour {o}", bare: "pour a drink", framing: "close-up", camera: "slow push-in", sfx: "liquid pouring" },
  { kind: "verb", ja: ["とろっとかか", "とろりとかか", "かかる", "かけ", "垂れ", "滴"], en: "drizzle slowly over the top", framing: "close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["溶け", "とろけ"], en: "melt slowly", framing: "close-up", camera: "slow push-in" },
  { kind: "verb", ja: ["持ってく", "持って来", "持ってき"], en: "bring {o}", bare: "bring something over", framing: "medium wide shot", camera: "static" },
  { kind: "verb", ja: ["持っ", "持ち", "持つ"], en: "hold {o}", bare: "hold something carefully", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["吹き消"], en: "blow out {o}", bare: "blow out the candles", framing: "close-up", camera: "static", sfx: "a soft puff of breath" },
  { kind: "verb", ja: ["照らす", "照らし", "照ら"], en: "light up {o}", bare: "light up the scene", framing: "wide shot", camera: "slow pan" },
  { kind: "verb", ja: ["抜い", "抜く"], en: "draw {o}", bare: "draw a sword", framing: "medium close-up", camera: "static", sfx: "a blade sliding out of its scabbard" },
  { kind: "verb", ja: ["構え"], en: "take a steady ready stance", framing: "medium wide shot", camera: "slow push-in" },
  { kind: "verb", ja: ["飛び込"], en: "dive into {o}", bare: "dive in", framing: "wide shot", camera: "static", sfx: "a splash" },
  { kind: "verb", ja: ["居眠り", "うとうと"], en: "doze off, head nodding", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["日向ぼっこ", "ひなたぼっこ"], en: "bask in the warm sunlight", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["印を結"], en: "form a secret ninja hand sign", framing: "medium close-up", camera: "slow push-in", human: true },
  { kind: "verb", ja: ["手をつな", "手を繋"], en: "hold hands", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["サッカー"], en: "play soccer", framing: "wide shot", camera: "handheld follow", sfx: "a ball being kicked" },
  { kind: "verb", ja: ["ゴールを決め", "シュート"], en: "score a goal", framing: "wide shot", camera: "static", sfx: "the net swishing" },
  { kind: "verb", ja: ["光", "輝"], en: "glow softly", framing: "medium shot", camera: "slow push-in" },
  { kind: "verb", ja: ["揺れ", "なび"], en: "sway gently", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["落ち"], en: "fall", framing: "medium shot", camera: "static" },
  { kind: "verb", ja: ["登場", "現れ", "あらわれ"], en: "appear", framing: "medium wide shot", camera: "slow push-in" },
];

// ───────── 物・小物・服・音 ─────────

export const OBJECTS: ObjectDef[] = [
  { kind: "object", ja: ["スイカ", "すいか"], en: "a triangular slice of red watermelon", food: true },
  { kind: "object", ja: ["ラーメン"], en: "a steaming bowl of ramen with sliced pork and a soft-boiled egg", food: true },
  { kind: "object", ja: ["うどん", "そば", "蕎麦"], en: "a steaming bowl of noodles", food: true },
  { kind: "object", ja: ["ケーキ"], en: "a strawberry shortcake with white cream", food: true },
  { kind: "object", ja: ["パフェ"], en: "a tall fruit parfait in a glass", food: true },
  { kind: "object", ja: ["かき氷"], en: "a bowl of fluffy shaved ice with strawberry syrup", food: true },
  { kind: "object", ja: ["アイスクリーム", "アイス", "ソフトクリーム"], en: "an ice cream cone", food: true },
  { kind: "object", ja: ["パンケーキ", "ホットケーキ"], en: "a stack of fluffy pancakes with melting butter and syrup", food: true },
  { kind: "object", ja: ["パン"], en: "freshly baked golden bread", food: true },
  { kind: "object", ja: ["お寿司", "寿司", "すし"], en: "a plate of fresh nigiri sushi", food: true },
  { kind: "object", ja: ["おにぎり"], en: "a rice ball wrapped in nori", food: true },
  { kind: "object", ja: ["お弁当", "弁当"], en: "a colorful bento box", food: true },
  { kind: "object", ja: ["カレー"], en: "a plate of Japanese curry rice", food: true },
  { kind: "object", ja: ["ハンバーガー"], en: "a juicy hamburger", food: true },
  { kind: "object", ja: ["ピザ"], en: "a hot pizza with stretching melted cheese", food: true },
  { kind: "object", ja: ["たこ焼き"], en: "takoyaki balls topped with sauce and bonito flakes dancing in the heat", food: true },
  { kind: "object", ja: ["焼き鳥"], en: "grilled chicken skewers glazed with sauce", food: true },
  { kind: "object", ja: ["ステーキ", "肉"], en: "a sizzling steak", food: true, sound: "sizzling" },
  { kind: "object", ja: ["コーヒー"], en: "a cup of hot coffee", food: true },
  { kind: "object", ja: ["紅茶", "お茶"], en: "a cup of hot tea", food: true },
  { kind: "object", ja: ["ビール"], en: "a glass of beer with white foam", food: true },
  { kind: "object", ja: ["ジュース"], en: "a glass of fresh juice", food: true },
  { kind: "object", ja: ["料理", "ご飯", "ごはん"], en: "a home-cooked meal", food: true },
  { kind: "object", ja: ["チョコレート", "チョコ"], en: "a glossy piece of chocolate", food: true },
  { kind: "object", ja: ["いちご", "イチゴ", "苺"], en: "fresh red strawberries", food: true },
  { kind: "object", ja: ["りんご", "リンゴ"], en: "a shiny red apple", food: true },
  { kind: "object", ja: ["香水"], en: "an elegant glass perfume bottle", product: true },
  { kind: "object", ja: ["腕時計", "時計"], en: "a polished wristwatch", product: true },
  { kind: "object", ja: ["スニーカー", "靴"], en: "a pair of clean white sneakers", product: true },
  { kind: "object", ja: ["口紅", "リップ"], en: "a sleek lipstick", product: true },
  { kind: "object", ja: ["コスメ", "化粧品", "美容液"], en: "a sleek cosmetics bottle", product: true },
  { kind: "object", ja: ["ヘッドホン", "イヤホン"], en: "a pair of modern headphones", product: true },
  { kind: "object", ja: ["スマホ", "スマートフォン", "携帯"], en: "a smartphone", product: true },
  { kind: "object", ja: ["バッグ", "かばん", "鞄"], en: "a stylish leather bag", product: true },
  { kind: "object", ja: ["ペットボトル", "ドリンク"], en: "a chilled drink bottle with condensation", product: true },
  { kind: "object", ja: ["看板"], en: "a large signboard facing the camera", sign: true },
  { kind: "object", ja: ["ポスター", "張り紙", "貼り紙"], en: "a poster on the wall facing the camera", sign: true },
  { kind: "object", ja: ["黒板"], en: "a green blackboard facing the camera", sign: true },
  { kind: "object", ja: ["横断幕", "垂れ幕", "旗", "のぼり"], en: "a banner facing the camera", sign: true },
  { kind: "object", ja: ["風鈴"], en: "a glass wind chime with a paper strip hanging from the eaves", sound: "a glass wind chime ringing softly" },
  { kind: "object", ja: ["目覚まし時計", "目覚まし"], en: "an alarm clock", sound: "an alarm clock ringing then clicked off" },
  { kind: "object", ja: ["鐘"], en: "a large bronze bell", sound: "a deep bell ringing" },
  { kind: "object", ja: ["電話"], en: "a phone", sound: "a phone ringing" },
  { kind: "object", ja: ["ギター"], en: "an acoustic guitar", sound: "acoustic guitar strumming" },
  { kind: "object", ja: ["ピアノ"], en: "a grand piano", sound: "gentle piano notes" },
  { kind: "object", ja: ["バイオリン"], en: "a violin", sound: "a warm violin melody" },
  { kind: "object", ja: ["太鼓"], en: "a large taiko drum", sound: "powerful taiko drum beats" },
  { kind: "object", ja: ["花火"], en: "big fireworks bursting in the night sky", sound: "deep firework booms and crackling", implies: ["夜"] },
  { kind: "object", ja: ["シャボン玉"], en: "soap bubbles floating and shimmering in the light" },
  { kind: "object", ja: ["湯気の立つ", "湯気が立つ", "湯気の上がる"], en: "rising steam" },
  { kind: "object", ja: ["シロップ", "はちみつ", "ハチミツ"], en: "golden syrup", food: true },
  { kind: "object", ja: ["チーズ"], en: "melted cheese", food: true },
  { kind: "object", ja: ["ソース"], en: "glossy sauce", food: true },
  { kind: "object", ja: ["クリーム"], en: "whipped cream", food: true },
  { kind: "object", ja: ["サッカーボール"], en: "a soccer ball" },
  { kind: "object", ja: ["刀"], en: "a gleaming katana" },
  { kind: "object", ja: ["笹", "竹"], en: "fresh green bamboo leaves", food: true },
  { kind: "object", ja: ["りんご飴"], en: "a shiny red candy apple", food: true },
  { kind: "object", ja: ["卵焼き"], en: "a fluffy rolled Japanese omelet", food: true },
  { kind: "object", ja: ["ミルク", "牛乳"], en: "milk", food: true },
  { kind: "object", ja: ["地球"], en: "the blue Earth" },
  { kind: "object", ja: ["かつお節", "鰹節"], en: "bonito flakes", food: true },
  { kind: "object", ja: ["提灯", "ちょうちん"], en: "glowing red paper lanterns" },
  { kind: "object", ja: ["鳥居"], en: "a red torii gate" },
  { kind: "object", ja: ["雪だるま"], en: "a round snowman with a carrot nose" },
  { kind: "object", ja: ["紙飛行機"], en: "a white paper airplane" },
  { kind: "object", ja: ["飛行機"], en: "an airplane", sound: "a jet passing overhead" },
  { kind: "object", ja: ["風船"], en: "a bunch of colorful balloons" },
  { kind: "object", ja: ["ろうそく", "キャンドル"], en: "softly flickering candles" },
  { kind: "object", ja: ["プレゼント", "贈り物"], en: "a wrapped gift box with a ribbon" },
  { kind: "object", ja: ["花束"], en: "a bouquet of colorful flowers" },
  { kind: "object", ja: ["ひまわり"], en: "tall sunflowers" },
  { kind: "object", ja: ["花"], en: "colorful flowers" },
  { kind: "object", ja: ["手紙"], en: "a handwritten letter" },
  { kind: "object", ja: ["本"], en: "a book" },
  { kind: "object", ja: ["ノート"], en: "a notebook" },
  { kind: "object", ja: ["ボール"], en: "a ball" },
  { kind: "object", ja: ["自転車"], en: "a bicycle", sound: "a bicycle bell" },
  { kind: "object", ja: ["電車"], en: "a commuter train", sound: "a train rumbling past" },
  { kind: "object", ja: ["車"], en: "a car" },
  { kind: "object", ja: ["ドア", "扉"], en: "the door", sound: "a door clicking" },
  { kind: "object", ja: ["窓"], en: "the window" },
  { kind: "object", ja: ["ベンチ"], en: "a wooden bench" },
  { kind: "object", ja: ["カメラ"], en: "a camera", sound: "a camera shutter click" },
  { kind: "object", ja: ["パソコン", "ノートパソコン"], en: "a laptop", sound: "keyboard typing" },
  { kind: "object", ja: ["月"], en: "a bright full moon", implies: ["夜"] },
  { kind: "object", ja: ["星"], en: "twinkling stars", implies: ["夜"] },
  { kind: "object", ja: ["太陽"], en: "the bright sun" },
  { kind: "object", ja: ["雲"], en: "fluffy white clouds" },
  { kind: "object", ja: ["空"], en: "the open sky" },
  { kind: "object", ja: ["波"], en: "rolling waves", sound: "waves washing ashore" },
  { kind: "object", ja: ["湯気"], en: "rising steam" },
  { kind: "object", ja: ["ビル"], en: "tall buildings" },
  { kind: "object", ja: ["ネオン"], en: "glowing neon signs" },
  { kind: "object", ja: ["水たまり"], en: "a puddle reflecting the sky" },
  { kind: "object", ja: ["鏡"], en: "a mirror" },
  { kind: "object", ja: ["魚"], en: "a fish" },
  { kind: "object", ja: ["おもちゃ"], en: "a colorful toy" },
];

export const PROPS: PropDef[] = [
  { kind: "prop", ja: ["傘をさした", "傘をさし", "傘を差し", "傘を差した", "傘を持った", "傘"], en: "holding a clear plastic umbrella" },
  { kind: "prop", ja: ["虫取り網", "虫とり網"], en: "a bug-catching net" },
  { kind: "prop", ja: ["ほうき", "箒"], en: "a wooden broomstick" },
  { kind: "prop", ja: ["ランドセル"], en: "a red randoseru school backpack on the back" },
  { kind: "prop", ja: ["リュック"], en: "a small backpack" },
  { kind: "prop", ja: ["麦わら帽子"], en: "a straw hat" },
  { kind: "prop", ja: ["帽子"], en: "a soft cap" },
  { kind: "prop", ja: ["メガネ", "眼鏡"], en: "round glasses" },
  { kind: "prop", ja: ["マフラー"], en: "a soft knitted scarf" },
  { kind: "prop", ja: ["ヘッドフォン"], en: "headphones around the neck" },
];

export const WARDROBES: WardrobeDef[] = [
  { kind: "wardrobe", ja: ["浴衣"], f: "navy yukata with a white morning glory pattern and a red obi", m: "charcoal gray striped yukata with a black obi", n: "light blue yukata with a white obi" },
  { kind: "wardrobe", ja: ["着物"], f: "red silk kimono with a floral pattern and a gold obi", m: "dark navy kimono with a gray hakama", n: "pale pink kimono with a white obi" },
  { kind: "wardrobe", ja: ["制服"], f: "navy blazer school uniform with a red ribbon tie and a gray pleated skirt", m: "black gakuran school uniform with gold buttons", n: "navy school uniform" },
  { kind: "wardrobe", ja: ["スーツ"], f: "tailored charcoal pantsuit with a white blouse", m: "dark navy suit with a white shirt and blue tie", n: "dark suit" },
  { kind: "wardrobe", ja: ["パジャマ"], f: "soft pastel pajamas", m: "striped cotton pajamas", n: "soft pastel pajamas" },
  { kind: "wardrobe", ja: ["ドレス"], f: "elegant long dress in deep blue", m: "black tuxedo", n: "elegant formal outfit" },
  { kind: "wardrobe", ja: ["ワンピース"], f: "simple knee-length dress", m: "simple linen shirt and trousers", n: "simple knee-length dress" },
  { kind: "wardrobe", ja: ["水着"], f: "sporty one-piece swimsuit", m: "board shorts", n: "sporty swimsuit" },
  { kind: "wardrobe", ja: ["エプロン"], f: "white shirt and a red apron", m: "white shirt and a dark apron", n: "small red apron" },
  { kind: "wardrobe", ja: ["コート"], f: "long camel coat and a knitted scarf", m: "long gray wool coat", n: "warm duffle coat" },
  { kind: "wardrobe", ja: ["ジャージ"], f: "blue track suit", m: "blue track suit", n: "blue track suit" },
  { kind: "wardrobe", ja: ["服"], f: "casual clothes", m: "casual clothes", n: "casual clothes" },
];

export const SOUNDS: SoundDef[] = [
  { kind: "sound", key: "chime", ja: ["チリン", "ちりん", "チリンチリン"], en: "one clear glass wind chime ring, chirin" },
  { kind: "sound", key: "meow", ja: ["ニャー", "にゃー", "ニャン", "にゃん", "ミャー"], en: "a short meow" },
  { kind: "sound", key: "bark", ja: ["ワンワン", "わんわん", "ワン"], en: "a happy bark" },
  { kind: "sound", key: "heavy_rain", ja: ["ザーザー", "ざーざー"], en: "heavy rain pouring" },
  { kind: "sound", key: "drip", ja: ["ポツポツ", "ぽつぽつ", "しとしと"], en: "light raindrops pattering" },
  { kind: "sound", key: "boom", ja: ["ドーン", "どーん", "ドカーン"], en: "a deep boom" },
  { kind: "sound", key: "crackle", ja: ["パチパチ", "ぱちぱち"], en: "crackling" },
  { kind: "sound", key: "thunder", ja: ["ゴロゴロ"], en: "rolling thunder" },
  { kind: "sound", key: "sizzle", ja: ["ジュージュー", "ジュー", "じゅーじゅー"], en: "sizzling on a hot pan" },
  { kind: "sound", key: "slurp", ja: ["ズルズル", "ずるずる"], en: "noisy noodle slurping" },
  { kind: "sound", key: "clink", ja: ["カラン", "からん"], en: "a clink of ice in a glass" },
  { kind: "sound", key: "knock", ja: ["コンコン", "トントン"], en: "a light knock" },
  { kind: "sound", key: "doorbell", ja: ["ピンポン"], en: "a doorbell chime" },
  { kind: "sound", key: "heart", ja: ["ドキドキ"], en: "a heartbeat" },
  { kind: "sound", key: "bell", ja: ["チャイム"], en: "a school chime" },
  { kind: "sound", key: "steps", ja: ["足音"], en: "footsteps" },
  { kind: "sound", key: "waves", ja: ["波の音", "波音", "ザブーン"], en: "waves washing ashore" },
  { kind: "sound", key: "birds", ja: ["さえずり", "鳥の声"], en: "birds chirping" },
  { kind: "sound", key: "cicada", ja: ["セミ", "蝉", "ミンミン"], en: "cicadas singing" },
  { kind: "sound", key: "whistle", ja: ["汽笛"], en: "a distant train whistle" },
  { kind: "sound", key: "applause", ja: ["歓声"], en: "an excited cheer" },
];

export const MODIFIERS: ModifierDef[] = [
  { kind: "modifier", ja: ["元気に", "元気よく", "元気"], adverb: "energetically", delivery: "energetic" },
  { kind: "modifier", ja: ["嬉しそうに", "うれしそうに", "楽しそうに", "楽しく"], adverb: "happily", delivery: "happy and bright" },
  { kind: "modifier", ja: ["悲しそうに", "寂しそうに", "さみしそうに"], adverb: "sadly", delivery: "sad and quiet" },
  { kind: "modifier", ja: ["ゆっくり", "ゆったり"], adverb: "slowly" },
  { kind: "modifier", ja: ["静かに", "そっと"], adverb: "quietly", delivery: "quiet" },
  { kind: "modifier", ja: ["思いっきり", "思い切り", "全力で", "全力"], adverb: "with full force", delivery: "loud and full of energy" },
  { kind: "modifier", ja: ["優しく", "やさしく"], adverb: "gently", delivery: "gentle and kind" },
  { kind: "modifier", ja: ["慌てて", "あわてて", "急いで"], adverb: "in a hurry", delivery: "hurried" },
  { kind: "modifier", ja: ["小声で", "小さな声で"], delivery: "in a soft whisper" },
  { kind: "modifier", ja: ["大声で", "大きな声で"], delivery: "loud" },
  { kind: "modifier", ja: ["自然に"], adverb: "naturally" },
  { kind: "modifier", ja: ["よちよち"], adverb: "with a waddle" },
  { kind: "modifier", ja: ["とろっと", "とろりと", "とろーり"], adverb: "in a slow, thick stream" },
  { kind: "modifier", ja: ["キラキラ", "きらきら"], adverb: "with sparkling light" },
  { kind: "modifier", ja: ["ふわふわ", "ふわっと", "ふわり"], adverb: "lightly and softly" },
  { kind: "modifier", ja: ["かっこよく", "格好よく"], adverb: "coolly" },
  { kind: "modifier", ja: ["可愛く", "かわいく"], adverb: "cutely", delivery: "cute" },
];

export const COLORS: ColorDef[] = [
  { kind: "color", ja: ["焼きたての", "焼き立ての", "出来たての", "できたての", "揚げたての", "作りたての"], en: "freshly made" },
  { kind: "color", ja: ["熱々の", "アツアツの", "あつあつの"], en: "piping hot" },
  { kind: "color", ja: ["冷たい", "キンキンに冷えた", "冷えた"], en: "ice-cold" },
  { kind: "color", ja: ["ふわふわの", "ふわふわな"], en: "fluffy" },
  { kind: "color", ja: ["大きな", "巨大な"], en: "huge" },
  { kind: "color", ja: ["小さな", "ちいさな"], en: "tiny" },
  { kind: "color", ja: ["赤い", "赤の", "真っ赤な"], en: "red" },
  { kind: "color", ja: ["青い", "青の", "真っ青な"], en: "blue" },
  { kind: "color", ja: ["白い", "白の", "真っ白な"], en: "white" },
  { kind: "color", ja: ["黒い", "黒の", "真っ黒な"], en: "black" },
  { kind: "color", ja: ["黄色い", "黄色の"], en: "yellow" },
  { kind: "color", ja: ["緑の", "緑色の"], en: "green" },
  { kind: "color", ja: ["ピンクの", "ピンク色の"], en: "pink" },
  { kind: "color", ja: ["紫の", "紫色の"], en: "purple" },
  { kind: "color", ja: ["金色の", "金の"], en: "gold" },
  { kind: "color", ja: ["銀色の", "銀の"], en: "silver" },
];

export const MUSIC: MusicDef[] = [
  { kind: "music", ja: ["BGM", "音楽", "曲"], en: "upbeat background music that fits the mood" },
  { kind: "music", ja: ["ジャズ"], en: "smooth jazz background music" },
  { kind: "music", ja: ["ピアノの曲"], en: "gentle solo piano background music" },
];

export const CROWDS: CrowdDef[] = [
  { kind: "crowd", ja: ["人混み", "人ごみ", "群衆", "大勢の人", "人々", "観客"], en: "a crowd of people in the background" },
];

export const GENRES: GenreDef[] = [
  { kind: "genre", ja: ["商品紹介", "新商品", "新作", "新発売", "商品", "製品", "宣伝", "広告", "CM"], genre: "product" },
  { kind: "genre", ja: ["飯テロ", "シズル"], genre: "food" },
];

export const STOPS: StopDef[] = [
  { kind: "stop", ja: ["日本", "本当", "本日", "落ち着", "今回", "何回", "一回", "二回", "三回", "何度", "一緒", "同じ", "始め", "始ま", "カメラが", "カメラは", "キャラクター", "キャラ", "注文", "注目", "注意", "様子", "写真", "画像",
    "動画", "映像", "場面", "瞬間", "最後", "最初", "途中", "全員", "全部", "自分", "私", "僕", "俺", "前", "後ろ", "後", "中", "上", "下", "横", "隣",
    "外", "奥", "手前", "向こう", "一人", "独り", "少し", "時", "今", "感じ", "気持ち", "風景", "景色", "姿", "方", "間", "毎日", "今日", "明日",
    "上手", "大きく", "深く", "一気", "次々", "順番", "次", "雰囲気", "時間", "日", "秒", "回", "度", "人", "匹", "頭", "羽", "枚", "個", "杯",
    "大", "小", "新", "古", "長い", "短い", "高く", "高い", "低い", "遠く", "近く", "々"] },
];

export const LEXICON: Entry[] = [
  ...STOPS, ...SUBJECTS, ...PAIRS, ...PLACES, ...TIMES, ...WEATHERS, ...SEASONS, ...VERBS,
  ...OBJECTS, ...PROPS, ...WARDROBES, ...SOUNDS, ...MODIFIERS, ...COLORS, ...MUSIC, ...CROWDS, ...GENRES,
];
