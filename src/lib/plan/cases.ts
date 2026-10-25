// 一文→指示文の確認用の課題セット。用途ごとに、指示文に必ず入ってほしい英語の言葉を書いておく。
// cases.test.ts が全部を変換して、抜け・崩れ・ぶれがないかを確かめ、結果を
// tools/prompt-expander/examples/rule-based.md に書き出す（npm run examples で作り直す）。

import type { Duration, FinalModel, Mood } from "@/lib/types";

export interface PlanCase {
  category: string;
  sentence: string;
  from_image?: boolean;
  mood?: Mood;
  /** 書き出す例の長さ（検査は10秒と15秒の両方で行う） */
  duration?: Duration;
  /** 指示文（Kling 形式）に入っていなければならない言葉 */
  expect: string[];
  model: FinalModel;
  characters: number;
}

export const CASES: PlanCase[] = [
  // 品質チェックの6課題（quality-check/test-set.md）
  { category: "品質チェック", duration: 15, sentence: "雨の渋谷の交差点で、傘をさした女子高生が振り返って「また明日ね」と笑う", expect: ["rain", "Shibuya", "umbrella", "high school girl", "turns around", "smiles", "「また明日ね」"], model: "kling-3.0", characters: 1 },
  { category: "品質チェック", duration: 15, sentence: "柴犬が縁側でスイカを食べていて、風鈴がチリンと鳴る夏の午後", expect: ["Shiba Inu", "veranda", "watermelon", "wind chime", "chirin", "summer", "afternoon"], model: "veo-3.1", characters: 1 },
  { category: "品質チェック", duration: 15, sentence: "ラーメン屋の大将が湯切りをしながら「へい、お待ち！」と元気に叫ぶ", expect: ["ramen shop", "ramen chef", "noodle strainer", "shout", "「へい、お待ち！」"], model: "kling-3.0", characters: 1 },
  { category: "品質チェック", duration: 15, sentence: "同じ三毛猫のキャラが、朝起きて、歯をみがいて、学校へ走っていく", expect: ["calico cat", "3D animated", "morning", "wakes up", "brushes teeth", "runs toward"], model: "veo-3.1", characters: 1 },
  { category: "品質チェック", duration: 15, sentence: "夏祭りの夜、浴衣の二人が花火を見上げて「きれいだね」「うん」と話す", expect: ["summer festival", "at night", "yukata", "A and B look up", "fireworks", "「きれいだね」", "「うん」"], model: "kling-3.0", characters: 2 },
  { category: "品質チェック", duration: 15, sentence: "「本日開店」と書かれた看板の前で、店主が深くお辞儀する", expect: ["「本日開店」", "signboard", "shop owner", "bows deeply"], model: "veo-3.1", characters: 1 },

  // SNS の日常
  { category: "日常", sentence: "朝のカフェで女性がコーヒーを飲みながら本を読む", expect: ["cafe", "morning", "woman", "drinks a cup of hot coffee", "reads a book"], model: "veo-3.1", characters: 1 },
  { category: "日常", sentence: "公園で子どもがシャボン玉を追いかけてはしゃぐ", expect: ["park", "child", "chases soap bubbles", "jumps for joy"], model: "veo-3.1", characters: 1 },
  { category: "日常", sentence: "夕方の屋上で、制服の男子高校生が空を見上げる", expect: ["rooftop", "dusk", "high school boy", "gakuran", "looks up at the open sky"], model: "veo-3.1", characters: 1 },
  { category: "日常", sentence: "おばあちゃんが縁側でお茶を飲んでいる", expect: ["elderly Japanese woman", "veranda", "drinks a cup of hot tea"], model: "veo-3.1", characters: 1 },
  { category: "日常", sentence: "サラリーマンが満員電車で居眠りする", expect: ["office worker", "packed commuter train", "dozes off"], model: "veo-3.1", characters: 1 },

  // ペット・動物
  { category: "ペット・動物", sentence: "夕焼けの海辺で猫が驚いてジャンプする", expect: ["sunset", "beach", "cat", "is startled", "jumps high"], model: "veo-3.1", characters: 1 },
  { category: "ペット・動物", sentence: "黒猫が窓辺で日向ぼっこしてあくびをする", expect: ["black cat", "window", "basks in the warm sunlight", "gives a big yawn"], model: "veo-3.1", characters: 1 },
  { category: "ペット・動物", sentence: "子犬が雪の中を走り回って尻尾を振る", expect: ["puppy", "snow", "runs", "wags the tail"], model: "veo-3.1", characters: 1 },
  { category: "ペット・動物", sentence: "ペンギンがよちよち歩いて海に飛び込む", expect: ["penguin", "walks with a waddle", "dives into"], model: "veo-3.1", characters: 1 },
  { category: "ペット・動物", sentence: "猫が「にゃっ」と鳴く", expect: ["cat", "「にゃっ」"], model: "kling-3.0", characters: 1 },

  // 食べ物
  { category: "食べ物", sentence: "焼きたてのパンケーキにシロップがとろっとかかる", expect: ["freshly made", "pancakes", "syrup", "drizzles"], model: "veo-3.1", characters: 0 },
  { category: "食べ物", sentence: "湯気の立つラーメンをズルズルすする", expect: ["steam", "ramen", "slurps", "slurping"], model: "veo-3.1", characters: 1 },
  { category: "食べ物", sentence: "熱々のたこ焼きの上でかつお節が踊る", expect: ["piping hot", "takoyaki"], model: "veo-3.1", characters: 0 },
  { category: "食べ物", sentence: "冷たいビールで乾杯する", expect: ["ice-cold", "beer", "raises a glass in a toast", "glasses clinking"], model: "veo-3.1", characters: 1 },

  // 商品紹介
  { category: "商品紹介", sentence: "新商品の香水がキラキラ光る", expect: ["perfume bottle", "glows softly", "commercial product look", "brand names"], model: "veo-3.1", characters: 0 },
  { category: "商品紹介", sentence: "新作のスニーカーがくるくる回る", expect: ["white sneakers", "spins around", "commercial"], model: "veo-3.1", characters: 0 },
  { category: "商品紹介", sentence: "白い背景で腕時計がゆっくり回転する", expect: ["white backdrop", "wristwatch", "spins around slowly"], model: "veo-3.1", characters: 0 },

  // 風景・旅行・季節
  { category: "風景・季節", sentence: "波が打ち寄せる夕暮れの海", expect: ["Waves roll", "dusk", "sea", "people"], model: "veo-3.1", characters: 0 },
  { category: "風景・季節", sentence: "秋の京都で紅葉が舞う", expect: ["Kyoto", "Autumn leaves flutter"], model: "veo-3.1", characters: 0 },
  { category: "風景・季節", sentence: "桜が散る川沿いを、制服の女子高生が自転車に乗って走る", expect: ["Cherry blossom petals", "riverside", "school uniform", "rides a bicycle"], model: "veo-3.1", characters: 1 },
  { category: "風景・季節", sentence: "満天の星の下、草原で流れ星が流れる", expect: ["stars twinkle", "meadow", "shooting star"], model: "veo-3.1", characters: 0 },
  { category: "風景・季節", sentence: "雪が降る夜の神社で、着物の女性が手を合わせる", expect: ["Snowflakes", "night", "Shinto shrine", "kimono", "hands together"], model: "veo-3.1", characters: 1 },

  // セリフ・会話
  { category: "セリフ", sentence: "女の子がケーキのろうそくを吹き消して「ありがとう！」と言う", expect: ["girl", "blows out", "candles", "「ありがとう！」"], model: "kling-3.0", characters: 1 },
  { category: "セリフ", sentence: "ロボットが「こんにちは」と手を振る", expect: ["robot", "waves a hand", "「こんにちは」"], model: "kling-3.0", characters: 1 },
  { category: "セリフ", sentence: "お母さんが「いってらっしゃい」と言い、男の子が「いってきます！」と走っていく", expect: ["mother", "boy", "「いってらっしゃい」", "「いってきます！」", "runs"], model: "kling-3.0", characters: 2 },

  // 画面の文字
  { category: "画面の文字", sentence: "教室で先生が黒板に「夢」と書く", expect: ["classroom", "teacher", "writes on a green blackboard", "「夢」", "garbled characters"], model: "veo-3.1", characters: 1 },
  { category: "画面の文字", sentence: "「新発売」の看板の前で店員が「いらっしゃいませ！」と言う", expect: ["「新発売」", "shop clerk", "「いらっしゃいませ！」"], model: "kling-3.0", characters: 1 },

  // キャラ・ファンタジー
  { category: "キャラ・ファンタジー", sentence: "ドラゴンが城の上を飛ぶ", expect: ["dragon", "castle", "flies through the air"], model: "veo-3.1", characters: 1 },
  { category: "キャラ・ファンタジー", sentence: "侍が刀を抜いて構える", expect: ["samurai", "draws a gleaming katana", "ready stance"], model: "veo-3.1", characters: 1 },
  { category: "キャラ・ファンタジー", sentence: "宇宙飛行士が月の上でゆっくりジャンプする", expect: ["astronaut", "surface of the Moon", "jumps high slowly"], model: "veo-3.1", characters: 1 },
  { category: "キャラ・ファンタジー", sentence: "魔女がほうきで夜空を飛ぶ", mood: "anime", expect: ["witch", "anime", "night", "flies"], model: "veo-3.1", characters: 1 },

  // 写真から作る
  { category: "写真から", from_image: true, sentence: "写真の中の様子が、自然にゆっくり動き出す", expect: ["Animate the input image", "Everything in the scene starts to move", "keep the look"], model: "kling-3.0", characters: 0 },
  { category: "写真から", from_image: true, sentence: "髪が風になびいて、こちらを見て微笑む", expect: ["Animate the input image", "hair flows", "looks straight at the camera", "smiles", "identity"], model: "kling-3.0", characters: 1 },
  { category: "写真から", from_image: true, sentence: "犬が「おかえり！」と言って尻尾を振る", expect: ["the dog in the input image", "wags the tail", "「おかえり！」"], model: "kling-3.0", characters: 1 },
  { category: "写真から", from_image: true, sentence: "料理から湯気が立ち、カメラがゆっくり寄る", expect: ["Animate the input image", "Steam rises", "push-in"], model: "kling-3.0", characters: 0 },
  { category: "写真から", from_image: true, sentence: "雪が降り始めて、二人が手をつなぐ", expect: ["Snowflakes", "A and B hold hands", "in the input image"], model: "kling-3.0", characters: 2 },
  { category: "写真から", from_image: true, sentence: "商品がくるっと回って光る", expect: ["Animate the input image", "spins around", "glows"], model: "kling-3.0", characters: 0 },
];
