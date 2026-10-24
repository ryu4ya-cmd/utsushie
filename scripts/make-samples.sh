#!/usr/bin/env bash
# 練習モードで返すサンプル動画を作る（外部APIは使わない。ffmpeg だけで作る）
# 使い方: bash scripts/make-samples.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/samples
FONT=${FONT:-/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf}
mkdir -p "$OUT"

make() { # name seconds width height color0 color1 label freq
  local name=$1 sec=$2 w=$3 h=$4 c0=$5 c1=$6 label=$7 freq=$8
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=${w}:y1=${h}:speed=0.02:d=${sec}:r=24" \
    -f lavfi -i "sine=frequency=${freq}:duration=${sec}:sample_rate=44100" \
    -f lavfi -i "color=c=white:s=$((w/6))x$((w/6)):d=${sec}:r=24" \
    -f lavfi -i "color=c=white:s=${w}x$((h/48)):d=${sec}:r=24" \
    -filter_complex "[0:v][2:v]overlay=x='(W-w)/2+(W/3)*sin(2*PI*t/2)':y='H*0.26-(H/14)*abs(sin(PI*t))':eval=frame[m];[m][3:v]overlay=x='-W+W*t/${sec}':y=H-h:eval=frame,drawtext=fontfile=${FONT}:text='${label}':fontcolor=white:fontsize=$((w/12)):x=(w-text_w)/2:y=(h-text_h)/2-$((h/14)),drawtext=fontfile=${FONT}:text='練習モードのサンプル':fontcolor=white@0.8:fontsize=$((w/20)):x=(w-text_w)/2:y=(h-text_h)/2+$((h/20)),drawtext=fontfile=${FONT}:text='%{eif\\:t\\:d}s':fontcolor=white@0.7:fontsize=$((w/18)):x=(w-text_w)/2:y=h-$((h/8))[v];[1:a]volume=0.08[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 32 -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 48k -shortest "$OUT/$name.mp4"
}

make draft-a 5 360 640 0x3EE8FF 0x08060F "下書きA" 440
make draft-b 5 360 640 0xFF4FD8 0x08060F "下書きB" 523
make final-10s 10 540 960 0x3EE8FF 0xFF4FD8 "本番（10秒）" 392
make final-15s 15 540 960 0xFF4FD8 0x3EE8FF "本番（15秒）" 349
ls -la "$OUT"
