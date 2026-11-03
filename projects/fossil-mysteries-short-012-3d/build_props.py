"""Fossil Short 012 (3D-native, one continuous camera take): "Could Titanoboa Survive the Dinosaur Era?"
Config for tools/fossil_pipeline/short_props.py. Voice = chirp_voice.py at normal speed (user kept 60 s, 2026-11-03).
See ../../../tts/episodes/fossil-mysteries/shorts/012/raw/source_script.txt.

  D:\youtube\tts\.venv\Scripts\python.exe build_props.py --chirp [--whisper]
"""
import sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJ.parents[1] / "tools" / "fossil_pipeline"))
from short_props import run  # noqa: E402

PLATES = {n: {"src": "media/3d.jpg", "tag": "3D ILLUSTRATION"} for n in range(1, 9)}
NOTES = [(2, "^ton", "~1,135 kg", "estimate from vertebrae · Head et al. 2009", 2.4),
 (4, "^india", "Sanajeh", "67 million years ago · Wilson et al. 2010", 2.6),
 (6, "^10", "~7–12 °C", "Hell Creek leaf-fossil estimates", 2.4),
 (8, "^months", "survivors", "every living snake descends from a few · Klein 2021", 2.6)]
DISPLAY = {1: "The biggest snake that ever lived missed the dinosaurs by 6 million years. So let's send it back.",
 2: "13 meters. Over a ton. As long as a T. rex.",
 3: "66 million years ago, T. rex's river. Plenty of fish. Plenty of baby dinosaurs.",
 4: "And snakes really did eat dinosaurs. In India, one was found coiled around a dinosaur nest, right next to a hatchling.",
 5: "So our snake rules the river, right? Not so fast.",
 6: "Titanoboa grew this big in a jungle around 30 degrees, all year. This river? Closer to 10. A cold snake is a slow snake.",
 7: "Slow, on the bank, next to an 8 ton T. rex. Then the asteroid hit. Every giant on land, gone.",
 8: "The snakes that made it hid underground and went months without food. Titanoboa grew from them. So could it survive the dinosaur era? No. It had to wait for them to disappear. Which animal should we drop in next?"}
_SPELL = {"metres": "meters", "metre": "meter"}

if __name__ == "__main__":
    run(PROJ, "012", PLATES, NOTES, DISPLAY, _SPELL, "YOUR PICK  ·  COMMENTS ↓", "Which animal should we drop in next?",
        hook_text="TITANOBOA VS DINOSAUR ERA")
