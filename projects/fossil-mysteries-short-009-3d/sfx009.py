"""Lớp hiệu ứng âm thanh cho Fossil Short 009 bản 3D r02 (2026-10-29).

Mốc thời gian khớp CUTS / HITS / DNA_EDITS trong
remotion-composer/projects/fossil-3d-city-test/Short009_3D.tsx (giây trong beat + frame bắt đầu beat).
Tiếng voi rống tự tổng hợp (răng cưa + vibrato + gầm), còn lại lấy từ tts/assets/sfx.
Trộn lên bản tiếng r04 (giọng + nhạc đã mix) rồi qua limiter.

Chạy bằng venv của tts:
  D:/youtube/tts/.venv/Scripts/python.exe sfx009.py <audio_r04.wav> <out.wav>
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
BEAT0 = {1: 0, 2: 103, 3: 275, 4: 438, 5: 623, 6: 775, 7: 959, 8: 1129}  # frame bắt đầu beat (props.json)
FPS = 30


def load(path, ch=1) -> np.ndarray:
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def norm(x, db=0.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (db / 20)


def pitch(x, r):
    """đổi cao độ đơn giản bằng nội suy lại (r > 1 = cao + ngắn hơn)"""
    idx = np.arange(0, len(x) - 1, r)
    return np.interp(idx, np.arange(len(x)), x).astype(np.float32)


def bp(x, lo, hi):
    return sosfilt(butter(4, [lo, hi], btype="band", fs=SR, output="sos"), x).astype(np.float32)


def lp(x, hi):
    return sosfilt(butter(4, hi, btype="low", fs=SR, output="sos"), x).astype(np.float32)


def trumpet(dur=1.1, f_lo=300, f_hi=560, seed=0):
    """voi rống: cao độ vọt lên, rung, tụt cuối; răng cưa giàu hoạ âm + gầm 32 Hz + hơi thở"""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    up = np.clip(t / 0.14, 0, 1)
    f0 = f_lo + (f_hi - f_lo) * up - 0.25 * (f_hi - f_lo) * np.clip((t - dur * 0.6) / (dur * 0.4), 0, 1)
    f0 = f0 * (1 + 0.035 * np.sin(2 * np.pi * 6.5 * t))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph) / k ** 0.75 for k in range(1, 24))
    x *= 1 + 0.35 * np.sin(2 * np.pi * 32 * t)
    x += 0.25 * rng.standard_normal(n) * up
    x = bp(x, 350, 5200)
    env = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.28, 0, 1)
    return norm(np.tanh(2.2 * x / np.abs(x).max()) * env)


def hum(dur):
    t = np.arange(int(dur * SR)) / SR
    x = 0.6 * np.sin(2 * np.pi * 120 * t) + 0.25 * np.sin(2 * np.pi * 240 * t) + 0.05 * np.random.default_rng(1).standard_normal(len(t))
    env = np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)
    return norm(lp(x, 900) * env)


def main(src, out):
    voice = load(src, 2)
    bus = np.zeros(len(voice) + SR * 2, np.float32)
    s = {p.stem: norm(load(p)) for p in list(SFX.glob("*.wav")) + list((SFX / "remotion").glob("*.wav"))}
    rng = np.random.default_rng(9)

    def at(beat, sec, clip, db, fade_out=None):
        i = int((BEAT0[beat] / FPS + sec) * SR)
        c = clip * 10 ** (db / 20)
        if fade_out:
            m = int(fade_out * SR)
            c = c[:m].copy()
            c[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
        if i < 0:
            c, i = c[-i:], 0
        bus[i:i + len(c)] += c[: len(bus) - i]

    def whoosh(beat, sec, db=-14):
        w = s["whoosh"] if rng.random() < 0.5 else s["soft_whoosh"]
        at(beat, sec - 0.15, pitch(w, 0.9 + 0.3 * rng.random()), db)

    # nền: gió thảo nguyên rất nhỏ (beat 1-2, 4-6, 8), gió sa mạc (7), máy chạy phòng lab (3), pad trong tế bào (2)
    wind = s["wind_howl"]
    for b, a, d in [(1, 0, 3.43), (2, 3.4, 2.33), (4, 0, 6.17), (5, 0, 5.07), (6, 0, 6.13), (8, 0, 6.0)]:
        at(b, a, np.tile(wind, 4), -34, fade_out=d)
    at(7, 0, pitch(np.tile(wind, 4), 0.8), -28, fade_out=5.67)
    at(3, 0, hum(5.43), -32)
    at(2, 0, np.tile(s["breath_pad"], 3), -26, fade_out=3.4)

    # cắt cảnh
    cuts = {1: [(1.48, "w"), (2.55, "c")], 2: [(0, "f"), (3.4, "w"), (4.6, "c")], 3: [(0, "w"), (0.95, "s"), (3.0, "c")],
            4: [(0, "w"), (2.28, "c"), (4.06, "c")], 5: [(0, "w"), (1.29, "w"), (1.85, "w"), (2.43, "f")],
            6: [(0, "w"), (1.79, "c"), (3.41, "w"), (4.79, "c")], 7: [(0, "f"), (1.89, "c"), (3.67, "w")], 8: [(0, "w"), (1.25, "w"), (1.73, "f")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec)
            elif k == "f" and not (b == 1 and sec == 0):
                at(b, sec, s["sub_impact"], -20)
            elif k == "s":
                at(b, sec, s["camera_shutter"], -16)

    # beat 1: voi ma mút rống, bước chân, lông bung tung toé, xẹp thành voi
    at(1, 0.18, trumpet(1.15, 280, 520, 1), -12)
    for sec in (0.35, 1.25):
        at(1, sec, s["deep_thud"], -16)
    at(1, 1.6, s["sub_impact"], -12)
    for i in range(24):
        at(1, 1.6 + 0.75 * rng.random() ** 1.5, pitch(s["bubble_pop"] if i % 2 else s["pop_click"], 0.7 + 0.9 * rng.random()), -20 - 6 * rng.random())
    at(1, 2.62, pitch(s["deep_thud"], 1.3), -15)

    # beat 2: từng nấc DNA được chèn gene -> tia zap; voi con rống be bé
    for sec, _ in [(1.07, 5), (1.33, 9), (1.73, 12), (1.99, 16), (2.27, 19), (2.61, 23)]:
        at(2, sec - 0.2, pitch(s["sci_fi_zap"], 0.9 + 0.5 * rng.random()), -21)
        at(2, sec, pitch(s["pop_click"], 1.4), -20)
    at(2, 4.8, trumpet(0.75, 620, 980, 2), -18)

    # beat 3: chuột lông vàng lấp lánh, tem "IT WORKED"
    at(3, 1.8, s["magic_chime"], -17)
    at(3, 4.61, s["heavy_slam"], -15)
    at(3, 4.63, s["bell_ding"], -20)

    # beat 4: lông khối rơi lộp độp theo bộ đếm, tuột mảng ở "slipped", gạch 2028, trượt đi
    for i in range(26):
        sec = 0.15 + 1.5 * (i / 26) ** 1.3
        at(4, sec, pitch(s["mouse-click"], 0.8 + 0.5 * rng.random()), -21)
        if i % 3 == 0:
            at(4, sec + 0.05, pitch(s["pop_click"], 0.6 + 0.4 * rng.random()), -22)
    at(4, 2.78, s["digital_glitch"], -18)
    at(4, 2.78, s["deep_thud"], -14)
    for i in range(6):
        at(4, 3.15 + 0.12 * i + 0.05 * rng.random(), pitch(s["deep_thud"], 1.5 + 0.6 * rng.random()), -22)
    at(4, 3.3, s["paper_rip"], -19)
    at(4, 3.65, s["swoosh_reverse"], -22)

    # beat 5: tia quét DNA
    at(5, 2.45, pitch(s["sci_fi_zap"], 0.6), -20)
    at(5, 2.45, s["magic_chime"], -22)

    # beat 6: bước chân đàn voi lúc máy sát đất
    for i in range(9):
        at(6, 0.1 + 0.2 * i + 0.04 * rng.random(), pitch(s["deep_thud"], 0.85 + 0.3 * rng.random()), -17 - 3 * (i % 2))
    at(6, 1.9, s["magic_chime"], -24)

    # beat 7: bước chân cuối, time-lapse 4.000 năm (tua băng + riser), kim tự tháp đập xuống
    for sec in (0.4, 1.3):
        at(7, sec, s["deep_thud"], -18)
    at(7, 1.89, s["tape_rewind"], -18)
    at(7, 2.0, np.concatenate([s["swoosh_reverse"]] * 2), -20)
    at(7, 4.67, s["heavy_slam"], -12)
    at(7, 4.67, s["sub_impact"], -14)

    # beat 8: VS đập + cả hai cùng rống, tuyết bắn
    at(8, 1.73, s["heavy_slam"], -12)
    at(8, 1.75, trumpet(1.25, 330, 600, 3), -14)
    at(8, 1.82, trumpet(1.3, 240, 470, 4), -14)
    at(8, 1.8, s["whoosh"], -18)

    mix = voice + bus[: len(voice), None]
    tmp = Path(out).with_suffix(".pre.wav")
    pcm = np.clip(mix, -4, 4).astype(np.float32).tobytes()
    subprocess.run([FF, "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(tmp)], input=pcm, check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", str(tmp), "-af", "alimiter=limit=0.89:level=false", "-ar", str(SR), "-ac", "2", str(out)], check=True)
    tmp.unlink()
    print("sfx peak dB", round(20 * np.log10(np.abs(bus).max() + 1e-9), 1), "voice peak dB", round(20 * np.log10(np.abs(voice).max()), 1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
