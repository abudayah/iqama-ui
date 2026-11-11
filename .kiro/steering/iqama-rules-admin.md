---
inclusion: fileMatch
fileMatchPattern: 'src/pages/IqamaRulesPage*,src/components/iqama-rules/*,src/hooks/useIqamaRules*,src/hooks/useOverrideClamps*'
---

# Iqama Rules Admin Page

`/admin/iqama` (tab label "Iqama Rules") edits the per-prayer iqama rules via the engine's `/api/v1/admin/iqama-rules` API. The "Iqama" tab at `/admin` is the overrides page; do not confuse them. Spec: `.kiro/specs/iqama-rules-admin/`.

## Flow

1. `useIqamaRules` loads `GET /` and `GET /catalog`.
2. One `RuleCard` per prayer shows a sentence from `describeRule`.
3. Tap opens `RuleSheet`: rule type, catalog-driven fields (`RuleFields`), modifier toggles, live 7-day strip from `POST /preview` (400 ms debounce).
4. "Add to changes" writes to `useIqamaRulesDraft`. A rule equal to the saved one is dropped from the draft.
5. Sticky "Unsaved changes" bar → `RuleReviewDialog`: effective date, 365-day scan, confirm checkbox → `PUT /base` with `previewId` and `expectedRevision`.
6. `GuardrailsNote` ("Always applied") ends the page.

## Critical rules

1. **Forms come from the catalog.** Do not hard-code rule types, ranges, or prayer lists in the UI.
2. **"Always applied" is read-only** and reads its numbers and prayer lists from `catalog.guardrails` and `catalog.prayers`. No edit controls.
3. **Friday-start prayers** (catalog `fridayStartRequired`: Fajr, Dhuhr, Asr, Isha): the review dialog shows an error and blocks saving on a non-Friday date. Maghrib may start any day.
4. **Preview before save.** Never call `PUT /base` without a fresh `previewId`. On 422 scan again; on 409 show the server message, then discard the draft and reload on close.
5. **UI wording is "Adjusted"**, the API field is `iqama_clamped`.
6. **Override warnings** (`useOverrideClamps` → `OverrideRow`) look at the next 31 days only and stay silent if the request fails.
7. **44px touch targets, no drag-and-drop, no new libraries.**
8. **Empty number inputs are `NaN` in state.** They must not reach the API; the sheet blocks preview and "Add to changes" while any is `NaN`.

## Local dev

`VITE_API_BASE_URL` must match the CSP origin exactly. `vite.config.ts` sets `connect-src` to the origin of this variable, and the browser keeps the API URL in localStorage (`iqama_ui_base_url`). Use `http://localhost:3000`, not `http://127.0.0.1:3000`; a mismatch shows "Network request failed". The engine's `CORS_ORIGIN` must include `http://localhost:5173`, and its `IQAMA_RULES` must be `db` for the public schedule to use the rules.
