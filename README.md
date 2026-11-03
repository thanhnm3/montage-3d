# openmontage-3d

Code + asset nhẹ để render các video 3D (Remotion + three.js) của các kênh Fossil Mysteries,
Why Why Why (ink-3D) và Caveman. Đây là bản chép riêng từ bản clone
[OpenMontage](https://github.com/calesthio/OpenMontage), giữ nguyên đường dẫn để chép đè lên đó.

## Có gì
- `remotion-composer/projects/fossil-3d-city-test/` — Short008–012 3D, Long006 3D, SeaAnimals, BlockAnimals...
- `remotion-composer/projects/www-ink3d-00{1,2,3}/` — Why Why Why ink-3D
- `remotion-composer/projects/caveman-{3d-rent,moneypile-3d,movieticket-3d}/`
- `projects/fossil-3d-assets/` — model CC0 (Quaternius...), `projects/*-3d/` — props.json, script, model nhỏ
- `tools/fossil_pipeline/FOSSIL_3D_SHORTS.md` — công thức
- `remotion-composer/package.json` — đã thêm `three`, `@react-three/fiber`, `@remotion/three`, `@remotion/sfx`

## Không có (phải tự tạo/lấy lại)
Video/âm thanh đã render, `narration.wav`, nhạc nền `.mp3`, `check/`, `renders/`, `node_modules/`.
Nhạc: `tts/assets/music/`. Giọng: tạo lại bằng pipeline TTS.

## Dùng trên cloud
```bash
git clone https://github.com/calesthio/OpenMontage.git
git clone <repo-này> openmontage-3d
cp -r openmontage-3d/remotion-composer openmontage-3d/projects openmontage-3d/tools OpenMontage/
cd OpenMontage/remotion-composer && npm install
```
Sau đó render theo `FOSSIL_3D_SHORTS.md` (dùng `--gl=angle` nếu có GPU/ANGLE).
