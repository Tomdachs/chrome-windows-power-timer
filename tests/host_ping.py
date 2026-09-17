#!/usr/bin/env python3
import json
import struct
import subprocess
import sys

exe = sys.argv[1]
payload = json.dumps({"command": "ping"}).encode("utf-8")
message = struct.pack("<I", len(payload)) + payload
completed = subprocess.run(
    [exe], input=message, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False
)
if completed.returncode != 0:
    raise SystemExit(
        f"host exited {completed.returncode}: {completed.stderr.decode(errors='replace')}"
    )
if len(completed.stdout) < 4:
    raise SystemExit("host returned no native-messaging frame")

length = struct.unpack("<I", completed.stdout[:4])[0]
response = json.loads(completed.stdout[4:4 + length].decode("utf-8"))
assert response.get("ok") is True, response
assert response.get("version") == "0.1.1", response
print("native host ping OK")
