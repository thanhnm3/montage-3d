"""Props for the ink-3D barn Short (comp Ink3DBarn): host pose library + face rig, Rhubarb cues, karaoke.

  PYTHONUTF8=1 tts/.venv python build.py   -> ../artifacts/props.json
Voice: r03.py voice <proj> <ep> --chirp (then x1.1, see README) -> public/audio/narration.wav,
artifacts/whisper_words_r03.json, scenes/r03_dialog.txt; mouth cues: rig/mouth_cues.py -> public/cues/mouth.json.
"""
from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent
POSE = Path("D:/youtube/openmontage/tools/whywhywhy_pipeline/pose")
sys.path.insert(0, str(POSE))
import reel_build  # noqa: E402
from reel_build import CAST, WHO, stage  # noqa: E402

FPS = 30
CAP_Y = 1190


def main():
    pub = PROJ / "public"
    with wave.open(str(pub / "audio" / "narration.wav")) as w:
        dur = w.getnframes() / w.getframerate()
    for f in (CAST / "poses").glob("*.png"):
        stage(f, pub / "characters" / "teen_poses" / f.name)
    import shutil
    for part in ("eyes", "brows", "mouth"):
        shutil.copytree(CAST / "rig" / WHO / part, pub / "characters" / "teen_face" / part, dirs_exist_ok=True)
    poses = json.loads((CAST / "poses" / "index.json").read_text(encoding="utf-8"))["poses"]
    rig = json.loads((CAST / "rig" / WHO / "index.json").read_text(encoding="utf-8"))
    plan = json.loads((PROJ / "artifacts" / "r03_plan.json").read_text(encoding="utf-8"))
    spec = {"audioFrom": {"start": 0, "end": dur + 1}, "dialog": "r03_dialog.txt",
            "captions": {"words": str(PROJ / "artifacts" / "whisper_words_r03.json"), "y": CAP_Y, "size": 96,
                         "maxWidth": 940, "keywords": plan["keywords"]}}
    cap = reel_build.karaoke(spec, PROJ / "scenes")
    cues = json.loads((pub / "cues" / "mouth.json").read_text(encoding="utf-8"))["mouthCues"]
    props = {
        "durationInFrames": round((dur + 0.5) * FPS), "audio": "audio/narration.wav", "cues": cues, "captions": cap,
        "poses": {"dir": "characters/teen_poses", "items": {n: {k: v[k] for k in ("w", "h", "ground", "face", "anchor")} for n, v in poses.items()}},
        "face": {"dir": "characters/teen_face", "pad": 6,
                 "sizes": {k: v for k, v in rig["sprites"].items() if k.split("/")[0] in ("eyes", "brows", "mouth")}},
    }
    out = PROJ / "artifacts" / "props.json"
    out.write_text(json.dumps(props), encoding="utf-8")
    print(f"props: {props['durationInFrames']} khung ({dur:.1f} s), {len(cues)} cue, {len(cap['chunks'])} cụm karaoke -> {out}")


if __name__ == "__main__":
    main()
