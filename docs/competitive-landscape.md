# Competitive landscape

Reviewed: 2026-09-17

## Problem and target users

Windows users sometimes want to start a sleep/shutdown countdown from the browser toolbar while watching media, downloading files, or leaving a PC unattended. Windows has command-line and Task Scheduler options, but they are not exposed as a small Chrome timer UI.

## Closest alternatives

| Alternative | What it does | Difference from this project |
| --- | --- | --- |
| Chrome Web Store: Close Browser - Schedule the Shutdown of Your Tabs | Counts down and closes Chrome windows/tabs | Does not perform Windows sleep or shutdown |
| Chrome Web Store: Keep Computer Awake (for a While) | Temporarily prevents sleep, then returns to the normal power policy | Does not explicitly trigger Windows shutdown and is centered on keep-awake behavior |
| Tiny Windows Shutdown Scheduler | Small open-source Windows desktop power timer | Native desktop UI rather than a Chrome toolbar workflow |
| Power Timer / similar Microsoft Store utilities | General Windows power scheduling and automation | Broader desktop automation scope; this project intentionally stays browser-controlled and minimal |

## Differentiation

The narrow responsibility is: **a local Chrome toolbar countdown that triggers only Windows sleep or shutdown through an allow-listed Native Messaging host**. No service, remote-control API, account, telemetry, or general command execution is included.

The project should not claim that Windows power timers are novel. The useful gap is the browser-toolbar workflow combined with a deliberately small local security boundary.

## Research snapshot

- GitHub repository slug `windows-power-timer` already exists under another owner. No exact `chrome-windows-power-timer` repository match was found in the 2026-09-17 GitHub search, so that is the recommended public slug.
- No package-registry name is required for v0.1 because distribution is planned through GitHub Releases rather than npm/PyPI.
- Chrome Web Store alternative: https://chromewebstore.google.com/detail/close-browser-schedule-th/ekeedmpgakpcfkioighpeabecijpjban
- Chrome Web Store alternative: https://chromewebstore.google.com/detail/keep-computer-awake-for-a/imbpigcghoambmanjekibelfjemnnool
- Desktop OSS alternative: https://github.com/pavanbadempet/Tiny-Windows-Shutdown-Scheduler
- Codex for Open Source criteria: https://openai.com/form/codex-for-oss/

The project is technically suitable for public OSS, but a new repository has no adoption evidence yet. Codex for Open Source currently looks for active maintenance plus meaningful usage, broad adoption, or clear ecosystem importance, so publication is the start of gathering evidence rather than evidence by itself.
