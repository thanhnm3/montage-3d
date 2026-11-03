"""Fossil Short 010 (3D-native size ladder): config for tools/fossil_pipeline/short_props.py.
No photo version: every beat is 3D, so PLATES only carry placeholder srcs (never rendered by Short010_3D).
See ../../../tts/episodes/fossil-mysteries/shorts/010/raw/source_script.txt.

  D:\youtube\tts\.venv\Scripts\python.exe build_props.py --chirp [--whisper]
"""
import sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJ.parents[1] / "tools" / "fossil_pipeline"))
from short_props import run  # noqa: E402

PLATES = {n: {"src": "media/3d.jpg", "tag": "3D ILLUSTRATION"} for n in range(1, 11)}
# field notes: (beat, regex for the anchor word, big, small, hold seconds) — sources only, sizes are shown by the 3D ruler
NOTES = [(4, "^about", "~6 m", "modern estimate · TV said 25 m", 2.2),
 (7, "^24", "up to 24 m", "Shimada et al. 2025 · classic 15-18 m", 2.4),
 (8, "^british", "Blue Anchor, UK", "found 2020 · Lomax et al. 2024", 2.6),
 (9, "^blue", "largest ever", "bigger than any dinosaur", 2.2)]
DISPLAY = {1: "Every giant sea monster, lined up by size. The biggest one is still alive.",
 2: "This is you. 1.8 meters.",
 3: "A great white shark. 6 meters, and it already feels huge.",
 4: "Liopleurodon. Old documentaries made it 25 meters. The real one? About 6.",
 5: "Mosasaurus. 12 meters, a sea lizard as long as a bus.",
 6: "Livyatan, a killer sperm whale. 17 meters, with teeth longer than your forearm.",
 7: "Megalodon. New estimates say up to 24 meters.",
 8: "Ichthyotitan, a giant ichthyosaur. Around 25 meters. Its jaw was found on a British beach by an 11 year old girl.",
 9: "But they all lose to an animal alive right now. The blue whale. 30 meters.",
 10: "Which one would you never swim with? Tell me below."}
_SPELL = {"metres": "meters", "metre": "meter"}

if __name__ == "__main__":
    run(PROJ, "010", PLATES, NOTES, DISPLAY, _SPELL, "YOUR PICK  ·  COMMENTS ↓", "Which one wouldn't you swim with?",
        hook_text="SEA MONSTERS BY SIZE")
