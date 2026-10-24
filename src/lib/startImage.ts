// 「写真から作る」で画面から届く最初のコマ（data URL）の検査。サーバーで使う。
// 画面ではスマホの写真を縮めて JPEG にしてから送るが、届いた中身は信用せず、形式・大きさ・縦横を確かめる。
// 条件は Kling の画像→動画（JPEG か PNG、10MB 以下、短い辺 300px 以上、縦横比 1:2.5〜2.5:1）に合わせ、さらに小さめにしてある。

/** 受け付ける大きさ。Vercel の受け取りの上限（4.5MB）より小さくしておく */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MIN_IMAGE_SIDE = 300;
export const MAX_IMAGE_RATIO = 2.5;

export interface StartImage {
  mime: "image/jpeg" | "image/png";
  /** data: を除いた base64（Kling にはこの形で渡す） */
  base64: string;
  width: number;
  height: number;
}

const DATA_URL = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/;

/** PNG の大きさ（IHDR） */
function pngSize(b: Buffer): [number, number] | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || !sig.every((v, i) => b[i] === v) || b.toString("latin1", 12, 16) !== "IHDR") return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

/** JPEG の大きさ（最初の SOF の印） */
function jpegSize(b: Buffer): [number, number] | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // 詰め物
      continue;
    }
    const len = b.readUInt16BE(i + 2);
    // SOF0〜SOF15（DHT・JPG・DAC の C4・C8・CC を除く）
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    }
    if (marker === 0xda || len < 2) return null; // 画像の中身に入っても大きさが見つからない
    i += 2 + len;
  }
  return null;
}

export function parseStartImage(input: unknown): { image: StartImage } | { error: string } {
  if (typeof input !== "string") return { error: "写真が届きませんでした。もう一度選んでください。" };
  const m = DATA_URL.exec(input);
  if (!m) return { error: "写真は JPEG か PNG にしてください。" };
  const mime = m[1] as StartImage["mime"];
  const base64 = m[2];
  if ((base64.length * 3) / 4 > MAX_IMAGE_BYTES) return { error: "写真が大きすぎます。別の写真を選んでください。" };
  const bytes = Buffer.from(base64, "base64");
  const size = mime === "image/png" ? pngSize(bytes) : jpegSize(bytes);
  if (!size) return { error: "写真を読み込めませんでした。別の写真を選んでください。" };
  const [width, height] = size;
  if (Math.min(width, height) < MIN_IMAGE_SIDE) return { error: `写真が小さすぎます（短い辺が${MIN_IMAGE_SIDE}ピクセル以上必要です）。` };
  if (Math.max(width, height) / Math.min(width, height) > MAX_IMAGE_RATIO) return { error: "写真が細長すぎます。" };
  return { image: { mime, base64, width, height } };
}
