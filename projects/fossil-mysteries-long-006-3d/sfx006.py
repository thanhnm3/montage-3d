"""Tiếng cho Fossil tập dài 006 bản 3D (HOOK, 2026-10-30): giọng Charon + nhạc nền nhỏ (né giọng) + hiệu ứng.

Mốc thời gian khớp CUTS / HITS / LIGHTNING trong
remotion-composer/projects/fossil-3d-city-test/Long006_3D.tsx (giây trong beat, BEAT_START lấy từ chirp_r04/result.json).
Tiếng gầm từ tts/assets/sfx/dino (ghép từ ghi âm thú thật, duyệt 2026-10-30); sấm tự tổng hợp; còn lại từ tts/assets/sfx.

  D:/youtube/tts/.venv/Scripts/python.exe sfx006.py <out.wav> [--until <giây>]
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
TTS = Path("D:/youtube/tts")
EP = TTS / "episodes/fossil-mysteries/long/006"
SFX = TTS / "assets/sfx"
DUR = [b["duration"] for b in json.loads((EP / "raw/chirp_r04/result.json").read_text(encoding="utf-8"))["beats"]]
START = np.concatenate([[0], np.cumsum(DUR)])


def load(path, ch=1) -> np.ndarray:
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def norm(x, db=0.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (db / 20)


def pitch(x, r):
    idx = np.arange(0, len(x) - 1, r)
    return np.interp(idx, np.arange(len(x)), x).astype(np.float32)


def filt(x, kind, f):
    return sosfilt(butter(4, f, btype=kind, fs=SR, output="sos"), x).astype(np.float32)


def thunder(dur=3.0, seed=0):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal(n), "low", 260) * (np.exp(-t * 1.6) + 0.5 * np.exp(-((t - 0.5) ** 2) / 0.05))
    crack = filt(rng.standard_normal(n), "band", [900, 5000]) * np.exp(-t * 18)
    return norm(x + 0.25 * crack)


def drone(dur, seed=0):
    rng = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * 41 * t) + 0.6 * np.sin(2 * np.pi * 61.5 * t + 1) + 0.3 * filt(rng.standard_normal(len(t)), "low", 200)
    env = np.clip(t / 0.8, 0, 1) * np.clip((dur - t) / 0.8, 0, 1)
    return norm(x * env)


def scrape(dur, seed=0):
    rng = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    x = filt(rng.standard_normal(len(t)), "band", [500, 2500]) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    return norm(x * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.2, 0, 1))


def main(out, until):
    voice = load(EP / "episode_audio_chirp_r04.wav")
    n = int(until * SR) if until else len(voice)
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    bus = np.zeros(n + SR * 3, np.float32)
    s = {p.stem: norm(load(p)) for p in list(SFX.glob("*.wav")) + list((SFX / "remotion").glob("*.wav"))}
    rng = np.random.default_rng(6)
    dino = {p.stem[5:]: norm(load(p)) for p in (SFX / "dino").glob("roar_*.wav")}

    def roar_of(sp, dur):
        """tiếng gầm của loài, cắt còn dur giây (vuốt đuôi 0.3 s)"""
        c = dino[sp][: int(dur * SR)].copy()
        m = min(len(c), int(0.3 * SR))
        c[-m:] *= np.linspace(1, 0, m)
        return c

    def at(beat, sec, clip, db, fade_out=None):
        i = int((START[beat - 1] + sec) * SR)
        c = clip * 10 ** (db / 20)
        if fade_out:
            c = c[: int(fade_out * SR)].copy()
            m = min(len(c), int(0.4 * SR))
            c[-m:] *= np.linspace(1, 0, m)
        if i >= len(bus):
            return
        bus[i:i + len(c)] += c[: len(bus) - i]

    def whoosh(beat, sec, db=-15):
        w = s["whoosh"] if rng.random() < 0.5 else s["soft_whoosh"]
        at(beat, sec - 0.15, pitch(w, 0.85 + 0.3 * rng.random()), db)

    # nền: gió bão + drone trầm suốt HOOK (trừ phòng trưng bày beat 4), sấm
    wind = np.tile(s["wind_howl"], 8)
    for b, d in [(1, 6.9), (2, 6.8), (3, 7.1), (5, 7.7)]:
        at(b, 0, wind, -30, fade_out=d)
    at(1, 0, drone(20.9), -24)
    at(5, 0, drone(7.7, 1), -24)
    at(4, 0, drone(8.1, 2), -30)
    at(1, 0.15, thunder(3.2, 1), -9)
    at(3, 0.65, thunder(2.6, 2), -13)

    # cắt cảnh: whoosh mỗi whip, sub_impact mỗi flash
    cuts = {1: [(1.74, "c"), (3.74, "f"), (5.34, "w")], 2: [(2.95, "c"), (4.37, "w")],
            3: [(1.99, "w"), (2.53, "w"), (3.17, "w"), (3.93, "w"), (6.39, "f")],
            4: [(0, "f"), (3.18, "c"), (4.24, "c"), (6.14, "c")], 5: [(0, "w"), (3.31, "f"), (4.47, "c")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -24)

    # beat 1: mắt bật sáng, gầm gừ, răng, sọ Triceratops có vết cắn
    at(1, 0.9, pitch(s["magic_chime"], 0.5), -26)
    at(1, 2.05, roar_of("trex", 2.6), -10)
    at(1, 3.74, s["heavy_slam"], -16)
    at(1, 5.4, s["deep_thud"], -14)
    at(1, 5.5, scrape(0.6, 1), -26)

    # beat 2: bước chân, dolly zoom, phả hơi
    at(2, 0.1, s["deep_thud"], -15)
    at(2, 1.3, pitch(s["deep_thud"], 0.85), -17)
    at(2, 2.95, np.concatenate([s["swoosh_reverse"]]), -22)
    at(2, 4.45, filt(np.random.default_rng(3).standard_normal(int(1.0 * SR)), "low", 900) * np.hanning(int(1.0 * SR)), -16)
    at(2, 5.45, filt(np.random.default_rng(4).standard_normal(int(0.9 * SR)), "low", 800) * np.hanning(int(0.9 * SR)), -17)
    at(2, 4.4, roar_of("snarl_close", 2.4), -16)

    # beat 3: bốn cặp mắt bật sáng, bốn đối thủ gầm theo whip, so chiều dài
    for i in range(4):
        at(3, 0.8 + 0.18 * i, pitch(s["magic_chime"], 0.45 + 0.08 * i), -27)
    for sec, sp, dur in [(2.0, "utahraptor", 0.75), (2.54, "carnotaurus", 0.85), (3.18, "spinosaurus", 1.0), (3.94, "giganotosaurus", 1.9)]:
        at(3, sec, roar_of(sp, dur), -12)
    for i in range(6):
        at(3, 5.7 + 0.2 * i, pitch(s["deep_thud"], 0.9 + 0.3 * rng.random()), -20)
    at(3, 6.3, pitch(s["sci_fi_zap"], 0.5), -24)

    # beat 4: phòng trưng bày: đá cọ, tia lấp lánh, ghim địa điểm, bộ xương sụp
    at(4, 0.2, scrape(1.2, 2), -26)
    at(4, 1.7, s["magic_chime"], -24)
    for sec in (3.4, 4.86, 6.96):
        at(4, sec, s["pop_click"], -18)
    at(4, 3.4, pitch(s["bell_ding"], 1.6), -26)
    at(4, 6.45, s["heavy_slam"], -14)
    for i in range(30):
        at(4, 6.5 + 0.9 * rng.random() ** 1.4, pitch(s["deep_thud"], 1.6 + 1.2 * rng.random()), -20 - 6 * rng.random())
    at(4, 6.6, filt(np.random.default_rng(5).standard_normal(int(1.6 * SR)), "low", 1500) * np.hanning(int(1.6 * SR)), -20)

    # beat 5: năm con gầm lần lượt (#5 nhỏ -> #1 to), tem RANKED, mắt T. rex mở
    for i, sp in enumerate(["utahraptor", "carnotaurus", "spinosaurus", "giganotosaurus", "trex"]):
        at(5, 0.35 + 0.42 * i, roar_of(sp, 1.0 + 0.3 * i), -15 + 1.2 * i)
    at(5, 3.31, s["heavy_slam"], -12)
    at(5, 4.6, pitch(s["magic_chime"], 0.4), -22)
    at(5, 4.65, pitch(s["sub_impact"], 0.8), -18)
    at(5, 5.2, roar_of("snarl_close", 2.2), -17)

    # ---------------- ACT 1-2 (beat 6-14)
    for b, d in [(6, 3.4), (7, 7.2), (8, 12.8), (9, 4.7), (12, 5.1), (13, 7.2), (14, 8.3)]:
        at(b, 0, wind, -32, fade_out=d)
    at(7, 4.03, drone(3.2, 3), -24)
    at(11, 12.41, drone(4.6, 4), -24)
    at(12, 0, drone(5.2, 5), -26)
    at(13, 0, drone(15.5, 6), -27)
    cuts = {6: [(0, "w"), (3.43, "c"), (6.27, "w"), (8.05, "c")], 7: [(0, "w"), (2.09, "c"), (3.43, "f"), (4.03, "w"), (7.19, "c")],
            8: [(0, "f"), (3.37, "c"), (6.01, "w"), (11.83, "c")], 9: [(1.56, "c"), (4.74, "w"), (10.4, "f")],
            10: [(0, "w"), (3.28, "c")], 11: [(3.35, "w"), (6.97, "c"), (8.57, "f"), (12.41, "w")],
            12: [(3.14, "c"), (5.14, "w")], 13: [(4.42, "w")], 14: [(2.75, "w"), (6.63, "f")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -17)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -25)
    # beat 6: sấm, thẻ tiêu chí bật ra, tia quét
    at(6, 0.45, thunder(2.4, 3), -16)
    for sec in (4.79, 6.39, 8.49):
        at(6, sec, s["pop_click"], -19)
    at(6, 8.6, pitch(s["sci_fi_zap"], 0.7), -26)
    # beat 7: Carnotaurus chạy, cuộn phim nứt rồi vỡ, hai con gầm đối mặt
    for i in range(4):
        at(7, 0.15 + 0.31 * i, pitch(s["deep_thud"], 1.0), -19)
    at(7, 2.09, s["tape_rewind"], -22, fade_out=1.3)
    at(7, 2.91, pitch(s["pop_click"], 0.6), -16)
    at(7, 3.43, s["heavy_slam"], -15)
    at(7, 5.0, roar_of("giganotosaurus", 1.5), -15)
    at(7, 5.4, roar_of("trex", 1.6), -14)
    at(7, 11.3, pitch(s["digital_glitch"], 0.8), -28)
    # beat 8: thẻ #5, raptor rình, đi ngang chân T. rex, gấu xám
    at(8, 0.07, s["heavy_slam"], -12)
    at(8, 0.15, thunder(2.6, 4), -15)
    at(8, 1.2, roar_of("snarl_close", 1.8), -19)
    for i in range(5):
        at(8, 3.5 + 0.53 * i, pitch(s["deep_thud"], 1.5), -22)
    at(8, 4.0, s["deep_thud"], -14)
    at(8, 11.85, pitch(s["deep_thud"], 0.8), -18)
    # beat 9: gầm cận mặt, vuốt liềm bật lên, thước, lấp lánh
    at(9, 0.2, roar_of("utahraptor", 1.2), -14)
    at(9, 4.9, scrape(0.35, 3), -20)
    at(9, 7.6, s["pop_click"], -20)
    at(9, 10.1, s["magic_chime"], -23)
    at(9, 10.4, pitch(s["whip"], 0.9), -16)
    # beat 10-11: Utah ban ngày: phủi bụi, ghim năm, cần cẩu, khối đá 9 tấn, chụp X-quang, tua ngược thời gian
    at(10, 0.1, scrape(1.5, 4), -27)
    at(10, 1.92, s["pop_click"], -18)
    at(10, 4.92, s["camera_shutter"], -20)
    at(11, 0.2, scrape(3.0, 5) * 0.6, -28)
    at(11, 7.67, s["heavy_slam"], -15)
    at(11, 8.57, pitch(s["sci_fi_zap"], 0.6), -22)
    at(11, 10.83, s["pop_click"], -20)
    at(11, 12.41, s["tape_rewind"], -18, fade_out=2.0)
    at(11, 14.71, pitch(s["magic_chime"], 0.5), -24)
    # beat 12: cát lún nuốt con mồi, raptor nhảy vào, cuốc chim gõ trúng xương
    for sec, db in [(1.5, -22), (3.9, -20), (4.2, -21)]:
        at(12, sec, pitch(s["water_splash"], 0.55), db)
    at(12, 1.8, pitch(roar_of("carnotaurus", 1.2), 1.25), -20)
    at(12, 3.9, roar_of("utahraptor", 1.0), -16)
    for sec in (7.92, 8.36, 8.98):
        at(12, sec, pitch(s["pop_click"], 0.45), -15)
    # beat 13: bước chân trong sân, nhảy qua rào, ván gỗ vỡ
    for i in range(9):
        at(13, 0.3 + 0.48 * i, pitch(s["deep_thud"], 1.6 + 0.2 * rng.random()), -24)
    at(13, 5.2, roar_of("utahraptor", 1.0), -15)
    at(13, 5.6, s["heavy_slam"], -14)
    for i in range(6):
        at(13, 5.62 + 0.25 * rng.random(), pitch(s["pop_click"], 0.35 + 0.2 * rng.random()), -18)
    # beat 14: gầm cận, cả bầy vây quanh, tem #5
    at(14, 0.8, roar_of("utahraptor", 1.4), -12)
    at(14, 4.0, roar_of("snarl_close", 1.6), -18)
    at(14, 4.3, pitch(roar_of("utahraptor", 1.0), 0.9), -18)
    at(14, 6.63, s["heavy_slam"], -12)

    # ---------------- ACT 3 (#4 Carnotaurus, beat 15-21)
    def engine(dur, rise=0.0):
        """tiếng máy xe: sóng răng cưa trầm + nhiễu, tần số tăng dần theo rise"""
        t = np.arange(int(dur * SR)) / SR
        f = 70 + 40 * rise * t / dur
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = ((ph / (2 * np.pi)) % 1 - 0.5) + 0.3 * filt(np.random.default_rng(8).standard_normal(len(t)), "low", 400)
        return norm(filt(x, "low", 900) * np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.4, 0, 1))

    def skid(dur, seed=0):
        t = np.arange(int(dur * SR)) / SR
        x = filt(np.random.default_rng(seed).standard_normal(len(t)), "band", [1800, 4200]) * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t))
        return norm(x * np.clip(t / 0.04, 0, 1) * np.clip((dur - t) / 0.25, 0, 1))

    def steps(beat, t0, t1, gap, db, p=1.0):
        k = t0
        while k < t1:
            at(beat, k, pitch(s["deep_thud"], p + 0.1 * rng.random()), db)
            k += gap

    for b, d in [(15, 13.0), (16, 15.0), (17, 1.9), (18, 12.0), (21, 9.4)]:
        at(b, 0, wind, -32, fade_out=d)
    at(17, 1.92, drone(8.1, 7), -27)
    at(21, 0, drone(9.4, 8), -28)
    cuts = {15: [(0, "f"), (5.23, "c"), (8.39, "w")], 16: [(6.68, "w"), (11.54, "c")], 17: [(1.92, "w"), (6.48, "c"), (10.0, "w")],
            18: [(3.0, "w"), (5.32, "c")], 19: [(0, "w"), (4.43, "c")], 20: [(3.77, "w")], 21: [(0, "w"), (4.66, "c"), (8.3, "f")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -17)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -25)
    # beat 15: thẻ #4, bước ra khỏi khói, gầm, lao đầu vỡ đá
    at(15, 0.13, s["heavy_slam"], -12)
    at(15, 0.1, thunder(2.4, 6), -16)
    steps(15, 0.4, 5.0, 0.6, -21, 0.9)
    at(15, 2.7, roar_of("carnotaurus", 1.8), -12)
    steps(15, 8.5, 11.4, 0.35, -19, 1.0)
    at(15, 11.43, s["heavy_slam"], -10)
    at(15, 11.45, pitch(s["deep_thud"], 0.7), -12)
    for i in range(12):
        at(15, 11.5 + 0.7 * rng.random(), pitch(s["deep_thud"], 1.4 + rng.random()), -21 - 5 * rng.random())
    # beat 16: tay cụt vẫy vô ích, mũi tên chạy ra đuôi
    for i in range(6):
        at(16, 7.6 + 0.55 * i, pitch(s["pop_click"], 1.3 + 0.15 * (i % 2)), -21)
    for i in range(4):
        at(16, 11.7 + 0.45 * i, pitch(s["soft_whoosh"], 1.6), -24)
    at(16, 13.66, pitch(s["sci_fi_zap"], 0.55), -24)
    # beat 17: đuôi sáng, phòng thí nghiệm, lớp cơ gắn vào, cột vọt lên
    at(17, 0.2, pitch(s["sci_fi_zap"], 0.5), -24)
    at(17, 2.08, s["pop_click"], -19)
    for sec in (7.56, 8.08, 8.98, 9.3):
        at(17, sec, s["digital_glitch"], -24)
    at(17, 10.5, pitch(s["swoosh_reverse"], 1.2), -21)
    at(17, 10.66, s["sub_impact"], -18)
    # beat 18: quay chậm (bước trầm), chạy nước rút, kim đồng hồ
    for i in range(3):
        at(18, 0.4 + 0.85 * i, pitch(s["deep_thud"], 0.6), -18)
    steps(18, 3.05, 11.9, 0.275, -20, 1.2)
    at(18, 3.0, s["whoosh"], -16)
    at(18, 4.3, roar_of("carnotaurus", 1.2), -16)
    # beat 19-20: phố đêm: máy xe, chân chạy, xe vọt, phanh, trượt, đâm cột đèn
    at(19, 0, engine(5.3, 0.3), -22)
    at(19, 4.43, engine(1.0, 1.5), -18)
    steps(19, 0.0, 5.3, 0.275, -20, 1.2)
    at(20, 0, engine(3.0, 0.2), -23)
    at(20, 1.2, skid(1.0, 1), -24)
    steps(20, 0.0, 2.3, 0.3, -20, 1.2)
    at(20, 2.33, skid(0.7, 2), -20)
    at(20, 2.33, scrape(0.6, 6), -18)
    at(20, 2.95, s["heavy_slam"], -12)
    at(20, 2.98, pitch(s["bell_ding"], 0.55), -18)
    at(20, 3.1, roar_of("carnotaurus", 1.0), -17)
    steps(20, 3.8, 9.9, 0.3, -21, 1.2)
    steps(20, 3.8, 9.9, 0.4, -26, 1.8)
    for k in range(5):
        at(20, 4.6 + 1.3 * k, skid(0.45, 3 + k), -24)
    # beat 21: phiến xương, năm/nơi, vảy da mọc dần, tem #4
    at(21, 1.04, s["pop_click"], -19)
    at(21, 3.46, s["camera_shutter"], -19)
    for i in range(10):
        at(21, 5.9 + 0.19 * i, pitch(s["bubble_pop"], 0.9 + 0.4 * rng.random()), -26)
    at(21, 8.3, s["heavy_slam"], -12)

    # ---------------- ACT 4 (#3 Spinosaurus, beat 22-27)
    def river(dur, seed=0):
        """nước sông chảy: nhiễu dải trung, biên độ dao động chậm"""
        t = np.arange(int(dur * SR)) / SR
        r = np.random.default_rng(seed)
        x = filt(r.standard_normal(len(t)), "band", [250, 1800]) * (0.6 + 0.25 * np.sin(2 * np.pi * 0.37 * t) + 0.15 * np.sin(2 * np.pi * 1.3 * t))
        return norm(x * np.clip(t / 0.5, 0, 1) * np.clip((dur - t) / 0.5, 0, 1))

    def siren(dur):
        t = np.arange(int(dur * SR)) / SR
        f = 650 + 250 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 1.6))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        return norm(filt(x, "low", 2500) * np.clip(t / 0.4, 0, 1) * np.clip((dur - t) / 0.5, 0, 1))

    for b, d, sd in [(22, 16.8, 1), (24, 16.2, 2), (25, 3.4, 3), (26, 2.0, 4), (27, 8.7, 5)]:
        at(b, 0, river(d, sd), -29)
    at(26, 10.33, river(4.9, 6), -29)
    at(23, 4.39, river(1.8, 7), -29)
    at(25, 3.47, drone(8.9, 9), -27)
    at(27, 0, wind, -30, fade_out=4.9)
    cuts = {22: [(0, "f"), (5.21, "c"), (9.45, "w"), (12.47, "c")], 23: [(4.39, "c"), (6.15, "w"), (13.33, "c")],
            24: [(4.95, "w"), (6.53, "c"), (8.81, "w"), (13.81, "c")], 25: [(3.47, "w"), (7.81, "c")],
            26: [(3.03, "w"), (8.37, "w"), (10.33, "c"), (12.83, "w")], 27: [(4.91, "c")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -17)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -25)
    # beat 22: thẻ #3, trồi lên khỏi sông, gầm, thước, đớp cá
    at(22, 0.13, s["heavy_slam"], -12)
    at(22, 0.1, thunder(2.6, 8), -16)
    at(22, 0.85, pitch(s["water_splash"], 0.5), -12)
    at(22, 1.65, pitch(s["water_splash"], 0.65), -16)
    at(22, 3.0, roar_of("spinosaurus", 2.2), -11)
    at(22, 6.5, s["pop_click"], -20)
    at(22, 11.6, s["pop_click"], -20)
    at(22, 14.35, pitch(s["water_splash"], 1.3), -18)
    at(22, 15.3, pitch(s["heavy_slam"], 1.4), -16)
    # beat 23: nhìn từ trên, mặt cận gầm khẽ, bản đồ, ghim, đống token
    at(23, 4.8, roar_of("snarl_close", 1.4), -18)
    at(23, 6.3, pitch(s["deep_thud"], 0.8), -18)
    at(23, 10.2, s["pop_click"], -16)
    for i in range(14):
        at(23, 13.45 + 0.1 * i, pitch(s["pop_click"], 0.9 + 0.3 * rng.random()), -22)
    for i in range(3):
        at(23, 14.85 + 0.18 * i, pitch(s["pop_click"], 1.6), -22)
    # beat 24: thú săn đi dọc bờ, cá sấu trồi lên, thằn lằn bay, người bước vào, mọi con mắt quay lại
    steps(24, 0.2, 4.9, 0.55, -21, 0.85)
    at(24, 5.15, pitch(s["water_splash"], 0.55), -15)
    at(24, 5.6, pitch(roar_of("snarl_close", 1.2), 0.8), -16)
    for i in range(10):
        at(24, 6.55 + 0.22 * i, pitch(s["soft_whoosh"], 1.9 + 0.2 * (i % 2)), -26)
    steps(24, 8.9, 13.7, 0.55, -23, 0.85)
    steps(24, 13.85, 14.4, 0.5, -24, 2.2)
    at(24, 14.2, pitch(s["sub_impact"], 0.7), -15)
    at(24, 14.3, s["swoosh_reverse"], -20)
    # beat 25: sương, bảo tàng, còi báo động, bom, trần sập, bộ xương đổ
    at(25, 1.9, roar_of("snarl_close", 1.4), -22)
    at(25, 8.0, siren(4.3), -21)
    at(25, 9.36, s["heavy_slam"], -9)
    at(25, 9.38, thunder(3.0, 10), -10)
    for i in range(28):
        at(25, 9.45 + 1.2 * rng.random() ** 1.3, pitch(s["deep_thud"], 1.0 + 1.4 * rng.random()), -18 - 6 * rng.random())
    # beat 26: phiến xương, đuôi ráp từng khối, dưới nước, lội nước, thẻ tập
    at(26, 1.6, s["magic_chime"], -24)
    for i in range(20):
        at(26, 3.6 + 0.08 * i, pitch(s["pop_click"], 1.1 + 0.02 * i), -24)
    at(26, 8.37, pitch(s["water_splash"], 0.5), -18)
    for i in range(10):
        at(26, 8.5 + 0.18 * i, pitch(s["bubble_pop"], 0.7 + 0.5 * rng.random()), -24)
    at(26, 11.0, pitch(s["water_splash"], 1.2), -22)
    at(26, 13.0, s["bell_ding"], -22)
    # beat 27: đồng trống im, mép sông, đôi mắt, lao lên, tối đen
    at(27, 6.6, pitch(s["magic_chime"], 0.4), -26)
    at(27, 7.3, pitch(s["water_splash"], 0.45), -9)
    at(27, 7.3, s["heavy_slam"], -10)
    at(27, 7.4, roar_of("spinosaurus", 1.4), -8)

    # ---------------- ACT 5 (#2 Giganotosaurus, beat 28-34)
    def car_alarm(dur):
        """còi báo động xe: hai nốt luân phiên, ngắt quãng"""
        t = np.arange(int(dur * SR)) / SR
        f = np.where((t * 4) % 2 < 1, 1250, 900)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * ((t * 8) % 1 < 0.7)
        return norm(filt(x, "low", 3000) * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.3, 0, 1))

    def hiss(dur, seed=0):
        t = np.arange(int(dur * SR)) / SR
        x = filt(np.random.default_rng(seed).standard_normal(len(t)), "high", 2500)
        return norm(x * np.clip(t / 0.02, 0, 1) * np.exp(-t / (dur * 0.4)))

    for b, d in [(28, 9.4), (29, 3.8), (30, 7.7), (31, 9.5), (32, 10.9)]:
        at(b, 0, wind, -31, fade_out=d)
    at(29, 3.87, wind, -36, fade_out=11.9)
    at(33, 0, drone(6.7, 11), -28)
    at(34, 2.16, drone(12.5, 12), -29)
    cuts = {28: [(0, "f"), (3, "w"), (6.74, "c")], 29: [(0, "w"), (3.87, "c"), (8.01, "w"), (10.61, "c")],
            30: [(0, "c"), (2.33, "w"), (6.09, "c")], 31: [(0, "c"), (3.62, "w"), (6.86, "c")],
            32: [(0, "w"), (5.13, "c"), (8.43, "w")], 33: [(0, "w"), (2.86, "c")],
            34: [(0, "f"), (2.16, "c"), (6.46, "w"), (11.4, "c"), (12.64, "w")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -17)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -25)
    # beat 28: thẻ #2, sấm, gầm, vương miện rơi xuống
    at(28, 0.13, s["heavy_slam"], -12)
    at(28, 0.1, thunder(2.8, 13), -15)
    at(28, 1.2, roar_of("giganotosaurus", 2.6), -10)
    steps(28, 3.2, 6.6, 0.6, -20, 0.8)
    at(28, 8.7, s["magic_chime"], -20)
    at(28, 8.75, pitch(s["deep_thud"], 1.3), -18)
    # beat 29: xe buggy chạy, phanh trượt tới khúc xương, ánh lấp lánh, thẻ tên
    at(29, 0, engine(7.6, 1.0), -21)
    at(29, 7.3, skid(1.1, 4), -22)
    at(29, 8.2, pitch(s["magic_chime"], 1.2), -24)
    at(29, 10.7, s["pop_click"], -19)
    # beat 30: thước, xe buýt trượt vào, xì phanh hơi
    at(30, 0.3, s["pop_click"], -20)
    at(30, 2.4, engine(3.0, 0.3), -24)
    at(30, 5.2, hiss(1.2, 5), -24)
    at(30, 6.2, s["bell_ding"], -24)
    # beat 31: sọ cạnh người, răng lưỡi dao lóe sáng, so với răng nhọn
    at(31, 0.4, pitch(s["deep_thud"], 0.9), -20)
    at(31, 4.3, pitch(s["magic_chime"], 1.6), -22)
    at(31, 4.35, pitch(s["camera_shutter"], 0.8), -24)
    at(31, 7.2, s["pop_click"], -20)
    at(31, 8.0, s["pop_click"], -20)
    # beat 32: chém cắn vào sườn titanosaur, góc thấp, toàn cảnh
    steps(32, 0.2, 4.6, 0.9, -17, 0.6)
    for k in (2.0, 3.1, 4.2):
        at(32, k, pitch(s["paper_rip"], 0.55), -18)
        at(32, k, s["whip"], -20)
    at(32, 3.0, roar_of("giganotosaurus", 1.6), -15)
    steps(32, 5.2, 10.6, 1.2, -16, 0.55)
    # beat 33: bước qua bãi đỗ xe, còi xe kêu, nhìn qua nóc xe tải
    steps(33, 0.2, 6.4, 0.75, -15, 0.75)
    at(33, 0.9, car_alarm(5.6), -27)
    at(33, 4.0, roar_of("snarl_close", 1.4), -19)
    # beat 34: thẻ "WHY NOT #1?", bộ xương thiếu, cân thăng bằng, đo chiều dài, hàm T. rex đớp, tối đen
    at(34, 0.13, s["heavy_slam"], -13)
    at(34, 0.1, thunder(2.6, 14), -16)
    at(34, 3.0, scrape(1.6, 15), -27)
    at(34, 6.6, pitch(scrape(1.4, 16), 0.5), -24)
    at(34, 8.9, s["pop_click"], -20)
    at(34, 11.6, s["pop_click"], -20)
    at(34, 13.3, roar_of("trex", 1.2), -14)
    at(34, 13.66, s["heavy_slam"], -9)

    # ---------------- ACT 6 (#1 T. rex, beat 35-39)
    def crunch(seed=0):
        """tiếng xương rạn: chùm nhiễu ngắn dải trung-cao"""
        r = np.random.default_rng(seed)
        t = np.arange(int(0.18 * SR)) / SR
        x = filt(r.standard_normal(len(t)), "band", [900, 5000]) * (r.random(len(t)) < 0.12)
        return norm(x * np.exp(-t / 0.06))

    for b, d in [(35, 4.0), (36, 2.2)]:
        at(b, 0, wind, -30, fade_out=d)
    at(35, 17.6, wind, -32, fade_out=4.7)
    at(38, 2.43, wind, -32, fade_out=1.3)
    at(39, 12.9, drone(5.2, 17), -28)
    cuts = {35: [(0, "f"), (4.09, "c"), (9.0, "w"), (12.0, "c"), (17.6, "w")], 36: [(0, "c"), (2.2, "w"), (7.8, "c")],
            37: [(0, "c"), (3.2, "w"), (5.26, "c"), (7.78, "w")], 38: [(0, "c"), (2.43, "f"), (3.77, "c")], 39: [(1.85, "w"), (12.9, "w")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -17)
            elif k == "f":
                at(b, sec, s["sub_impact"], -17)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -25)
    # beat 35: thẻ #1, sấm, T. rex gầm; Sue trong bảo tàng; thước; cân + voi rơi xuống; bước đi trong bão
    at(35, 0.13, s["heavy_slam"], -11)
    at(35, 0.1, thunder(3.0, 18), -13)
    steps(35, 0.3, 2.2, 0.8, -16, 0.7)
    at(35, 2.3, roar_of("trex", 2.6), -8)
    at(35, 2.4, thunder(2.4, 19), -18)
    at(35, 4.1, drone(4.9, 20), -30)
    at(35, 9.4, s["pop_click"], -20)
    at(35, 12.2, pitch(scrape(1.0, 21), 0.5), -26)
    at(35, 16.18, pitch(s["deep_thud"], 0.9), -16)
    at(35, 17.45, pitch(s["deep_thud"], 1.2), -19)
    steps(35, 17.8, 22.2, 0.8, -18, 0.7)
    # beat 36: mặt cận gầm gừ, phòng thí nghiệm, cảm biến trượt vào, cá sấu + chim
    at(36, 0.2, roar_of("snarl_close", 1.8), -15)
    at(36, 4.4, pitch(s["swoosh_reverse"], 1.4), -22)
    at(36, 5.2, s["pop_click"], -19)
    at(36, 8.2, pitch(s["water_splash"], 1.1), -24)
    at(36, 8.9, pitch(s["pop_click"], 1.8), -22)
    # beat 37: hàm kẹp cảm biến (kim đồng hồ vọt lên), ba xe rơi, răng + chuối, đầu răng ép xương
    at(37, 0.3, pitch(s["digital_glitch"], 0.7), -26)
    at(37, 1.6, s["heavy_slam"], -12)
    for a in (4.02, 4.24, 4.52):
        at(37, a, s["heavy_slam"], -14)
    at(37, 6.0, pitch(s["magic_chime"], 1.3), -24)
    at(37, 8.2, pitch(scrape(2.2, 22), 0.4), -22)
    for i in range(12):
        at(37, 9.6 + 0.2 * i, crunch(30 + i), -22 + i * 0.5)
    at(37, 11.36, s["bell_ding"], -22)
    # beat 38: cá sấu ngoạm không vỡ, T. rex gầm đớp, sọ mẫu cắn đi cắn lại, xương vỡ
    for a in (0.9, 1.9):
        at(38, a, pitch(s["deep_thud"], 1.6), -18)
    at(38, 2.5, roar_of("trex", 1.3), -10)
    at(38, 2.95, s["heavy_slam"], -13)
    for i, a in enumerate((4.07, 4.53, 4.83, 5.21, 5.43, 5.79, 6.25)):
        at(38, a, pitch(s["deep_thud"], 1.4), -17)
        at(38, a, crunch(50 + i), -20 + i)
    at(38, 6.6, s["heavy_slam"], -10)
    for i in range(16):
        at(38, 6.65 + 0.6 * rng.random(), crunch(70 + i), -16)
    # beat 39: mảnh xương rơi, phân hoá thạch, thước, soi X-quang; phố đêm, xe bị cắn bẹp
    for i in range(8):
        at(39, 0.1 + 0.15 * i, pitch(s["pop_click"], 0.6 + 0.4 * rng.random()), -22)
    at(39, 3.0, pitch(s["magic_chime"], 0.8), -26)
    at(39, 7.2, s["pop_click"], -20)
    at(39, 8.8, pitch(s["sci_fi_zap"], 0.6), -24)
    steps(39, 13.0, 15.4, 0.8, -15, 0.7)
    at(39, 15.6, roar_of("snarl_close", 1.0), -17)
    at(39, 16.35, s["heavy_slam"], -9)
    at(39, 16.38, pitch(s["paper_rip"], 0.45), -14)
    for i in range(10):
        at(39, 16.4 + 0.5 * rng.random(), pitch(s["pop_click"], 1.4 + 0.6 * rng.random()), -20)
    at(39, 16.6, roar_of("trex", 1.0), -12)

    # ---------------- CLOSER (beat 40-42)
    at(40, 0, wind, -31, fade_out=14.1)
    at(41, 0, wind, -33, fade_out=11.9)
    cuts = {40: [(0, "c"), (1.59, "w"), (4.25, "w"), (5.53, "w"), (8.85, "w"), (10.93, "f")],
            41: [(0, "c"), (5.44, "c"), (6.14, "c"), (6.78, "c"), (7.44, "c"), (8.46, "w"), (9.74, "c")], 42: [(0, "c"), (2.26, "w"), (8.9, "w")]}
    for b, lst in cuts.items():
        for sec, k in lst:
            if k == "w":
                whoosh(b, sec, -18)
            elif k == "f":
                at(b, sec, s["sub_impact"], -16)
            else:
                at(b, sec, pitch(s["soft_whoosh"], 1.3), -26)
    # beat 40: dòng xếp hạng bật ra từng con, mỗi con một tiếng gầm ngắn
    for a in (1.59, 4.25, 5.53, 8.85):
        at(40, a + 0.05, s["pop_click"], -19)
    steps(40, 1.7, 4.2, 0.3, -22, 1.5)
    at(40, 2.2, pitch(roar_of("utahraptor", 0.9), 1.05), -18)
    steps(40, 4.3, 5.5, 0.28, -19, 1.0)
    at(40, 4.5, roar_of("carnotaurus", 0.9), -17)
    at(40, 5.6, pitch(s["water_splash"], 0.6), -20)
    at(40, 6.4, roar_of("spinosaurus", 1.3), -16)
    at(40, 9.0, roar_of("giganotosaurus", 1.6), -15)
    at(40, 10.95, s["heavy_slam"], -11)
    at(40, 10.95, thunder(2.8, 23), -15)
    at(40, 12.4, roar_of("trex", 1.8), -10)
    # beat 41: vạch dài, cắt cận mũi/mắt/hàm/răng, gầm, phiến xương có vết cắn
    at(41, 0.4, pitch(scrape(1.2, 24), 0.6), -27)
    for a in (5.44, 6.14, 6.78, 7.44):
        at(41, a, pitch(s["camera_shutter"], 0.7), -21)
    at(41, 6.8, roar_of("snarl_close", 0.8), -19)
    at(41, 8.5, roar_of("trex", 1.3), -12)
    at(41, 10.0, pitch(s["magic_chime"], 0.8), -25)
    # beat 42: năm con, trục thời gian (mốc bật lên), tập sau: thằn lằn bay, T. rex gầm, tắt đèn
    at(42, 0, drone(2.3, 25), -28)
    for a in (2.4, 2.6, 2.8, 3.0, 3.2):
        at(42, a, pitch(s["pop_click"], 1.2), -21)
    at(42, 3.6, s["swoosh_reverse"], -23)
    at(42, 6.0, s["swoosh_reverse"], -23)
    at(42, 7.95, s["bell_ding"], -20)
    at(42, 8.9, wind, -29, fade_out=4.0)
    at(42, 9.0, thunder(3.0, 26), -16)
    at(42, 10.3, roar_of("trex", 1.5), -12)
    at(42, 11.42, pitch(s["magic_chime"], 0.6), -21)

    # nhạc nền nhỏ, né giọng (giảm khi có tiếng nói)
    music = load(TTS / "assets/music/fossil_mysteries.mp3")
    music = np.tile(music, int(np.ceil(n / len(music))))[:n]
    if n >= int(START[-1] * SR) - SR:
        m = int(1.6 * SR)  # cuối tập: nhạc tắt dần theo màn đen
        music[-m:] *= np.linspace(1, 0, m)
    w = int(0.25 * SR)
    cs = np.concatenate([[0], np.cumsum(np.abs(voice))])
    env = (cs[np.clip(np.arange(n) + w // 2, 0, n)] - cs[np.clip(np.arange(n) - w // 2, 0, n)]) / w
    duck = 1 - 0.55 * np.clip(env / (env.max() * 0.15), 0, 1)
    music *= 10 ** (-27 / 20) * duck
    music[: int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))

    voice_n = voice / np.abs(voice).max() * 10 ** (-3 / 20)
    mix = voice_n + music + bus[:n]
    mono = np.clip(mix, -4, 4).astype(np.float32)
    st = np.stack([mono, mono], 1).astype(np.float32)
    tmp = Path(out).with_suffix(".pre.wav")
    subprocess.run([FF, "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(tmp)], input=st.tobytes(), check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", str(tmp), "-af", "alimiter=limit=0.89:level=false,loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", str(out)], check=True)
    tmp.unlink()
    print("sfx peak dB", round(20 * np.log10(np.abs(bus).max() + 1e-9), 1))


if __name__ == "__main__":
    until = float(sys.argv[sys.argv.index("--until") + 1]) if "--until" in sys.argv else 0
    main(sys.argv[1], until)
