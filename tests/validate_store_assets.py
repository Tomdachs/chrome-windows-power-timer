#!/usr/bin/env python3
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = {
    "extension/icons/icon16.png": (16, 16),
    "extension/icons/icon32.png": (32, 32),
    "extension/icons/icon48.png": (48, 48),
    "extension/icons/icon128.png": (128, 128),
    "docs/store-assets/icon-128.png": (128, 128),
    "docs/store-assets/promo-small-440x280.png": (440, 280),
    "docs/store-assets/promo-marquee-1400x560.png": (1400, 560),
    "docs/screenshots/store-idle-1280x800.png": (1280, 800),
    "docs/screenshots/store-running-1280x800.png": (1280, 800),
}


def png_size(path: Path):
    with path.open("rb") as f:
        header = f.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise AssertionError(f"Not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


for rel, expected in EXPECTED.items():
    path = ROOT / rel
    assert path.is_file(), f"Missing asset: {rel}"
    actual = png_size(path)
    assert actual == expected, f"{rel}: expected {expected}, got {actual}"

print(f"store assets OK: {len(EXPECTED)} files")
