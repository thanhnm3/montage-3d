# Why Why Why — ink-3D 003 ("Why do we get goosebumps?") — myth explainer

Same look as 002 (free CC0/CC-BY world + pose-library host with ink outline). First Short built with the lessons from
the "trapped samurai" reference (2026-11-03): every shot shows the literal action of its line, shot sizes vary
(wide / macro / low), the grade follows the mood (cold blue, fear red-dark, warm payoff), diagrams draw themselves on,
one white flash on the twist.
- Script/voice: artifacts/r03_plan.json -> `r03.py voice <proj> <ep> --chirp`, then scenes/voice_post.py (x1.1 + align)
- Episode: tts/episodes/why-why-why/ink3d/003
- Remotion: remotion-composer/projects/www-ink3d-003 (comp `Goosebumps`)
- Models: see public/free/CREDITS.md

## r02 (2026-11-04): free 3D person instead of the 2D host
- Quaternius "Casual Character" (CC0, glb/man.glb), teal tee. Remotion `Person.tsx`: model clips (Idle/HitRecieve/Wave) +
  procedural arm/head poses aimed in character space (hug, selfCheck, lookArm, armsDown, scared, puff, shrug, pointUp, facepalm)
  + a canvas face (eyes/brows/mouth, Rhubarb lip sync, blinks, chattering, cold red nose/cheeks) projected onto the head skin in
  the shader + goosebumps/hairs on the right forearm. Keys: PERSON_KEYS in Goosebumps.tsx. Stills harness: comp `PersonTest`.
- r01 comp kept as Goosebumps_r01.tsx.bak. Output tts/episodes/why-why-why/ink3d/003/www_ink3d_goosebumps_r02_person.mp4
