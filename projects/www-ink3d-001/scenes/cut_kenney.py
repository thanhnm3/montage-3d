"""Cut the 6x-rasterised Kenney Toon Characters sheets (9x5 tiles) into named poses by matching each tile against
the pack's own 96x128 pose PNGs. -> public/free/<who>/<pose>.png (trimmed) + index.json {pose: {w, h, ground}}"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
PROJ = Path(__file__).resolve().parent.parent
SRC = Path("D:/youtube/openmontage/projects/free-assets-cc0/kenney_toonCharacters1")
for who, folder, pre in [("man", "Male person", "character_malePerson_"), ("woman", "Female person", "character_femalePerson_")]:
    sheet = Image.open(PROJ / "public" / "free" / f"kenney_{who}_sheet6x.png").convert("RGBA")
    refs = {p.stem[len(pre):]: np.asarray(Image.open(p).convert("RGBA"), np.float32) for p in (SRC / folder / "PNG" / "Poses").glob("*.png")}
    out = PROJ / "public" / "free" / who
    out.mkdir(parents=True, exist_ok=True)
    idx = {}
    for r in range(5):
        for c in range(9):
            tile = sheet.crop((c * 576, r * 768, (c + 1) * 576, (r + 1) * 768))
            small = np.asarray(tile.resize((96, 128), Image.LANCZOS), np.float32)
            name, err = min(((n, np.abs(small[..., 3] - a[..., 3]).mean() + np.abs(small[..., :3] - a[..., :3]).mean() * 0.3) for n, a in refs.items()), key=lambda x: x[1])
            if err > 12 or name in idx:
                continue
            bb = tile.getbbox()
            if not bb:
                continue
            t = tile.crop(bb)
            t.save(out / f"{name}.png")
            a = np.asarray(t)[..., 3]
            ys, xs = np.nonzero(a > 128)
            foot = ys.max()
            gx = xs[ys > foot - 12].mean()
            idx[name] = {"w": t.width, "h": t.height, "ground": [round(float(gx), 1), int(foot)]}
    (out / "index.json").write_text(json.dumps(idx, indent=1))
    print(who, len(idx), sorted(idx))
