# Why Why Why — ink-3D 004 ("Do we only use 10% of our brain?") — myth explainer

Same look as 003 r02 (free CC0 world + the Quaternius 3D person with the canvas face, ink outline, mood grade).
Format: myth -> the cost (2% weight, 20% energy) -> why evolution would not allow it -> the scans -> punchline.
- Script/voice: artifacts/r03_plan.json -> `r03.py voice <proj> <ep> --chirp`, then scenes/voice_post.py (x1.1 + align)
- Props: scenes/build.py -> artifacts/props.json (adds `words`, the comp times every shot from them)
- Episode: tts/episodes/why-why-why/ink3d/004
- Remotion: remotion-composer/projects/www-ink3d-004 (comp `BrainMyth`)
- Models: public/free/CREDITS.md. The brain is procedural (no free model fits): sulci are grooves along the zero lines
  of a 3D noise, 12 regions light up / switch off with the narration.

## Kịch bản (bản duyệt tiếng Việt -> bản tiếng Anh cuối)

| # | Tiếng Việt (để duyệt) | English (final, đọc bằng Chirp) | Hình |
|---|---|---|---|
| 1 | Bạn chỉ dùng 10% bộ não. Phim ảnh rất mê ý tưởng đó. Còn não bạn thì không. | You only use 10% of your brain. Movies love that idea. Your brain doesn't. | Não khổng lồ, chỉ 1 mảng nhỏ sáng / thẻ phim "UNLOCK 100%!" / zoom mặt ngán ngẩm + dấu MYTH |
| 2 | Não chỉ nặng khoảng 2% cơ thể, nhưng đốt khoảng 20% năng lượng. | Your brain is just 2% of your body weight, but it burns about 20% of your energy. | Não tí hon lơ lửng trên đầu + thanh 2% / cả não rực sáng, tàn lửa bay + thanh 20% |
| 3 | Cơ thể không đời nào trả giá đắt vậy để tắt 90%. Tiến hóa đã cắt bỏ nó từ lâu rồi. | Your body would never pay that much to keep 90% switched off. Evolution would have cut it long ago. | Từng vùng tắt dần (90% OFF?) / cây kéo cắt, não teo lại |
| 4 | Ảnh chụp não cũng đồng ý. Không phải vùng nào cũng sáng cùng lúc, nhưng qua một ngày, gần như vùng nào cũng tới lượt. | Brain scans agree. Not every part lights up at once, but over a day, almost every region gets its turn. | Chớp trắng + khung BRAIN SCAN quét / từng vùng sáng lần lượt / đồng hồ 24 giờ, sáng dần hết -> 100% USED |
| 5 | Vậy bạn không chỉ dùng 10% não. Bạn dùng hết, chỉ là không cùng một lúc. Theo dõi Why Why Why để biết lý do đằng sau mọi thứ. | So you don't use 10% of your brain. You use all of it, just not all at once. Follow Why Why Why for the why behind everything. | Nhân vật nhún vai, MYTH BUSTED / não sáng nhấp nháy so le / vẫy tay, cẩu máy lên |

97 từ, khoảng 30 s sau x1.1 (tốc độ 003).

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
