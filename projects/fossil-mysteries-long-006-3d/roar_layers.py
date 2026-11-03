"""Tiếng gầm từng loài ghép từ ghi âm thú thật (2026-10-30), thay roar() tổng hợp bị chê "không tự nhiên".

Nguồn: tts/assets/sfx/animals (Wikimedia Commons, public domain / CC0 / CC BY, xem CREDITS.txt ở đó).
Cách làm kiểu phim: mỗi loài trộn 2-3 lớp thú thật, hạ tông bằng cách phát chậm lại (to xác = chậm + trầm),
lớp cá sấu lọc trầm làm nền ầm, rồi nén nhẹ + vang ngoài trời. Utahraptor = mẫu D tổng hợp (đã duyệt) + quạ.

  D:/youtube/tts/.venv/Scripts/python.exe roar_layers.py <thư mục ra>
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np

from roar_lab import SR, filt, fin, raptor_screech, reverb, save

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path("D:/youtube/tts/assets/sfx/animals")
_cache: dict[str, np.ndarray] = {}


def load(name):
    if name not in _cache:
        raw = subprocess.run([FF, "-v", "error", "-i", str(SRC / name), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
        _cache[name] = np.frombuffer(raw, np.float32).copy()
    return _cache[name]


BEAR, BEARV = "Yellowstone_sound_library_-_Grizzly_Bears_Roar_-_001.mp3", "Yellowstone_sound_library_-_Grizzly_Bear_vocalizations_-_001.mp3"
GATOR, GATOR2 = "Alligatorbellowedit.ogg", "27alligator2bellow.ogg"
TIGER, LION, BISON, RAVEN = "439280_schots_angry-tiger.wav", "Lionroar.wav", "Bison.wav", "Yellowstone_sound_library_-_Common_Raven_-_001.mp3"


def cut(name, a, b, rate=1.0, fade=0.06):
    """lấy đoạn [a, b] giây, phát với tốc độ rate (< 1 = chậm + trầm), vuốt hai đầu, chuẩn hoá"""
    x = load(name)[int(a * SR):int(b * SR)]
    if rate != 1.0:
        idx = np.arange(0, len(x) - 1, rate)
        x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    x = filt(x, "high", 25)
    f = min(int(fade * SR), len(x) // 3)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x / (np.abs(x).max() + 1e-9)


def lay(*parts):
    """parts = (tín hiệu, giây bắt đầu, độ lớn dB)"""
    n = max(int(o * SR) + len(x) for x, o, _ in parts)
    y = np.zeros(n, np.float32)
    for x, o, db in parts:
        i = int(o * SR)
        y[i:i + len(x)] += x * 10 ** (db / 20)
    return y


def comp(x, thr=0.35, ratio=3.0):
    """nén nhẹ theo đường bao để tiếng dày, đều"""
    w = int(0.02 * SR)
    cs = np.concatenate([[0], np.cumsum(x * x)])
    i = np.arange(len(x))
    e = np.sqrt((cs[np.clip(i + w, 0, len(x))] - cs[np.clip(i - w, 0, len(x))]) / (2 * w) + 1e-12)
    e /= e.max()
    g = np.where(e > thr, (thr + (e - thr) / ratio) / e, 1.0)
    return (x * g).astype(np.float32)


def species():
    out = {}
    # T. rex: gấu xám gầm (chậm 0.7) + hổ bùng đầu (chậm 0.6) + cá sấu ầm trầm (chậm 0.75, lọc dưới 260 Hz)
    out["trex"] = lay((cut(BEAR, 2.0, 5.1, 0.7), 0.0, 0), (cut(TIGER, 3.0, 3.9, 0.6), 0.05, -4),
                      (filt(cut(GATOR, 7.5, 10.9, 0.75), "low", 260), 0.2, -2))
    # Giganotosaurus: hổ (chậm 0.65, hai tiếng nối nhau) + gấu (chậm 0.78) — sắc hơn T. rex, ít ầm hơn
    out["giganotosaurus"] = lay((cut(TIGER, 0.2, 1.25, 0.65), 0.0, 0), (cut(TIGER, 3.0, 3.9, 0.7), 1.25, -2),
                                (cut(BEAR, 3.2, 5.1, 0.78), 0.3, -5), (filt(cut(GATOR2, 0.8, 2.3, 0.8), "low", 300), 0.1, -6))
    # Carnotaurus: bò rừng bison rống (chậm 0.8) + hổ gắt (chậm 0.85) — kiểu "bò ăn thịt"
    out["carnotaurus"] = lay((cut(BISON, 0.05, 2.4, 0.8), 0.0, 0), (cut(TIGER, 6.4, 7.0, 0.85), 0.15, -5),
                             (filt(cut(GATOR2, 4.85, 6.3, 0.85), "low", 300), 0.1, -7))
    # Spinosaurus: cá sấu rống (chậm 0.85) làm thân + gấu (chậm 0.75) — loài sống sông nên nghiêng về bò sát
    out["spinosaurus"] = lay((cut(GATOR, 1.15, 3.8, 0.85), 0.0, 0), (cut(BEAR, 2.0, 3.3, 0.75), 0.25, -4),
                             (cut(TIGER, 5.55, 6.2, 0.7), 0.1, -9))
    # Utahraptor: mẫu D tổng hợp (đã duyệt) + quạ kêu khàn (chậm 0.75) chồng lên
    d = raptor_screech()[:, 0]
    out["utahraptor"] = lay((d / np.abs(d).max(), 0.0, 0), (cut(RAVEN, 8.4, 8.8, 0.75), 0.12, -6), (cut(RAVEN, 4.9, 5.3, 0.7), 0.7, -9))
    # gừ phì phò cận mặt: gấu xám gừ (chậm 0.8)
    out["snarl_close"] = lay((cut(BEARV, 26.4, 30.0, 0.8, 0.2), 0.0, 0), (filt(cut(GATOR, 13.4, 16.5, 0.7), "low", 200), 0.3, -8))
    return out


if __name__ == "__main__":
    dst = Path(sys.argv[1])
    dst.mkdir(parents=True, exist_ok=True)
    allx = []
    for i, (name, y) in enumerate(species().items()):
        y = comp(y / np.abs(y).max())
        st = reverb(fin(y) * 0.9, 1.6 if name != "utahraptor" else 1.1, 0.24, i) if name != "utahraptor" else np.stack([y, y], 1)
        save(st, dst / f"that_{i + 1}_{name}.wav")
        allx += [st / np.abs(st).max() * 0.84, np.zeros((int(0.8 * SR), 2), np.float32)]
        print(name, round(len(st) / SR, 2), "s")
    save(np.concatenate(allx), dst / "that_tat_ca_noi_tiep.wav")
