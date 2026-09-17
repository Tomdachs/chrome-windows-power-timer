# Contributing

Issues and pull requests are welcome for reproducible bugs, documentation improvements, tests, and focused feature proposals.

## Development

Requirements: Node.js 20+ for JavaScript tests and Windows 10/11 with Windows PowerShell 5.1 for the native-host build.

```bash
npm test
./scripts/check.sh
```

On Windows, build the native host without executing a power action:

```powershell
.\scripts\build-host.ps1
py -3 .\tests\host_ping.py .\dist\windows-power-host.exe
```

Keep the native host command surface minimal. New OS actions require tests, documentation, and a security-boundary review.
