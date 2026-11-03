# openmontage-3d

Code + asset nhẹ để render các video 3D (Remotion + three.js) của các kênh Fossil Mysteries,
Why Why Why (ink-3D) và Caveman. Đây là bản chép riêng từ bản clone
[OpenMontage](https://github.com/calesthio/OpenMontage), giữ nguyên đường dẫn để chép đè lên đó.

## Có gì
- `remotion-composer/projects/fossil-3d-city-test/` — Short008–012 3D, Long006 3D, SeaAnimals, BlockAnimals...
- `remotion-composer/projects/www-ink3d-00{1,2,3,4}/` — Why Why Why ink-3D (004: myth "chỉ dùng 10% não", chưa có giọng)
- `remotion-composer/projects/caveman-{3d-rent,moneypile-3d,movieticket-3d}/`
- `projects/fossil-3d-assets/` — model CC0 (Quaternius...), `projects/*-3d/` — props.json, script, model nhỏ
- `tools/fossil_pipeline/FOSSIL_3D_SHORTS.md` — công thức
- `remotion-composer/package.json` — đã thêm `three`, `@react-three/fiber`, `@remotion/three`, `@remotion/sfx`

## Không có
Video đã render, `check/`, `renders/`, `node_modules/`. Nhạc nền và giọng đọc các tập đã làm nằm ở `shared_assets/` (xem dưới).

## Dùng trên cloud
```bash
git clone https://github.com/calesthio/OpenMontage.git
git clone <repo-này> openmontage-3d
cp -r openmontage-3d/remotion-composer openmontage-3d/projects openmontage-3d/tools OpenMontage/
cd OpenMontage/remotion-composer && npm install
```
Sau đó render theo `FOSSIL_3D_SHORTS.md` (dùng `--gl=angle` nếu có GPU/ANGLE).

## Hướng dẫn cho Claude cloud (đọc phần này đầu tiên)
Repo này **public**, tải không cần đăng nhập:
```bash
git clone https://github.com/thanhnm3/montage-3d.git
git clone https://github.com/calesthio/OpenMontage.git
cp -r montage-3d/remotion-composer montage-3d/projects montage-3d/tools OpenMontage/
cd OpenMontage && bash ../montage-3d/fetch_assets.sh ../montage-3d   # đặt nhạc + narration vào public/ từng project
cd remotion-composer && npm install
```
Tải từng file lẻ khi không muốn clone: `https://raw.githubusercontent.com/thanhnm3/montage-3d/main/<đường-dẫn>`.

`shared_assets/` gồm:
- `music/fossil_mysteries.mp3` (Fossil), `music/{hook_curious_bounce,body_light_steady,twist_suspense_break}.mp3` (Why Why Why).
- `narration/<tên-project>.wav` — giọng đọc đã chốt của Short008–012 (Fossil) và www-ink3d-001/002/003.

Model 3D: `projects/fossil-3d-assets/`, `projects/*/public/free/`. Công thức render: `tools/fossil_pipeline/FOSSIL_3D_SHORTS.md`.
Tập mới thì cần tạo giọng đọc riêng (không có trong repo).
