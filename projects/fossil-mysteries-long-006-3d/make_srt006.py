"""Phụ đề + chương YouTube cho Fossil tập dài 006 bản 3D, lấy từ mốc chữ của giọng Chirp (long/006/raw/words_all.json).

  python make_srt006.py <out.srt> <out_chapters.txt>
Cue tối đa 2 dòng x 42 ký tự, ngắt ở cuối câu hoặc khoảng lặng > 0.5 s; mốc beat = cumsum thời lượng trong chirp_r04/result.json.
"""
import json
import re
import sys
from pathlib import Path

EP = Path("D:/youtube/tts/episodes/fossil-mysteries/long/006")
CHAPTERS = [(1, "The scariest dinosaurs"), (6, "How we ranked them"), (8, "#5 Utahraptor"), (15, "#4 Carnotaurus"),
            (22, "#3 Spinosaurus"), (28, "#2 Giganotosaurus"), (35, "#1 Tyrannosaurus rex"), (40, "The final ranking")]


def ts(s: float) -> str:
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def wrap(text: str, width=42) -> str:
    if len(text) <= width:
        return text
    words = text.split(" ")
    best = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
    return " ".join(words[:best]) + "\n" + " ".join(words[best:])


def main(out_srt: Path, out_ch: Path):
    dur = [b["duration"] for b in json.loads((EP / "raw/chirp_r04/result.json").read_text(encoding="utf-8"))["beats"]]
    start = [0.0]
    for d in dur:
        start.append(start[-1] + d)
    words = json.loads((EP / "raw/words_all.json").read_text(encoding="utf-8"))["words"]
    # nối token tách rời ("T" + "-Rex", "34" + ",000") thành một chữ, giờ tuyệt đối
    toks: list[list] = []
    for b in range(1, len(dur) + 1):
        for sec, w in words.get(str(b), []):
            t = start[b - 1] + sec
            if toks and re.match(r"^[-,]\S", w) and not re.search(r"[.?!,]$", toks[-1][1]):
                toks[-1][1] += w
            else:
                toks.append([t, w])
    for i, tk in enumerate(toks):
        nxt = toks[i + 1][0] if i + 1 < len(toks) else start[-1]
        tk.append(min(nxt, tk[0] + 0.25 + 0.07 * len(tk[1])))  # hết chữ: trước chữ sau, không quá dài
    cues, cur = [], None
    for t0, w, t1 in toks:
        if cur and len(cur["text"]) + 1 + len(w) <= 84 and t0 - cur["end"] <= 0.5 and not re.search(r"[.?!]$", cur["text"]):
            cur["text"] += " " + w
            cur["end"] = t1
        else:
            if cur:
                cues.append(cur)
            cur = {"start": t0, "end": t1, "text": w}
    cues.append(cur)
    cues[0]["start"] = 0.0
    for a, b in zip(cues, cues[1:]):
        a["end"] = min(max(a["end"], a["start"] + 1.0), b["start"] - 0.04)
    out_srt.write_text("\n".join(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{wrap(c['text'].replace('T-Rex', 'T. rex'))}\n" for i, c in enumerate(cues, 1)), encoding="utf-8")
    lines = [f"{int(start[b - 1] // 60)}:{int(start[b - 1] % 60):02d} {name}" for b, name in CHAPTERS]
    lines[0] = "0:00 " + CHAPTERS[0][1]
    out_ch.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(out_srt, len(cues), "cues;", " | ".join(lines))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
