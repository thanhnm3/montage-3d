"""Short 010: Whisper could not hear the three species names (interpolated right after the previous word,
so they lit up ~0.5 s early, at the end of the previous beat). Move each to its own beat start (+60 ms)
and stretch the previous caption line to meet it. Run after build_props.py; writes props.json + artifacts/props.json."""
import json
from pathlib import Path

P = Path(__file__).resolve().parent
p = json.loads((P / "artifacts" / "props.json").read_text(encoding="utf-8"))
starts = {s["beat"]: round(s["startFrame"] * 1000 / 30) for s in p["scenes"]}
FIX = {"Liopleurodon.": 4, "Livyatan,": 6, "Ichthyotitan,": 8, "But": 9}
K = p["karaoke"]
for i, g in enumerate(K):
    for w in g["words"]:
        if w["text"] in FIX and len(g["words"]) == 1:
            t0 = starts[FIX[w["text"]]] + 60
            w["startMs"] = g["startMs"] = t0
            if i:
                K[i - 1]["endMs"] = t0
                K[i - 1]["words"][-1]["endMs"] = t0
for out in (P / "props.json", P / "artifacts" / "props.json"):  # make_srt.py reads artifacts/
    out.write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8")
print("fixed")
