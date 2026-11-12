---
inclusion: fileMatch
fileMatchPattern: 'src/pages/IqamaRulesPage*,src/components/iqama-rules/*,src/hooks/useIqamaRules*,src/hooks/useOverrideClamps*'
---

# Iqama Rules Admin Page

`/admin/iqama` ("Rules" view of the "Iqama" nav tab) edits the per-prayer iqama rules via the engine's `/api/v1/admin/iqama-rules` API. `/admin` (default view "Overrides") shares the tab through `IqamaTabLayout`, which owns the Rules draft so it survives switching views (a dot on "Rules" marks unsaved changes). Spec: `.kiro/specs/iqama-rules-admin/`.

## Flow

1. `useIqamaRules` loads `GET /` and `GET /catalog`. The baseline is `config.latest.rules` (the NEWEST version), never `effective`.
2. One `RuleCard` per prayer shows a sentence from `describeRule`.
3. Tap opens `RuleSheet`: rule type, catalog-driven fields (`RuleFields`), modifier toggles, live 7-day strip from `POST /preview` (400 ms debounce).
4. "Add to changes" writes to `useIqamaRulesDraft`. A rule equal to the saved one is dropped from the draft.
5. Sticky "Unsaved changes" bar → `RuleReviewDialog`: effective date, 365-day scan, confirm checkbox → `PUT /base` with `previewId` and `expectedRevision`.
6. `GuardrailsNote` ("Always applied") ends the page.

## Critical rules

1. **Forms and validation come from the catalog** (`RuleFields`, `logic/rule-validator.ts`): kinds, labels, ranges, options, list sizes, variants, prayer lists. No string parsing, no invented defaults (only catalog `default`s). A new rule type needs the `RuleBase` union and `describeBase` (the sentence), nothing else.
2. **"Always applied" is read-only** and reads its numbers and prayer lists from `catalog.guardrails` and `catalog.prayers`. No edit controls.
3. **Friday-start prayers** (catalog `fridayStartRequired`: Fajr, Dhuhr, Asr, Isha): the review dialog shows an error and blocks saving on a non-Friday date. Maghrib may start any day.
4. **Preview before save.** Never call `PUT /base` without a fresh `previewId`. On 422 scan again; on 409 show the server message, then discard the draft and reload on close.
5. **UI wording is "Adjusted"**, the API field is `iqama_clamped`.
6. **Override warnings** (`useOverrideClamps` → `OverrideRow`) look at the next 31 days only and stay silent if the request fails.
7. **44px touch targets, no drag-and-drop, no new libraries.**
8. **Empty number inputs are `NaN` in state.** They must not reach the API; the sheet blocks preview and "Add to changes" while any is `NaN`.

## Local dev

`VITE_API_BASE_URL` must match the CSP origin exactly. `vite.config.ts` sets `connect-src` to the origin of this variable, and the browser keeps the API URL in localStorage (`iqama_ui_base_url`). Use `http://localhost:3000`, not `http://127.0.0.1:3000`; a mismatch shows "Network request failed". The engine's `CORS_ORIGIN` must include `http://localhost:5173`.
9. **Build every proposal from `latest.rules`** and show "Editing on top of version N" plus scheduled versions. Building from today's effective rules would revert changes scheduled in an upcoming version.
10. **Confirmation belongs to one preview.** The confirmation and the Fajr acknowledgement are stored against `previewId`; the preview is only used while its request key (rules, date, revision) is current; late answers are ignored; any 422 drops the preview and scans again; a revision mismatch blocks saving.
11. **Dialogs** use `useModalA11y` (focus in and back, trap, Escape, inert background) and render in a portal.
12. **Contract** lives in the engine (`iqama-rules-system.md`, "UI contract (exact shapes)"). Test fixtures `src/test/engine-*.fixture.ts` are snapshots of it; update them with the contract.
