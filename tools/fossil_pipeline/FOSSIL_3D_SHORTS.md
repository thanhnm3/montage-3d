# Fossil Mysteries — Shorts 3D khối vuông (công thức, chốt 2026-10-30)

Bản mẫu đã duyệt: **Short 009 3D r02** ("đẹp").
- Video: `tts/episodes/fossil-mysteries/shorts/009/fossil_short009_3d_r02.mp4`
- Code: `remotion-composer/projects/fossil-3d-city-test/Short009_3D.tsx`

Tập 3D sau làm theo file này. Mức chất lượng tối thiểu là r02, không phải r01.

## 0. Quy trình tóm tắt

1. **Làm xong bản ảnh thật trước** theo `FOSSIL_FORMAT.md` (script, giọng Chirp3-HD Charon, phụ đề, field note, end card, `props.json`). Bản 3D chỉ thay phần hình; giọng, phụ đề, chữ và nhịp giữ nguyên.
2. **Tạo thư mục dự án 3D:** `openmontage/projects/fossil-mysteries-short-00N-3d/`.
   - Chép `props.json` từ `projects/fossil-mysteries-short-00N/artifacts/props.json`.
   - Thư mục `public/` chứa `audio/narration.wav`, `brand/grain_0..3.png`, `music/fossil_mysteries.mp3`.
3. **Lấy mốc chữ trong từng beat** (mục 3) để đặt các cú cắt và va chạm đúng lúc từ khoá được đọc.
4. **Viết `Short00N_3D.tsx`.** Chép `Short009_3D.tsx` làm khung, rồi thay `shot()`, `CUTS`, `HITS` và overlay. Đăng ký comp `Short00N-3D` và `Thumb00N` trong `Root.tsx`.
   - Id comp không được chứa `_`.
   - `calculateMetadata` lấy từ `short008Overlays`.
5. **Bundle một lần, render ảnh tĩnh để kiểm tra** (khoảng 18 frame, ghép thành contact sheet). Sửa góc máy rồi render lại cho tới khi ổn (mục 6).
6. **Hiệu ứng âm thanh:** chép `sfx009.py` thành `sfx00N.py`, sửa `BEAT0`, `cuts` và các cue, rồi trộn lên tiếng của bản ảnh thật (mục 5).
7. **Render đầy đủ và ghép tiếng** (mục 6), xuất thành `shorts/00N/fossil_short00N_3d_r0X.mp4`.
8. **Thumbnail** render từ chính model 3D, chữ chèn bằng `thumb_text.py --raw` (mục 7).
9. **Gói đăng:** chạy `/yt-package`, rồi cập nhật `PUBLISH_PACKAGE.md` và `POSTING_LIST` (mục 8).

## 1. Phong cách đã duyệt (và những thứ đã bị loại)

- **Đã duyệt:** thú bằng khối hộp, màu phẳng (`meshStandardMaterial flatShading`), kiểu minh hoạ cố ý đơn giản. Ánh sáng mặt trời, sương mù, nền trời gradient.
- **Đã bị loại, không đề xuất lại:**
  - Model 3D do Gemini viết ("siêu xấu").
  - Thú SDF Claude tự dựng ("RẤT XẤU").
  - Sư tử TRELLIS / ảnh→3D ("thật sự xấu").
  - Quaternius CC0 (khủng long low-poly có xương) chỉ còn là kho dự phòng, không phải phong cách chính.
- **r01 bị chê nhàm** dù hình đẹp, vì mỗi beat chỉ có một góc máy chậm. Mọi tập 3D phải có các hiệu ứng ở mục 2.

## 2. Mức tối thiểu cho mỗi tập (học từ r02)

| Hạng mục | Cách làm trong r02 |
|---|---|
| **Góc máy** | Mỗi beat chia 2–4 góc, cắt đúng lúc từ khoá được đọc. Phối nhiều kiểu: góc thấp nhìn ngược lên, cận mặt, quay từ trên xuống, góc sát đất, quay vòng, dolly zoom (lùi máy và thu góc nhìn cùng lúc). |
| **Cắt cảnh** | `CUTS[beat] = [[giây, "whip" \| "flash" \| "cut"]]`. Whip làm nhoè ngang khoảng 6 frame (CSS blur + dịch ngang + scale). Flash chớp trắng 5 frame. |
| **Va chạm** | `HITS[beat] = [[giây, độ mạnh]]` gồm rung máy (vài sóng sin, tắt dần theo hàm mũ) và đập phóng cả khung (`scale 1 + 0.35*env`). Dùng cho bước chân, cú bung, tem, chữ VS. |
| **Hạt** | `Particles` có 3 loại: snow, sand, bokeh. Thời gian lấy theo T tuyệt đối để hạt liền mạch qua các cú cắt. Bụi chân dùng `Footfalls`, tính đúng thời điểm chân chạm đất theo pha của chân. |
| **Gag hình ảnh** | Mỗi ý trong lời đọc biến thành một hành động: lông bung ra khỏi thân (`furPop`), lông rơi từ trời xuống (`furDrop`), chuỗi DNA đổi màu, mảng lông tuột (`Debris`), time-lapse ngày đêm và con vật chìm vào cát, tuyết bắn tung (`Burst`), tia quét (`ScanPlane`, `LaserScan`), lấp lánh (`Sparkles`). |
| **Cảnh lạ** | Ít nhất một cảnh khác hẳn bối cảnh chính, ví dụ cảnh bên trong tế bào (nền tối, bokeh, `Helix`). |
| **Chữ trên màn hình** | Tem kiểu "IT WORKED ✓", bộ đếm (`EditCounter`), số bị gạch rồi trượt đi, chữ VS đập vào. Đặt trong khoảng y 700–1100 để không đụng field note (góc trên trái) và phụ đề (y 1245). |
| **Hiệu ứng âm thanh** | Cú cắt nào cũng có tiếng; va chạm nào cũng có tiếng thịch hoặc đập; tiếng thú; tiếng nền theo bối cảnh. |

**Luật khung hình dọc 9:16:**
- Cận mặt không để mặt kín khung. Máy cách đầu khoảng 4.5–6 m với thú cỡ voi, góc nhìn 40°.
- Hai con đối đầu thì máy quay vòng ở bán kính 16–20 m, nếu không một con sẽ ra ngoài khung.
- Góc sát đất đặt máy xa khoảng 8 m, nếu không thân thú che nửa khung.

## 3. Mốc chữ trong từng beat

```bash
cd openmontage/projects/fossil-mysteries-short-00N-3d
python -c "
import json;p=json.load(open('props.json'))
st=[s['startFrame']/30 for s in p['scenes']];out={}
for g in p['karaoke']:
  for w in g['words']:
    t=w['startMs']/1000;b=max(i for i,s in enumerate(st) if s<=t+1e-6)
    out.setdefault(b+1,[]).append(f\"{t-st[b]:.2f} {w['text']}\")
for b,v in out.items(): print(b,' | '.join(v))"
```

Các mốc giây trong `shot()`, `CUTS`, `HITS` và `sfx00N.py` đều là giây tính từ đầu beat, lấy từ bảng này.

## 4. Thư viện code (`remotion-composer/projects/fossil-3d-city-test/`)

**`BlockAnimals.tsx`:** mọi chuyển động là hàm của t. Đầu con vật quay về -X, mặt đất ở y=0, đơn vị là mét thật.
- `BlockProboscid` (voi ↔ voi ma mút) có các tham số:
  - `mammoth` 0..1
  - `fur` (lông mọc) và `furPop` (lông bung ra)
  - `furDrop` (lông rơi vào chỗ)
  - `coat` (ép mức nhuộm màu lông lên da)
  - `tusks`, `raise` (ngóc đầu, cuộn vòi, xoè tai khi rống)
  - `walk`, `phase`, `period`
- Ngoài ra có `BlockMouse`, `BlockPyramid`, `BlockPine`, và helper `Box` / `V3`.

**`BlockLion.tsx`:** sư tử khối, có `walk`, `roarA`/`roarB`.

**Con vật mới:** viết trong `BlockAnimals.tsx` theo cùng khuôn: các hộp lồng group, xoay quanh khớp (chân, đuôi, hàm, đốt vòi), cỡ thật, có một tham số cho cử động nổi bật (như rống, há miệng).

**`Short009_3D.tsx`:**
- Khung chính: `shot()`, `World` (máy quay có rung, đèn, sương, nền trời có thể chuyển sang đêm), `Cam` có fov.
- Bối cảnh: `Steppe`, `Desert`, `Lab`, `CellBg`.
- Hiệu ứng: `Particles`, `Footfalls`, `Debris`, `Burst`, `Helix`, `ScanPlane`, `LaserScan`, `Sparkles`, `Glow`.
- Overlay: `Stamp`, `EditCounter`, `VsSlam`.
- Thumbnail: `Thumb009`.

**`short008Overlays.tsx`:** các lớp chung của kênh, gồm `Captions`, `FieldNote`, `EndCardView`, `HookHeadline`, `Grain`, `Ammonite`, các hằng `PANEL`/`CAPTION_Y`, và font `mono`/`sans`/`serif`.

Nhãn góc khung ghi `3D ILLUSTRATION`.

## 5. Hiệu ứng âm thanh (`openmontage/projects/fossil-mysteries-short-009-3d/sfx009.py`)

- Chạy bằng venv của tts (`D:/youtube/tts/.venv/Scripts/python.exe`), có sẵn numpy, scipy, imageio_ffmpeg.
- Đầu vào là tiếng của bản ảnh thật (giọng + nhạc, stereo 48k), tách bằng:
  ```
  ffmpeg -i fossil_short00N_r0X.mp4 -vn -ac 2 -ar 48000 audio_r0X.wav
  ```
- **`BEAT0`** là frame bắt đầu mỗi beat, lấy từ `props.json`.
- **`trumpet(dur, f_lo, f_hi, seed)`** tổng hợp tiếng voi rống. Voi con dùng 620→980 Hz, voi lớn 240–600 Hz.
- **Kho âm** ở `tts/assets/sfx/`:
  - Va chạm, đập: `deep_thud`, `sub_impact`, `heavy_slam`
  - Bụp, click: `pop_click`, `bubble_pop`, `mouse-click`
  - Gió, lướt: `whoosh`, `soft_whoosh`, `swoosh_reverse`
  - Công nghệ: `sci_fi_zap`, `digital_glitch`
  - Chuông: `magic_chime`, `bell_ding`
  - Khác: `camera_shutter`, `paper_rip`, `tape_rewind`
  - Nền: `wind_howl`, `breath_pad`
  - `remotion/*` là CC0.
- **Mức âm lượng:**

  | Loại | Mức |
  |---|---|
  | Nền | −26 đến −34 dB |
  | Whoosh | −14 |
  | Đập lớn | −12 đến −15 |
  | Lộp độp, click | −20 đến −22 |

  Sau khi trộn thì qua `alimiter`, kết quả khoảng −16 LUFS. Bản 009 có đỉnh SFX −7 dB, giọng vẫn rõ.
- **Âm phải đi theo hình:** whoosh ở mỗi whip, `sub_impact` ở mỗi flash, shutter ở cảnh lab, thịch theo bước chân, zap theo mỗi nấc DNA, click theo bộ đếm, tiếng tua băng cho time-lapse.

## 6. Lệnh build, kiểm tra, render

```bash
cd D:/youtube/openmontage/remotion-composer
B=<scratchpad>/b00N   # thư mục bundle MỚI mỗi lần (đừng rm -rf biến)
npx remotion bundle projects/fossil-3d-city-test/index.tsx --out-dir=$B --public-dir=../projects/fossil-mysteries-short-00N-3d/public
P=../projects/fossil-mysteries-short-00N-3d/props.json
npx remotion still $B Short00N-3D out/f300.png --frame=300 --props=$P --scale=0.33 --gl=angle --log=error
npx remotion render $B Short00N-3D ../projects/fossil-mysteries-short-00N-3d/video_noaudio.mp4 --props=$P --gl=angle --crf=16 --muted
FF=D:/youtube/tts/.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe
$FF -y -i video_noaudio.mp4 -i audio_sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest fossil_short00N_3d_r0X.mp4
```

- Contact sheet: ghép các ảnh tĩnh bằng PIL thành lưới 6 cột rồi xem một lần.
- Kiểm tra trên contact sheet:
  - Mặt có quá sát không.
  - Có con nào bị cắt khỏi khung không.
  - Tia laser hay hạt bay có quá to không.
  - Chữ có đè lên mặt không.
- Ước lượng thời gian: render 1309 frame với `--gl=angle` mất khoảng vài phút.
- Lưu ý:
  - Chạy typecheck trước khi bundle: `npx tsc --noEmit -p .`
  - Remotion không có tsc riêng.

## 7. Thumbnail (render từ model 3D)

- Comp `Thumb00N` (1 frame, 1080x1920), xuất ra `shorts/00N/publish/thumb_raw_3d.png`, rồi chèn chữ:
  ```
  python .../thumb_text.py 00N --raw 00N/publish/thumb_raw_3d.png --y 0.21
  ```
  Kết quả là `thumb_ai.jpg` và `thumb_check.jpg`.
- Bố cục:
  - Một con vật lớn, mắt nhìn thẳng vào máy, góc 3/4 để thấy chi tiết nổi bật (như mảng lông).
  - Nền trời chạng vạng tối; mặt đất được phủ tối bớt.
  - Đèn chính chiếu từ phía máy; đèn ngược sáng ấm `#FFB45A` tạo viền sáng.
- **Vị trí:** đầu con vật nằm ở khoảng 40–55% chiều cao (đặt `look` cao hơn đầu); vùng 15–32% để trống cho chữ. Xem `thumb_check.jpg`: chữ không được đè lên mắt, kể cả ở khung cắt 3:4.
- Dùng `coat` thấp nếu cần giữ màu da thật, ví dụ "voi có lông" phải còn xám để đọc ra là voi.
- Trước khi ghi đè `thumb_ai.jpg` / `thumb_check.jpg` / `PUBLISH_PACKAGE.md` / `CREDITS.txt` của bản ảnh thật, sao lưu bản cũ thành `*_r0X.*`.

## 8. Gói đăng

- Chạy `/yt-package`: viết 10 tiêu đề, chấm bằng `title.py`, chọn tiêu đề có số, tên hoặc năm, ≤ 40 ký tự nếu được.
- Chữ trên thumb tối đa 3 từ và không lặp từ nào của tiêu đề (009: tiêu đề nói *khi nào* 2028, thumb nói *là gì* "JUST AN ELEPHANT?").
- **Mô tả:** giữ nguyên phần nguồn của bản ảnh thật. Bỏ ghi công ảnh Commons nếu video 3D không dùng ảnh của ai. Thêm 2 dòng:
  - `Visuals: simplified 3D illustration made for this video, not a scientific reconstruction.`
  - `Voice: AI narration (Google Cloud Text-to-Speech).`
- **`CREDITS.txt`:** ghi rằng không dùng ảnh bên thứ ba, SFX từ @remotion/sfx (CC0), giọng TTS.
- Cập nhật `shorts/POSTING_LIST_*.md`: đổi đường dẫn video và tiêu đề.
- Nhớ tải file `.srt` lên mục Subtitles.

## 9. Lỗi hay gặp

- Thời gian mỗi frame phải là hàm thuần của t; không dùng state hay useFrame. Dùng `useMemo` cho các thứ tạo một lần.
- Tạo màu bằng `new THREE.Color(hex)` hoặc helper `mix`. Không chia byte sRGB cho 255.
- Text vẽ vào CanvasTexture sẽ ra trắng trơn; chữ phải là HTML overlay.
- Thứ tự chân khi đi: sau-trái, trước-trái, sau-phải, trước-phải (lệch pha 0.25 chu kỳ).
- Tham số `furPop` cho mọi khối cùng bay; muốn rụng một phần thì dùng `Debris` riêng.
- Lệnh `rm -rf $VAR` bị chặn an toàn. Dùng thư mục bundle mới mỗi lần, hoặc đường dẫn tuyệt đối viết thẳng.

## 9. Phong cách toon / beast (thử từ 2026-11-04, Short 013)
- Thú vẽ 2D (`projects/fossil-toon-test/beastAnimals.ts`) và nhân vật "you" (`youToon.ts`) trên tấm billboard trong
  cảnh 3D, cùng các lớp chữ của kênh. Mẫu: `Short013_3D.tsx` (thả người vào kỷ Phấn trắng, đồng hồ sinh tồn).
- Thời gian lấy từ các từ khoá trong `props.karaoke` (`ANCHORS`). Chưa có giọng thì dùng file ước lượng `short013_est.ts`.
- Xem ảnh tĩnh trên cloud: `PUBLIC=<thư mục public> bash tools/www_pipeline/cloud_stills.sh fossil-3d-city-test <Comp> <out> <giây...>`.
