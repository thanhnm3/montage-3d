"""Hand-painted-look textures + flat 2D cutouts for the ink-3D barn Short, all drawn by code (no AI, no downloads).

  tts/.venv python gen_textures.py   -> ../public/tex/*.png
Wood shows grain and dark gaps between planks; colours are saturated, darks never pure black (style rule).
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "tex"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
INK = (34, 26, 48)


def noise(w, h, scale, octaves=4, seed=0):
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = max(1, int(scale / (2 ** o)))
        small = r.random((h // s + 2, w // s + 2)).astype(np.float32)
        im = Image.fromarray((small * 255).astype(np.uint8)).resize((w + 2 * s, h + 2 * s), Image.BICUBIC)
        acc += amp * (np.asarray(im, np.float32)[:h, :w] / 255)
        tot += amp
        amp *= 0.5
    return acc / tot


def save(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT / name)
    print(name)


def planks(base, var, name, n=8, size=1024, worn=None, seed=1):
    """vertical boards: per-board tint, stretched grain, knots, dark gaps"""
    W = H = size
    img = np.zeros((H, W, 3), np.float32)
    grain = noise(W // 16, H, 6, 3, seed)
    grain = np.asarray(Image.fromarray((grain * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
    fine = noise(W, H, 3, 2, seed + 1)
    bw = W / n
    for i in range(n):
        x0, x1 = int(i * bw), int((i + 1) * bw)
        tint = 1 + (rng.random() - 0.5) * var
        col = np.array(base, np.float32) * tint
        g = grain[:, x0:x1, None]
        img[:, x0:x1] = col * (0.78 + 0.32 * g) * (0.93 + 0.1 * fine[:, x0:x1, None])
        # grain lines
        for _ in range(7):
            gx = rng.uniform(x0 + 6, x1 - 6)
            ys = np.arange(H)
            xs = (gx + 5 * np.sin(ys / rng.uniform(40, 120) + rng.uniform(0, 6))).astype(int)
            for dx in (0, 1):
                xx = np.clip(xs + dx, x0, x1 - 1)
                img[ys, xx] *= 0.82
        # knot
        if rng.random() < 0.6:
            cx, cy = rng.uniform(x0 + 25, x1 - 25), rng.uniform(60, H - 60)
            yy, xx = np.mgrid[0:H, x0:x1]
            d = np.sqrt(((xx - cx) / 9) ** 2 + ((yy - cy) / 15) ** 2)
            img[:, x0:x1] *= (1 - 0.35 * np.exp(-d ** 2))[..., None]
        # dark gap + bevel highlight
        img[:, x0:x0 + 5] *= 0.25
        img[:, x0 + 5:x0 + 9] *= 1.12
    if worn is not None:          # paint worn off at the bottom / edges: shows grey wood underneath
        wear = noise(W, H, 40, 4, seed + 9)
        ramp = np.linspace(0, 1, H)[:, None] ** 3
        m = np.clip((wear * 0.9 + ramp * 0.55 - 0.78) * 6, 0, 1)[..., None]
        img = img * (1 - m) + worn * m
    save(img, name)
    return img


def grey_wood():
    return planks((150, 138, 124), 0.18, "wood_grey.png", seed=3)


def main():
    gw = grey_wood()
    planks((190, 46, 38), 0.12, "wood_red.png", seed=3)
    planks((168, 118, 74), 0.2, "wood_plank.png", n=6, seed=11)            # bucket, crates, fence

    # roof shingles (slate blue-grey, rows with staggered tabs)
    W = H = 1024
    a = np.zeros((H, W, 3), np.float32)
    n = noise(W, H, 8, 3, 21)
    row = 64
    for r in range(H // row):
        off = (r % 2) * 48
        for c in range(-1, W // 96 + 1):
            x0 = c * 96 + off
            t = 1 + (rng.random() - 0.5) * 0.25
            a[r * row:(r + 1) * row, max(0, x0):max(0, x0 + 96)] = np.array((92, 98, 118)) * t
        a[r * row:r * row + 6] *= 0.35
        for c in range(-1, W // 96 + 2):
            x = c * 96 + off
            if 0 <= x < W:
                a[r * row:(r + 1) * row, x:x + 4] *= 0.4
    a *= (0.85 + 0.25 * n)[..., None]
    save(a, "roof.png")

    # grass: saturated green with painterly clumps
    n1, n2 = noise(W, H, 64, 4, 31), noise(W, H, 6, 2, 32)
    g = np.stack([96 + 50 * n1, 142 + 45 * n1, 60 + 25 * n1], -1) * (0.85 + 0.25 * n2)[..., None]
    save(g, "grass.png")
    # dirt path
    d = np.stack([150 + 40 * n1, 118 + 34 * n1, 86 + 26 * n1], -1) * (0.8 + 0.3 * n2)[..., None]
    save(d, "dirt.png")
    # rust: orange-brown, pitted
    n3 = noise(512, 512, 16, 4, 41)
    rr = np.stack([120 + 70 * n3, 58 + 36 * n3, 34 + 16 * n3], -1)
    pits = noise(512, 512, 2, 1, 42) > 0.8
    rr[pits] *= 0.6
    save(rr, "rust.png")
    # wheat: golden
    n4 = noise(512, 512, 10, 3, 51)
    save(np.stack([230 + 25 * n4, 182 + 40 * n4, 70 + 30 * n4], -1), "wheat.png")
    # mold: green-grey fuzzy blobs on transparent
    m = noise(256, 256, 20, 4, 61)
    yy, xx = np.mgrid[0:256, 0:256]
    rad = np.sqrt((xx - 128) ** 2 + (yy - 128) ** 2) / 128
    alpha = np.clip((m * 1.2 - rad * 0.9) * 5, 0, 1)
    rgba = np.dstack([90 + 40 * m, 130 + 40 * m, 80 + 30 * m, alpha * 255])
    Image.fromarray(rgba.clip(0, 255).astype(np.uint8), "RGBA").save(OUT / "mold.png")
    print("mold.png")

    cow()
    cloud()
    flare()


def cow():
    """flat 2D cartoon cow, side view facing left, thick ink outline (drawn 2x then downsampled)"""
    S = 2
    W, H = 760 * S, 560 * S
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = 9 * S
    ink = INK + (255,)
    white, cream, pink, hoof = (250, 246, 236, 255), (236, 226, 206, 255), (240, 160, 160, 255), (70, 56, 60, 255)
    spot = (52, 44, 58, 255)
    # legs (thin, slightly tapered) behind body
    for lx in (250, 320, 520, 590):
        far = lx in (320, 590)
        c = cream if far else white
        d.rounded_rectangle([lx * S, 330 * S, (lx + 38) * S, 520 * S], 16 * S, fill=c, outline=ink, width=lw)
        d.rounded_rectangle([(lx - 2) * S, 492 * S, (lx + 40) * S, 528 * S], 8 * S, fill=hoof, outline=ink, width=lw)
    # tail
    d.line([(660 * S, 210 * S), (700 * S, 300 * S), (690 * S, 380 * S)], fill=ink, width=10 * S, joint="curve")
    d.ellipse([672 * S, 370 * S, 712 * S, 420 * S], fill=spot, outline=ink, width=lw // 2)
    # body
    d.rounded_rectangle([200 * S, 170 * S, 670 * S, 390 * S], 95 * S, fill=white, outline=ink, width=lw)
    # spots (clipped to body by redrawing body outline after)
    sp = Image.new("L", (W, H), 0)
    ds = ImageDraw.Draw(sp)
    for (x0, y0, x1, y1) in [(330, 180, 450, 270), (500, 230, 610, 340), (240, 270, 310, 350), (440, 320, 500, 390)]:
        ds.ellipse([x0 * S, y0 * S, x1 * S, y1 * S], fill=255)
    body = Image.new("L", (W, H), 0)
    ImageDraw.Draw(body).rounded_rectangle([200 * S, 170 * S, 670 * S, 390 * S], 95 * S, fill=255)
    sp = Image.fromarray((np.asarray(sp) & np.asarray(body)).astype(np.uint8))
    im.paste(Image.new("RGBA", (W, H), spot), (0, 0), sp)
    d.rounded_rectangle([200 * S, 170 * S, 670 * S, 390 * S], 95 * S, outline=ink, width=lw)
    # udder
    d.ellipse([480 * S, 360 * S, 560 * S, 420 * S], fill=pink, outline=ink, width=lw)
    # head
    d.ellipse([60 * S, 110 * S, 260 * S, 300 * S], fill=white, outline=ink, width=lw)
    d.ellipse([36 * S, 220 * S, 190 * S, 330 * S], fill=pink, outline=ink, width=lw)          # snout
    d.ellipse([70 * S, 262 * S, 90 * S, 286 * S], fill=ink)
    d.ellipse([120 * S, 262 * S, 140 * S, 286 * S], fill=ink)
    d.ellipse([160 * S, 160 * S, 196 * S, 200 * S], fill=(255, 255, 255, 255), outline=ink, width=lw // 2)  # eye
    d.ellipse([170 * S, 172 * S, 188 * S, 194 * S], fill=ink)
    # ear + horns
    d.polygon([(240 * S, 140 * S), (310 * S, 120 * S), (262 * S, 180 * S)], fill=white, outline=ink, width=lw)
    d.polygon([(150 * S, 118 * S), (176 * S, 60 * S), (186 * S, 122 * S)], fill=(240, 224, 180, 255), outline=ink, width=lw)
    d.polygon([(206 * S, 124 * S), (236 * S, 70 * S), (238 * S, 132 * S)], fill=(240, 224, 180, 255), outline=ink, width=lw)
    im = im.resize((W // S, H // S), Image.LANCZOS)
    im.save(OUT / "cow.png")
    print("cow.png")


def cloud():
    """flat cartoon cloud: cream puffs, cool-blue shaded underside, no outline"""
    S = 2
    W, H = 900 * S, 420 * S
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    puffs = [(120, 230, 120), (260, 170, 150), (430, 140, 170), (600, 180, 140), (740, 240, 110), (420, 270, 160)]
    for x, y, r in puffs:
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=255)
    d.rectangle([110 * S, 260 * S, 780 * S, 340 * S], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(2 * S))
    a = np.asarray(m, np.float32) / 255
    yy = np.linspace(0, 1, H)[:, None]
    shade = np.clip((yy - 0.55) * 3, 0, 1)
    top = np.array([255, 248, 236], np.float32)
    bot = np.array([186, 196, 236], np.float32)
    col = top * (1 - shade[..., None]) + bot * shade[..., None]
    col = np.broadcast_to(col, (H, W, 3))
    rgba = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").resize((W // S, H // S), Image.LANCZOS).save(OUT / "cloud.png")
    print("cloud.png")


def flare():
    """soft radial glow (star, sparkles) + 4-point twinkle"""
    N = 256
    yy, xx = np.mgrid[0:N, 0:N]
    r = np.sqrt((xx - N / 2) ** 2 + (yy - N / 2) ** 2) / (N / 2)
    g = np.exp(-r ** 2 * 6) + 0.35 * np.exp(-r * 4)
    cross = np.exp(-np.abs(xx - N / 2) / 3) * np.exp(-r * 2.2) + np.exp(-np.abs(yy - N / 2) / 3) * np.exp(-r * 2.2)
    a = np.clip(g + 0.8 * cross, 0, 1)
    rgba = np.dstack([np.full_like(a, 255), np.full_like(a, 255), np.full_like(a, 255), a * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT / "glow.png")
    print("glow.png")


if __name__ == "__main__":
    main()
