"""Phòng thử tiếng gầm khủng long (2026-10-30), thay roar() răng cưa cũ trong sfx006.py bị chê "không tự nhiên".

Cách tổng hợp mới, mô phỏng giọng thú thật thay vì cộng sóng sin:
- nguồn: chuỗi xung thanh môn đặt từng xung một, chu kỳ rung ngẫu nhiên (jitter), biên độ rung (shimmer),
  nhân đôi chu kỳ (subharmonic, tiếng khàn rè), cộng hơi thở;
- ống thanh quản: 4 formant cộng hưởng đổi theo thời gian (miệng há dần -> F1/F2 lên), lọc theo khối 10 ms có giữ trạng thái;
- vang ngoài trời: IR nhiễu tắt dần, stereo lệch pha.

  D:/youtube/tts/.venv/Scripts/python.exe roar_lab.py <thư mục ra>
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()


def filt(x, kind, f, order=4):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x).astype(np.float32)


def curve(t, pts):
    """nội suy mượt theo các mốc [(giây, giá trị)]"""
    ts, vs = zip(*pts)
    return np.interp(t, ts, vs)


def glottal(dur, f0_pts, jitter=0.05, shimmer=0.25, sub=0.0, seed=0, breath=0.15):
    """chuỗi xung thanh môn: mỗi xung là một nửa chu kỳ cosin lệch (mở chậm, đóng nhanh)"""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n, np.float32)
    t = 0.0
    k = 0
    drift = 0.0
    while t < dur:
        f0 = float(curve(t, f0_pts))
        drift = 0.9 * drift + 0.1 * rng.normal(0, 1)
        T = 1 / max(8.0, f0 * (1 + jitter * (rng.normal(0, 1) * 0.7 + drift)))
        if sub and k % 2:
            T *= 1 + sub * 0.5
        a = (1 + shimmer * rng.normal(0, 1)) * (1 - sub * (k % 2) * 0.6)
        L = int(T * SR)
        op = int(L * 0.62)
        cl = max(2, int(L * 0.22))
        pulse = np.concatenate([0.5 - 0.5 * np.cos(np.linspace(0, np.pi, op)), np.cos(np.linspace(0, np.pi / 2, cl)), np.zeros(max(0, L - op - cl))])
        i = int(t * SR)
        m = min(len(pulse), n - i)
        x[i:i + m] += a * pulse[:m]
        t += T
        k += 1
    x = np.diff(x, prepend=0) * 20  # đạo hàm luồng khí ~ áp suất phát ra
    x += breath * filt(rng.standard_normal(n), "band", [300, 6000]) * (0.4 + np.abs(x) / (np.abs(x).max() + 1e-9))
    return x


def tract(x, F, B, gains=None, block=480):
    """lọc qua các formant cộng hưởng đổi theo thời gian: F, B = list hàm t -> Hz"""
    n = len(x)
    out = np.zeros(n, np.float32)
    for j, (fF, fB) in enumerate(zip(F, B)):
        g = 1.0 if gains is None else gains[j]
        y = np.zeros(n, np.float32)
        zi = np.zeros(2)
        for s in range(0, n, block):
            tc = (s + block / 2) / SR
            f, bw = fF(tc), fB(tc)
            r = np.exp(-np.pi * bw / SR)
            th = 2 * np.pi * f / SR
            a = [1, -2 * r * np.cos(th), r * r]
            b = [(1 - r) * np.sqrt(1 - 2 * r * np.cos(2 * th) + r * r)]
            y[s:s + block], zi = lfilter(b, a, x[s:s + block], zi=zi)
        out += g * y
    return out


def reverb(x, rt=1.3, wet=0.28, seed=0):
    rng = np.random.default_rng(seed)
    n = int(rt * SR)
    t = np.arange(n) / SR
    chans = []
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
        ir = filt(ir, "low", 3500)
        ir[: int(0.012 * SR)] = 0
        ir[int((0.031 + 0.007 * c) * SR)] += 6  # dội sớm từ vách đá
        ir /= np.sqrt((ir ** 2).sum())
        chans.append(np.pad(fftconvolve(x, ir), (0, 1))[: len(x) + n])
    dry = np.pad(x, (0, n))
    return np.stack([dry + wet * chans[0] * 3, dry + wet * chans[1] * 3], 1)


def env(t, a, r, dur):
    return np.clip(t / a, 0, 1) * np.clip((dur - t) / r, 0, 1) ** 1.5


def fin(x):
    x = x / (np.abs(x).max() + 1e-9)
    return np.tanh(1.6 * x) / np.tanh(1.6)


def k(pts):
    return lambda t: float(curve(t, pts))


# ---------------------------------------------------------------- các mẫu
def rex_growl_roar(seed=1):
    """A. T. rex: gầm gừ trầm rồi há miệng gầm, khàn rè (nhân đôi chu kỳ), formant mở dần"""
    d = 2.8
    t = np.arange(int(d * SR)) / SR
    src = glottal(d, [(0, 38), (0.5, 46), (1.0, 62), (1.6, 70), (2.3, 52), (2.8, 34)], jitter=0.09, shimmer=0.35, sub=0.55, seed=seed, breath=0.35)
    F = [k([(0, 170), (0.8, 220), (1.2, 380), (2.2, 360), (2.8, 200)]), k([(0, 520), (1.2, 900), (2.2, 850), (2.8, 600)]),
         k([(0, 1350), (1.2, 1700), (2.8, 1400)]), k([(0, 2300), (2.8, 2500)])]
    B = [k([(0, 90), (2.8, 120)]), k([(0, 160), (2.8, 200)]), k([(0, 260), (2.8, 260)]), k([(0, 380), (2.8, 380)])]
    y = tract(src, F, B, [1, 0.8, 0.45, 0.25])
    y += 0.5 * filt(y, "low", 160)  # ngực rung
    y *= env(t, 0.12, 0.7, d) * (0.55 + 0.45 * np.clip((t - 0.7) / 0.5, 0, 1))
    return reverb(fin(y), 1.4, 0.3, seed)


def rex_closed_boom(seed=2):
    """B. Gầm ngậm miệng kiểu chim/cá sấu (giả thuyết khoa học 2016): ầm trầm, rung cả nền, không há miệng"""
    d = 2.6
    t = np.arange(int(d * SR)) / SR
    src = glottal(d, [(0, 26), (0.6, 33), (1.8, 31), (2.6, 24)], jitter=0.06, shimmer=0.2, sub=0.25, seed=seed, breath=0.08)
    F = [k([(0, 110), (2.6, 120)]), k([(0, 260), (2.6, 280)]), k([(0, 520), (2.6, 540)])]
    B = [k([(0, 50), (2.6, 50)]), k([(0, 90), (2.6, 90)]), k([(0, 160), (2.6, 160)])]
    y = tract(src, F, B, [1, 0.6, 0.25])
    y = filt(y, "low", 900)
    y += 0.35 * filt(np.random.default_rng(seed).standard_normal(len(t)), "low", 70) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    y *= env(t, 0.35, 0.9, d)
    return reverb(fin(y), 1.8, 0.35, seed)


def rex_rumble_then_roar(seed=3):
    """C. Gầm gừ trong họng (1 s) rồi bùng ra gầm lớn há rộng"""
    d = 3.2
    t = np.arange(int(d * SR)) / SR
    src = glottal(d, [(0, 30), (1.0, 34), (1.15, 72), (1.8, 84), (2.6, 64), (3.2, 40)], jitter=0.11, shimmer=0.4, sub=0.6, seed=seed, breath=0.4)
    F = [k([(0, 140), (1.0, 150), (1.25, 420), (2.6, 380), (3.2, 220)]), k([(0, 420), (1.0, 450), (1.25, 1000), (3.2, 650)]),
         k([(0, 1100), (1.25, 1800), (3.2, 1400)]), k([(0, 2200), (3.2, 2600)])]
    B = [k([(0, 80), (1.2, 140), (3.2, 120)]), k([(0, 140), (3.2, 220)]), k([(0, 260), (3.2, 300)]), k([(0, 400), (3.2, 400)])]
    y = tract(src, F, B, [1, 0.85, 0.5, 0.3])
    y += 0.45 * filt(y, "low", 150)
    y *= env(t, 0.2, 0.8, d) * (0.35 + 0.65 * np.clip((t - 1.0) / 0.2, 0, 1))
    return reverb(fin(y), 1.5, 0.3, seed)


def raptor_screech(seed=4):
    """D. Utahraptor: rít cao khàn kiểu chim săn mồi + tiếng lách cách trong họng"""
    d = 1.5
    t = np.arange(int(d * SR)) / SR
    src = glottal(d, [(0, 240), (0.25, 520), (0.8, 470), (1.5, 300)], jitter=0.07, shimmer=0.3, sub=0.4, seed=seed, breath=0.6)
    F = [k([(0, 700), (0.3, 1100), (1.5, 800)]), k([(0, 1700), (0.3, 2300), (1.5, 1800)]), k([(0, 3200), (1.5, 3400)])]
    B = [k([(0, 200), (1.5, 220)]), k([(0, 300), (1.5, 300)]), k([(0, 500), (1.5, 500)])]
    y = tract(src, F, B, [1, 0.8, 0.5])
    clicks = np.zeros(len(t), np.float32)
    for c in np.arange(0.9, 1.45, 0.045):
        i = int(c * SR)
        clicks[i:i + 120] += np.hanning(120) * np.random.default_rng(int(c * 1000)).standard_normal(120)
    y += 0.3 * filt(clicks, "band", [1500, 5000]) / (np.abs(clicks).max() + 1e-9)
    y *= env(t, 0.03, 0.35, d)
    return reverb(fin(y), 1.1, 0.25, seed)


def carno_bellow(seed=5):
    """E. Carnotaurus: rống trầm vừa, giọng mũi (formant hẹp), ngắt quãng 2 hơi"""
    d = 2.4
    t = np.arange(int(d * SR)) / SR
    src = glottal(d, [(0, 70), (0.4, 95), (0.9, 85), (1.1, 60), (1.3, 88), (1.9, 92), (2.4, 55)], jitter=0.06, shimmer=0.3, sub=0.35, seed=seed, breath=0.25)
    F = [k([(0, 300), (0.5, 450), (2.4, 350)]), k([(0, 1050), (2.4, 1000)]), k([(0, 2100), (2.4, 2200)])]
    B = [k([(0, 70), (2.4, 70)]), k([(0, 110), (2.4, 110)]), k([(0, 200), (2.4, 200)])]
    y = tract(src, F, B, [1, 0.7, 0.35])
    gate = np.clip(np.minimum(np.abs(t - 1.1) / 0.08, 1), 0, 1)
    y *= env(t, 0.1, 0.5, d) * gate
    return reverb(fin(y), 1.3, 0.3, seed)


def snarl_hiss(seed=6):
    """F. Phì phò gầm gừ khẽ sát máy (cận mặt): hơi thở qua formant + gừ rất trầm"""
    d = 2.2
    t = np.arange(int(d * SR)) / SR
    rng = np.random.default_rng(seed)
    air = rng.standard_normal(len(t)).astype(np.float32)
    F = [k([(0, 600), (2.2, 700)]), k([(0, 1500), (2.2, 1700)]), k([(0, 2900), (2.2, 3100)])]
    B = [k([(0, 300), (2.2, 300)]), k([(0, 400), (2.2, 400)]), k([(0, 700), (2.2, 700)])]
    y = tract(air, F, B, [0.7, 1, 0.6]) * (0.5 + 0.5 * np.clip(np.sin(np.pi * t / 1.1), 0, 1))
    g = tract(glottal(d, [(0, 32), (2.2, 28)], jitter=0.12, shimmer=0.5, sub=0.6, seed=seed, breath=0.1),
              [k([(0, 160), (2.2, 170)]), k([(0, 450), (2.2, 460)])], [k([(0, 70), (2.2, 70)]), k([(0, 130), (2.2, 130)])])
    y = 0.6 * y / (np.abs(y).max() + 1e-9) + g / (np.abs(g).max() + 1e-9)
    y *= env(t, 0.2, 0.6, d)
    return reverb(fin(y), 0.9, 0.18, seed)


SAMPLES = [("A_rex_gam_khan_ha_mieng", rex_growl_roar), ("B_rex_gam_ngam_mieng_kieu_chim", rex_closed_boom),
           ("C_rex_gu_roi_bung_gam", rex_rumble_then_roar), ("D_raptor_rit_cao", raptor_screech),
           ("E_carno_rong_giong_mui", carno_bellow), ("F_phi_pho_gu_can_mat", snarl_hiss)]


def save(x, path):
    x = x / np.abs(x).max() * 10 ** (-1.5 / 20)
    subprocess.run([FF, "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(path)], input=x.astype(np.float32).tobytes(), check=True)


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    allx = []
    for name, fn in SAMPLES:
        x = fn()
        save(x, out / f"{name}.wav")
        allx += [x / np.abs(x).max() * 0.84, np.zeros((int(0.8 * SR), 2), np.float32)]
        print(name, round(len(x) / SR, 2), "s")
    save(np.concatenate(allx), out / "tat_ca_mau_noi_tiep.wav")
