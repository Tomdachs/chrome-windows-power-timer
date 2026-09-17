#!/usr/bin/env python3
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT = ROOT / "extension"
DIST = ROOT / "dist" / "web-store"
manifest = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
output = DIST / f"windows-power-timer-{version}.zip"

required_icons = ["icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png"]
for rel in required_icons:
    if not (EXT / rel).is_file():
        raise SystemExit(f"Missing required icon: {rel}")

DIST.mkdir(parents=True, exist_ok=True)
if output.exists():
    output.unlink()

with tempfile.TemporaryDirectory() as tmp:
    stage = Path(tmp) / "extension"
    shutil.copytree(EXT, stage)
    store_manifest = json.loads((stage / "manifest.json").read_text(encoding="utf-8"))
    store_manifest.pop("key", None)
    (stage / "manifest.json").write_text(json.dumps(store_manifest, indent=2) + "\n", encoding="utf-8")
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(stage.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(stage).as_posix())

with zipfile.ZipFile(output) as zf:
    names = set(zf.namelist())
    if "manifest.json" not in names:
        raise SystemExit("manifest.json is not at the ZIP root")
    packaged_manifest = json.loads(zf.read("manifest.json"))
    if "key" in packaged_manifest:
        raise SystemExit("Chrome Web Store package unexpectedly contains manifest key")
    for rel in required_icons:
        if rel not in names:
            raise SystemExit(f"Packaged icon missing: {rel}")

print(output)
print(f"files={len(names)} version={version} manifest_key=omitted")
