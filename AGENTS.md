# AGENTS.md

Guide for AI agents and human reviewers working on this repository.

## What this is

`iqama-ui` is the front end of a masjid prayer-times system.

- **Public display** (`/`, and an embeddable `/widget`): live countdown to the next Azan and Iqama, a sky scene, moon phase, today/tomorrow table. Installable as a PWA.
- **Admin** (`/admin/*`): behind a password prompt. Tabs: Iqama (overrides), Weekly View, Ramadan & Eid, Adhan.

The backend is a separate repo, [iqama-engine](https://github.com/abudayah/iqama-engine). **The engine is the source of truth** for all prayer and iqama times, Hijri dates and validation. This repo only displays them and sends admin changes. The API contract lives in the engine; this repo's types in `src/types/` mirror it.

> The "Iqama Rules" admin page (`/admin/iqama`, rule editor with preview) arrives with [PR #3](https://github.com/abudayah/iqama-ui/pull/3). It is not on `main` yet.

## Stack

From `package.json` (ranges, not pinned; `package-lock.json` pins the installed versions):

| Area | Used |
|---|---|
| UI | React `^19`, react-router-dom `^6` |
| Build | Vite `^6`, `vite-plugin-pwa` `^0.21`, TypeScript `^5` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Styling | Tailwind CSS `^3` (utility classes in JSX, no component library) |
| Dates | dayjs `^1.11`, dayjs-hijri |
| Tests | Vitest `^4` (jsdom), Testing Library, msw `^2`, fast-check `^3` |
| Lint/format | ESLint 9 (typescript-eslint, react, react-hooks), Prettier (single quotes, 100 cols), husky + lint-staged |

CI (`.github/workflows/build-and-deploy.yml`) uses Node 20 and runs `npm ci` and `npm run build` only; it does **not** run lint or tests. Run them yourself.

## Commands

```bash
npm ci                 # install (use ci, the lockfile is committed)
cp .env.example .env   # then edit
npm run dev            # Vite dev server on http://localhost:5173
npm run build          # tsc -b && vite build
npm run lint           # eslint src
npm run test           # vitest --run (all tests, once)
npx vitest --run src/path/to/file.test.tsx   # one file
```

Run the dev server against a local engine:

```bash
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

`VITE_API_BASE_URL` must match the origin the browser uses **exactly** (`http://localhost:3000`, not `http://127.0.0.1:3000`), because it also sets the CSP `connect-src` (see below). The API URL is also remembered in the browser's localStorage, so an old stored value can override it.

## Environment variables (`.env.example`)

| Variable | Meaning |
|---|---|
| `VITE_API_BASE_URL` | Engine base URL, no `/api` suffix (paths already contain `/api/v1/...`). When set, the first-run URL screen is skipped. |
| `VITE_BASE_PATH` | App base path, `/` or e.g. `/ui/`. |
| `VITE_MASJID_TIMEZONE` | IANA zone of the masjid (e.g. `America/Vancouver`). Used so "now" is evaluated in masjid time. Defaults to `UTC` if unset. |

`README.md` still shows a `VITE_API_KEY` line; the code does not read it. The admin password is typed at the login screen.

## Layout

```
src/
  api/          apiFetch + error classes (ApiError, AuthError, NetworkError, ParseError)
  components/   presentational and feature components (adhan-config/ for the Adhan tab)
  hooks/        React hooks (data fetching, drafts, countdown, simulator)
  logic/        pure functions, no React (countdown, next prayer, dates)
  pages/        route-level pages (PrayerViewerPage, WidgetPage, AdminPage, ...)
  services/     API calls, one file per backend area
  store/        config store (localStorage: API URL and admin key)
  types/        shared TypeScript types
.kiro/          specs and steering notes (design history; read before big changes)
```

Tests sit next to the code as `*.test.ts(x)` and `*.property.test.ts(x)` (fast-check).

## Conventions

- **Service pattern:** every backend call goes through `apiFetch` in `src/api/api-client.ts` from a function in `src/services/`. Admin calls pass `requiresAuth: true`, which sends the key in the `x-api-key` header. Don't call `fetch` directly in components.
- **Draft reducer pattern:** admin forms collect edits in a local `useReducer` draft (see `src/hooks/useAdhanDraft.ts`), show a sticky "Unsaved changes" bar, then Review & save (preview, then confirm, then write). Nothing is written until confirmed.
- **Pure logic in `src/logic/`**, with tests; keep React out of it.
- **Mobile first:** design for a phone width, then widen. Interactive controls are at least 44px tall/wide (`min-h-[44px]`). No drag-and-drop.
- **Accessibility:** real buttons/labels, `role` and `aria-*` on dialogs and tabs, Escape closes dialogs, don't rely on colour alone.
- **Theme:** Tailwind utilities, consistent with neighbouring components (gray/white cards, blue primary, amber warnings, red errors).
- **Types:** strict TypeScript. No `any` without a reason.
- **No new dependencies** for small things.

## Known test failures (not caused by your PR)

On `main` (commit `31a23115`), `npm run test` reports 12 failing tests, all in:

- `src/logic/derive-countdown.test.ts` and `derive-countdown.property.test.ts`
- `src/logic/derive-next-prayer.test.ts`

They fail without any change. I did not investigate the cause. Also, `src/components/eid-card.property.test.tsx` has failed once with a "multiple elements" error and passed on re-run (it looks flaky). Don't blame a PR for these unless it touches those files.

## PR and commit rules

- Branch from `main`; open a PR into `main`. Never push to `main` directly.
- Keep PRs small and focused; describe what changed, how it was tested, and anything not verified.
- Commit messages are short and in the repo's existing style: `type(scope): summary` (e.g. `feat(admin): ...`, `fix(schedule): ...`, `docs(...)`, `test(ui): ...`).
- Before opening: `npm run build`, `npm run lint`, and the tests for the files you touched. A husky pre-commit hook runs lint-staged (eslint --fix, prettier).
- Never commit `.env` files or secrets (`.env*` is git-ignored except `.env.example`).

## How to review

1. **The UI never computes iqama or prayer times.** Times, Hijri dates, clamping/adjusting, and validation come from the engine. Flag any new client-side prayer-time or iqama arithmetic. (Display helpers such as countdowns, formatting, or choosing "next prayer" from engine data are fine.)
2. **API usage:** calls go through `apiFetch` and a service; admin calls set `requiresAuth`; errors are shown to the user, not swallowed.
3. **Types match the engine contract** in `iqama-engine`; optional fields stay optional so the UI works with older engines.
4. **Accessibility:** labels, roles, keyboard access, focus, Escape on dialogs, contrast.
5. **Mobile:** works at 360px width; 44px touch targets; no horizontal overflow; no drag-and-drop.
6. **Secrets:** no keys, passwords or tokens in code, tests, `.env.example`, or any `VITE_*` variable (they are embedded in the public bundle).
7. **CSP:** `vite.config.ts` builds the Content-Security-Policy from `VITE_API_BASE_URL`. A change that calls a new origin (fonts, analytics, another API) must update it on purpose; don't loosen `default-src`/`script-src` casually.
8. **Tests:** new logic has tests (Vitest; msw for network). Don't delete or weaken tests to make a PR pass.
9. **Scope:** no unrelated refactors, no new libraries for small things.
