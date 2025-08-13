#!/usr/bin/env bash
set -euo pipefail

# Standardize image filenames to lowercase kebab-case, safe characters, unique names
# Affects: public/images/products/**/*.{jpg,jpeg,png,webp,svg,gif,avif}

project_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
target_dir="$project_root_dir/public/images/products"

if [ ! -d "$target_dir" ]; then
  echo "Nothing to do: $target_dir does not exist" >&2
  exit 0
fi

standardize_name() {
  local name="$1"
  # lowercase
  name="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
  # replace spaces/underscores with hyphens
  name="${name// /-}"
  name="${name//_/-}"
  # replace any sequence of invalid chars with hyphen (allow a-z 0-9 . -)
  name="$(printf '%s' "$name" | sed -E 's/[^a-z0-9.-]+/-/g')"
  # collapse multiple hyphens
  name="$(printf '%s' "$name" | sed -E 's/-+/-/g')"
  # ensure single dot in extension position: if multiple dots, keep last as ext, replace others with hyphen
  local base ext
  base="${name%.*}"
  ext="${name##*.}"
  if [ "$base" = "$ext" ]; then
    # no extension
    ext=""
  else
    # clean base from stray dots
    base="$(printf '%s' "$base" | sed -E 's/[.]+/-/g')"
  fi
  # trim leading/trailing hyphens from base
  base="$(printf '%s' "$base" | sed -E 's/^-+//; s/-+$//')"
  if [ -n "$ext" ]; then
    printf '%s.%s' "$base" "$ext"
  else
    printf '%s' "$base"
  fi
}

rename_file() {
  local path="$1"
  local dir base ext orig name std
  dir="$(dirname -- "$path")"
  base="$(basename -- "$path")"
  std="$(standardize_name "$base")"
  if [ "$std" = "$base" ]; then
    return 0
  fi
  local candidate="$std"
  local stem="${std%.*}"
  local extension="${std##*.}"
  if [ "$stem" = "$extension" ]; then
    extension=""
  fi
  local i=1
  while [ -e "$dir/$candidate" ] && [ "$dir/$candidate" != "$path" ]; do
    if [ -n "$extension" ]; then
      candidate="${stem}-${i}.${extension}"
    else
      candidate="${stem}-${i}"
    fi
    i=$((i+1))
  done
  mv -v -- "$path" "$dir/$candidate"
}

# Find and rename files
find "$target_dir" -type f \( \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o \
  -iname '*.webp' -o -iname '*.svg' -o -iname '*.gif' -o -iname '*.avif' \
\) -print0 | while IFS= read -r -d '' f; do
  rename_file "$f"
done

echo "Filename standardization complete under $target_dir"

