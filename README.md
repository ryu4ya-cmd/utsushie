# ウツシエ

日本語の一文から、声や効果音まで入った短い縦動画を作る Web アプリです。
いまは **練習モード** で動きます。外部の動画 AI や LLM は一切呼ばず、`public/samples/` のサンプル動画を返すので、お金はかかりません。

## 画面の流れ

| # | 画面 | ファイル |
|---|------|----------|
| ① | 用途を選ぶ（SNS縦型・自由。商品紹介と漫画・アニメ風は近日公開） | `src/app/page.tsx` |
| ② | 一文・雰囲気・長さ・音・字幕を選ぶ | `src/app/create/page.tsx` |
| ③ | AI が直した指示文を見て、下書き2本から選ぶ | `src/app/drafts/page.tsx` |
| ④ | 本番を生成中 | `src/app/generating/page.tsx` |
| ⑤ | 字幕の切り替え・MP4 保存・共有 | `src/app/done/page.tsx` |

## 動かし方（自分のパソコンで）

Node.js 20 以上が必要です。

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。スマホの幅で見ると本番に近い見た目になります。

その他のコマンド:

```bash
npm test        # 指示文づくりのテスト
npm run lint    # 書き方のチェック
npm run build   # 公開用にまとめる
```

## しくみ

- **一文 → 設計図 → 指示文**：`POST /api/plan`。設計図の形と LLM への指示書は `tools/prompt-expander/system-prompt.md`。
  練習モードでは LLM を呼ばず、`src/lib/plan/mockPlanner.ts` が決まった形の設計図を作ります。
  設計図から各モデル向けの文章と字幕を作るのは `src/lib/plan/build.ts`（Python の試作 `build_prompts.py` を移したもの。テストで同じ出力になることを確かめています）。
- **モデルの選び方**：セリフ（「」）があれば Kling 3.0、なければ Veo 3.1（`src/lib/models.ts`）。
- **生成ジョブ**：`POST /api/jobs` で始め、`GET /api/jobs/:id` で進み具合を見ます。練習モードではジョブIDに開始時刻を入れ、経過時間から進み具合を計算します（サーバーに状態を持たないので Vercel の無料プランでもそのまま動きます）。
- **字幕**：セリフから WebVTT を作って動画に重ねています。MP4 への焼き込みは本番モードで FFmpeg を使う予定です。
- **モード切り替え**：`src/lib/mode.ts`。`UTSUSHIE_MODE=live` はまだ実装しておらず、選ぶとエラーになります。

## サンプル動画を作り直す

```bash
bash scripts/make-samples.sh   # ffmpeg が必要
```

## Vercel で公開する

1. https://vercel.com に GitHub でログインし、「Add New → Project」からこのリポジトリを選ぶ
2. 設定は変えずに「Deploy」を押す（環境変数は不要）
3. `○○.vercel.app` のアドレスで見られます

## まだ作っていないもの

- 本物の LLM（指示文の書き直し）と動画 API（Kling 3.0 / Veo 3.1）へのつなぎ込み
- ログイン、生成履歴、クレジットと決済
- 入力・出力のモデレーション
- 字幕の焼き込み（FFmpeg）
