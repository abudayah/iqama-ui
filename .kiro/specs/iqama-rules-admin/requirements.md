# Requirements Document

## Introduction

The admin area gets an "Iqama Rules" tab at `/admin/iqama`. It lets the Imam view and change the per-prayer iqama rules served by the engine's `/api/v1/admin/iqama-rules` API (UI side only; the engine is specified separately). Forms and validation are generated from the engine catalog; only the plain-English sentence of a brand-new rule type needs UI code. Every save goes through a preview that scans the next 365 days.

## Glossary

- **Rule**: The iqama rule of one prayer: a base (`OFFSET`, `FIXED_TIME`, `SCALED_GAP`, `SEASONAL`) plus optional modifiers (limits, rounding, weekday adjust, weekly lock).
- **Catalog**: Response of `GET /catalog`: prayers, base types and their fields, modifier ranges, and the fixed guardrails.
- **Guardrails**: Fixed rules that cannot be edited: iqama at least N min after Azan; Fajr iqama at least M min before sunrise.
- **Friday-start prayers**: Prayers whose catalog entry has `fridayStartRequired` (Fajr, Dhuhr, Asr, Isha). Maghrib may start any day.
- **Adjusted**: A day whose iqama was moved later by a guardrail (`iqama_clamped: true`).
- **Preview token**: `previewId` returned by `POST /preview`, required by `PUT /base`.

## Requirements

### Requirement 1: Tab and route

1. THE nav SHALL have one "Iqama" tab; `/admin/iqama` is its "Rules" view (see Requirement 8.5).
2. THE route SHALL render `IqamaRulesPage` inside the existing admin auth gate.

### Requirement 2: Prayer cards

1. THE page SHALL show one card per prayer (Fajr, Dhuhr, Asr, Maghrib, Isha).
2. EACH card SHALL show a plain-English sentence for the rule, e.g. "Azan + 5 min, rounded up to the next 5".
3. A card with unsaved changes SHALL show an "Edited" badge.
4. IF the engine mode is not `db`, THEN the page SHALL show a notice that the public schedule does not use these rules yet.
5. IF nothing is saved on the engine, THEN the page SHALL say so and offer no editing (no invented default rule).

### Requirement 3: Edit sheet

1. TAPPING a card SHALL open a bottom sheet for that prayer.
2. THE sheet SHALL let the user pick a rule type and fill its fields, all rendered and validated from the catalog (`int`, `time`, `enum`, `bool`, `list`, `object` with variants).
3. THE sheet SHALL offer toggles for the modifiers: Limits, Rounding, Weekday adjust, and Weekly hold (only where the catalog allows it; the sunrise limit only for Fajr).
4. THE sheet SHALL show a live 7-day strip (Azan → Iqama per day) from `POST /preview`, debounced, with an "Adjusted" badge on adjusted days.
5. IF any field is invalid (empty required, decimal where an integer is required, out of range, wrong list size, bad time), THEN the sheet SHALL show the error beside the field, SHALL not call the API, and SHALL disable "Add to changes".
6. "Add to changes" SHALL put the rule in the local draft; nothing is saved yet.

### Requirement 4: Review and save

1. WHEN the draft has changes, THE page SHALL show a sticky "Unsaved changes" bar with Discard and "Review & save".
2. THE review dialog SHALL show the effective date (default: the engine's `defaultEffectiveFrom`, the next Friday) and the 365-day scan: days changed, days adjusted, per-prayer counts, first changed dates, first adjusted dates, and warnings.
3. IF a changed prayer is Friday-start and the date is not a Friday, THEN the dialog SHALL show an error naming the prayers and SHALL block saving. Friday quick-pick buttons SHALL be offered. A Maghrib-only change SHALL accept any date.
4. SAVING SHALL require an explicit confirmation checkbox, then `PUT /base` with the preview token, `requestHash` and the revision the page loaded.
5. ON 409 or `IQAMA_REVISION_STALE` THE dialog SHALL show the server message and block saving; "Reload latest rules" discards the draft and reloads.
6. ON any 422 THE page SHALL drop the preview, show the message, and scan again; the confirmation is needed again.
7. ON success THE page SHALL clear the draft, reload, and show a success message that depends on the engine mode (`db` published, `shadow` still comparing, `legacy` public schedule unchanged).

### Requirement 5: Always applied

1. THE page SHALL end with a read-only "Always applied" section, a numbered list of four rules: at least N min after Azan (all prayers, overrides too); Fajr at least M min before sunrise; Fajr, Dhuhr, Asr, Isha rule changes start on a Friday; Maghrib can start any day.
2. N and M and the prayer lists SHALL come from the catalog, not be hard-coded.
3. A note SHALL say these cannot be changed here and that times they move are marked "adjusted". THE copy SHALL NOT imply that all constraints are always satisfiable: the Fajr sunrise buffer is normally enforced, and when it clashes with the minimum gap the gap wins, the day is flagged, and the admin must acknowledge it.
4. THE section SHALL have no edit controls.
5. WHEN the catalog has `guardrails.iqamaStepMinutes`, THE section SHALL add an item "Every iqama is on a N-minute mark"; the item is hidden when the field is missing. THE override time input SHALL use a 5-minute step with a hint saying the final time can be moved further to keep the safety rules.

### Requirement 6: Override warnings

1. ON the Overrides tab, an override row SHALL show a warning when any day in its next 31 days has `iqama_clamped` for that prayer (read from the schedule range API).
2. IF the schedule request fails, THEN no warning SHALL be shown.

### Requirement 7: Mobile and accessibility

1. All controls SHALL have 44px touch targets.
2. THE UI SHALL use no drag-and-drop and no new libraries.
3. Dialogs SHALL have `role="dialog"`, `aria-modal`, a label, and close on Escape.

### Requirement 8: Reason, Fajr conflicts, overlaps, Weekly View (phase 5)

1. THE review dialog SHALL have an optional "Reason for change" box (max 500) sent as `reason` in `PUT /base` when not empty.
2. WHEN the preview returns `conflicts`, THE dialog SHALL list them and require a checkbox "I understand Fajr will be less than N min before sunrise on these days" before Save; THE save SHALL send `acknowledgeConflicts: true`. Without `conflicts`, nothing changes.
3. WHEN saving an override returns 409, THE override form SHALL show the server message near the dates.
4. THE Weekly View SHALL show a small "Conflict" badge for days or prayers with `iqama_conflict`, when the field is present.
5. THE nav SHALL have 4 tabs: Iqama, Weekly View, Ramadan & Eid, Adhan. The single "Iqama" tab SHALL cover `/admin` (Overrides, default) and `/admin/iqama` (Rules), with a segmented control (`role=tablist`, arrow keys, 44px) at the top. The Rules draft SHALL survive switching, with a dot on "Rules" while it has changes.

### Requirement 9: Review fixes (phase 6)

1. EVERY proposal SHALL be built from `latest.rules` (the newest version), never from the version in force today. THE page SHALL show "Editing on top of version N (effective …)", the version in force, and all scheduled (upcoming) versions with effective date, saved-at date and reason (no "who").
2. THE effective date SHALL NOT be earlier than today or the newest version's date.
3. THE confirmation and the Fajr acknowledgement SHALL belong to one preview (its `previewId`); any change of rules, date or revision SHALL remove the preview at once and unset both. Late answers for older requests SHALL be ignored. A preview for another revision than the loaded one SHALL block saving.
4. THE rule form SHALL use catalog defaults only; fields without a default start empty and must be entered. A cleared optional field SHALL be removed, never sent as 0 or NaN; decimals SHALL NOT be truncated.
5. THE rule sheet and review dialog SHALL move focus in, trap it, return it to the trigger, close on Escape, and make the background inert.
6. THE override warning SHALL be recomputed when prayer, type, value or dates change, share identical range requests, and show nothing when the request fails.
