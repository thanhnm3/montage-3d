"""Lớp hiệu ứng âm thanh cho Fossil Short 011 bản 3D (cá sấu ở kỷ khủng long, một cú máy), 2026-11-03.

Mốc thời gian là GIÂY TUYỆT ĐỐI, khớp các hằng T_* trong
remotion-composer/projects/fossil-3d-city-test/Short011_3D.tsx (video không cắt cảnh nên không tính theo beat).
Tiếng cá sấu = ghi âm cá sấu Mỹ (Wikimedia, public domain), T. rex = roar_trex.wav (ghép từ ghi âm public domain/CC0,
xem tts/assets/sfx/dino/README.md); còi mỏ vịt, tiếng rít thiên thạch, nền dưới nước tự tổng hợp; còn lại tts/assets/sfx.
Trộn lên tiếng đã mix bằng remix_audio.py (giọng + nhạc, nhạc tắt trước cú twist) rồi qua limiter.

  D:/youtube/tts/.venv/Scripts/python.exe sfx011.py <audio_mix.wav> <out.wav>
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


def main(src, out):
    voice = load(src, 2)
    bus = np.zeros(len(voice) + SR * 2, np.float32)
    s = {p.stem: norm(load(p)) for p in list(SFX.glob("*.wav")) + list((SFX / "remotion").glob("*.wav"))}
    gator = norm(load(SFX / "animals" / "Alligatorbellow1.ogg"))
    gator2 = norm(load(SFX / "animals" / "27alligator2bellow.ogg"))
    rex = norm(load(SFX / "dino" / "roar_trex.wav"))
    rng = np.random.default_rng(11)

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

    def ticks(t0, t1, n=10, db=-22, ding=True):
        for k in range(n):
            at(t0 + (t1 - t0) * (k / n) ** 0.8, pitch(s["mouse-click"], 0.9 + 0.8 * k / n), db)
        if ding:
            at(t1, s["bell_ding"], db + 1)

    def chomp(sec, db=-12, r=1.4):
        at(sec, lp(pitch(s["heavy_slam"], r), 3000), db)
        at(sec, pitch(s["pop_click"], 0.6), db - 6)

    total = len(voice) / SR
    # nền: gió nhẹ trên sông (trên mặt nước), ồ ồ trầm khi máy ở dưới nước (29.9-36.2)
    air = bed(total + 1, 500, 4)
    under = (29.9, 36.2)
    ia, iz = int(under[0] * SR), int(under[1] * SR)
    f = int(0.1 * SR)
    air[ia:iz] = 0
    air[ia - f:ia] *= np.linspace(1, 0, f)
    air[iz:iz + f] *= np.linspace(0, 1, f)
    bus[:len(air)] += air[: len(bus)] * 10 ** (-36 / 20)
    at(under[0], bed(under[1] - under[0], 200, 5), -24)
    for k in range(18):
        at(under[0] + rng.random() * (under[1] - under[0] - 0.3), lp(pitch(s["bubble_pop"], 0.6 + 0.6 * rng.random()), 2500), -30 - 6 * rng.random())

    # hook: rơi từ trời (gió rít lên), ùm xuống sông, cá sấu gầm khẽ
    at(0.0, lp(s["wind_howl"], 3000), -22, dur=2.3)
    at(0.9, s["swoosh_reverse"], -16)
    at(2.22, s["water_splash"], -9)
    at(2.22, s["deep_thud"], -15)
    at(3.0, lp(pitch(gator, 1.05), 2500), -19, dur=1.3)
    # 6 m, cú đớp mạnh nhất
    ticks(4.55, 5.5, 10)
    chomp(7.36, -11, 1.35)
    # 75 triệu năm: còi mỏ vịt, nước động
    at(10.1, honk(1.4, 104, 1), -22)
    at(11.0, honk(1.1, 131, 2), -26)
    at(11.95, lp(s["soft_whoosh"], 1500), -18)
    at(12.2, rumble(1.4, 90), -18)
    for k in range(5):
        at(12.0 + 0.22 * k, lp(pitch(s["bubble_pop"], 0.5 + 0.1 * k), 1800), -22)
    # Deinosuchus trồi lên + gầm trầm; đo 7,7 m; đớp đuôi mỏ vịt
    at(13.45, pitch(s["water_splash"], 0.75), -14)
    at(13.8, lp(pitch(gator2, 0.72), 1800), -12, dur=1.6)
    ticks(4.55 + 10.5, 16.2, 12, ding=True)
    at(17.45, lp(s["whoosh"], 3500), -14)
    chomp(18.12, -10, 1.15)
    at(18.12, s["water_splash"], -13)
    at(18.25, honk(0.7, 175, 3), -17)
    # SNACK? — tem + Deinosuchus há mõm
    at(19.85, s["deep_thud"], -16)
    at(19.9, lp(pitch(gator, 0.8), 2000), -16, dur=1.0)
    # "Not so fast": băng dừng, tua nhanh 75 -> 66 Tr năm
    at(21.0, sweep(0.45, 520, 70, 5), -15)
    at(21.0, s["sub_impact"], -18)
    at(21.25, s["tape_rewind"], -15, dur=1.15)
    ticks(21.3, 22.3, 9, db=-24)
    # 66 triệu năm: T. rex gầm, thiên thạch rít tới, va chạm, sóng xung kích
    at(23.0, rex, -10, dur=1.6)
    at(23.05, sweep(1.1, 260, 1500, 3), -22)
    at(23.25, s["swoosh_reverse"], -15)
    at(24.16, s["heavy_slam"], -8)
    at(24.16, s["sub_impact"], -7)
    at(24.2, rumble(3.4, 110, 6), -11)
    at(25.05, s["deep_thud"], -17)          # tem GONE
    at(26.05, pitch(s["deep_thud"], 0.75), -11)  # T. rex đổ xuống đất
    at(27.2, s["wind_howl"], -14, dur=2.2)  # sóng xung kích quét qua
    at(27.2, rumble(1.8, 160, 7), -15)
    at(27.4, pitch(s["deep_thud"], 0.85), -15)  # Triceratops ngã
    at(27.7, s["deep_thud"], -18)           # tem GONE
    # lặn xuống sông, tim chậm, đếm ngày
    at(29.85, lp(s["water_splash"], 1800), -17)
    for k in range(3):
        at(30.8 + 1.5 * k, lp(pitch(s["deep_thud"], 0.55), 400), -21)
    ticks(32.9, 34.2, 14, db=-23)
    # trồi lên mặt nước dưới trời trong, STILL HERE
    at(36.15, s["water_splash"], -17)
    at(36.4, s["breath_pad"], -28, dur=3)
    at(37.45, s["magic_chime"], -17)
    at(37.45, s["deep_thud"], -17)

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


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
