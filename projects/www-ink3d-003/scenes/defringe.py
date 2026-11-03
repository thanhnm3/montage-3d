"""Clean the light matte fringe off the staged pose cut-outs (project copies only, the cast library is untouched).

The pose PNGs' anti-aliased edge pixels carry a light grey left from the background cut (mean RGB ~120-145 at
alpha 128-255, against a ~30 dark art outline): under the ink contour it showed as a thin white line.
Fix: edge pixels (alpha < 250, or opaque but touching transparency) take the art's own dark outline colour, and
the alpha is pulled in by 1 px so no half-transparent rim is left.

  PYTHONUTF8=1 tts/.venv python defringe.py      (run after build.py, which re-stages the poses)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DIR = Path(__file__).resolve().parent.parent / "public" / "characters" / "teen_poses"
INK = np.array([38, 28, 34], float)

for f in sorted(DIR.glob("*.png")):
    a = np.array(Image.open(f).convert("RGBA")).astype(float)
    al = a[..., 3]
    solid = al >= 250
    core = ndimage.binary_erosion(solid, iterations=1)
    rim = (al > 0) & ~core
    a[..., :3][rim] = INK
    # 1 px choke: alpha of the outermost ring drops, the next one keeps its value
    a[..., 3] = np.where(ndimage.binary_erosion(al > 8, iterations=1), al, 0)
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(f)
print("defringed", len(list(DIR.glob('*.png'))), "poses")
