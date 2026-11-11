# Requirements Document

## Introduction

The admin area gets an "Iqama Rules" tab at `/admin/iqama`. It lets the Imam view and change the per-prayer iqama rules served by the engine's `/api/v1/admin/iqama-rules` API (UI side only; the engine is specified separately). Forms are generated from the engine catalog, so new rule types need no UI change. Every save goes through a preview that scans the next 365 days.

## Glossary

- **Rule**: The iqama rule of one prayer: a base (`OFFSET`, `FIXED_TIME`, `SCALED_GAP`, `SEASONAL`) plus optional modifiers (limits, rounding, weekday adjust, weekly lock).
- **Catalog**: Response of `GET /catalog`: prayers, base types and their fields, modifier ranges, and the fixed guardrails.
- **Guardrails**: Fixed rules that cannot be edited: iqama at least N min after Azan; Fajr iqama at least M min before sunrise.
- **Friday-start prayers**: Prayers whose catalog entry has `fridayStartRequired` (Fajr, Dhuhr, Asr, Isha). Maghrib may start any day.
- **Adjusted**: A day whose iqama was moved later by a guardrail (`iqama_clamped: true`).
- **Preview token**: `previewId` returned by `POST /preview`, required by `PUT /base`.

## Requirements

### Requirement 1: Tab and route

1. THE Admin_Nav SHALL show an "Iqama Rules" tab linking to `/admin/iqama`, next to the existing "Iqama" (overrides) tab.
2. THE route SHALL render `IqamaRulesPage` inside the existing admin auth gate.

### Requirement 2: Prayer cards

1. THE page SHALL show one card per prayer (Fajr, Dhuhr, Asr, Maghrib, Isha).
2. EACH card SHALL show a plain-English sentence for the rule, e.g. "Azan + 5 min, rounded up to the next 5".
3. A card with unsaved changes SHALL show an "Edited" badge.
4. IF the engine mode is not `db`, THEN the page SHALL show a notice that the public schedule does not use these rules yet.
5. IF a prayer has no stored rule (legacy mode), THEN the card SHALL start from a default of Azan + 10 min.

### Requirement 3: Edit sheet

1. TAPPING a card SHALL open a bottom sheet for that prayer.
2. THE sheet SHALL let the user pick a rule type and fill its fields, all rendered from the catalog (`int`, `time`, `list`, `oneOf` field kinds).
3. THE sheet SHALL offer toggles for the modifiers: Limits, Rounding, Weekday adjust, and Weekly hold (only where the catalog allows it; the sunrise limit only for Fajr).
4. THE sheet SHALL show a live 7-day strip (Azan → Iqama per day) from `POST /preview`, debounced, with an "Adjusted" badge on adjusted days.
5. IF a number field is empty, THEN the sheet SHALL not call the API and SHALL disable "Add to changes".
6. "Add to changes" SHALL put the rule in the local draft; nothing is saved yet.

### Requirement 4: Review and save

1. WHEN the draft has changes, THE page SHALL show a sticky "Unsaved changes" bar with Discard and "Review & save".
2. THE review dialog SHALL show the effective date (default: the engine's `defaultEffectiveFrom`, the next Friday) and the 365-day scan: days changed, days adjusted, per-prayer counts, first changed dates, first adjusted dates, and warnings.
3. IF a changed prayer is Friday-start and the date is not a Friday, THEN the dialog SHALL show an error naming the prayers and SHALL block saving. Friday quick-pick buttons SHALL be offered. A Maghrib-only change SHALL accept any date.
4. SAVING SHALL require an explicit confirmation checkbox, then `PUT /base` with the preview token and the revision the page loaded.
5. ON 409 (stale revision) THE dialog SHALL show the server message; closing it SHALL discard the draft and reload.
6. ON 422 (bad token) THE page SHALL scan again to get a new token.
7. ON success THE page SHALL clear the draft, reload, and show a success message.

### Requirement 5: Always applied

1. THE page SHALL end with a read-only "Always applied" section, a numbered list of four rules: at least N min after Azan (all prayers, overrides too); Fajr at least M min before sunrise; Fajr, Dhuhr, Asr, Isha rule changes start on a Friday; Maghrib can start any day.
2. N and M and the prayer lists SHALL come from the catalog, not be hard-coded.
3. A note SHALL say these cannot be changed here and that breaking times are moved later and marked "adjusted".
4. THE section SHALL have no edit controls.

### Requirement 6: Override warnings

1. ON the Overrides tab, an override row SHALL show a warning when any day in its next 31 days has `iqama_clamped` for that prayer (read from the schedule range API).
2. IF the schedule request fails, THEN no warning SHALL be shown.

### Requirement 7: Mobile and accessibility

1. All controls SHALL have 44px touch targets.
2. THE UI SHALL use no drag-and-drop and no new libraries.
3. Dialogs SHALL have `role="dialog"`, `aria-modal`, a label, and close on Escape.
