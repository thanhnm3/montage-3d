#!/usr/bin/env bash
# Stills check for a Why Why Why ink-3D project in a Claude cloud container (no GPU, no Google Fonts in the browser).
#   bash tools/www_pipeline/cloud_stills.sh <project> <Comp> <out_dir> <sec> [sec ...]
#   e.g. bash tools/www_pipeline/cloud_stills.sh www-ink3d-004 BrainMyth /tmp/check 0.6 4.6 12.8
#   PUBLIC=fossil-mysteries-short-013-3d bash ... fossil-3d-city-test Short013-3D ...   (public dir under projects/ when it differs)
# -> <out_dir>/s_<frame>.png per second given + <out_dir>/sheet.png (6 per row, scale 0.35).
# Cloud workarounds: the headless shell browser of the container + --gl=swangle (software WebGL), and a temp copy
# of the comp where @remotion/google-fonts/Anton is replaced by a local Anton file (the browser can't reach Google).
# Local Windows renders don't need any of this: use the normal bundle/render commands from the project README.
set -e
PROJ=$1; COMP=$2; OUT=$3; shift 3
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
RC=$ROOT/remotion-composer
HS=${HS:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
PUB=$OUT/_public; BUN=$OUT/_bundle; TMPP=$RC/projects/_cloudtest
rm -rf "$PUB" "$TMPP" && cp -r "$ROOT/projects/${PUBLIC:-$PROJ}/public" "$PUB" && cp -r "$RC/projects/$PROJ" "$TMPP"
if [ ! -f "$OUT/anton.ttf" ]; then
  U=$(curl -sS "https://fonts.googleapis.com/css2?family=Anton" -A "Mozilla/5.0 Chrome/120" | grep -o "https://[^)]*" | tail -1)
  curl -sS -o "$OUT/anton.ttf" "$U"
fi
cp "$OUT/anton.ttf" "$PUB/anton.ttf"
python3 - "$TMPP" <<'PY'
import sys, glob
for p in glob.glob(sys.argv[1] + "/*.tsx"):
    s = open(p).read()
    if "@remotion/google-fonts/" not in s: continue
    s = s.replace('import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";\n', '')
    # any other Google font: a stub returning a local fallback family (the browser here can't reach Google)
    import re
    s = re.sub(r'import \{ loadFont as (\w+) \} from "@remotion/google-fonts/(\w+)";',
               lambda m: f'const {m.group(1)} = (..._a: unknown[]) => ({{ fontFamily: "{m.group(2)}, DejaVu Sans, sans-serif" }});', s)
    s = s.replace('const anton = loadAnton().fontFamily;', '''const anton = "AntonLocal";
if (typeof document !== "undefined" && !document.getElementById("antonlocal")) { const st = document.createElement("style"); st.id = "antonlocal"; st.textContent = `@font-face{font-family:AntonLocal;src:url(${staticFile("anton.ttf")});}`; document.head.appendChild(st); }''')
    open(p, "w").write(s)
PY
cd "$RC"
npx remotion bundle "projects/_cloudtest/index.tsx" --out-dir="$BUN" --public-dir="$PUB" >/dev/null 2>&1
rm -rf "$TMPP"
rm -f "$OUT"/s_*.png
for s in "$@"; do
  f=$(python3 -c "print(round($s*30))")
  npx remotion still "$BUN" "$COMP" "$OUT/s_$(printf %05d $f).png" --frame=$f --gl=swangle --browser-executable="$HS" --scale=${SCALE:-0.35} >/dev/null 2>&1 || echo "fail $s"
done
python3 - "$OUT" <<'PY'
import sys, glob
from PIL import Image, ImageDraw
o = sys.argv[1]; fs = sorted(glob.glob(o + "/s_*.png"))
if not fs: sys.exit("no stills")
ims = [Image.open(f) for f in fs]; w, h = ims[0].size; c = min(6, len(ims)); r = (len(ims) + c - 1) // c
S = Image.new("RGB", (w * c, h * r), "white")
for i, (f, im) in enumerate(zip(fs, ims)):
    S.paste(im, ((i % c) * w, (i // c) * h)); ImageDraw.Draw(S).text(((i % c) * w + 5, (i // c) * h + 5), f.split("_")[-1][:-4], fill="white")
S.save(o + "/sheet.png"); print(o + "/sheet.png")
PY
