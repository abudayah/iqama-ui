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
2. When status loads, a **3-tile selector** appears with options:
   - **Astronomical** (default) — resets to astronomical calendar (deletes override)
   - **29 Days** — moon sighted, month ends today
   - **30 Days** — complete month
3. Tapping a tile that differs from the current selection opens the **ConfirmationSheet** (inline, no modal) showing consequence text
4. **Confirm** behavior depends on the selected tile and current Hijri month:
   - **Astronomical tile**: calls `deleteOverride()` directly, shows success inline
   - **29 or 30 tile + month 9 or 11** (Eid months): opens `EidPrayerModal` — POST is dispatched from within the modal
   - **29 or 30 tile + all other months**: dispatches POST directly, shows success/error inline
5. **Cancel** closes the ConfirmationSheet without any network call
6. Tapping the already-active tile does nothing

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
| `month-length-tile-astronomical` | "Astronomical" tile (default) |
| `month-length-tile-29` | "29 Days" tile |
| `month-length-tile-30` | "30 Days" tile |
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

The UI label reads **"Active nights: 20th–29th Ramadan"**.

The backend injects `qiyam_time` on Hijri days **20–29** of month 9. The night of the 30th has no Qiyam — it is Eid eve. The label accurately reflects the backend range.

## Critical Rules

1. **SightingCard is always rendered** — never conditionally hide it based on loading/error state.
2. **3-tile selector** — options are Astronomical / 29 Days / 30 Days. Tapping the active tile does nothing.
3. **ConfirmationSheet before POST** — never dispatch POST directly from a tile tap.
4. **Eid months open modal** — months 9 and 11 must open `EidPrayerModal` after Confirm on a 29/30 tile; POST is dispatched from within the modal.
5. **Astronomical tile calls `deleteOverride()`** — not `submitOverride()`.
6. **`computeConsequenceText` must be exported** — it is tested independently.
7. **Qiyam label is "20th–29th Ramadan"** — the night of the 30th has no Qiyam (it is Eid eve).
8. **OFFSET range is -120 to +120 minutes** — negative offsets are valid (e.g. Fajr earlier than Azan is not valid in practice, but the UI allows the full range).
