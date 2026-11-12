# Implementation Plan: Iqama Rules Admin Tab

## Overview

UI side of the iqama rule engine. Phase 3 (this UI) is complete. The engine phases are tracked in the engine repo.

## Tasks

- [x] 1. Phase 3: Iqama Rules tab
  - [x] 1.1 Types, service and logic
    - `src/types/iqama-rules.ts`, `src/services/iqama-rules-service.ts`, `src/logic/iqama-rules.ts`, `src/logic/rule-defaults.ts`
    - Add `iqama_clamped?` to `PrayerEntry`
    - _Requirements: 2, 3, 4_
  - [x] 1.2 Hooks
    - `useIqamaRules`, `useIqamaRulesDraft`
    - _Requirements: 2, 4_
  - [x] 1.3 Components
    - `RuleCard`, `RuleFields`, `RuleSheet`, `RuleReviewDialog`
    - _Requirements: 2, 3, 4, 7_
  - [x] 1.4 Page, route and nav
    - `IqamaRulesPage`, route `/admin/iqama`, "Iqama Rules" tab in `AdminNav`
    - _Requirements: 1_
  - [x] 1.5 Override warnings
    - `useOverrideClamps`, warning in `OverrideRow` via `OverrideList`
    - _Requirements: 6_
  - [x] 1.6 Tests
    - Page, logic and draft tests
    - _Requirements: 2, 3, 4, 6_

- [x] 2. "Always applied" section
  - [x] 2.1 `GuardrailsNote`: read-only numbered list from the catalog, note below it
  - [x] 2.2 Rename the sheet badge from "Clamped" to "Adjusted"
  - [x] 2.3 Test: four items, values from the catalog, no controls
  - _Requirements: 5_

- [x] 3. Phase 4A: docs and spec
  - [x] 3.1 This spec (`requirements.md`, `design.md`, `tasks.md`)
  - [x] 3.2 README section and steering file `.kiro/steering/iqama-rules-admin.md`

- [ ] 4. Not done
  - [ ] 4.1 Pre-save clamp warning in the override form (needs an engine endpoint)
  - [ ] 4.2 Browser check on a real phone

- [x] 5. Phase 5: overrides tab rename, reason, conflicts, overlap errors
  - [x] 5.1 One "Iqama" nav tab with a Rules | Overrides segmented control (`IqamaTabLayout`); draft kept across views
  - [x] 5.2 Reason box and `reason` in `PUT /base`
  - [x] 5.3 Fajr conflicts list, required acknowledgement, `acknowledgeConflicts`
  - [x] 5.4 Inline 409 overlap message in the override form
  - [x] 5.5 "Conflict" badge in Weekly View
  - _Requirements: 8_

- [x] 6. Phase 6: external review of PR #3
  - [x] 6.1 Baseline from `latest`; versions panel (editing on top of, in force, upcoming, history)
  - [x] 6.2 Confirmation and Fajr acknowledgement bound to one preview; request key; revision check; late answers ignored; 422 / 409 / 400 handling
  - [x] 6.3 Catalog-driven recursive validator, structured fields, no invented defaults
  - [x] 6.4 Mode-aware success text; guardrail copy; override hint
  - [x] 6.5 Dialog focus trap, return, inert background (`useModalA11y`)
  - [x] 6.6 `useOverrideClamps` keyed on type and value, shared requests, hook tests
  - [x] 6.7 Contract tests against engine snapshots (catalog and seed rules)
  - [x] 6.8 Spec design.md rewritten for the full contract
  - _Requirements: 9_
