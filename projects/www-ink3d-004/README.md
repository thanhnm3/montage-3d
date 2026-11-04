# Why Why Why — ink-3D 004 ("Do we only use 10% of our brain?") — myth explainer

Same world look as 003 (free CC0 world, ink outline, mood grade). Host since r03 (2026-11-04): a flat 2D card drawn with
`toon.ts` from the cartoon-3d-short skill (github.com/mromidev/claude-animated-shorts, MIT), standing in the 3D sets
like the reference Short youtube.com/shorts/7xS87iActkU (analysed frame by frame: 2D billboard characters, swappable
eye/brow/mouth parts on a static head, no lip sync, pose snaps, real ground shadows).
Format r04 (2026-11-04): fantasy first, then reality slaps -> the cost (2% weight, 20% energy) -> why evolution would not
allow it -> the scans -> callback to the fantasy (no flying, no mind powers) + CTA.
- Script/voice: artifacts/r03_plan.json -> `r03.py voice <proj> <ep> --chirp`, then scenes/voice_post.py (x1.1 + align)
  (`r03` is the pipeline tool name; the file now holds the r04 script)
- Props: scenes/build.py -> artifacts/props.json (adds `words`, the comp times every shot from them; ANCHORS = r04)
- Episode: tts/episodes/why-why-why/ink3d/004
- Remotion: remotion-composer/projects/www-ink3d-004 (comp `BrainMyth`; r03 kept as BrainMyth_r03.tsx.bak)
- Host: ToonHost.tsx (card, contact blob, blinks, squash on pose snaps, light side follows the sun) + toon.ts
  (gestures added: point_up, present, shrug, arms_up, think, facepalm, hips). r04 adds lift (flying/jumping), roll
  (lying on the ground), glowing eyes, the stamp squash and toon.ts "fall" mode. Keys: HOST_KEYS in BrainMyth.tsx.
  Stills: comp `HostTest` (frame 0 gestures, frame 1 faces).
- r04: EVERY animated prop is a 2D card drawn the toon.ts way (props2d.ts on ToonCard.tsx): cow, birds, rocks, leaf,
  stopwatch, 24 h clock, scissors, the big brain and the mini brain (2D side view, 12 Voronoi regions that light up /
  switch off), plus toon.ts fx (burst, stars, dust, cloud). Stills of all of them: comp `PropsTest`.
  Ink.tsx: new `dream` grade (the fantasy) and `freeze` grade (time stopped: everything grey except the host card).
- Models: public/free/CREDITS.md (Kenney meadow only; everything else is drawn in code).

## Kịch bản r04 (bản duyệt tiếng Việt -> bản tiếng Anh cuối)

| # | Tiếng Việt (để duyệt) | English (final, đọc bằng Chirp) | Hình |
|---|---|---|---|
| 1 | Mở khóa 100% bộ não là bạn bay được. Dùng ý nghĩ di chuyển đồ vật. Thậm chí dừng thời gian. | Unlock 100% of your brain, and you could fly. Move things with your mind. Even stop time. | Thanh UNLOCKING 10%->100%, não tí hon sáng dần, nổ sáng, mắt phát sáng / bay vút lên, chim, mây (FLY!) / bò + đá bay lên có vòng sáng (TELEKINESIS) / búng tay, đồng hồ bấm giờ, cả thế giới xám lại đứng im, riêng host còn màu (100% UNLOCKED) |
| 2 | Chỉ có một vấn đề. Bạn vốn đã dùng hết rồi. | There's just one problem. You're already using all of it. | Màu bật lại, cận mặt host cười gượng / con dấu WRONG! đập vào mặt, host rơi bịch nằm ngửa, bụi, sao quay; bò rơi cạnh rồi nhai cỏ (ALREADY 100%) |
| 3 | Não chỉ nặng khoảng 2% cơ thể, nhưng đốt khoảng 20% năng lượng. | Your brain is only 2% of your body weight, but it burns about 20% of your energy. | Host đứng dậy, não tí hon trên đầu + thanh 2% / não lớn 2D rực sáng, tàn lửa + thanh 20% |
| 4 | Cơ thể không đời nào trả giá đắt vậy để tắt 90%. Tiến hóa đã cắt bỏ nó từ lâu rồi. | Your body would never pay that much to keep 90% switched off. Evolution would have cut it long ago. | Từng vùng tắt dần (90% OFF?) / kéo 2D cắt ngang, não teo lại (CUT IT!) |
| 5 | Ảnh chụp não cũng đồng ý. Không phải vùng nào cũng sáng cùng lúc, nhưng qua một ngày, gần như vùng nào cũng tới lượt. | Brain scans agree. Not every part lights up at once, but over a day, almost every region gets its turn. | Chớp trắng + khung BRAIN SCAN quét / từng vùng sáng lần lượt / đồng hồ 24 giờ 2D, sáng dần hết -> 100% USED |
| 6 | Vậy là không bay được. Không có siêu năng lực. Chỉ là một bộ não, làm việc cả ngày. Theo dõi Why Why Why để biết lý do đằng sau mọi thứ. | So no flying. No mind powers. Just one brain, working all day. Follow Why Why Why for the why behind everything. | Host nhảy vỗ tay rồi ngã sấp mặt (NO FLYING) / chĩa tay vào bò, bò chỉ chớp mắt nhai tiếp (NO MIND POWERS) / não tí hon sáng hết nhấp nháy (ALL OF IT. ALL DAY.) / vẫy tay, bò giơ móng vẫy, cẩu máy lên |

104 từ (đếm cả "Why Why Why"), ước lượng ~33,6 s sau x1.1 (T_EST trong BrainMyth.tsx; bản r03 97 từ ước lượng 30,4 s).
Bản r03 (mở đầu "You only use 10% of your brain. Movies love that idea...", 97 từ) nằm trong lịch sử git.

## Nguồn kiểm chứng
- Não khoảng 2% khối lượng cơ thể, dùng khoảng 20% năng lượng/oxy lúc nghỉ; chụp não trong một ngày cho thấy gần như mọi vùng
  đều hoạt động, chỉ không cùng lúc; tổn thương gần như bất kỳ vùng nào cũng gây suy giảm chức năng:
  - https://en.wikipedia.org/wiki/Ten-percent-of-the-brain_myth
  - https://www.medicalnewstoday.com/articles/321060.php
  - https://earthsky.org/human-world/is-it-true-we-use-only-10-percent-of-our-brains/
- Lời thoại cố ý nói "about 20%" và "almost every region" vì số liệu năng lượng dao động theo nguồn và ảnh chụp não là ảnh so sánh.

## Render (máy local, sau khi có giọng)
```bash
python scenes/voice_post.py && python scenes/build.py
cd remotion-composer
npx remotion bundle projects/www-ink3d-004/index.tsx --out-dir=$B --public-dir=../projects/www-ink3d-004/public
npx remotion render $B BrainMyth out.mp4 --props=../projects/www-ink3d-004/artifacts/props.json --gl=angle --crf=16
```
Chưa có props.json thì comp vẫn chạy với thời gian ước lượng (T_EST trong BrainMyth.tsx) để xem ảnh tĩnh trước.
Nhạc: dùng lại 3 bài của kênh (fetch_assets.sh chép vào public/music); music_cues/sfx_cues chưa làm vì phụ thuộc thời gian giọng thật.
