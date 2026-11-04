# Fossil Mysteries — thử phong cách cartoon (2026-11-04)

Câu hỏi: skill cartoon-3d-short (nhân vật 2D toon trong thế giới 3D) có dùng cho kênh Fossil Mysteries được không?
Thử với 3 con: T. rex, Triceratops, voi ma mút.

- Hình vẽ: `remotion-composer/projects/fossil-toon-test/toonAnimals.ts`, vẽ bằng `Pen` của `toon.ts`
  (github.com/mromidev/claude-animated-shorts, MIT). Gồm mảng tối vẽ tay quay ngược hướng sáng, viền mực tím dày–mỏng,
  mắt chấm có mi. Mỗi con có thể đi bộ (`walk` + `phase`), đổi biểu cảm (neutral / angry / shock / happy / sleepy)
  và chớp mắt; T. rex há miệng gầm được (`roar`).
- Trong 3D: `FossilToonScene.tsx` (comp `FossilToonScene`, 9 s).
  - Thú là tấm billboard chỉ xoay theo trục đứng, có kích thước thật (T. rex 12,3 m, Triceratops 8,5 m, voi ma mút 5,6 m).
  - Đổ bóng thật xuống nền, không bị nét mực của thế giới vẽ đè (`noInk`).
  - Tự lật mặt khi hướng đi chỉ sang trái màn hình, mặt sáng tối đổi theo hướng mặt trời.
  - Cây và đá dùng Kenney CC0; nét mực, màu và độ nhòe hậu cảnh lấy từ tập Why Why Why 004.
- Biến thể "hầm hố" (`fierceAnimals.ts`, comp `FossilToonSceneFierce`):
  - Dáng góc cạnh: sọ hình khối, mỏ quặp, gai và vảy sừng dọc lưng, lông voi ma mút dạng răng cưa.
  - Đổ bóng cắt khối gắt thay cho chuyển màu mềm; viền gần như đen, dày hơn, chênh dày–mỏng mạnh hơn.
  - Mắt hẹp tròng vàng con ngươi dọc dưới gờ lông mày, răng dài lởm chởm, móng vuốt, sẹo, màu tối và trầm hơn.
  - Cùng tư thế, biểu cảm, kích thước thật và cách đặt vào 3D như bản tròn.
- Tấm kiểm tra 2D: comp `AnimalSheet` (mỗi con: bản tròn, rồi bản hầm hố khi đứng, đi và gầm/hoảng).
- Ảnh xem trước: `preview_animals.jpg` (bản tròn và bản hầm hố cạnh nhau), `preview_scene.jpg` (bản tròn), `preview_scene_fierce.jpg` (bản hầm hố).
- Xem ảnh tĩnh trên cloud: `bash tools/www_pipeline/cloud_stills.sh fossil-toon-test FossilToonScene <out> 0.3 2.5 ...`

Nhận xét:
- Hợp với hook, so sánh kích thước, đối đầu và các đoạn gag.
- Khác hẳn phong cách khối vuông đã duyệt của kênh (FOSSIL_3D_SHORTS.md).
- Khi camera quay vòng quanh con vật, tấm hình 2D lộ ra là hình phẳng: nên quay ngang hoặc cắt cảnh, không orbit sát.
- Lá cây thông Kenney còn màu xanh ngọc, cần đổi màu theo tên vật liệu nếu làm thật.
