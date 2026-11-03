"""Props for the ink-3D 10%-brain myth Short (comp BrainMyth): Rhubarb cues, karaoke, whisper word times.

  PYTHONUTF8=1 tts/.venv python build.py   -> ../artifacts/props.json
Voice first: r03.py voice <proj> <ep> --chirp, then voice_post.py (x1.1 + whisper + Rhubarb) ->
public/audio/narration.wav, artifacts/whisper_words_r03.json, public/cues/mouth.json.
Unlike 003 there is no 2D pose library / face rig to stage: the host is the 3D person with the canvas face (Person.tsx).
The comp takes every shot time from props.words (anchor words, see ANCHORS in BrainMyth.tsx), so a new take
only needs this script re-run, no hand-edited time table.
"""
from __future__ import annotations

import json
import re
import sys
import wave
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent
POSE = Path("D:/youtube/openmontage/tools/whywhywhy_pipeline/pose")
sys.path.insert(0, str(POSE))
import reel_build  # noqa: E402

FPS = 30
CAP_Y = 1660
# same list, same order as ANCHORS in remotion-composer/projects/www-ink3d-004/BrainMyth.tsx
ANCHORS = ["only", "brain", "movies", "idea", "your", "doesnt", "brain", "weight", "burns", "energy", "body", "pay", "keep", "switched",
           "evolution", "cut", "ago", "scans", "agree", "not", "lights", "once", "over", "day", "almost", "region", "turn", "so", "dont",
           "all", "just", "once", "follow", "why", "behind"]


def check_anchors(words):
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    i = 0
    for a in ANCHORS:
        while i < len(words) and norm(words[i]["word"]) != a:
            i += 1
        if i >= len(words):
            print(f"!! anchor '{a}' not found in the transcript: the comp falls back to its estimated timing. Fix the take or ANCHORS.")
            return False
        i += 1
    return True


def main():
    pub = PROJ / "public"
    with wave.open(str(pub / "audio" / "narration.wav")) as w:
        dur = w.getnframes() / w.getframerate()
    plan = json.loads((PROJ / "artifacts" / "r03_plan.json").read_text(encoding="utf-8"))
    words_file = PROJ / "artifacts" / "whisper_words_r03.json"
    words = json.loads(words_file.read_text(encoding="utf-8"))
    check_anchors(words)
    spec = {"audioFrom": {"start": 0, "end": dur + 1}, "dialog": "r03_dialog.txt",
            "captions": {"words": str(words_file), "y": CAP_Y, "size": 96, "maxWidth": 940, "keywords": plan["keywords"]}}
    cap = reel_build.karaoke(spec, PROJ / "scenes")
    cues = json.loads((pub / "cues" / "mouth.json").read_text(encoding="utf-8"))["mouthCues"]
    props = {
        "durationInFrames": round((dur + 0.5) * FPS), "audio": "audio/narration.wav", "cues": cues, "captions": cap,
        "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words],
    }
    out = PROJ / "artifacts" / "props.json"
    out.write_text(json.dumps(props), encoding="utf-8")
    print(f"props: {props['durationInFrames']} khung ({dur:.1f} s), {len(cues)} cue, {len(cap['chunks'])} cụm karaoke -> {out}")


if __name__ == "__main__":
    main()
