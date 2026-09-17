# Windows Power Timer for Chrome

Schedule **Windows sleep or shutdown from the Chrome toolbar**, with one-minute precision and no background service, account, telemetry, or administrator rights.

The extension keeps the countdown in Chrome and sends only the final power action to a small local Native Messaging host. English and Japanese UI are included.

## Features

- 1-minute to 7-day countdowns
- Sleep or shutdown selection
- 5m / 15m / 30m / 1h presets
- Visible remaining time and cancel button
- Shutdown confirmation before scheduling
- Current-user installation; no administrator rights
- No network permission, telemetry, account, or cloud dependency
- Stable unpacked-extension ID for Native Messaging

## Requirements

- Windows 10 or Windows 11
- Google Chrome
- Windows PowerShell 5.1

The installer uses the .NET Framework C# compiler included with Windows to build the small native host from source.

## Quick start

Download and extract the latest GitHub Release, then open Windows PowerShell in the extracted folder and run:

```powershell
.\install.ps1 -OpenChromeExtensions
```
Chrome opens `chrome://extensions`. Enable **Developer mode**, choose **Load unpacked**, and select the extension directory printed by the installer, normally:

```text
%LOCALAPPDATA%\Tomdachs\WindowsPowerTimer\extension
```

The expected unpacked extension ID is `lfcapfodknbfpomfifbkfekikbflmjck`.

To verify or remove the installation:

```powershell
.\install.ps1 -Check
.\install.ps1 -Uninstall
```

### Developing from WSL

The same installer can be launched from WSL:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass \
  -File "$(wslpath -w install.ps1)" -OpenChromeExtensions
```

## How it works

`extension/` is a Manifest V3 extension using `chrome.alarms` and local extension storage. `host/` contains the Windows Native Messaging executable source. `install.ps1` builds and registers the host under the current user's Chrome Native Messaging registry key.

The native host accepts only `ping`, `sleep`, and `shutdown`. It cannot execute arbitrary commands and it does not access the network.
## Safety and limitations

- Chrome must still be running when the timer expires.
- If Chrome was closed and the deadline is already more than two minutes late, the action expires instead of running unexpectedly on the next Chrome launch.
- Shutdown uses Windows `shutdown.exe /s /t 0`; save open work before scheduling it.
- Sleep availability depends on the Windows device's supported power states and policy.
- The project does not bypass UAC or Windows security settings.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for the trust boundary.

## Development

```bash
npm test
./scripts/check.sh
```

`./scripts/check.sh` tests the timer logic, validates extension JSON, compiles the Windows native host, and sends a harmless Native Messaging `ping`. It never sleeps or shuts down the machine.

Create a release archive on Windows:

```powershell
.\scripts\package-release.ps1
```

## Project scope

This project intentionally focuses on a small browser-controlled Windows power timer. It is not a general task scheduler, remote-control service, or system optimization suite. See [docs/competitive-landscape.md](docs/competitive-landscape.md) for the public OSS positioning snapshot.

## License

MIT
