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
- Biến thể "beast" v3 (`beastAnimals.ts`, comp `FossilToonSceneBeast`), giữ biểu cảm toon nhưng gần thật hơn và đáng sợ hơn:
  - Giải phẫu: T. rex thân ngang, sọ sâu có gờ mày, chân đi bằng ngón 3 khúc với 3 móng; Triceratops thân nặng,
    sừng mày dài, diềm cổ viền gai dài, móng guốc; voi ma mút bướu vai, lưng dốc, lông dài rủ thành sợi, ngà xoắn.
  - Bề mặt: đổ bóng 3 tông (tối / trung gian / sáng) cộng viền sáng, vảy sần, nếp da, hàng vảy xương dọc lưng,
    sẹo, sừng nứt.
  - Mặt: hốc mắt tối sâu, tròng đỏ cam phát sáng, con ngươi dọc; răng dài lởm chởm, nước dãi khi gầm.
  - Cảnh: hoàng hôn u ám (khói đỏ, mặt trời thấp, trời có sao, viền đỏ khi gầm).
- Tấm kiểm tra 2D: comp `AnimalSheet` (hiện đang để bản beast: đứng và gầm/hoảng) (mỗi con: bản tròn, rồi bản hầm hố khi đứng, đi và gầm/hoảng).
- Ảnh xem trước: `preview_animals.jpg` (bản tròn và bản hầm hố cạnh nhau), `preview_scene.jpg` (bản tròn), `preview_scene_fierce.jpg` (bản hầm hố), `preview_animals_beast.jpg` và `preview_scene_beast.jpg` (bản v3).
- Xem ảnh tĩnh trên cloud: `bash tools/www_pipeline/cloud_stills.sh fossil-toon-test FossilToonScene <out> 0.3 2.5 ...`

Nhận xét:
- Hợp với hook, so sánh kích thước, đối đầu và các đoạn gag.
- Khác hẳn phong cách khối vuông đã duyệt của kênh (FOSSIL_3D_SHORTS.md).
- Khi camera quay vòng quanh con vật, tấm hình 2D lộ ra là hình phẳng: nên quay ngang hoặc cắt cảnh, không orbit sát.
- Lá cây thông Kenney còn màu xanh ngọc, cần đổi màu theo tên vật liệu nếu làm thật.

## r4 (2026-11-04): more animals + "you"
- `beastAnimals.ts` also has Megalodon (`meg`, 15 m, swimming, gape), Titanoboa (`boa`, 13 m, rearing, strike + forked
  tongue) and Acheroraptor (`raptor`, 3 m, feathered, sickle claw held up). Megalodon and Titanoboa are not from the
  Cretaceous: keep them for other eras.
- `youToon.ts`: "you", an everyday person drawn with toon.ts (all its expressions) plus a heavy near-black silhouette
  outline to sit with the beast animals.
- Used in Fossil Short 013 (`projects/fossil-mysteries-short-013-3d`).

## r5 (2026-11-04): 12 more beast animals (`beastMore.ts`)
User: "làm bản hầm hố, làm list các con vật, bản hầm hố nhất". Same beast look (3-tone cel, scales, scutes, scars, deep
glowing eyes, uneven teeth). Each has `walk`/`phase` and a `roar` = its attack move. Sheet: comp `BeastMoreSheet`
(walk | attack), `preview_beast_more.jpg`. `BeastSolo` draws one animal alone (used to measure x0/x1).

| key | animal | real size | `roar` does |
|---|---|---|---|
| steg | Stegosaurus (Jurassic) | 9 m | tail swing up with the 4 spikes |
| ankylo | Ankylosaurus (Hell Creek) | 7 m | tail club swing |
| sauro | sauropod, Brachiosaurus-like (Jurassic) | 22 m | head up, bellow |
| edmonto | Edmontosaurus (Hell Creek), healed T. rex bite on the tail | 12 m | head up, bellow |
| pachy | Pachycephalosaurus (Hell Creek) | 4.5 m | head-down ram |
| spino | Spinosaurus (mid Cretaceous) | 14 m | bite |
| quetz | Quetzalcoatlus (Hell Creek age), standing | ~5 m tall | beak gape, head thrust |
| mosa | Mosasaurus (Late Cretaceous sea) | 13 m | bite, palate teeth show |
| dunkle | Dunkleosteus (Devonian) | 3.5 m | bone-blade bite |
| smilo | Smilodon populator (Ice Age) | ~2 m + tail | ~80° sabre gape |
| rhino | woolly rhino (Ice Age) | 3.6 m | head-down charge |
| bear | cave bear (Ice Age) | 3 m | roar |

`BEAST_ALL` = the 6 of `beastAnimals.ts` + these 12 (same `{ draw, len, x0, x1 }` entries, so `BeastCard` in
Short013_3D.tsx can take any of them). Not from Hell Creek: steg, sauro, spino, mosa (sea), dunkle, smilo, rhino, bear.
