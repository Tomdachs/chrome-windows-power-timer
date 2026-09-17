# Chrome Web Store privacy answers

Use these answers in the Developer Dashboard Privacy practices tab.

## Single purpose

Allow a user to schedule Windows sleep or shutdown after a user-selected countdown from the Chrome toolbar.

## Permission justifications

### `alarms`

Used to keep the countdown deadline and wake the extension service worker when the selected timer expires while Chrome is running.

### `storage`

Used only for local timer state such as the selected action, target time, and status so the popup can show the active countdown after it is closed and reopened.

### `nativeMessaging`

Used to send an allow-listed `ping`, `sleep`, or `shutdown` request to the locally installed Windows companion host. The host does not provide arbitrary command execution or network access.

No host permissions or browsing-history permissions are requested.
## Remote code

Select: **No, I am not using remote code.**

All executable extension code is included in the uploaded extension package. The project does not load JavaScript, WebAssembly, or other executable logic from remote servers.

## Data usage

The extension does not collect or transmit user data.

Timer state is stored locally in Chrome extension storage. It is not sent to the developer or any third party. The extension has no network permission, analytics SDK, advertising SDK, account system, or cloud backend.

For the data-type checkboxes, select no collected-data categories unless the Dashboard wording changes in a way that requires a different declaration.

## Limited use certifications

Certify the applicable Limited Use statements because the extension does not sell, transfer, or use user data for advertising, credit, or unrelated purposes.

## Privacy policy

https://github.com/Tomdachs/chrome-windows-power-timer/blob/main/PRIVACY.md

If the Dashboard requires a dedicated web page rather than the GitHub document, publish the same policy through GitHub Pages before submission.
