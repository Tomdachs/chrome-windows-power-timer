# Chrome Web Store publication checklist

## Current checkpoint — paused 2026-09-17

Chrome Web Store publication is intentionally **paused before developer registration/payment**. There is no urgency to publish, and the one-time Chrome Web Store developer registration fee has not been paid as part of this work. No item has been submitted for review.

Prepared state at the pause point:

- Public GitHub repository and working unpacked extension are available.
- Local sleep/shutdown behavior was manually smoke-tested successfully.
- Source/manifest are prepared as `0.1.1`; the latest published GitHub Release remains `v0.1.0`.
- Store icon, promo images, 1280x800 screenshots, English/Japanese listing copy, privacy answers, and reviewer instructions are prepared.
- `npm run package:webstore` produces `dist/web-store/windows-power-timer-0.1.1.zip`; its upload manifest intentionally omits the development `key`.
- Native-host installer supports `-NativeHostOnly -ExtensionId <STORE_EXTENSION_ID>` so the future Web Store ID can be authorized after the first upload.
- CI validates the Web Store package/assets and the Windows native host.

To resume, first decide to register/pay for the Chrome Web Store developer account. Then upload the prepared ZIP **without submitting for review**, record the assigned Store extension ID, wire that ID into the companion-host defaults, run a store-installed smoke test, and only then submit for review.

Do not create a `v0.1.1` GitHub Release solely for the Web Store preparation checkpoint; publish it when the companion-host defaults contain the actual Store extension ID or when a separate release is otherwise justified.

## Prepared in this repository

- Manifest V3 extension package
- 128px store icon and extension icons
- 1280x800 screenshots
- 440x280 small promo tile
- 1400x560 marquee promo tile
- English and Japanese listing copy
- Privacy and permission justifications
- Public privacy policy, support, and homepage URLs
- Chrome Web Store-only ZIP generator

Generate the upload ZIP from WSL:

```bash
npm ci
npm run store-assets
npm run package:webstore
```

The upload ZIP is written under `dist/web-store/` with `manifest.json` at the ZIP root. The Web Store package intentionally omits the development-only `manifest.key`.

## First-upload sequence

1. Register or sign in to the Chrome Web Store Developer Dashboard.
2. Complete publisher profile and email verification; enable Google Account 2-Step Verification.
3. Pay the one-time developer registration fee if the publisher account is not registered yet.
4. Add a new item and upload the ZIP from `dist/web-store/`.
5. Do **not** submit for review yet. Record the Web Store item / extension ID first.
6. Add that store ID to the Native Messaging host `allowed_origins` default while keeping the local-development ID working.
7. Rebuild and publish the Windows companion-host release.
8. If the extension package changes, increment its version and upload the replacement package.
9. Fill the Store Listing, Privacy practices, Distribution, and Test instructions tabs from the drafts in `docs/`.
10. Submit for review only after a store-installed copy connects to the companion host successfully.

## Why the store ID must be confirmed first

Native Messaging hosts allow explicit `chrome-extension://<id>/` origins. The Chrome Web Store assigns a stable item ID during the first upload flow. The public companion installer must authorize that actual store ID, otherwise a Web Store-installed extension cannot call the Windows host.

The source manifest contains a development `key` only so the unpacked build has a stable local ID. The upload package strips that key and lets the Web Store own the published item's identity.

## Suggested distribution

Start with **Unlisted** if an end-to-end store-installed smoke test is desired before making the listing broadly discoverable. Unlisted items still go through the same policy review. After verification, switch to Public and republish as required by the Dashboard.

## Reviewer test instructions

1. Install the extension from the submitted Chrome Web Store item.
2. Download the Windows companion host from the linked GitHub Release.
3. Run `.\install.ps1 -NativeHostOnly -ExtensionId <STORE_EXTENSION_ID>` in Windows PowerShell. Administrator rights are not required.
4. Open the extension popup and verify `Windows host connected` appears.
5. Start a 5-minute Sleep timer and confirm the countdown appears; cancel it before expiry for a non-disruptive smoke test.
6. To verify the OS action, save work first and use a 1-minute Sleep timer. Shutdown is also available and intentionally requires confirmation.
