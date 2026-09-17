# Security policy

## Supported versions

Security fixes are provided for the latest released version.

## Reporting a vulnerability

Please report a security issue privately through GitHub Security Advisories when the public repository is available. Do not include secrets or personal data in a public issue.

## Security boundary

The browser extension can request Windows sleep or shutdown through a Native Messaging host. The host is registered for the current user only and allows a single extension origin by default. It accepts only `ping`, `sleep`, and `shutdown`; it does not execute arbitrary commands or access the network.

The project intentionally does not bypass UAC, disable Windows security controls, or force-close applications before shutdown. Users should save work before scheduling a shutdown.
