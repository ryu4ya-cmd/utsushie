# 練習モードの一文→指示文（自動生成）

`src/lib/plan/cases.ts` の課題セットを、LLM を使わない練習モードの変換（`src/lib/plan/mockPlanner.ts`）にかけた結果。
変換や辞書を変えたら `npm run examples` で作り直す（テストがこのファイルとの違いを見つける）。

辞書で読み切れた一文：43 / 43

| # | 用途 | 一文 | 本番のモデル | 辞書にない言葉 |
|---|---|---|---|---|
| 1 | 品質チェック | 雨の渋谷の交差点で、傘をさした女子高生が振り返って「また明日ね」と笑う | kling-3.0 | — |
| 2 | 品質チェック | 柴犬が縁側でスイカを食べていて、風鈴がチリンと鳴る夏の午後 | veo-3.1 | — |
| 3 | 品質チェック | ラーメン屋の大将が湯切りをしながら「へい、お待ち！」と元気に叫ぶ | kling-3.0 | — |
| 4 | 品質チェック | 同じ三毛猫のキャラが、朝起きて、歯をみがいて、学校へ走っていく | veo-3.1 | — |
| 5 | 品質チェック | 夏祭りの夜、浴衣の二人が花火を見上げて「きれいだね」「うん」と話す | kling-3.0 | — |
| 6 | 品質チェック | 「本日開店」と書かれた看板の前で、店主が深くお辞儀する | veo-3.1 | — |
| 7 | 日常 | 朝のカフェで女性がコーヒーを飲みながら本を読む | veo-3.1 | — |
| 8 | 日常 | 公園で子どもがシャボン玉を追いかけてはしゃぐ | veo-3.1 | — |
| 9 | 日常 | 夕方の屋上で、制服の男子高校生が空を見上げる | veo-3.1 | — |
| 10 | 日常 | おばあちゃんが縁側でお茶を飲んでいる | veo-3.1 | — |
| 11 | 日常 | サラリーマンが満員電車で居眠りする | veo-3.1 | — |
| 12 | ペット・動物 | 夕焼けの海辺で猫が驚いてジャンプする | veo-3.1 | — |
| 13 | ペット・動物 | 黒猫が窓辺で日向ぼっこしてあくびをする | veo-3.1 | — |
| 14 | ペット・動物 | 子犬が雪の中を走り回って尻尾を振る | veo-3.1 | — |
| 15 | ペット・動物 | ペンギンがよちよち歩いて海に飛び込む | veo-3.1 | — |
| 16 | ペット・動物 | 猫が「にゃっ」と鳴く | kling-3.0 | — |
| 17 | 食べ物 | 焼きたてのパンケーキにシロップがとろっとかかる | veo-3.1 | — |
| 18 | 食べ物 | 湯気の立つラーメンをズルズルすする | veo-3.1 | — |
| 19 | 食べ物 | 熱々のたこ焼きの上でかつお節が踊る | veo-3.1 | — |
| 20 | 食べ物 | 冷たいビールで乾杯する | veo-3.1 | — |
| 21 | 商品紹介 | 新商品の香水がキラキラ光る | veo-3.1 | — |
| 22 | 商品紹介 | 新作のスニーカーがくるくる回る | veo-3.1 | — |
| 23 | 商品紹介 | 白い背景で腕時計がゆっくり回転する | veo-3.1 | — |
| 24 | 風景・季節 | 波が打ち寄せる夕暮れの海 | veo-3.1 | — |
| 25 | 風景・季節 | 秋の京都で紅葉が舞う | veo-3.1 | — |
| 26 | 風景・季節 | 桜が散る川沿いを、制服の女子高生が自転車に乗って走る | veo-3.1 | — |
| 27 | 風景・季節 | 満天の星の下、草原で流れ星が流れる | veo-3.1 | — |
| 28 | 風景・季節 | 雪が降る夜の神社で、着物の女性が手を合わせる | veo-3.1 | — |
| 29 | セリフ | 女の子がケーキのろうそくを吹き消して「ありがとう！」と言う | kling-3.0 | — |
| 30 | セリフ | ロボットが「こんにちは」と手を振る | kling-3.0 | — |
| 31 | セリフ | お母さんが「いってらっしゃい」と言い、男の子が「いってきます！」と走っていく | kling-3.0 | — |
| 32 | 画面の文字 | 教室で先生が黒板に「夢」と書く | veo-3.1 | — |
| 33 | 画面の文字 | 「新発売」の看板の前で店員が「いらっしゃいませ！」と言う | kling-3.0 | — |
| 34 | キャラ・ファンタジー | ドラゴンが城の上を飛ぶ | veo-3.1 | — |
| 35 | キャラ・ファンタジー | 侍が刀を抜いて構える | veo-3.1 | — |
| 36 | キャラ・ファンタジー | 宇宙飛行士が月の上でゆっくりジャンプする | veo-3.1 | — |
| 37 | キャラ・ファンタジー | 魔女がほうきで夜空を飛ぶ | veo-3.1 | — |
| 38 | 写真から | 📷 写真の中の様子が、自然にゆっくり動き出す | kling-3.0 | — |
| 39 | 写真から | 📷 髪が風になびいて、こちらを見て微笑む | kling-3.0 | — |
| 40 | 写真から | 📷 犬が「おかえり！」と言って尻尾を振る | kling-3.0 | — |
| 41 | 写真から | 📷 料理から湯気が立ち、カメラがゆっくり寄る | kling-3.0 | — |
| 42 | 写真から | 📷 雪が降り始めて、二人が手をつなぐ | kling-3.0 | — |
| 43 | 写真から | 📷 商品がくるっと回って光る | kling-3.0 | — |

## 1. 雨の渋谷の交差点で、傘をさした女子高生が振り返って「また明日ね」と笑う

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：雨→1、渋谷の交差点→1、傘をさした→1、女子高生→1、振り返→1、「また明日ね」→2、笑→2

```text
9:16 vertical video, 15 seconds. Style: photorealistic, rainy, overcast light, subject centered in the vertical frame. Setting: The Shibuya scramble crossing in Tokyo, crowds with umbrellas or bags crossing in every direction, in steady rain, wet surfaces reflecting light. No background music.
Shot 1 (0-8s): Medium close-up, static. A is a Japanese high school girl about 17 years old, soft round face, shoulder-length straight black hair with bangs, navy blazer school uniform with a red ribbon tie and a gray pleated skirt, holding a clear plastic umbrella. A turns around toward the camera. Ambience: steady rain, pedestrian crossing signal beeping.
Shot 2 (8-15s): Close-up, slow push-in. A is a Japanese high school girl about 17 years old, soft round face, shoulder-length straight black hair with bangs, navy blazer school uniform with a red ribbon tie and a gray pleated skirt, holding a clear plastic umbrella. A smiles warmly. A says in Japanese in a bright, friendly young female voice, cheerful, with a light laugh, with matching lip movement: 「また明日ね」. Ambience: steady rain, pedestrian crossing signal beeping.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 2. 柴犬が縁側でスイカを食べていて、風鈴がチリンと鳴る夏の午後

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：柴犬→1、縁側→1、スイカ→2、食べ→2、風鈴→1、チリン→2、鳴→2、夏→1、午後→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, warm afternoon light, subject centered in the vertical frame. Setting: The wooden veranda (engawa) of an old Japanese house, a green garden beyond, in the afternoon, in summer. No background music.
0-8s: Wide shot, slow push-in. A is a red-and-white Shiba Inu dog with a fox-like face, upright triangular ears, cream cheeks and chest, a tightly curled tail, wearing a thin red collar. The camera reveals the scene with A in the middle of it, calm and natural. Ambience: soft breeze through the garden, cicadas singing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different Shiba Inu, changing fur pattern.

# 延長（続き7秒）
9:16 vertical video, 7 seconds. Style: photorealistic, warm afternoon light, subject centered in the vertical frame. Setting: The wooden veranda (engawa) of an old Japanese house, a green garden beyond, in the afternoon, in summer. No background music.
Continue seamlessly from the last frame of the previous clip.
0-7s: Close-up, slow push-in. A is a red-and-white Shiba Inu dog with a fox-like face, upright triangular ears, cream cheeks and chest, a tightly curled tail, wearing a thin red collar. A eats a triangular slice of red watermelon happily. Visible details: a glass wind chime with a paper strip hanging from the eaves. Sound effects: happy chewing, one clear glass wind chime ring, chirin. Ambience: soft breeze through the garden, cicadas singing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different Shiba Inu, changing fur pattern.
```

## 3. ラーメン屋の大将が湯切りをしながら「へい、お待ち！」と元気に叫ぶ

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：ラーメン屋→1、大将→1、湯切り→1、「へい、お待ち！」→2、叫→2
- 決めたこと：大将は50代の男性

```text
9:16 vertical video, 15 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The open kitchen behind the wooden counter of a small Japanese ramen shop, big pots of boiling water. No background music.
Shot 1 (0-8s): Close-up, static. A is a Japanese ramen chef in his 50s, square face with a short stubble beard, buzz-cut black hair, white twisted headband, black T-shirt, dark navy apron, thick forearms. A snaps a deep mesh noodle strainer down to shake off the water, steam bursting up. Sound effects: water splashing from the strainer. Ambience: low chatter of customers.
Shot 2 (8-15s): Medium shot, static. A is a Japanese ramen chef in his 50s, square face with a short stubble beard, buzz-cut black hair, white twisted headband, black T-shirt, dark navy apron, thick forearms. A shouts with the mouth wide open energetically. A says in Japanese in a loud, gruff, energetic middle-aged male voice, shouted, loud and energetic, with matching lip movement: 「へい、お待ち！」. Ambience: low chatter of customers.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 4. 同じ三毛猫のキャラが、朝起きて、歯をみがいて、学校へ走っていく

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：三毛猫→1、朝→1、起き→1、歯をみが→2、学校→1、走→3
- 決めたこと：人のように動く動物なので、3Dアニメ風にしました / 場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: 3D animated feature film style, soft morning light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene, in the morning. No background music.
0-4s: Medium shot, static. A is an anthropomorphic, upright-walking calico cat with white fur and large orange and black patches, a black patch over the left ear, an orange patch around the right eye, big green eyes, a small pink nose. A wakes up in bed with a big stretch and a yawn. Sound effects: a small yawn. Ambience: birds chirping.
4-8s: Medium close-up, static. A is an anthropomorphic, upright-walking calico cat with white fur and large orange and black patches, a black patch over the left ear, an orange patch around the right eye, big green eyes, a small pink nose. A brushes teeth at the sink, foam around the mouth. Sound effects: brisk toothbrush scrubbing. Ambience: birds chirping.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different calico cat, changing fur pattern.

# 延長（続き7秒）
9:16 vertical video, 7 seconds. Style: 3D animated feature film style, soft morning light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene, in the morning. No background music.
Continue seamlessly from the last frame of the previous clip.
0-7s: Wide shot, handheld follow. A is an anthropomorphic, upright-walking calico cat with white fur and large orange and black patches, a black patch over the left ear, an orange patch around the right eye, big green eyes, a small pink nose. A runs toward a Japanese school building. Sound effects: quick footsteps. Ambience: birds chirping.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different calico cat, changing fur pattern.
```

## 5. 夏祭りの夜、浴衣の二人が花火を見上げて「きれいだね」「うん」と話す

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：夏祭り→1、夜→1、浴衣→1、二人→1、花火→2、見上げ→2、「きれいだね」→2、「うん」→2、話→2
- 決めたこと：女性は20代後半 / 男性は20代後半 / 二人は20代の女性と男性（声を分けやすくするため）

```text
9:16 vertical video, 15 seconds. Style: photorealistic, night, soft artificial light, subject centered in the vertical frame. Setting: A Japanese summer festival with paper lanterns and glowing food stalls, at night. No background music.
Shot 1 (0-8s): Wide shot, slow push-in. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, navy yukata with a white morning glory pattern and a red obi. B is a Japanese man in his late 20s, friendly face, short black hair, charcoal gray striped yukata with a black obi. The camera reveals the scene with A and B in the middle of it, calm and natural. Sound effects: deep firework booms and crackling. Ambience: festival crowd murmur, taiko drums in the distance.
Shot 2 (8-15s): Medium shot, slow upward tilt. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, navy yukata with a white morning glory pattern and a red obi. B is a Japanese man in his late 20s, friendly face, short black hair, charcoal gray striped yukata with a black obi. A and B look up at big fireworks bursting in the night sky. A, a Japanese woman in her late 20s, says in Japanese in a soft, clear female voice, natural and friendly, with matching lip movement: 「きれいだね」. B, a Japanese man in his late 20s, says in Japanese in a calm, warm male voice, natural and friendly, with matching lip movement: 「うん」. Ambience: festival crowd murmur, taiko drums in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 6. 「本日開店」と書かれた看板の前で、店主が深くお辞儀する

- 条件：15秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：「本日開店」（画面の文字）→1、看板→1、店主→1、お辞儀→2
- 決めたこと：店主は40代の男性 / 場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
0-8s: Wide shot, slow push-in. A is a Japanese shop owner, a man in his 40s, kind face, short neat black hair, crisp white shirt with rolled sleeves and a dark green apron. The camera reveals the scene with A in the middle of it, calm and natural. A large signboard facing the camera shows the Japanese text 「本日開店」 in big, clear, flat letters. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, garbled characters, extra text on the sign.

# 延長（続き7秒）
9:16 vertical video, 7 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-7s: Medium wide shot, static. A is a Japanese shop owner, a man in his 40s, kind face, short neat black hair, crisp white shirt with rolled sleeves and a dark green apron. A bows deeply, holding the bow for a moment before straightening up. Sound effects: soft rustle of clothes. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, garbled characters, extra text on the sign.
```

## 7. 朝のカフェで女性がコーヒーを飲みながら本を読む

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：朝→1、カフェ→1、女性→1、コーヒー→1、飲→1、本→2、読→2
- 決めたこと：女性は20代後半

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, soft morning light, subject centered in the vertical frame. Setting: A cozy cafe with warm wooden interiors, in the morning. No background music.
0-5s: Medium close-up, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A drinks a cup of hot coffee. Sound effects: a satisfied sip. Ambience: soft cafe chatter, cups clinking.
5-8s: Medium shot, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A reads a book. Sound effects: pages turning. Ambience: soft cafe chatter, cups clinking.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, soft morning light, subject centered in the vertical frame. Setting: A cozy cafe with warm wooden interiors, in the morning. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A reads a book. Sound effects: pages turning. Ambience: soft cafe chatter, cups clinking.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 8. 公園で子どもがシャボン玉を追いかけてはしゃぐ

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：公園→1、子ども→1、シャボン玉→1、追いかけ→1、はしゃ→2
- 決めたこと：子どもは7歳くらい

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A green city park with trees and benches. No background music.
0-5s: Wide shot, handheld follow. A is a Japanese child about 7 years old, round rosy cheeks, bright eyes, short black bob hair, red hoodie, navy shorts and white sneakers. A chases soap bubbles floating and shimmering in the light. Sound effects: quick footsteps. Ambience: birds chirping, children playing in the distance.
5-8s: Medium shot, static. A is a Japanese child about 7 years old, round rosy cheeks, bright eyes, short black bob hair, red hoodie, navy shorts and white sneakers. A jumps for joy. Ambience: birds chirping, children playing in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A green city park with trees and benches. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, static. A is a Japanese child about 7 years old, round rosy cheeks, bright eyes, short black bob hair, red hoodie, navy shorts and white sneakers. A jumps for joy. Ambience: birds chirping, children playing in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 9. 夕方の屋上で、制服の男子高校生が空を見上げる

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：夕方→1、屋上→1、制服→1、男子高校生→1、空→1、見上げ→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, warm dusk light, subject centered in the vertical frame. Setting: A school or building rooftop with a wire fence and a wide sky, at dusk. No background music.
0-8s: Wide shot, slow upward tilt. A is a Japanese high school boy about 17 years old, slim face, short neat black hair, black gakuran school uniform with gold buttons. A looks up at the open sky. Ambience: wind blowing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, warm dusk light, subject centered in the vertical frame. Setting: A school or building rooftop with a wire fence and a wide sky, at dusk. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, slow upward tilt. A is a Japanese high school boy about 17 years old, slim face, short neat black hair, black gakuran school uniform with gold buttons. A looks up at the open sky. Ambience: wind blowing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 10. おばあちゃんが縁側でお茶を飲んでいる

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：おばあちゃん→1、縁側→1、お茶→1、飲→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The wooden veranda (engawa) of an old Japanese house, a green garden beyond. No background music.
0-8s: Medium close-up, static. A is an elderly Japanese woman in her 70s, kind smiling face, short curly gray hair, lavender cardigan over a white blouse and a long navy skirt. A drinks a cup of hot tea. Sound effects: a satisfied sip. Ambience: soft breeze through the garden.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The wooden veranda (engawa) of an old Japanese house, a green garden beyond. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium close-up, static. A is an elderly Japanese woman in her 70s, kind smiling face, short curly gray hair, lavender cardigan over a white blouse and a long navy skirt. A drinks a cup of hot tea. Sound effects: a satisfied sip. Ambience: soft breeze through the garden.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 11. サラリーマンが満員電車で居眠りする

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：サラリーマン→1、満員電車→1、居眠り→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: Inside a packed commuter train. No background music.
0-8s: Medium shot, slow push-in. A is a Japanese office worker, a man in his 30s, tired but kind face, short black hair, dark navy suit, white shirt, blue tie and a black leather briefcase. A dozes off, head nodding. Ambience: rhythmic train rumble.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: Inside a packed commuter train. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, slow push-in. A is a Japanese office worker, a man in his 30s, tired but kind face, short black hair, dark navy suit, white shirt, blue tie and a black leather briefcase. A dozes off, head nodding. Ambience: rhythmic train rumble.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 12. 夕焼けの海辺で猫が驚いてジャンプする

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：夕焼け→1、海辺→1、猫→1、驚→1、ジャンプ→2
- 決めたこと：猫は茶トラ

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, golden sunset light, subject centered in the vertical frame. Setting: A sandy beach by the sea, at sunset, the sky glowing orange. No background music.
0-5s: Medium shot, static. A is an orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail. A is startled, eyes wide. Ambience: waves washing ashore, seagulls in the distance.
5-8s: Medium wide shot, static. A is an orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail. A jumps high. Sound effects: a soft thud on landing. Ambience: waves washing ashore, seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different cat, changing fur pattern.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, golden sunset light, subject centered in the vertical frame. Setting: A sandy beach by the sea, at sunset, the sky glowing orange. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, static. A is an orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail. A jumps high. Sound effects: a soft thud on landing. Ambience: waves washing ashore, seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different cat, changing fur pattern.
```

## 13. 黒猫が窓辺で日向ぼっこしてあくびをする

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：黒猫→1、窓辺→1、日向ぼっこ→1、あくび→2

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A sunny spot by a window, sheer curtains moving slightly. No background music.
0-5s: Medium shot, slow push-in. A is a sleek black cat with short glossy fur, bright yellow-green eyes, a small black nose, pointed ears and a long thin tail. A basks in the warm sunlight. Ambience: faint birdsong outside.
5-8s: Medium close-up, static. A is a sleek black cat with short glossy fur, bright yellow-green eyes, a small black nose, pointed ears and a long thin tail. A gives a big yawn. Sound effects: a small yawn. Ambience: faint birdsong outside.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different black cat, changing fur pattern.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A sunny spot by a window, sheer curtains moving slightly. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium close-up, static. A is a sleek black cat with short glossy fur, bright yellow-green eyes, a small black nose, pointed ears and a long thin tail. A gives a big yawn. Sound effects: a small yawn. Ambience: faint birdsong outside.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different black cat, changing fur pattern.
```

## 14. 子犬が雪の中を走り回って尻尾を振る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：子犬→1、雪→1、走り回→1、尻尾を振→2
- 決めたこと：場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, soft, cold winter light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene, with snow gently falling, everything covered in white. No background music.
0-5s: Wide shot, handheld follow. A is a fluffy cream-colored puppy with floppy ears, round dark eyes, a black button nose, short legs and a small blue collar. A runs around happily. Sound effects: quick footsteps. Ambience: muffled snowy quiet.
5-8s: Medium shot, static. A is a fluffy cream-colored puppy with floppy ears, round dark eyes, a black button nose, short legs and a small blue collar. A wags the tail happily. Ambience: muffled snowy quiet.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different puppy, changing fur pattern.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, soft, cold winter light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene, with snow gently falling, everything covered in white. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, static. A is a fluffy cream-colored puppy with floppy ears, round dark eyes, a black button nose, short legs and a small blue collar. A wags the tail happily. Ambience: muffled snowy quiet.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different puppy, changing fur pattern.
```

## 15. ペンギンがよちよち歩いて海に飛び込む

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：ペンギン→1、歩→1、海→1、飛び込→2

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The wide blue sea. No background music.
0-5s: Wide shot, handheld follow. A is a small penguin with a glossy black back and head, a white belly, white rings around the eyes, small flippers and short pink feet. A walks with a waddle. Sound effects: footsteps. Ambience: waves washing ashore, seagulls in the distance.
5-8s: Wide shot, static. A is a small penguin with a glossy black back and head, a white belly, white rings around the eyes, small flippers and short pink feet. A dives into the wide blue sea. Sound effects: a splash. Ambience: waves washing ashore, seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different penguin, changing fur pattern.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The wide blue sea. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, static. A is a small penguin with a glossy black back and head, a white belly, white rings around the eyes, small flippers and short pink feet. A dives into the wide blue sea. Sound effects: a splash. Ambience: waves washing ashore, seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different penguin, changing fur pattern.
```

## 16. 猫が「にゃっ」と鳴く

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：猫→1、「にゃっ」→2、鳴→2
- 決めたこと：猫は茶トラ / 人のように動く動物なので、3Dアニメ風にしました / 場所が書かれていないため、背景はシンプルにしています

```text
9:16 vertical video, 10 seconds. Style: 3D animated feature film style, soft natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Shot 1 (0-5s): Wide shot, slow push-in. A is an anthropomorphic, upright-walking orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail. The camera reveals the scene with A in the middle of it, calm and natural. Ambience: ambient sound that fits the place.
Shot 2 (5-10s): Medium shot, static. A is an anthropomorphic, upright-walking orange tabby cat with short striped fur, a white chest and white paws, round amber eyes, a pink nose and a long striped tail. A lets out a cry. A says in Japanese in a cute, high-pitched cat-like voice, cute and playful, with matching lip movement: 「にゃっ」. Sound effects: a short meow. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, a different cat, changing fur pattern.
```

## 17. 焼きたてのパンケーキにシロップがとろっとかかる

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：パンケーキ→1、シロップ→1、とろっとかか→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, appetizing food close-up, glistening details, subject centered in the vertical frame. Setting: A place that fits the scene. No background music.
0-8s: Close-up, slow push-in. Golden syrup drizzles slowly over the top. Visible details: a freshly made stack of fluffy pancakes with melting butter and syrup. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, appetizing food close-up, glistening details, subject centered in the vertical frame. Setting: A place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Close-up, slow push-in. Golden syrup drizzles slowly over the top. Visible details: a freshly made stack of fluffy pancakes with melting butter and syrup. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs.
```

## 18. 湯気の立つラーメンをズルズルすする

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：湯気の立つ→1、ラーメン→1、ズルズル→1、すす→1
- 決めたこと：女性は20代後半 / 一文に人物が書かれていないため、20代後半の女性にしました / 場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
0-8s: Close-up, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A slurps a steaming bowl of ramen with sliced pork and a soft-boiled egg. Visible details: rising steam. Sound effects: noisy noodle slurping. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Close-up, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A slurps a steaming bowl of ramen with sliced pork and a soft-boiled egg. Visible details: rising steam. Sound effects: noisy noodle slurping. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 19. 熱々のたこ焼きの上でかつお節が踊る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：たこ焼き→1、かつお節→1、踊→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, appetizing food close-up, glistening details, subject centered in the vertical frame. Setting: A place that fits the scene. No background music.
0-8s: Medium wide shot, static. Bonito flakes dance happily. Visible details: piping hot takoyaki balls topped with sauce and bonito flakes dancing in the heat. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, appetizing food close-up, glistening details, subject centered in the vertical frame. Setting: A place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, static. Bonito flakes dance happily. Visible details: piping hot takoyaki balls topped with sauce and bonito flakes dancing in the heat. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs.
```

## 20. 冷たいビールで乾杯する

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：ビール→1、乾杯→1
- 決めたこと：女性は20代後半 / 一文に人物が書かれていないため、20代後半の女性にしました / 場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
0-8s: Medium shot, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A raises a glass in a toast. Visible details: an ice-cold glass of beer with white foam. Sound effects: glasses clinking. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, static. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, cream knit sweater, light blue jeans and small gold earrings. A raises a glass in a toast. Visible details: an ice-cold glass of beer with white foam. Sound effects: glasses clinking. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 21. 新商品の香水がキラキラ光る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：新商品→1、香水→1、光→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, clean commercial product look, soft studio lighting, crisp reflections, subject centered in the vertical frame. Setting: A clean seamless studio backdrop. No background music.
0-8s: Medium shot, slow push-in. An elegant glass perfume bottle glows softly with sparkling light. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, clean commercial product look, soft studio lighting, crisp reflections, subject centered in the vertical frame. Setting: A clean seamless studio backdrop. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, slow push-in. An elegant glass perfume bottle glows softly with sparkling light. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.
```

## 22. 新作のスニーカーがくるくる回る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：新作→1、スニーカー→1、くるくる回→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, clean commercial product look, soft studio lighting, crisp reflections, subject centered in the vertical frame. Setting: A clean seamless studio backdrop. No background music.
0-8s: Medium wide shot, static. A pair of clean white sneakers spins around. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, clean commercial product look, soft studio lighting, crisp reflections, subject centered in the vertical frame. Setting: A clean seamless studio backdrop. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, static. A pair of clean white sneakers spins around. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.
```

## 23. 白い背景で腕時計がゆっくり回転する

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：白い背景→1、腕時計→1、回転→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, clean commercial look, subject centered in the vertical frame. Setting: A clean photo studio with a seamless white backdrop. No background music.
0-8s: Medium wide shot, static. A polished wristwatch spins around slowly. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, clean commercial look, subject centered in the vertical frame. Setting: A clean photo studio with a seamless white backdrop. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, static. A polished wristwatch spins around slowly. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products.
```

## 24. 波が打ち寄せる夕暮れの海

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：波が打ち寄せ→1、夕暮れ→1、海→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, warm dusk light. Setting: The wide blue sea, at dusk. No background music.
0-8s: Wide shot, slow pan. Waves roll gently onto the shore. Sound effects: waves washing ashore. Ambience: seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, warm dusk light. Setting: The wide blue sea, at dusk. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, slow pan. Waves roll gently onto the shore. Sound effects: waves washing ashore. Ambience: seagulls in the distance.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.
```

## 25. 秋の京都で紅葉が舞う

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：秋→1、京都→1、紅葉が舞→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light. Setting: A traditional stone-paved street in Kyoto lined with old wooden houses, in autumn. No background music.
0-8s: Wide shot, slow pan. Autumn leaves flutter down. Sound effects: dry leaves rustling. Ambience: soft footsteps on stone.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light. Setting: A traditional stone-paved street in Kyoto lined with old wooden houses, in autumn. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, slow pan. Autumn leaves flutter down. Sound effects: dry leaves rustling. Ambience: soft footsteps on stone.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.
```

## 26. 桜が散る川沿いを、制服の女子高生が自転車に乗って走る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：桜が散→1、川沿い→1、制服→1、女子高生→2、自転車→2、乗っ→2、走→2

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A riverside path along a gently flowing river, with cherry blossoms in full bloom. No background music.
0-5s: Wide shot, slow pan. Cherry blossom petals swirl down through the air. Ambience: a gently flowing river.
5-8s: Wide shot, handheld follow. A is a Japanese high school girl about 17 years old, soft round face, shoulder-length straight black hair with bangs, navy blazer school uniform with a red ribbon tie and a gray pleated skirt. A rides a bicycle, then runs. Sound effects: quick footsteps, a bicycle bell. Ambience: a gently flowing river.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A riverside path along a gently flowing river, with cherry blossoms in full bloom. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, handheld follow. A is a Japanese high school girl about 17 years old, soft round face, shoulder-length straight black hair with bangs, navy blazer school uniform with a red ribbon tie and a gray pleated skirt. A rides a bicycle, then runs. Sound effects: quick footsteps, a bicycle bell. Ambience: a gently flowing river.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 27. 満天の星の下、草原で流れ星が流れる

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：満天の星→1、草原→1、流れ星が流れ→2

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, night, soft artificial light. Setting: A wide grassy meadow under a big sky, at night. No background music.
0-5s: Wide shot, slow upward tilt. Countless stars twinkle in the night sky. Ambience: wind through the grass.
5-8s: Wide shot, static. A shooting star streaks across the night sky. Ambience: wind through the grass.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, night, soft artificial light. Setting: A wide grassy meadow under a big sky, at night. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, static. A shooting star streaks across the night sky. Ambience: wind through the grass.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, people.
```

## 28. 雪が降る夜の神社で、着物の女性が手を合わせる

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：雪が降→1、夜→1、神社→1、着物→1、女性→2、手を合わせ→2
- 決めたこと：女性は20代後半

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, night, soft artificial light, soft, cold winter light, subject centered in the vertical frame. Setting: A Shinto shrine with a red torii gate and stone lanterns, at night, with snow gently falling, everything covered in white. No background music.
0-5s: Wide shot, slow pan. Snowflakes drift slowly down. Ambience: muffled snowy quiet, wind through tall trees.
5-8s: Medium shot, slow push-in. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, red silk kimono with a floral pattern and a gold obi. A puts both hands together in a quiet prayer. Ambience: muffled snowy quiet, wind through tall trees.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, night, soft artificial light, soft, cold winter light, subject centered in the vertical frame. Setting: A Shinto shrine with a red torii gate and stone lanterns, at night, with snow gently falling, everything covered in white. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium shot, slow push-in. A is a Japanese woman in her late 20s, gentle oval face, shoulder-length dark brown hair, red silk kimono with a floral pattern and a gold obi. A puts both hands together in a quiet prayer. Ambience: muffled snowy quiet, wind through tall trees.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 29. 女の子がケーキのろうそくを吹き消して「ありがとう！」と言う

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：女の子→1、ケーキ→1、ろうそく→2、吹き消→2、「ありがとう！」→2、言→2
- 決めたこと：女の子は8歳くらい / 場所が書かれていないため、背景はシンプルにしています

```text
9:16 vertical video, 10 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Shot 1 (0-5s): Wide shot, slow push-in. A is a Japanese girl about 8 years old, round cheeks, big dark eyes, black hair in two low pigtails, yellow T-shirt, denim overall skirt and white sneakers. The camera reveals the scene with A in the middle of it, calm and natural. Visible details: a strawberry shortcake with white cream. Ambience: ambient sound that fits the place.
Shot 2 (5-10s): Close-up, static. A is a Japanese girl about 8 years old, round cheeks, big dark eyes, black hair in two low pigtails, yellow T-shirt, denim overall skirt and white sneakers. A blows out softly flickering candles. A says in Japanese in a cheerful little girl's voice, energetic, exclaiming, with matching lip movement: 「ありがとう！」. Sound effects: a soft puff of breath. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 30. ロボットが「こんにちは」と手を振る

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：ロボット→1、「こんにちは」→2、手を振→2
- 決めたこと：場所が書かれていないため、背景はシンプルにしています

```text
9:16 vertical video, 10 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Shot 1 (0-5s): Wide shot, slow push-in. A is a small friendly white robot with a round head, two glowing blue circular eyes, a smooth glossy body, short arms with three-fingered hands, rolling on a single wheel. The camera reveals the scene with A in the middle of it, calm and natural. Ambience: ambient sound that fits the place.
Shot 2 (5-10s): Medium shot, static. A is a small friendly white robot with a round head, two glowing blue circular eyes, a smooth glossy body, short arms with three-fingered hands, rolling on a single wheel. A waves a hand. A says in Japanese in a cheerful, slightly electronic voice, natural and friendly, with matching lip movement: 「こんにちは」. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 31. お母さんが「いってらっしゃい」と言い、男の子が「いってきます！」と走っていく

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：お母さん→1、「いってらっしゃい」→1、言→2、男の子→1、「いってきます！」→1、走→2
- 決めたこと：男の子は8歳くらい / 場所が書かれていないため、背景はシンプルにしています

```text
9:16 vertical video, 10 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Shot 1 (0-5s): Medium shot, slow push-in. A is a Japanese mother in her 30s, warm face, dark brown hair tied in a low ponytail, white blouse, beige apron and light gray trousers. B is a Japanese boy about 8 years old, round face, bright eyes, short black hair, blue-and-white striped T-shirt, khaki shorts and white sneakers. The camera reveals the scene with A and B in the middle of it, calm and natural. A, a Japanese mother in her 30s, says in Japanese in a warm, gentle female voice, natural and friendly, with matching lip movement: 「いってらっしゃい」. B, a Japanese boy about 8 years old, says in Japanese in a lively little boy's voice, energetic, exclaiming, with matching lip movement: 「いってきます！」. Ambience: ambient sound that fits the place.
Shot 2 (5-10s): Wide shot, handheld follow. B is a Japanese boy about 8 years old, round face, bright eyes, short black hair, blue-and-white striped T-shirt, khaki shorts and white sneakers. B runs. Sound effects: quick footsteps. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 32. 教室で先生が黒板に「夢」と書く

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：教室→1、先生→1、黒板→1、「夢」（画面の文字）→1、書く→1
- 決めたこと：先生は30代の女性

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A bright school classroom with wooden desks and a blackboard. No background music.
0-8s: Close-up, static. A is a Japanese teacher, a woman in her 30s, friendly face, black hair in a neat bob, white blouse, navy cardigan and a gray skirt. A writes on a green blackboard facing the camera. A green blackboard facing the camera shows the Japanese text 「夢」 in big, clear, flat letters. Sound effects: pencil scratching on paper. Ambience: students chatting quietly.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, garbled characters, extra text on the sign.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A bright school classroom with wooden desks and a blackboard. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Close-up, static. A is a Japanese teacher, a woman in her 30s, friendly face, black hair in a neat bob, white blouse, navy cardigan and a gray skirt. A writes on a green blackboard facing the camera. A green blackboard facing the camera shows the Japanese text 「夢」 in big, clear, flat letters. Sound effects: pencil scratching on paper. Ambience: students chatting quietly.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, garbled characters, extra text on the sign.
```

## 33. 「新発売」の看板の前で店員が「いらっしゃいませ！」と言う

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：「新発売」（画面の文字）→1、看板→1、店員→1、「いらっしゃいませ！」→2、言→1
- 決めたこと：店員は20代の女性 / 場所が書かれていないため、背景はシンプルにしています

```text
9:16 vertical video, 10 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Shot 1 (0-5s): Wide shot, slow push-in. A is a young Japanese shop clerk, a woman in her 20s, cheerful face, short brown hair, white shirt, dark green apron with a small name tag. The camera reveals the scene with A in the middle of it, calm and natural. A large signboard facing the camera shows the Japanese text 「新発売」 in big, clear, flat letters. Ambience: ambient sound that fits the place.
Shot 2 (5-10s): Medium close-up, static. A is a young Japanese shop clerk, a woman in her 20s, cheerful face, short brown hair, white shirt, dark green apron with a small name tag. A faces the camera with a natural expression. A says in Japanese in a bright, polite female voice, energetic, exclaiming, with matching lip movement: 「いらっしゃいませ！」. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus, garbled characters, extra text on the sign.
```

## 34. ドラゴンが城の上を飛ぶ

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：ドラゴン→1、城→1、飛ぶ→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A white Japanese castle with layered roofs. No background music.
0-8s: Wide shot, slow pan. A is a large dragon with shimmering emerald scales, a pale gold belly, glowing golden eyes, two curved horns, wide bat-like wings and a long spiked tail. A flies through the air. Sound effects: wings fluttering. Ambience: wind blowing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A white Japanese castle with layered roofs. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, slow pan. A is a large dragon with shimmering emerald scales, a pale gold belly, glowing golden eyes, two curved horns, wide bat-like wings and a long spiked tail. A flies through the air. Sound effects: wings fluttering. Ambience: wind blowing.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 35. 侍が刀を抜いて構える

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：侍→1、刀→1、抜い→1、構え→2
- 決めたこと：場所が書かれていないため、背景はシンプルにしています

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
0-5s: Medium close-up, static. A is a Japanese samurai in his 30s, stern face, black hair tied in a topknot, dark indigo kimono and hakama, a katana in a black scabbard at his waist. A draws a gleaming katana. Sound effects: a blade sliding out of its scabbard. Ambience: ambient sound that fits the place.
5-8s: Medium wide shot, slow push-in. A is a Japanese samurai in his 30s, stern face, black hair tied in a topknot, dark indigo kimono and hakama, a katana in a black scabbard at his waist. A takes a steady ready stance. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: A simple, uncluttered place that fits the scene. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, slow push-in. A is a Japanese samurai in his 30s, stern face, black hair tied in a topknot, dark indigo kimono and hakama, a katana in a black scabbard at his waist. A takes a steady ready stance. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 36. 宇宙飛行士が月の上でゆっくりジャンプする

- 条件：10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：宇宙飛行士→1、月の上→1、ジャンプ→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The gray, dusty surface of the Moon, the Earth hanging in a black sky. No background music.
0-8s: Medium wide shot, static. A is an astronaut whose face is hidden behind a reflective gold visor, white spacesuit with a round mission patch on the shoulder, bulky white gloves and boots. A jumps high slowly. Sound effects: a soft thud on landing. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: photorealistic, natural light, subject centered in the vertical frame. Setting: The gray, dusty surface of the Moon, the Earth hanging in a black sky. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Medium wide shot, static. A is an astronaut whose face is hidden behind a reflective gold visor, white spacesuit with a round mission patch on the shoulder, bulky white gloves and boots. A jumps high slowly. Sound effects: a soft thud on landing. Ambience: ambient sound that fits the place.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 37. 魔女がほうきで夜空を飛ぶ

- 条件：10秒・縦・雰囲気 anime
- 検査：問題なし
- 一文の要素 → カット：魔女→1、ほうき→1、夜空→1、飛ぶ→1

```text
# 1本目（8秒）
9:16 vertical video, 8 seconds. Style: Japanese anime style, clean cel shading, night, soft artificial light, subject centered in the vertical frame. Setting: The open night sky high above the rooftops, at night. No background music.
0-8s: Wide shot, slow pan. A is a young witch about 18 years old, long silver hair, violet eyes, pointed black hat, long black robe with gold trim, holding a slim wooden wand, a wooden broomstick. A flies through the air. Sound effects: wings fluttering. Ambience: soft wind.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.

# 延長（続き2秒）
9:16 vertical video, 2 seconds. Style: Japanese anime style, clean cel shading, night, soft artificial light, subject centered in the vertical frame. Setting: The open night sky high above the rooftops, at night. No background music.
Continue seamlessly from the last frame of the previous clip.
0-2s: Wide shot, slow pan. A is a young witch about 18 years old, long silver hair, violet eyes, pointed black hat, long black robe with gold trim, holding a slim wooden wand, a wooden broomstick. A flies through the air. Sound effects: wings fluttering. Ambience: soft wind.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, other people in focus.
```

## 38. 写真の中の様子が、自然にゆっくり動き出す

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：動き出→1
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image. No background music.
Shot 1 (0-10s): Same framing as the input image, slow push-in. Animate the input image as the first frame, keeping its subject, composition and lighting. Everything in the scene starts to move naturally and gently: hair, clothes, leaves, water and light. Ambience: natural ambient sound that fits the place in the image.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, changing the face or identity of the subject, new people appearing, sudden scene changes.
```

## 39. 髪が風になびいて、こちらを見て微笑む

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：髪が風になび→1、こちらを見→2、微笑→2
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image. No background music.
Shot 1 (0-5s): Same framing as the input image, slow push-in. A is the main subject in the input image, exactly as shown: same face, hair or fur, clothing, colors and proportions. Animate the input image as the first frame, keeping its subject, composition and lighting. A's hair flows gently in the breeze. Ambience: natural ambient sound that fits the place in the image.
Shot 2 (5-10s): Same framing, continuous take, static. A is the main subject in the input image, exactly as shown: same face, hair or fur, clothing, colors and proportions. The same continuous take goes on with no cut. A looks straight at the camera, then smiles warmly. Ambience: natural ambient sound that fits the place in the image.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, changing the face or identity of the subject, new people appearing, sudden scene changes.
```

## 40. 犬が「おかえり！」と言って尻尾を振る

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：犬→1、「おかえり！」→1、言→2、尻尾を振→2
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image. No background music.
Shot 1 (0-5s): Same framing as the input image, slow push-in. A is the dog in the input image, exactly as shown: same face, fur pattern, colors and proportions. Animate the input image as the first frame, keeping its subject, composition and lighting. A looks toward the camera with small natural movements. A says in Japanese in a warm, friendly dog-like voice, energetic, exclaiming, with matching lip movement: 「おかえり！」. Ambience: natural ambient sound that fits the place in the image.
Shot 2 (5-10s): Same framing, continuous take, static. A is the dog in the input image, exactly as shown: same face, fur pattern, colors and proportions. The same continuous take goes on with no cut. A wags the tail happily. Ambience: natural ambient sound that fits the place in the image.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, a different dog, changing fur pattern, changing the face or identity of the subject, new people appearing, sudden scene changes.
```

## 41. 料理から湯気が立ち、カメラがゆっくり寄る

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：料理→1、湯気が立→1、寄る→2
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image. No background music.
Shot 1 (0-5s): Same framing as the input image, slow push-in. Animate the input image as the first frame, keeping its subject, composition and lighting. Steam rises and curls in the light. Visible details: a home-cooked meal. Ambience: natural ambient sound that fits the place in the image.
Shot 2 (5-10s): Same framing, continuous take, static. The same continuous take goes on with no cut. The camera slowly moves in closer. Ambience: natural ambient sound that fits the place in the image.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, changing the face or identity of the subject, new people appearing, sudden scene changes.
```

## 42. 雪が降り始めて、二人が手をつなぐ

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：雪が降→1、二人→2、手をつな→2
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image, with snow gently falling, everything covered in white. No background music.
Shot 1 (0-5s): Same framing as the input image, slow push-in. Animate the input image as the first frame, keeping its subject, composition and lighting. Snowflakes drift slowly down. Ambience: muffled snowy quiet.
Shot 2 (5-10s): Same framing, continuous take, static. A is the woman in the input image, exactly as shown: same face, hairstyle, clothing, colors and proportions. B is the man in the input image, exactly as shown: same face, hairstyle, clothing, colors and proportions. The same continuous take goes on with no cut. A and B hold hands. Ambience: muffled snowy quiet.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, changing the face or identity of the subject, new people appearing, sudden scene changes.
```

## 43. 商品がくるっと回って光る

- 条件：写真から・10秒・縦・雰囲気 auto
- 検査：問題なし
- 一文の要素 → カット：商品→1、くるっと回→1、光→2
- 決めたこと：選んだ写真を最初のコマにして、写っている人や物・構図はそのまま動かします

```text
9:16 vertical video, 10 seconds. Style: keep the look, colors and lighting of the input image. Setting: The place shown in the input image. No background music.
Shot 1 (0-5s): Same framing as the input image, slow push-in. Animate the input image as the first frame, keeping its subject, composition and lighting. The product spins around. Ambience: natural ambient sound that fits the place in the image.
Shot 2 (5-10s): Same framing, continuous take, static. The same continuous take goes on with no cut. The product glows softly. Ambience: natural ambient sound that fits the place in the image.
Avoid: subtitles, captions, watermark, logo, distorted hands, extra limbs, brand names, extra products, changing the face or identity of the subject, new people appearing, sudden scene changes.
```
