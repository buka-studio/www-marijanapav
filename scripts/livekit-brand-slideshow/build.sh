#!/usr/bin/env bash
# Builds the LiveKit brand slideshow (mp4 + gif) from 2x PNG exports of the slides
# listed in sequence.txt. Exports are expected in SLIDES_DIR named by node id with
# ":" replaced by "-" (e.g. 365-16504.png, 1920x1080).
#
# Usage: scripts/livekit-brand-slideshow/build.sh SLIDES_DIR OUT_BASE
# Env:   HOLD (s per slide, default 1.0), FADE (default 0.15), BG (default 0x1c1c1c),
#        BORDER (default 0x3c3c3c)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SLIDES_DIR="$(cd "$1" && pwd)"; OUT_BASE="$2"
HOLD=${HOLD:-1.0}; FADE=${FADE:-0.15}; FPS=${FPS:-30}
BG=${BG:-0x1c1c1c}; BORDER=${BORDER:-0x3c3c3c}

FILES=()
while read -r id _; do
  [[ -z "$id" || "$id" == \#* ]] && continue
  f="$SLIDES_DIR/${id//:/-}.png"
  [[ -f "$f" ]] || { echo "Missing export for $id: $f" >&2; exit 1; }
  FILES+=("$f")
done < "$HERE/sequence.txt"
N=${#FILES[@]}
echo "Building $N slides"

IN=(); F=""
for f in "${FILES[@]}" "${FILES[0]}"; do IN+=(-loop 1 -t "$HOLD" -framerate "$FPS" -i "$f"); done
for k in $(seq 0 "$N"); do
  if [[ "${FRAME:-1}" == "0" ]]; then
    # Slide only, at 2x (1920x1080), uniform 2px (=1 CSS px) border; the site draws
    # the backdrop in code (see `backdrop` on the video entry in constants.tsx).
    F+="[${k}]crop=1912:1072,pad=1920:1080:4:4:0x070707,"
    F+="drawbox=x=0:y=0:w=1920:h=1080:color=${BORDER}:t=2,format=gbrp,setsar=1[v${k}];"
  else
    # Trim export edges, downscale 2x->1x, draw one uniform 1px border, then center on the
    # 1402x1002 canvas at the same offset the slides use in the Figma frames.
    F+="[${k}]crop=1912:1072,scale=956:536:flags=lanczos,pad=960:540:2:2:0x070707,"
    F+="drawbox=x=0:y=0:w=960:h=540:color=${BORDER}:t=1,"
    F+="pad=1402:1002:221:231:${BG},format=gbrp,setsar=1[v${k}];"
  fi
done
prev="v0"
for k in $(seq 1 "$N"); do
  off=$(awk "BEGIN{print ($HOLD-$FADE)*$k}")
  F+="[${prev}][v${k}]xfade=transition=fade:duration=${FADE}:offset=${off}[x${k}];"
  prev="x${k}"
done
TOTAL=$(awk "BEGIN{print ($HOLD-$FADE)*$N}")
F+="[${prev}]trim=duration=${TOTAL},split=3[a][b][c];"
F+="[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle[gif];"
F+="[c]format=yuv420p[mp4]"

ffmpeg -v error -y "${IN[@]}" -filter_complex "$F" \
  -map "[gif]" -loop 0 "$OUT_BASE.gif" \
  -map "[mp4]" -c:v libx264 -preset slow -crf 18 -tune stillimage -movflags +faststart -an "$OUT_BASE.mp4"
for o in "$OUT_BASE.gif" "$OUT_BASE.mp4"; do
  echo "$o $(ffprobe -v error -show_entries format=duration,size -of compact=p=0 "$o")"
done
