#!/usr/bin/env bash
set -euo pipefail

# Fetch and process beautiful, unbranded goods images into square 1024x1024 PNG + WebP
# Requires: curl, ImageMagick (convert)

project_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
out_dir="$project_root_dir/public/images/products"

if ! command -v convert >/dev/null 2>&1; then
  echo "Error: ImageMagick 'convert' is required. Install and retry." >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required. Install and retry." >&2
  exit 1
fi

mkdir -p \
  "$out_dir/fresh" \
  "$out_dir/bakery" \
  "$out_dir/dairy" \
  "$out_dir/meat" \
  "$out_dir/snacks" \
  "$out_dir/drinks" \
  "$out_dir/household" \
  "$out_dir/personal-care"

# category|filename|unsplash_photo_id
read -r -d '' ITEMS <<'EOF'
fresh|eggs-tray|XktEKmetbzc
fresh|eggs-dozen|leOh1CzRZVQ
bakery|bread-slices-white|WHJTaLqonkU
bakery|bread-sliced-artisan|rYOqbTcGp1c
dairy|milk-bottle-clear|KikhsHzIO9o
dairy|milk-bowl-yellow|U0lQNabx2hE
meat|chicken-raw-breast|9zLa37VNL38
snacks|chips-bowl|IENsJZTvkHo
drinks|bottle-plastic-clear|Y-J-f7JkjmU
household|bottle-glass-wood-lid|2S9FFzGKK1A
personal-care|bottle-glass-clear|KikhsHzIO9o
EOF

process_one() {
  local category="$1"; shift
  local name="$1"; shift
  local pid="$1"; shift

  local url="https://unsplash.com/photos/${pid}/download?force=true"
  local tmp_file
  tmp_file="$(mktemp --suffix=.jpg)"

  echo "Downloading $category/$name from $pid ..."
  curl -fL "$url" -o "$tmp_file"

  local out_png="$out_dir/$category/${name}.png"
  local out_webp="$out_dir/$category/${name}.webp"

  convert "$tmp_file" \
    -auto-orient -strip \
    -resize '1024x1024^' -gravity center -extent 1024x1024 \
    "$out_png"
  convert "$out_png" -define webp:method=6 -quality 82 "$out_webp"

  rm -f "$tmp_file"
  echo "Saved: ${out_png} and ${out_webp}"
}

while IFS='|' read -r category name pid; do
  [ -z "$category" ] && continue
  process_one "$category" "$name" "$pid"
done <<<"$ITEMS"

echo "All images processed into $out_dir"

