"""x1.1 tempo on the Chirp take (same pace as Why Why Why 004), then re-align words + Rhubarb mouth cues.

  PYTHONUTF8=1 tts/.venv python voice_post.py
"""
import json
import subprocess
import sys
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent
EP = Path("D:/youtube/tts/episodes/caveman-economics/shorts/2026-11-04-rich-house")
TOOLS = Path("D:/youtube/openmontage/tools/whywhywhy_pipeline")
sys.path.insert(0, str(TOOLS / "pose"))
import short_kit  # noqa: E402
import imageio_ffmpeg  # noqa: E402

src = EP / "episode_audio_r03.wav"
fast = EP / "episode_audio_r03_x110.wav"
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-i", str(src), "-af", "atempo=1.1", str(fast)], check=True)
nar = PROJ / "public" / "audio" / "narration.wav"
nar.write_bytes(fast.read_bytes())
words = short_kit.whisper_words(nar, PROJ / "artifacts" / "whisper_words.json")
subprocess.run([sys.executable, str(TOOLS / "rig" / "mouth_cues.py"), str(nar), str(PROJ / "public" / "cues" / "mouth.json"),
                "--text", str(PROJ / "scenes" / "dialog.txt")], check=True)
print(len(words), "words")
print(" ".join(f"{w['word'].strip()}@{w['start']:.2f}" for w in words))
