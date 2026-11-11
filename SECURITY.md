# Security Policy

## Supported versions

Only the latest code on `main` is supported. There are no maintained release branches.

## Reporting a vulnerability

Please report privately using GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability** (Security Advisories).

Please do not open a public issue or pull request for a suspected vulnerability. Include what you found, steps to reproduce, and the impact.

The backend lives in a separate repository, [iqama-engine](https://github.com/abudayah/iqama-engine). Report server-side issues there.

## Scope

In scope: the code in this repository (the React app, its build configuration, and the CSP it ships with).

Out of scope: the engine/API (separate repo), third-party services, and issues that need a modified browser or device that the attacker already controls.

## How the admin key is handled

- The admin area asks for a password on a login screen. The value is sent to the engine as the `x-api-key` header on admin requests.
- It is stored **in plain text in the browser's `localStorage`** under the key `iqama_ui_api_key` (the API URL is under `iqama_ui_base_url`). It is not an httpOnly cookie.
- Risk: any script that runs on the page (for example through an XSS bug) can read it. Anyone with access to the browser profile can also read it. Use the admin area only on devices you trust.
- "Sign out" in the admin header clears the stored key.
- There are no per-user accounts: the key is a single shared password that is checked by the engine.

## Content Security Policy

`vite.config.ts` builds a Content-Security-Policy from `VITE_API_BASE_URL`. In development it is sent as a response header; in the built HTML it is injected as a `<meta http-equiv>` tag. It is:

```
default-src 'self';
connect-src 'self' <origin of VITE_API_BASE_URL>;
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
worker-src 'self' blob:;
manifest-src 'self'
```

Notes:

- `connect-src` allows only the app's own origin and the API origin. If `VITE_API_BASE_URL` is unset or invalid, it falls back to `'self'` only.
- `script-src` includes `'unsafe-inline'` (the config comment says this is needed for Vite HMR in dev). It is also present in the built policy, which weakens XSS protection.
- A `<meta>` CSP cannot set some directives (such as `frame-ancestors`); this project does not set any HTTP security headers itself. Those depend on how the site is hosted.
- The API URL can also be stored in `localStorage` by the user; if it points to a different origin than `VITE_API_BASE_URL`, the CSP blocks the requests.

## Secrets and `VITE_` variables

Every `VITE_*` variable is embedded in the public JavaScript bundle. Never put passwords, API keys, or tokens in them. The variables used are `VITE_API_BASE_URL`, `VITE_BASE_PATH` and `VITE_MASJID_TIMEZONE`; none are secret. `.env` files are git-ignored (only `.env.example` is committed).

## Dependencies

Dependencies are installed from the committed `package-lock.json` (`npm ci`). Keep them updated and run `npm audit` before releases. There is no automated dependency-update bot configured in this repository.
