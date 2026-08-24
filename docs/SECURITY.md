# Security

DEEP is a static, account-free application. It has no backend, database, authentication, cookies, payment flow or user-submitted content. That removes common server-side risks, but does not make the frontend or its content pipeline risk-free.

## Threat model

The relevant risks are compromised catalog data introducing unsafe URLs, dependency or build-pipeline compromise, clickjacking, unintended browser capabilities, unreviewed media publication and excessive bandwidth use against public assets.

The site contains no secrets. Anything prefixed with `VITE_` is public at build time and must never contain credentials or private tokens.

## Current controls

- Netlify serves a restrictive Content Security Policy.
- Framing is denied by CSP and `X-Frame-Options`.
- MIME sniffing is disabled and referrer data is limited.
- Camera, microphone and geolocation are disabled.
- HTTPS is enforced with HSTS after the first secure response.
- Runtime detail shards are restricted to same-origin `/datasets/` paths.
- External media and links accept HTTPS only.
- Catalog, editorial and media-rights checks run during production builds.
- `npm audit` is part of release review.

The CSP permits inline styles because React uses dynamic style attributes for atlas positioning and observation geometry. Scripts remain same-origin; inline or evaluated scripts are not allowed.

## Operational guidance

1. Protect GitHub and Netlify with MFA and least-privilege access.
2. Keep deploy previews private while reviewing unapproved media.
3. Review dependency alerts and lockfile changes before merging.
4. Never place API keys in source, JSON, `VITE_` variables or client code.
5. Run dependency, catalog, editorial and media audits before release.
6. Treat generator input and cached upstream responses as untrusted build input.

## Reporting

Security issues can be reported through the repository owner's GitHub profile linked in the application. Avoid including sensitive information in a public issue.
