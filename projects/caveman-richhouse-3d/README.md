# Caveman Economics Short: "5 Things Missing From A Rich Man's House" (ink-3D + THE GUIDE toon host)

Branch work 2026-11-04. Same build as Why Why Why 004 (three.js in Remotion, ink pass + mood grade, karaoke), but the
host is **THE GUIDE**, the Caveman Economics host, drawn with `toon.ts` (2D card standing in the 3D world).
Comp: `remotion-composer/projects/caveman-richhouse-3d/RichHouse.tsx` (`RichHouse`), host sheet: `HostTest`.

## Script (user's, voiced as is, 120 words, ~42 s estimated before x1.1)
| Beat | Line |
|---|---|
| HOOK | Five things missing from a rich man's house. None of them are money. |
| SETUP | Your house is full. Theirs is empty. Same species. Different wiring. |
| #5 | Number five. No TV. The wall is the art. |
| #4 | No clutter on the counters. Your kitchen is a storage unit. For a famine that never came. |
| #3 | The fridge is empty. Scarcity hoards. Abundance doesn't have to. |
| #2 | No visible logos. A logo tells other people. They don't need to tell. |
| #1 | Nobody's home. It isn't a house. It's where the money sits. |
| FLIP | You spent years filling a room. They sell it in an afternoon. Same room. |
| CLOSE | In my cave, nothing. And nothing cost me nothing. Which room in your house is a museum of fear? Pick yours below. |

No figures to verify ("years / an afternoon" is rhetoric, not data).

## Visual format (user's brief → how it's built)
- Two code-built dioramas on dark plinths in a black void: FULL room (amber/orange, dark, crammed: TV, shelves,
  sofa, cluttered counter, stuffed fridge, boxes, generic logo badges, no real brands) and EMPTY room (ivory + black,
  one black chair, empty counter, flush fridge, tall window).
- Opening = split screen (two half-width canvases), no text; captions start at beat 2.
- Countdown 5 → 1: big static number top-left (Anton). Each step cuts across rooms; the empty room shows a **dashed
  outline** where the missing thing would be (TV on the wall, clutter on the counter, food in the fridge, logos on the
  chair/wall, a seated person in the chair, ochre). #4 = low dutch angle, #2 = snap zoom (pattern interrupts).
- #1 "where the money sits": the empty room's plinth turns gold.
- Flip: both rooms in one frame, pulling back to two small boxes in the void; the full room empties and refills item
  by item on "spent years filling"; the empty room hops on "sell it"; both plinths flare on "same room".
- Close: split again, full room goes dark, empty room lit, THE GUIDE in it. "MUSEUM OF FEAR." + the 5 steps as a list.
- THE GUIDE (toon.ts, new outfit options): wild black hair, thick black beard, red ochre stripe on the forehead,
  necklace of three teeth, grey wolf-fur over one shoulder, hide tunic. New gesture `cross` (arms crossed).
  He is in the empty room from beat 2 and absent on "Nobody's home".

Preview (estimated timing, no voice): `artifacts/preview_sheet_est.jpg`.

## Publish (from the user's brief)
Description:
> Five things a rich man's house doesn't have. None of them are money.
> Your kitchen is a storage unit for a famine that never came. Your logos tell other people who you are. Their house
> tells nobody anything, and that's the point.
> This is scarcity wiring: the brain you inherited hoards because winter used to kill. Abundance doesn't have to.
> Which room in your house is a museum of fear? Tell me below.
> #behavioraleconomics #consumerpsychology #quietluxury #evolutionarypsychology #minimalism

Tags: caveman economics, behavioral economics, consumer psychology, quiet luxury, scarcity mindset, evolutionary
psychology, why rich people are minimalist, minimalism psychology, status symbols, why people buy things, psychology
of money, rich habits, abundance mindset, why you hoard things, evolutionary mismatch

## On the PC
1. Voice (Chirp) from `scenes/dialog.txt` into `D:/youtube/tts/episodes/caveman-economics/shorts/2026-11-04-rich-house`
   (`voice_post.py` expects `episode_audio_r03.wav` there; rename or edit the path if your voice tool names it otherwise).
2. `scenes/voice_post.py` (x1.1, whisper words, Rhubarb) → `scenes/build.py` → `artifacts/props.json`
   (warns if an anchor word is missing; anchors are listed in `ANCHORS` in both build.py and RichHouse.tsx).
3. Bundle with `--public-dir=../projects/caveman-richhouse-3d/public`, then
   `npx remotion render <bundle> RichHouse out.mp4 --props=../projects/caveman-richhouse-3d/artifacts/props.json --gl=angle --crf=16`.
4. Music: none in the repo for this channel yet (YouTube Audio Library, under the voice).

Cloud stills: `bash tools/www_pipeline/cloud_stills.sh caveman-richhouse-3d RichHouse <out> 1.0 6.2 9.3 ...`
