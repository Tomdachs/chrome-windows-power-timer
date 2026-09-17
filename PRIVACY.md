# Privacy

Windows Power Timer is designed to work entirely on your local Windows PC.

- The Chrome extension does not request network access.
- Timer settings are stored in Chrome local extension storage.
- The native messaging host accepts only `ping` and the allow-listed power actions `sleep` and `shutdown`.
- No telemetry, analytics, account, advertising SDK, or cloud service is included.
- The installer writes only the app files under `%LOCALAPPDATA%\Tomdachs\WindowsPowerTimer` and the current-user Chrome Native Messaging registry key.

If future releases add network features or telemetry, this document and the Chrome Web Store disclosure must be updated before release.
