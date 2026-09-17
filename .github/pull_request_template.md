## Summary

Describe the focused change and the user-facing reason for it.

## Validation

- [ ] `npm test`
- [ ] `./scripts/check.sh` on WSL/Windows when native-host behavior changed
- [ ] No sleep or shutdown was triggered by automated tests

## Security / behavior checklist

- [ ] Native Messaging remains allow-listed and does not expose arbitrary command execution
- [ ] No network permission, telemetry, or account requirement was added without documentation
- [ ] README / PRIVACY / SECURITY were updated when the trust boundary changed
- [ ] User-visible behavior is documented in English and Japanese when applicable
