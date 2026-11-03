"""Fossil Short 011 (3D-native, one continuous camera take): config for tools/fossil_pipeline/short_props.py.
Voice = chirp_voice.py then atempo 1.12 (result.json durations rescaled, tempo=1.12).
See ../../../tts/episodes/fossil-mysteries/shorts/011/raw/source_script.txt.

  D:\youtube\tts\.venv\Scripts\python.exe build_props.py --chirp [--whisper]
"""
import sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJ.parents[1] / "tools" / "fossil_pipeline"))
from short_props import run  # noqa: E402

PLATES = {n: {"src": "media/3d.jpg", "tag": "3D ILLUSTRATION"} for n in range(1, 9)}
NOTES = [(2, "^strongest", "3,700 psi", "highest bite force ever measured · Erickson 2012", 2.4),
 (4, "^bigger", "~7.7 m", "2025 estimate · older books said 12 m", 2.4),
 (4, "^bite", "bite marks", "on duck-billed dinosaur tail bones", 2.0),
 (7, "^months", "months", "without food · low-energy cold blood", 2.2)]
DISPLAY = {1: "Drop the biggest crocodile alive into the age of dinosaurs. Does it survive?",
 2: "6 meters. A ton of armor. The strongest bite ever measured.",
 3: "75 million years ago, this river looks easy. Until the water moves.",
 4: "Deinosuchus. Bigger, heavier, and dinosaur bones from this time carry its bite marks.",
 5: "So our croc is the snack, right? Not so fast.",
 6: "66 million years ago, the asteroid hit. T. rex, gone. Every giant on land, gone.",
 7: "But down in the rivers, crocodiles waited. Cold blood, tiny appetites, months without a meal.",
 8: "So could a crocodile survive the dinosaur era? It already did. Which animal should we drop in next?"}
_SPELL = {"metres": "meters", "metre": "meter", "armour": "armor"}

if __name__ == "__main__":
    run(PROJ, "011", PLATES, NOTES, DISPLAY, _SPELL, "YOUR PICK  ·  COMMENTS ↓", "Which animal should we drop in next?",
        hook_text="CROC VS DINOSAUR ERA")
