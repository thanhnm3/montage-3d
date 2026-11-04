---
name: whywhywhy-ink3d-short
description: Make a new Why Why Why ink-3D Short in this repo (montage-3d) the way episode 004 "Do we only use 10% of our brain?" was made — a ~30 s myth explainer, three.js inside Remotion, a 2D toon host card (drawn with toon.ts from the cartoon-3d-short skill) standing in 3D sets, ink pass + mood grade, karaoke captions, Chirp voice made on the user's PC. Use whenever the user asks for a new Why Why Why video/short/tập ("làm tập Why Why Why mới", "tạo video mới kênh why why why short", "giải thích 1 myth", "làm tập 005", "làm giống tập 004", "host 2D trong 3D"), or wants to change the host, a scene or the stills of an existing www-ink3d project.
---

# Why Why Why ink-3D Short (episode 004 recipe)

Reference build: **www-ink3d-004 "Do we only use 10% of our brain?"** (2026-11-03/04). Read its files before writing a
new episode; copy them, don't start from scratch:
- `projects/www-ink3d-004/` — README (script VI + EN, sources, render steps), `artifacts/r03_plan.json`,
  `scenes/r03_dialog.txt`, `scenes/build.py`, `scenes/voice_post.py`, `public/` (Kenney CC0 glb, tex), CREDITS.
- `remotion-composer/projects/www-ink3d-004/` — `BrainMyth.tsx` (the comp), `ToonHost.tsx` + `toon.ts` (host),
  `Ink.tsx` (ink + grade + DOF), `World.tsx`, `FreeWorld.tsx`, `HostTest.tsx`, `Root.tsx`, `index.tsx`.

The user reviews in Vietnamese and wants things clarified before work starts: ask the open questions first (topic,
scope) with AskUserQuestion, then do the work.

## 1. Topic + facts
- One simple, popular myth/question about the human body or everyday life, with a real mechanism under it.
  Offer 3-4 candidates (myth + the real answer) and let the user pick.
- Web search to verify every number/claim; hedge where sources vary ("about 20%", "almost every region").
  Put 2+ source links in the project README. Never invent a figure.

## 2. Script (5 beats, ~85-100 words, ~30 s after x1.1)
Format of 002/003/004: myth stated as fact → the principle/cost → why the myth can't be true → the real answer
(the twist, one white flash) → punchline + CTA "Follow Why Why Why for the why behind everything."
- Show the Vietnamese draft next to the English final in a table (README), English is what gets voiced.
- `artifacts/r03_plan.json` = {beats: [5 strings], keywords: [words highlighted yellow in the karaoke]}.
- `scenes/r03_dialog.txt` = the whole English text on one line.
- Numbers as digits ("10%"), contractions, short sentences.

## 3. Project files
Copy 004 to `projects/www-ink3d-00N/` and `remotion-composer/projects/www-ink3d-00N/`, rename the comp.
- `voice_post.py`: change the episode path (`D:/youtube/tts/episodes/why-why-why/ink3d/00N`).
- `build.py`: keep; update `ANCHORS` to match the new comp. It writes `artifacts/props.json` with
  `durationInFrames, audio, cues, captions, words` and warns if an anchor word is missing from the whisper transcript.
- Add the project to `fetch_assets.sh` (music only until a final voice exists) and to the root README list.

## 4. Timing: everything keys off anchor words
- In the comp: `ANCHORS` = ordered [name, word] list; `timesFrom(props.words)` matches each to the next occurrence
  after the previous one → `T.<name>` (start time, s). Avoid numbers as anchors (whisper may write "ten" or "10%").
- `T_EST` = fallback estimate so stills work before the voice exists. Generate it with a quick script:
  ~0.17 s + 0.045 s/letter per word, +0.35 s for a "%" word, +0.32 s after "." and +0.15 s after ",", then x0.78.
- Shots (`buildShots()`), host keys, overlays and region/prop states are all written as `T.x ± small offsets`.
  Every reaction lands 0-3 frames before its word.

## 5. The comp (see BrainMyth.tsx)
- 2 sets cut against each other (004: dark "stage" with the hero object + sunny Kenney "meadow" with the host).
  One shot per phrase, each shot shows the literal action of its line; vary shot size (wide / CU / low / high),
  snap zoom on the deadpan line, an orbit for "over a day"-type lines, crane up on the CTA.
- Shot = `{ t, set, a, b, k?, note, host?: V3 }`; camera lerps a→b; `host` = where the host stands on the stage in
  that shot (omit = no host there). Keep the host fully in frame (portrait frame is narrow: ~±0.8 m at 4 m); drop
  him from orbits (he balloons when the camera passes close).
- Mood grade per set/beat via `InkPass` params (cold / warm / night / flash). One white flash on the twist.
- Overlays in HTML: `Tag` + `Big` / `Stamp` (Anton font), diagram cards that draw on, karaoke at y 1660.
- Hero objects with no free model are built in code. 004 r03: a procedural 3D brain; **004 r04 (current): every animated
  prop is a 2D card drawn the toon.ts way** (`props2d.ts` drawers on `ToonCard.tsx`: cow, birds, rocks, leaf, stopwatch,
  24 h clock, scissors, a 2D brain with 12 Voronoi regions, toon.ts fx). Recipe per prop: blob contour -> flat fill +
  `shadedFill` crescent away from the light -> `inkRing` thick-thin outline; check them all on comp `PropsTest`.
  Only the world (Kenney meadow, stage floor) stays 3D. `soft` cards (glows, dust) are blended and get no ink marker.
- Story option (004 r04): open with the myth acted out for real (the fantasy, `dream` grade, `freeze` grade for
  "stop time" that keeps the host in colour), slap it with a giant stamp, explain, then call back to the fantasy.

## 6. The host = 2D toon card (ToonHost.tsx + toon.ts)
Look of the reference Short youtube.com/shorts/7xS87iActkU, built with `toon.ts` from
github.com/mromidev/claude-animated-shorts (MIT, header keeps the credit):
- Channel design: `HOST` outfit in ToonHost.tsx (black hair, mustard hoodie, no buttons, jeans, white sneakers).
  Never copy the reference channel's characters; only the construction style.
- `HOST_KEYS = [{ t, gesture?, expr?, look?, facing? }]`
  - gestures: idle, wave, point_up, present, shrug, arms_up, think, facepalm, hips (toon.ts `GESTURES`; add new ones
    there as [elbow, hand] per arm in (u outward, HH down) from the shoulder; `over: true` draws the hand on the face)
  - expr (toon.ts face library, 14): neutral (deadpan), stern, grin, laugh, whistle (o mouth), nervous, shock,
    relief, relief_open, dazed, pained, smile, smile_closed, lick
- Card behaviour: yaw-only billboard, alpha-tested, casts its shadow + contact blob, painted light side follows the
  sun (45° steps), blinks every 0.5-2.3 s (4 f), squash on each pose snap, no lip sync (the reference has none).
- `userData.noInk` on the card → Ink.tsx writes alpha 0 in the normal target and skips world ink there.
- Scale: 1 design unit = 0.00216 m, host 1.68 m, face at `HOST_HEAD_Y` (1.44 m) — aim CU cameras there.
- Check every gesture/face on one sheet with comp `HostTest` (frame 0 gestures, frame 1 faces).

## 7. Checking stills in a cloud session
YouTube and the user's TTS are not reachable from the cloud container; the voice is made on the user's PC.
```bash
cd remotion-composer && npm install        # once per container
bash ../tools/www_pipeline/cloud_stills.sh www-ink3d-00N <Comp> <out_dir> 0.6 2.6 4.6 ...   # seconds
```
It bundles a temp copy with a local Anton font, renders with the container's headless shell + `--gl=swangle`, and
writes `<out_dir>/sheet.png`. Look at the sheet, fix framing/timing, repeat. Save the final sheet as
`projects/www-ink3d-00N/artifacts/preview_sheet_est.jpg` and send it to the user.
`npx tsc` on a single entry: `npx tsc --noEmit --jsx react-jsx --strict --esModuleInterop --skipLibCheck --target ES2022
--lib ES2022,DOM --module ESNext --moduleResolution bundler projects/www-ink3d-00N/index.tsx` (the World.tsx
`flatShading` error is old and harmless).

## 8. On the user's PC (after the script is approved)
`r03.py voice <proj> <ep> --chirp` → `scenes/voice_post.py` (x1.1 tempo, whisper words, Rhubarb) → `scenes/build.py`
→ bundle with `--public-dir=../projects/www-ink3d-00N/public` → `npx remotion render <bundle> <Comp> out.mp4
--props=../projects/www-ink3d-00N/artifacts/props.json --gl=angle --crf=16`. Music cues / SFX are made after the
voice timing is locked (they depend on it).

## 9. Deliver
Commit + push to the session branch, send the preview sheet, and tell the user plainly what was verified (stills only
vs a full render) and what is left for their PC (voice, music/SFX cues, final render).
