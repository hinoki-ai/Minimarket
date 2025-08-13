#!/usr/bin/env bash
set -euo pipefail

# Fetch and process curated goods images into square 1024x1024 PNG + WebP
# Sources supported:
# - Unsplash: by photo ID or full photo URL
# - Direct image URL (e.g., Pexels "images.pexels.com" link)
#
# Usage:
# 1) Paste curated selections into the ITEMS block below as lines in the format:
#    category|filename|source|ref
#    - category: one of fresh|bakery|dairy|meat|snacks|drinks|frozen|household|personal-care|electronics|toys|stationery
#    - filename: lowercase-kebab name without extension (e.g., milk-bottle-clear)
#    - source: unsplash|url (pexels and others use "url")
#    - ref: for unsplash: photo ID (e.g., XktEKmetbzc) or full photo URL
#           for url: a direct image URL (jpeg/png/webp)
# 2) Run: bash scripts/fetch_curated_images.sh
# 3) Optional: bash scripts/standardize_image_names.sh

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
  "$out_dir/frozen" \
  "$out_dir/household" \
  "$out_dir/personal-care" \
  "$out_dir/electronics" \
  "$out_dir/toys" \
  "$out_dir/stationery"

# category|filename|source|ref
read -r -d '' ITEMS <<'EOF' || true
drinks|bottle-plastic-clear|unsplash|Y-J-f7JkjmU
snacks|chips-bowl|unsplash|IENsJZTvkHo
fresh|two-cherries|unsplash|vbAEHCrvXZ0
bakery|sliced-breads|unsplash|WHJTaLqonkU
dairy|milk-bottle-clear|unsplash|KikhsHzIO9o
dairy|milk-bowl-yellow|unsplash|U0lQNabx2hE
meat|chicken-raw-breast|unsplash|9zLa37VNL38
frozen|ice-cream-tub|url|https://images.pexels.com/photos/1352296/pexels-photo-1352296.jpeg?auto=compress&cs=tinysrgb&w=1600
household|detergent-bottle|unsplash|2S9FFzGKK1A
personal-care|shampoo-bottle|unsplash|KikhsHzIO9o
electronics|headphones|unsplash|zm42KtKcn9c
toys|toy-car|url|https://images.pexels.com/photos/163036/pexels-photo-163036.jpeg?auto=compress&cs=tinysrgb&w=1600
stationery|pens-set|url|https://images.pexels.com/photos/2325729/pexels-photo-2325729.jpeg?auto=compress&cs=tinysrgb&w=1600
EOF

resolve_unsplash_url() {
  local ref="$1"
  if [[ "$ref" =~ ^https?:// ]]; then
    # If it's a photo page URL, prefer the force download endpoint
    if [[ "$ref" == *"unsplash.com/photos/"* ]] && [[ "$ref" != *"/download"* ]]; then
      echo "${ref%/}/download?force=true"
      return 0
    fi
    echo "$ref"
    return 0
  fi
  echo "https://unsplash.com/photos/${ref}/download?force=true"
}

process_one() {
  local category="$1"; shift
  local name="$1"; shift
  local source="$1"; shift
  local ref="$1"; shift

  local url
  case "$source" in
    unsplash)
      url="$(resolve_unsplash_url "$ref")"
      ;;
    url|pexels)
      url="$ref"
      ;;
    *)
      echo "Skipping $category/$name: unknown source '$source'" >&2
      return 0
      ;;
  esac

  local tmp_file
  tmp_file="$(mktemp --suffix=.img)"

  echo "Downloading $category/$name from $source ..."
  # Use browser-like headers and referer to avoid 403 from some CDNs; retry a few times
  if ! curl -fL \
      -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' \
      -H 'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8' \
      -e 'https://unsplash.com/' \
      --retry 3 --retry-delay 1 --retry-connrefused \
      "$url" -o "$tmp_file"; then
    echo "Primary download failed for $category/$name. Skipping." >&2
    rm -f "$tmp_file"
    return 0
  fi

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

while IFS='|' read -r category name source ref; do
  [[ -z "${category:-}" ]] && continue
  [[ "${category:0:1}" == "#" ]] && continue
  process_one "$category" "$name" "$source" "$ref"
done <<<"$ITEMS"

echo "All images processed into $out_dir"

