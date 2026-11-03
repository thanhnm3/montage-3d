"""Sound layer for Fossil Short 012 3D (Titanoboa in the dinosaur era, one take), 2026-11-03.

Cue times are ABSOLUTE SECONDS matching the T_* constants and CAM keys in
remotion-composer/projects/fossil-3d-city-test/Short012_3D.tsx (no cuts, so not per beat).
T. rex = roar_trex.wav (layered from public-domain/CC0 recordings, see tts/assets/sfx/dino/README.md);
snake hiss, hadrosaur calls, rewind/asteroid sweeps synthesised here; the rest from tts/assets/sfx.
Mixed over remix_audio.py's voice + music mix, then limiter + loudnorm -15 LUFS.

  D:/youtube/tts/.venv/Scripts/python.exe sfx012.py <audio_mix.wav> <out.wav>
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()
SFX = Path("D:/youtube/tts/assets/sfx")


def load(path, ch=1) -> np.ndarray:
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def norm(x, db=0.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (db / 20)


def pitch(x, r):
    idx = np.arange(0, len(x) - 1, r)
    return np.interp(idx, np.arange(len(x)), x).astype(np.float32)


def bp(x, lo, hi):
    return sosfilt(butter(4, [lo, hi], btype="band", fs=SR, output="sos"), x).astype(np.float32)


def lp(x, hi):
    return sosfilt(butter(4, hi, btype="low", fs=SR, output="sos"), x).astype(np.float32)


def env(n, a=0.05, r=0.3):
    t = np.arange(n) / SR
    d = n / SR
    return np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)


def sweep(dur, f0, f1, harm=6, wob=0.0):
    t = np.arange(int(dur * SR)) / SR
    f = f0 * (f1 / f0) ** (t / dur) * (1 + wob * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(sum(np.sin(k * ph) / k for k in range(1, harm + 1)) * env(len(t), 0.03, 0.15))


def honk(dur, f0=110, seed=0):
    """còi trầm của Parasaurolophus (mào rỗng cộng hưởng): hoạ âm lẻ, rung chậm, lọc thấp"""
    rng = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    f = f0 * (1 + 0.04 * np.sin(np.pi * t / dur)) * (1 + 0.01 * np.sin(2 * np.pi * 5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.6 * np.sin(3 * ph) + 0.3 * np.sin(5 * ph) + 0.05 * rng.standard_normal(len(t))
    return norm(lp(x, 1400) * env(len(t), 0.12, 0.35))


def rumble(dur, hi=120, seed=3):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    return norm(lp(rng.standard_normal(n), hi) * env(n, 0.05, dur * 0.7))


def bed(dur, hi, seed=2):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    return norm(lp(rng.standard_normal(n), hi) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * t)) * env(n, 0.4, 0.4))



def hiss(dur, seed=0):
    """snake hiss: band-passed noise, fast attack, slow tail"""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    return norm(bp(rng.standard_normal(n), 2600, 9000) * env(n, 0.04, dur * 0.6))


def main(src, out):
    voice = load(src, 2)
    bus = np.zeros(len(voice) + SR * 2, np.float32)
    s = {p.stem: norm(load(p)) for p in list(SFX.glob("*.wav")) + list((SFX / "remotion").glob("*.wav"))}
    rex = norm(load(SFX / "dino" / "roar_trex.wav"))
    rng = np.random.default_rng(12)

    def at(sec, clip, db, dur=None):
        i = int(sec * SR)
        c = clip * 10 ** (db / 20)
        if dur:
            m = int(dur * SR)
            c = c[:m].copy()
            q = min(len(c), int(0.25 * SR))
            c[-q:] *= np.linspace(1, 0, q)
        if i < 0:
            c, i = c[-i:], 0
        bus[i:i + len(c)] += c[: len(bus) - i]

    def ticks(t0, t1, n=10, db=-22, ding=True, r0=0.9, r1=1.7):
        for k in range(n):
            at(t0 + (t1 - t0) * (k / n) ** 0.8, pitch(s["mouse-click"], lerp(r0, r1, k / n)), db)
        if ding:
            at(t1, s["bell_ding"], db + 1)

    def step(sec, db):
        at(sec, lp(pitch(s["deep_thud"], 0.7), 300), db)

    total = len(voice) / SR
    # beds: humid jungle air (0-5, 52.5-end), cooler river wind, muffled earth in the burrow (48.9-52.3)
    air = bed(total + 1, 500, 4)
    ia, iz = int(48.9 * SR), int(52.3 * SR)
    f = int(0.15 * SR)
    air[ia:iz] = 0
    air[ia - f:ia] *= np.linspace(1, 0, f)
    air[iz:iz + f] *= np.linspace(0, 1, f)
    bus[:len(air)] += air[: len(bus)] * 10 ** (-36 / 20)
    at(52.4, bp(bed(10.0, 6000, 9), 3000, 7000), -40)   # insect shimmer back in the hot jungle
    at(48.9, bed(3.4, 160, 5), -24)

    # r03 hook = the drop: falling whoosh from frame 0, head-first splash, body pours in, tail slap
    at(0.0, lp(s["whoosh"], 4000), -14)
    at(0.25, sweep(0.9, 700, 160, 4), -19)
    at(1.25, s["water_splash"], -9)
    at(1.25, s["sub_impact"], -12)
    at(1.27, lp(pitch(s["heavy_slam"], 0.6), 900), -13)
    at(2.05, pitch(s["water_splash"], 0.8), -16)
    at(3.0, lp(s["breath_pad"], 2000), -30, dur=2)
    # "send it back": 60 -> 66 Ma
    at(4.85, s["swoosh_reverse"], -16)
    at(5.0, s["tape_rewind"], -15, dur=1.6)
    ticks(5.05, 6.55, 9, db=-24)
    # 13 m bar, a ton (person ghost), 12 m T. rex bar
    ticks(6.8, 7.9, 10)
    at(8.54, s["deep_thud"], -18)
    ticks(9.6, 10.5, 9, db=-23)
    # T. rex walks east along the bank
    for k in range(11):
        step(10.7 + 0.58 * k, -24 - 0.5 * k)
    # fish leap and slap back
    for k in range(9):
        t0 = 14.45 + k * 0.14 + 0.12 * rng.random()
        at(t0, pitch(s["water_splash"], 1.6 + 0.4 * rng.random()), -27)
        at(t0 + 0.85, pitch(s["water_splash"], 1.8 + 0.4 * rng.random()), -25)
    # r02: gar leaps, the snake snaps it out of the air, gulps it down
    at(14.72, pitch(s["water_splash"], 1.2), -19)
    at(14.85, hiss(0.35, 5), -20)
    at(15.2, lp(pitch(s["heavy_slam"], 1.3), 3000), -13)
    at(15.22, pitch(s["pop_click"], 0.6), -16)
    at(16.15, lp(pitch(s["deep_thud"], 1.2), 500), -19)   # gulp
    # baby dinosaurs + SNACKS
    at(15.95, s["pop_click"], -16)
    at(16.3, honk(0.5, 300, 3), -24)
    at(16.9, honk(0.4, 340, 4), -26)
    # swing to the fossil slab and back
    at(17.75, lp(s["whoosh"], 3500), -16)
    at(21.6, s["magic_chime"], -21)
    at(24.65, pitch(s["magic_chime"], 1.2), -23)
    at(25.05, lp(s["whoosh"], 3500), -14)
    # rear up, strike, FREEZE
    at(25.9, lp(s["water_splash"], 2500), -18)
    at(26.3, hiss(1.4, 2), -15)
    at(27.4, s["whoosh"], -12)
    at(28.45, sweep(0.45, 520, 70, 5), -15)
    at(28.45, s["sub_impact"], -17)
    at(28.5, s["deep_thud"], -16)
    at(28.9, lp(bed(8.6, 150, 6), 150), -24)          # bullet-time drone
    # 30 C ... 10 C
    at(31.9, s["soft_whoosh"], -18)
    at(32.15, s["bell_ding"], -21)
    ticks(35.3, 36.6, 12, db=-23, r0=1.6, r1=0.8)
    at(35.4, s["wind_howl"], -20, dur=3.2)
    for k in range(6):
        at(35.8 + 0.25 * k, bp(pitch(s["paper_rip"], 1.6 + 0.3 * k), 2000, 8000), -28)   # frost crackle
    # thaw in slow motion, misses
    at(37.5, sweep(0.6, 70, 260, 4), -20)
    at(38.3, lp(pitch(s["heavy_slam"], 0.7), 1800), -14)
    at(38.55, s["deep_thud"], -17)
    at(39.4, lp(pitch(s["deep_thud"], 0.8), 600), -15)  # head flops onto the mud
    at(39.7, lp(hiss(1.0, 3), 5000), -24)
    # T. rex comes back and roars
    for k in range(4):
        step(40.4 + 0.5 * k, -20 + 2 * k)
    at(42.3, rex, -9, dur=1.7)
    at(41.7, hiss(1.8, 4), -14)                               # r02: wide gape-hiss at the lunging T. rex
    at(42.85, lp(pitch(s["heavy_slam"], 0.8), 2000), -14)     # T. rex jaws snap shut just short
    # asteroid
    at(43.55, sweep(1.0, 260, 1500, 3), -22)
    at(43.75, s["swoosh_reverse"], -15)
    at(44.55, s["heavy_slam"], -8)
    at(44.55, s["sub_impact"], -7)
    at(44.6, rumble(3.4, 110, 6), -11)
    at(45.3, s["wind_howl"], -14, dur=2.2)
    at(45.3, rumble(1.8, 160, 7), -15)
    at(46.6, pitch(s["deep_thud"], 0.75), -11)        # T. rex hits the ground
    at(46.9, pitch(s["deep_thud"], 0.9), -16)
    at(47.05, s["deep_thud"], -18)                     # GONE
    # into the burrow: slow heartbeat, days without food
    at(48.6, lp(s["soft_whoosh"], 1200), -16)
    for k in range(3):
        at(49.3 + 0.95 * k, lp(pitch(s["deep_thud"], 0.55), 400), -21)
    ticks(50.0, 51.2, 12, db=-24)
    # out into the Paleocene jungle, the small snake grows into Titanoboa
    at(51.9, s["swoosh_reverse"], -15)
    at(52.35, s["magic_chime"], -18)
    ticks(52.7, 53.4, 7, db=-24, r0=1.7, r1=0.9)
    at(52.5, sweep(1.2, 70, 300, 5), -21)
    at(53.7, s["deep_thud"], -18)
    # "No."
    at(55.62, s["heavy_slam"], -13)
    at(55.62, hiss(1.3, 5), -13)
    at(58.2, s["pop_click"], -20)

    mix = voice.copy()
    n = min(len(mix), len(bus))
    mix[:n] += bus[:n, None]
    peak = np.abs(mix).max()
    print(f"peak before limiter {20 * np.log10(peak):.1f} dB")
    tmp = Path(out).with_suffix(".raw.wav")
    pcm = np.clip(mix, -1, 1)
    subprocess.run([FF, "-y", "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", str(tmp)], input=pcm.astype(np.float32).tobytes(), check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", str(tmp), "-af", "alimiter=limit=0.89:level=false,loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), str(out)], check=True)
    tmp.unlink()
    print("wrote", out)


def lerp(a, b, k):
    return a + (b - a) * k


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
