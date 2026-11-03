"""Lớp hiệu ứng âm thanh cho Fossil Short 010 bản 3D (size ladder quái vật biển), 2026-11-02.

Mốc thời gian khớp CUTS / HITS / CTR trong
remotion-composer/projects/fossil-3d-city-test/Short010_3D.tsx (giây trong beat; frame bắt đầu beat đọc từ props.json).
Tiếng cá voi, tiếng click cá nhà táng, tiếng phình/xì hơi, còi rơi tự tổng hợp; còn lại lấy từ tts/assets/sfx.
Trộn lên tiếng đã mix bằng remix_audio.py (giọng + nhạc, -16 LUFS) rồi qua limiter.

Chạy bằng venv của tts:
  D:/youtube/tts/.venv/Scripts/python.exe sfx010.py <audio_mix.wav> <out.wav>
"""
import json
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()
SFX = Path("D:/youtube/tts/assets/sfx")
FPS = 30
PROPS = json.loads((Path(__file__).resolve().parent / "props.json").read_text(encoding="utf-8"))
BEAT0 = {s["beat"]: s["startFrame"] for s in PROPS["scenes"]}
DUR = {s["beat"]: s["durationFrames"] / FPS for s in PROPS["scenes"]}


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


def whale(dur, f0=55, f1=95, seed=0):
    """tiếng cá voi xanh: rên trầm lượn lên xuống, hoạ âm mềm + rung chậm"""
    rng = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    f = f0 + (f1 - f0) * np.sin(np.pi * t / dur) ** 2 + 4 * np.sin(2 * np.pi * 0.7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.1 * rng.standard_normal(len(t))
    return norm(lp(x, 900) * env(len(t), 0.5, 0.8))


def clicks(dur, rate=9.0, seed=1):
    """chuỗi click định vị của cá nhà táng"""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n, np.float32)
    t = 0.0
    while t < dur:
        i = int(t * SR)
        m = min(n - i, int(0.006 * SR))
        x[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (0.0012 * SR))
        t += 1 / rate * (0.8 + 0.4 * rng.random())
    return norm(bp(x, 800, 7000))


def bed(dur, seed=2):
    """nền dưới nước: ồ ồ trầm + lục bục nhẹ"""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = lp(rng.standard_normal(n), 220) * 3
    t = np.arange(n) / SR
    x *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * t)
    return norm(x * env(n, 0.4, 0.4))


def main(src, out):
    voice = load(src, 2)
    bus = np.zeros(len(voice) + SR * 2, np.float32)
    s = {p.stem: norm(load(p)) for p in list(SFX.glob("*.wav")) + list((SFX / "remotion").glob("*.wav"))}
    rng = np.random.default_rng(10)

    def at(beat, sec, clip, db, fade_out=None):
        i = int((BEAT0[beat] / FPS + sec) * SR)
        c = clip * 10 ** (db / 20)
        if fade_out:
            m = int(fade_out * SR)
            c = c[:m].copy()
            q = min(len(c), int(0.3 * SR))
            c[-q:] *= np.linspace(1, 0, q)
        if i < 0:
            c, i = c[-i:], 0
        bus[i:i + len(c)] += c[: len(bus) - i]

    def whoosh(beat, sec, db=-14):
        w = s["whoosh"] if rng.random() < 0.5 else s["soft_whoosh"]
        at(beat, sec - 0.15, lp(pitch(w, 0.8 + 0.25 * rng.random()), 4000), db)

    def bloop(beat, sec, db=-20):
        at(beat, sec, lp(pitch(s["bubble_pop"], 0.55 + 0.2 * rng.random()), 2500), db)

    def chomp(beat, sec, db=-14, r=1.4):
        at(beat, sec, lp(pitch(s["heavy_slam"], r), 3000), db)

    def ticks(beat, t0, t1, n=10, db=-22):
        for i in range(n):
            at(beat, t0 + (t1 - t0) * (i / n) ** 0.8, pitch(s["mouse-click"], 0.9 + 0.8 * i / n), db)
        at(beat, t1, s["bell_ding"], db + 1)

    # nền dưới nước cả video (trừ bãi biển và bàn mẫu vật)
    total = len(voice) / SR
    i0 = 0
    b = bed(total + 1)
    cut_out = [(BEAT0[6] / FPS + 3.79, BEAT0[7] / FPS), (BEAT0[8] / FPS + 4.74, BEAT0[9] / FPS)]
    for a, z in cut_out:
        ia, iz = int(a * SR), int(z * SR)
        f = int(0.08 * SR)
        b[ia:iz] = 0
        b[ia - f:ia] *= np.linspace(1, 0, f)
        b[iz:iz + f] *= np.linspace(0, 1, f)
    bus[i0:i0 + len(b)] += b[: len(bus)] * 10 ** (-30 / 20)
    for k in range(40):  # bong bóng lác đác
        tt = rng.random() * total
        if not any(a <= tt <= z for a, z in cut_out):
            j = int(tt * SR)
            c = lp(pitch(s["bubble_pop"], 0.8 + 0.8 * rng.random()), 3000) * 10 ** ((-32 - 6 * rng.random()) / 20)
            bus[j:j + len(c)] += c[: len(bus) - j]

    # cắt cảnh: whoosh ở whip, boom trầm ở flash, bloop ở cut
    cuts = {1: [(1.12, "w"), (2.02, "f"), (3.5, "w")], 2: [(0, "f"), (1.54, "c")], 3: [(0, "w"), (1.65, "c"), (2.67, "w")],
            4: [(0, "f"), (1.6, "c"), (4.36, "w")], 5: [(0, "w"), (1.22, "c"), (2.3, "w")], 6: [(0, "w"), (1.03, "c"), (2.39, "c"), (3.79, "f")],
            7: [(0, "f"), (1.24, "c")], 8: [(0, "w"), (1.34, "c"), (2.92, "c"), (4.74, "w"), (6.02, "c"), (6.98, "c")],
            9: [(1.06, "w"), (2.88, "c"), (4.32, "f")], 10: [(0, "c")]}
    for bt, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(bt, sec)
            elif k == "f":
                at(bt, sec, s["sub_impact"], -18)
            else:
                bloop(bt, sec)

    # beat 1: Megalodon lao tới + đớp, Mosasaurus đớp, cả hàng hiện ra, bóng cá voi
    at(1, 0.0, lp(np.concatenate([s["swoosh_reverse"]] * 2), 3000), -18)
    chomp(1, 0.45, -13, 1.2)
    chomp(1, 1.6, -16, 1.6)
    at(1, 2.66, s["deep_thud"], -14)
    at(1, 3.4, whale(2.4, 48, 80, 3), -14)
    at(1, 4.88, s["sub_impact"], -13)

    # beat 2: thợ lặn thở bóng khí, bộ đếm 1.8 m
    for k in range(3):
        at(2, 0.25 + 0.5 * k, lp(pitch(s["bubble_pop"], 1.2 + 0.3 * k), 3000), -24)
    ticks(2, 1.54, 2.1, 6)

    # beat 3: cá mập lướt qua, dựng vào ô, "huge"
    at(3, 0.2, lp(s["soft_whoosh"], 2500), -20)
    ticks(3, 1.65, 2.3, 9)
    at(3, 2.3, s["deep_thud"], -17)
    at(3, 3.45, pitch(s["deep_thud"], 0.8), -15)

    # beat 4: Liopleurodon đớp hai lần; nhiễu TV + phình lên 25 m; xì hơi về 6 m
    chomp(4, 0.5, -15, 1.5)
    chomp(4, 1.2, -16, 1.7)
    st = bp(np.random.default_rng(4).standard_normal(int(0.35 * SR)), 1500, 7000)
    at(4, 1.6, norm(st) * env(len(st), 0.01, 0.1), -20)
    at(4, 1.62, s["tape_rewind"], -22)
    at(4, 2.2, sweep(0.85, 140, 520, 5), -18)
    ticks(4, 2.2, 3.0, 12)
    at(4, 3.0, s["heavy_slam"], -15)
    at(4, 5.6, sweep(0.6, 600, 110, 4, wob=0.18), -17)
    at(4, 5.66, s["sub_impact"], -20)
    for k in range(6):
        at(4, 5.66 + 0.07 * k, pitch(s["mouse-click"], 1.7 - 0.12 * k), -22)
    at(4, 6.1, s["bell_ding"], -21)

    # beat 5: Mosasaurus đớp; xe buýt rơi (còi tụt) rồi đập đáy
    chomp(5, 0.62, -14, 1.3)
    ticks(5, 1.22, 1.9, 9)
    at(5, 2.55, sweep(0.9, 1400, 380, 2), -24)
    at(5, 3.44, lp(s["heavy_slam"], 2500), -11)
    at(5, 3.44, s["sub_impact"], -13)

    # beat 6: click cá nhà táng, đớp; bộ đếm; bàn mẫu vật (màn trập, chuông)
    at(6, 0.1, clicks(2.2), -23)
    chomp(6, 1.27, -12, 1.1)
    ticks(6, 2.39, 3.0, 9)
    at(6, 3.79, s["camera_shutter"], -16)
    at(6, 4.0, s["pop_click"], -20)
    at(6, 4.55, s["pop_click"], -20)
    at(6, 4.91, s["heavy_slam"], -17)

    # beat 7: Megalodon lao vào máy + đớp; bộ đếm 17 -> 24
    at(7, 0.0, s["sub_impact"], -13)
    chomp(7, 0.55, -12, 1.0)
    at(7, 0.9, s["deep_thud"], -16)
    ticks(7, 1.6, 2.45, 12)
    at(7, 2.45, s["heavy_slam"], -15)

    # beat 8: Ichthyotitan lướt; mắt; bộ đếm; bãi biển (gió, sóng), lấp lánh, chuông "age 11"
    at(8, 0.15, lp(s["soft_whoosh"], 2500), -19)
    at(8, 1.34, s["magic_chime"], -24)
    ticks(8, 2.92, 3.4, 5)
    beach = DUR[8] - 4.74
    at(8, 4.74, np.tile(s["wind_howl"], 3), -31, fade_out=beach)
    for k in range(3):
        at(8, 4.8 + 1.3 * k, s["water_splash"], -27)
    at(8, 6.02, s["magic_chime"], -18)
    at(8, 7.56, s["bell_ding"], -17)

    # beat 9 (twist): cá voi rên khi bóng tối phủ xuống, đi qua đầu, dựng vào ô cuối = boom lớn
    at(9, 0.4, whale(3.2, 42, 75, 5), -11)
    at(9, 2.6, whale(1.8, 60, 110, 6), -14)
    at(9, 4.32, s["heavy_slam"], -12)
    ticks(9, 4.32, 4.95, 8)
    at(9, 4.36, s["magic_chime"], -20)

    # beat 10: một tiếng cá voi xa xa
    at(10, 0.6, whale(2.6, 50, 85, 7), -21)

    mix = voice + bus[: len(voice), None]
    tmp = Path(out).with_suffix(".pre.wav")
    pcm = np.clip(mix, -4, 4).astype(np.float32).tobytes()
    subprocess.run([FF, "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(tmp)], input=pcm, check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", str(tmp), "-af", "alimiter=limit=0.89:level=false", "-ar", str(SR), "-ac", "2", str(out)], check=True)
    tmp.unlink()
    print("sfx peak dB", round(20 * np.log10(np.abs(bus).max() + 1e-9), 1), "voice peak dB", round(20 * np.log10(np.abs(voice).max()), 1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
