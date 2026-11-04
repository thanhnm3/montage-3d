"""Fossil Short 013 (3D-native, toon/beast style): "Could a Human Survive 24 Hours in the Cretaceous?"
Config for tools/fossil_pipeline/short_props.py, same recipe as 011/012. Voice = chirp_voice.py (Charon) then the
usual atempo; script in SCRIPT.md (Vietnamese review draft + English final + sources).

  D:\\youtube\\tts\\.venv\\Scripts\\python.exe build_props.py --chirp [--whisper]

The comp (fossil-3d-city-test/Short013_3D.tsx) times every shot from the beat starts and the karaoke words in props.json
(anchor words, see ANCHORS there), so a new take only needs this script re-run.
"""
import sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJ.parents[1] / "tools" / "fossil_pipeline"))
from short_props import run  # noqa: E402

PLATES = {n: {"src": "media/3d.jpg", "tag": "3D ILLUSTRATION"} for n in range(1, 9)}
NOTES = [(1, "^66", "66 Ma", "Hell Creek, Montana · the last dinosaurs", 2.4),
 (3, "^23", "~23.5 h", "372 days a year · de Winter et al. 2020", 2.6),
 (4, "^mild", "~7–12 °C", "yearly average · Hell Creek leaf fossils", 1.6),
 (4, "^mosquitoes", "99 Ma", "oldest mosquito in amber · Borkent & Grimaldi 2004", 2.2),
 (6, "^hawk", "55°", "T. rex binocular field · Stevens 2006", 2.4),
 (7, "^acheroraptor", "Acheroraptor", "Hell Creek raptor · Evans et al. 2013", 2.4)]
DISPLAY = {1: "You fall out of the sky into Montana, 66 million years ago. Your mission: survive 24 hours.",
 2: "First breath. Good news: the air works. More carbon dioxide than today, but your lungs won't notice.",
 3: "Bad news: 24 hours isn't one day here. Earth spun faster, so a day lasted about 23 and a half hours.",
 4: "And it's no jungle. Hell Creek was wet and surprisingly mild. Mosquitoes had already been biting for 30 million years.",
 5: "You find a river. Something is drinking from it. Triceratops: 8 meters of horns, and it does not want company.",
 6: "Then the ground shakes. T. rex. And no, standing still won't save you. Its eyes faced forward, with depth vision wider than a hawk's.",
 7: "At night, the ground is no place to sleep. Acheroraptor hunted here, with a sickle claw on each foot.",
 8: "Climb a tree, stay quiet, and you might see sunrise. Just hope it's not the day the asteroid hits."}
_SPELL = {"metres": "meters", "metre": "meter"}

if __name__ == "__main__":
    run(PROJ, "013", PLATES, NOTES, DISPLAY, _SPELL, "YOUR PICK  ·  COMMENTS ↓", "Which era should we drop you in next?",
        hook_text="24 HOURS IN THE CRETACEOUS")
