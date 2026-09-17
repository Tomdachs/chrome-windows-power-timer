#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

node --check extension/background.js
node --check extension/popup.js
node --check extension/timer-utils.js
node --test tests/*.test.mjs
python3 -m json.tool extension/manifest.json >/dev/null
python3 -m json.tool extension/_locales/en/messages.json >/dev/null
python3 -m json.tool extension/_locales/ja/messages.json >/dev/null

csc='/mnt/c/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
[[ -x "$csc" ]] || csc='/mnt/c/Windows/Microsoft.NET/Framework/v4.0.30319/csc.exe'
if [[ -x "$csc" ]]; then
  output_win='C:\Users\Public\windows-power-timer-check.exe'
  output='/mnt/c/Users/Public/windows-power-timer-check.exe'
  source_win="$(wslpath -w host/WindowsPowerHost.cs)"
  rm -f "$output"
  "$csc" /nologo /target:exe /reference:System.Windows.Forms.dll "/out:$output_win" "$source_win"
  python3 tests/host_ping.py "$output"
  rm -f "$output"
else
  echo 'Windows .NET Framework csc.exe not available; native host check skipped.' >&2
fi
