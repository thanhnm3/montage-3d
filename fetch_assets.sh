#!/usr/bin/env bash
# Chạy từ thư mục gốc của repo OpenMontage SAU KHI đã chép đè repo montage-3d vào.
# Đặt nhạc + giọng đọc vào đúng public/ của từng project. Dùng: bash fetch_assets.sh [đường-dẫn-montage-3d]
set -e
SRC="${1:-../montage-3d}"; A="$SRC/shared_assets"
for p in fossil-mysteries-short-008-3d fossil-mysteries-short-009-3d fossil-mysteries-short-010-3d fossil-mysteries-short-011-3d fossil-mysteries-short-012-3d; do
  mkdir -p projects/$p/public/music projects/$p/public/audio
  cp "$A/music/fossil_mysteries.mp3" projects/$p/public/music/
  cp "$A/narration/$p.wav" projects/$p/public/audio/narration.wav
done
for p in www-ink3d-001 www-ink3d-002 www-ink3d-003; do
  mkdir -p projects/$p/public/music projects/$p/public/audio
  cp "$A"/music/{hook_curious_bounce,body_light_steady,twist_suspense_break}.mp3 projects/$p/public/music/
  cp "$A/narration/$p.wav" projects/$p/public/audio/narration.wav
done
echo done
