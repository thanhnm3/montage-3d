"""Short 012: Whisper placed the beat-6 "Titanoboa" ~0.55 s early (in the gap before beat 6, end of "Not so fast").
Move it to its own beat start (+60 ms) and stretch the previous caption line to meet it. The second "Titanoboa"
(beat 8) is fine. Run after build_props.py; writes props.json + artifacts/props.json."""
import json
from pathlib import Path

P = Path(__file__).resolve().parent
p = json.loads((P / "artifacts" / "props.json").read_text(encoding="utf-8"))
starts = {s["beat"]: round(s["startFrame"] * 1000 / 30) for s in p["scenes"]}
FIX = {"titanoboa": 6}
K = p["karaoke"]
for i, g in enumerate(K):
    for j, w in enumerate(g["words"]):
        b = FIX.get(w["text"].lower().strip(".,?!"))
        if b and w["startMs"] < starts[b] and j == 0:
            t0 = starts[b] + 60
            w["startMs"] = g["startMs"] = t0
            if i:
                K[i - 1]["endMs"] = t0
                K[i - 1]["words"][-1]["endMs"] = t0
            print("moved", w["text"], "->", t0)
for out in (P / "props.json", P / "artifacts" / "props.json"):  # make_srt.py reads artifacts/
    out.write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8")
print("fixed")
