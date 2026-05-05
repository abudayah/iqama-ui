---
inclusion: fileMatch
fileMatchPattern: 'src/pages/RamadanEidPage*'
---

# Ramadan & Eid Admin Page

This document describes the `RamadanEidPage` component and its supporting code in `src/pages/`, `src/hooks/`, `src/services/`, and `src/logic/`.

## Overview

The Ramadan & Eid admin page (`/admin/eid`) lets the Imam manage three things:

1. **Moon Sighting** — Declare whether the Hijri month ends today (29 days) or completes 30 days
2. **Eid Prayer Times** — Set prayer times for Eid al-Fitr and Eid al-Adha
3. **Qiyam al-Layl** — Set the nightly start time for the last 10 nights of Ramadan

## Component Architecture

### `RamadanEidPage` (`src/pages/RamadanEidPage.tsx`)

The main page component. Exports two things:

- **`RamadanEidPage`** (default export) — the React component
- **`computeConsequenceText(hijriMonth, length, referenceDate)`** — pure function, exported for testing

### Exported Helper: `computeConsequenceText`

```ts
computeConsequenceText(hijriMonth: number, length: 29 | 30, referenceDate: Date): string
```

Returns the consequence text shown in the ConfirmationSheet:
- Month 9 (Ramadan) → `"Eid al-Fitr will fall on <formatted date>"`
- Month 11 (Dhul Qi'dah) → `"Eid al-Adha will fall on <formatted date>"`
- All other months → `"Month will be <length> days"`

Uses `calculateEidDate` from `src/logic/calculate-eid-date.ts` for date calculation.

## UX Flow: Moon Sighting

1. **SightingCard** is always rendered (even during loading/error states) — `data-testid="sighting-card"`
2. When status loads, two decision buttons appear:
   - **"Yes, Month ends today"** → 29-day month
   - **"No, Complete 30 days"** → 30-day month
3. Tapping a button opens the **ConfirmationSheet** (inline, no modal) showing consequence text
4. **Confirm** behavior depends on the current Hijri month:
   - **Month 9 or 11** (Eid months): opens `EidPrayerModal` — POST is dispatched from within the modal
   - **All other months**: dispatches POST directly, shows success/error inline
5. **Cancel** closes the ConfirmationSheet without any network call

## Status Badges

- `data-testid="confirmed-badge"` — shown when `status.hasOverride === true`
- `data-testid="pending-badge"` — shown when `status.hasOverride === false`

## Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useSightingStatus` | `src/hooks/useSightingStatus.ts` | Fetches current Hijri date + override status |
| `useEidPrayers` | `src/hooks/useEidPrayers.ts` | Fetches Eid prayer records |
| `useQiyamConfig` | `src/hooks/useQiyamConfig.ts` | Fetches + saves Qiyam config |

### `useSightingStatus` return shape

```ts
{
  status: HijriCalendarStatus | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

`HijriCalendarStatus` fields: `gregorianDate`, `hijriYear`, `hijriMonth`, `hijriDay`, `hasOverride`, `overrideLength`.

## Services

`src/services/hijri-calendar-service.ts` — all API calls for this feature:

- `fetchHijriStatus()` → `GET /hijri-calendar/status`
- `submitOverride(payload)` → `POST /hijri-calendar/override`
- `deleteOverride()` → `DELETE /hijri-calendar/override`
- `fetchEidPrayers(type?)` → `GET /hijri-calendar/eid-prayers`
- `fetchQiyamConfig()` → `GET /hijri-calendar/qiyam-config`
- `saveQiyamConfig(hijriYear, startTime)` → `POST /hijri-calendar/qiyam-config`

## Logic

### `calculateEidDate` (`src/logic/calculate-eid-date.ts`)

```ts
calculateEidDate(currentDate: Date, isSighted: boolean, eidType: 'FITR' | 'ADHA'): Date
```

- `isSighted = true` → new month starts tomorrow (currentDate + 1)
- `isSighted = false` → month completes 30 days (currentDate + 2)
- Eid al-Fitr = month start + 0 days
- Eid al-Adha = month start + 9 days

### `ceilToNearest15` (`src/logic/ceil-to-nearest-15.ts`)

Used by `EidPrayerModal` to compute default prayer times from sunrise.

## Components

### `EidPrayerModal` (`src/components/EidPrayerModal.tsx`)

Modal for setting Eid prayer times. Props:

```ts
{
  eidType: 'EID_AL_FITR' | 'EID_AL_ADHA';
  eidDate: Date;
  sunriseTime: string;   // HH:mm
  hijriYear: number;
  hijriMonth: number;
  length: 29 | 30;
  onSubmit: (payload: SubmitOverridePayload) => Promise<void>;
  onClose: () => void;
}
```

Default prayer times are computed from sunrise:
- 1st prayer: `ceilToNearest15(sunrise + 20 min)` for Eid al-Fitr, `+15 min` for Eid al-Adha
- 2nd prayer: 1st prayer + 90 min

## Key Test IDs

| `data-testid` | Element |
|---------------|---------|
| `sighting-card` | Moon sighting section wrapper (always present) |
| `status-skeleton` | Loading skeleton |
| `status-error` | Error message |
| `hijri-date` | Hijri date display text |
| `confirmed-badge` | Green "Confirmed" badge |
| `pending-badge` | Amber "Pending" badge |
| `decision-yes` | "Yes, Month ends today" button |
| `decision-no` | "No, Complete 30 days" button |
| `sighting-success` | Success message after POST |
| `sighting-error` | Error message after failed POST |
| `eid-card-EID_AL_FITR` | Eid al-Fitr card |
| `eid-card-EID_AL_ADHA` | Eid al-Adha card |
| `edit-eid-button-EID_AL_FITR` | Edit button for Eid al-Fitr |
| `edit-eid-button-EID_AL_ADHA` | Edit button for Eid al-Adha |
| `qiyam-time-input` | Qiyam time `<input type="time">` |
| `save-qiyam-button` | Save Qiyam time button |
| `qiyam-save-success` | Success message after Qiyam save |
| `qiyam-save-error` | Error message after failed Qiyam save |

## Qiyam Active Nights

The UI label reads **"Active nights: 21st–30th Ramadan"** (display label).

The backend injects `qiyam_time` on Hijri days **20–29** of month 9. The display label uses 21st–30th because these are the *nights* (the night of the 21st begins after Maghrib on the 20th). Do not change the backend range to match the display label.

## Critical Rules

1. **SightingCard is always rendered** — never conditionally hide it based on loading/error state.
2. **ConfirmationSheet before POST** — never dispatch POST directly from a decision button tap.
3. **Eid months open modal** — months 9 and 11 must open `EidPrayerModal` after Confirm; POST is dispatched from within the modal.
4. **`computeConsequenceText` must be exported** — it is tested independently.
5. **`deleteOverride` is not imported in the current component** — moon sighting only submits overrides (29 or 30 days); there is no "reset to astronomical" button in this flow.
