# Fossil Short 013 — "Could a Human Survive 24 Hours in the Cretaceous?" (3D, toon/beast style)

First Fossil Short in the toon look tested in `projects/fossil-toon-test`: 2D cards in a 3D Hell Creek map, beast-style
animals and "you" (an everyday person). Script, sources and shot plan: `SCRIPT.md`.

- Comp: `remotion-composer/projects/fossil-3d-city-test/Short013_3D.tsx` (id `Short013-3D`, registered in that Root).
  - Drawings: `../fossil-toon-test/beastAnimals.ts` (rex, trike, raptor), `youToon.ts` (you), `toon.ts` (MIT, cartoon-3d-short).
  - Story beats, shots and the "you" timeline are keyed to anchor words (`ANCHORS`) read from `props.karaoke`.
    Without props the comp runs on the estimate in `short013_est.ts` (~56 s), so stills work before the voice.
  - Survival clock (top right): runs from the landing to 23:30; on "half" the "24:00" target is struck and becomes 23:30.
  - Channel overlays from `short008Overlays.tsx`: captions, field notes, hook headline, end card, grain, wordmark.
- Props: `build_props.py` (same `short_props.run` as 011/012): beat texts, field notes, hook, end card.
- Public: `public/brand` (grain), `public/free/glb` (Kenney CC0 flora, the same set as 011), `public/tex`.
- Preview at the estimated timing: `preview_sheet_est.jpg`.

## On the PC
```bash
D:\youtube\tts\.venv\Scripts\python.exe build_props.py --chirp --whisper
cd remotion-composer
npx remotion bundle projects/fossil-3d-city-test/index.tsx --out-dir=$B --public-dir=../projects/fossil-mysteries-short-013-3d/public
npx remotion render $B Short013-3D video_noaudio.mp4 --props=../projects/fossil-mysteries-short-013-3d/props.json --gl=angle --crf=16 --muted
```
Then sfx013.py (copy sfx012.py: whoosh on the fall, heavy thud on the landing, wind, rain, mosquito buzz, footstep thuds,
roar, night crickets, a rising rumble on the asteroid) and mux as in FOSSIL_3D_SHORTS.md section 6.

## Cloud stills
```bash
PUBLIC=fossil-mysteries-short-013-3d bash tools/www_pipeline/cloud_stills.sh fossil-3d-city-test Short013-3D <out> 1.0 5.0 14.5 ...
```

## Known gaps (first pass)
- The racing sun in the time-lapse beat is not in frame yet. The beat reads through the clock and the shadows.
- No thumbnail comp yet (Thumb013) and no SFX script.
- Megalodon and Titanoboa are drawn (`beastAnimals.ts`) but are not in this episode: they are from other eras.
