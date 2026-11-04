"""Props for the Caveman Economics Short "A home now costs 5 years of income" (comp HouseYears): Rhubarb cues, karaoke, whisper word times.

  PYTHONUTF8=1 tts/.venv python build.py   -> ../artifacts/props.json
Voice first: r03.py voice <proj> <ep> --chirp, then voice_post.py (x1.1 + whisper + Rhubarb) ->
public/audio/narration.wav, artifacts/whisper_words.json, public/cues/mouth.json.
No narrator on screen; the office worker card (ToonHost.tsx) has no lip sync, so mouth.json is only kept for later use.
The comp takes every shot time from props.words (anchor words, see ANCHORS in HouseYears.tsx), so a new take
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
# same list, same order as ANCHORS in remotion-composer/projects/caveman-houseyears-3d/HouseYears.tsx
ANCHORS = ["home", "costs", "income", "every", "earn", "not", "savings", "entire", "straight", "harvard", "tracks", "called", "ratio",
           "sat", "affordable", "bubble", "record", "crash", "dragged", "climbed", "after", "median", "dollars", "times", "tie", "bubble",
           "follow", "real", "life", "keep", "eyes", "house", "away"]


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
    plan = json.loads((PROJ / "artifacts" / "plan.json").read_text(encoding="utf-8"))
    words_file = PROJ / "artifacts" / "whisper_words.json"
    words = json.loads(words_file.read_text(encoding="utf-8"))
    check_anchors(words)
    spec = {"audioFrom": {"start": 0, "end": dur + 1}, "dialog": "dialog.txt",
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
