#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
cache_dir="${PLAYWRIGHT_BROWSER_CACHE:-$PWD/.cache/browser}"
libs_dir="${PLAYWRIGHT_BROWSER_LIBS:-$PWD/.cache/browser-libs}"
chrome="$cache_dir/opt/google/chrome/google-chrome"

for candidate in chromium chromium-browser google-chrome google-chrome-stable; do
  if command -v "$candidate" >/dev/null 2>&1; then
    command -v "$candidate"
    exit 0
  fi
done

if [[ ! -x "$chrome" ]]; then
  mkdir -p "$cache_dir"
  deb="$(mktemp --suffix=.deb)"
  trap 'rm -f "$deb"' EXIT
  curl -L --fail --retry 3 -o "$deb" \
    https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
  rm -rf "$cache_dir"/*
  dpkg-deb -x "$deb" "$cache_dir"
fi
lib_path="$libs_dir/root/usr/lib/x86_64-linux-gnu"
if [[ ! -e "$lib_path/libnspr4.so" ]]; then
  mkdir -p "$libs_dir/packages" "$libs_dir/root"
  pushd "$libs_dir/packages" >/dev/null
  apt download libnspr4 libnss3 libasound2t64 >/dev/null
  for package in ./*.deb; do
    dpkg-deb -x "$package" "$libs_dir/root"
  done
  popd >/dev/null
fi

printf '%s\n' "$chrome"
