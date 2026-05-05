# Requirements Document

## Introduction

This feature delivers two related changes to the iqama system.

**Change 1 — Redesign the admin "Eid & Moon Sighting" tab into "Ramadan & Eid":** The existing `EidMoonSightingPage` at `/admin/eid` is redesigned with a richer layout organised into three sections: Moon Sighting, Eid Prayer Times, and Qiyam al-Layl. The `AdminNav` tab label is renamed from "Eid & Moon Sighting" to "Ramadan & Eid". The Moon Sighting section gains a confirmation bottom sheet before POSTing, and the action card is always visible (not gated by Hijri day). The Eid Prayer Times section replaces the old "Saved Eid Records" section with clearer source-aware display. A new Qiyam al-Layl section lets the Imam configure a single start time for the last 10 nights of Ramadan.

**Change 2 — Qiyam al-Layl prayer in the public prayer table:** During the last 10 nights of Ramadan (Hijri days 20–29 of month 9), a "Qiyam" row appears in the prayer table after Isha, showing the configured start time with no iqama column. The backend injects `qiyam_time` into `DailySchedule` following the same pattern as `eid_prayer_1`/`eid_prayer_2`. A new `QiyamConfig` Prisma model and two new API endpoints support this.

## Glossary

- **Ramadan_Eid_Page**: The redesigned admin page at `/admin/eid`, replacing the old `EidMoonSightingPage`. Contains three sections: Moon Sighting, Eid Prayer Times, and Qiyam al-Layl.
- **Admin_Nav**: The existing frontend navigation component. Its third tab label is renamed from "Eid & Moon Sighting" to "Ramadan & Eid".
- **Moon_Sighting_Section**: The top section of `Ramadan_Eid_Page`. Displays the current Hijri date status card, a Pending/Confirmed badge, and the action card for submitting a moon-sighting decision.
- **Eid_Prayer_Times_Section**: The middle section of `Ramadan_Eid_Page`. Displays two cards — one for Eid al-Fitr and one for Eid al-Adha — each showing prayer times or a pending message.
- **Qiyam_Section**: The bottom section of `Ramadan_Eid_Page`. Allows the Imam to configure a single Qiyam al-Layl start time for the last 10 nights of Ramadan.
- **Confirmation_Sheet**: A bottom sheet (modal) that appears after the Imam taps a moon-sighting decision button. Shows the consequence of the decision and requires an explicit "Confirm" tap before the POST is fired.
- **Action_Card**: The card within `Moon_Sighting_Section` that prompts the Imam to record a moon-sighting decision. Always visible on the admin page regardless of the current Hijri day.
- **QiyamConfig**: The new Prisma database model storing the Qiyam al-Layl start time for a given Hijri year. Fields: `id`, `hijri_year` (int, unique), `start_time` (string HH:mm), `createdAt`, `updatedAt`.
- **Qiyam_Config_Service**: The backend service responsible for reading and writing `QiyamConfig` records.
- **Hijri_Calendar_Controller**: The existing NestJS controller at `/api/v1/hijri-calendar`, extended with two new Qiyam endpoints.
- **Schedule_Builder_Service**: The existing NestJS service that builds `DailySchedule` objects for a month. Extended to inject `qiyam_time` on qualifying Ramadan nights.
- **DailySchedule**: The existing interface (backend and frontend) representing one day's prayer schedule. Extended with an optional `qiyam_time?: string` field (HH:mm).
- **Qiyam_Nights**: Hijri days 20–29 of Hijri month 9 (Ramadan) in the current Hijri year. These are the evenings of the last 10 nights (nights 21–30).
- **EidPrayerModal**: The existing frontend modal that collects Eid prayer times. Reused as-is.
- **CalendarOverride**: The existing Prisma model storing the Imam's moon-sighting decision for a given Hijri year and month.
- **SpecialPrayer**: The existing Prisma model storing Eid prayer schedules.
- **EID_AL_FITR**: The Eid celebration on the 1st of Shawwal (Hijri month 10).
- **EID_AL_ADHA**: The Eid celebration on the 10th of Dhul-Hijjah (Hijri month 12).

---

## Requirements

### Requirement 1: Rename Admin Tab

**User Story:** As an Imam, I want the admin navigation tab to be labelled "Ramadan & Eid" so that the tab name reflects the full scope of its content.

#### Acceptance Criteria

1. THE Admin_Nav SHALL render the third tab with the label "Ramadan & Eid" instead of "Eid & Moon Sighting".
2. WHEN the `/admin/eid` route is active, THE Admin_Nav SHALL apply the active tab styling (blue underline and blue text) to the "Ramadan & Eid" tab.

---

### Requirement 2: Moon Sighting Section — Status Card

**User Story:** As an Imam, I want to see the current Hijri date and override status at a glance in the Moon Sighting section, so that I have full context before taking action.

#### Acceptance Criteria

1. THE Moon_Sighting_Section SHALL display a status card showing the current Hijri date in the format "[Month Name] [Day], [Year]" (e.g., "Dhul Qi'dah 18, 1447"), the corresponding Gregorian date, and the current Hijri month number.
2. WHEN `hasOverride` is `true`, THE Moon_Sighting_Section SHALL display a "Confirmed" badge on the status card.
3. WHEN `hasOverride` is `false`, THE Moon_Sighting_Section SHALL display a "Pending" badge on the status card.
4. WHEN the `GET /api/v1/hijri-calendar/status` request is loading, THE Moon_Sighting_Section SHALL display a skeleton loading state in place of the status card.
5. IF the `GET /api/v1/hijri-calendar/status` request fails, THEN THE Moon_Sighting_Section SHALL display an error message.

---

### Requirement 3: Moon Sighting Section — Action Card

**User Story:** As an Imam, I want an always-visible action card that lets me record a moon-sighting decision at any time, so that I am not limited to the dashboard's visibility window.

#### Acceptance Criteria

1. THE Moon_Sighting_Section SHALL always render the Action_Card regardless of the current Hijri day.
2. WHEN the current Hijri day is 29, THE Action_Card SHALL display a pulsing blue dot indicator and the label "ACTION NEEDED TODAY".
3. THE Action_Card SHALL display the prompt: "Today is the 29th of [Current Month Name]. Has the crescent moon for [Next Month Name] been sighted?"
4. THE Action_Card SHALL present two buttons: "Yes — moon sighted (29-day month)" and "No — complete 30 days".
5. WHEN the Imam taps either button on the Action_Card, THE Ramadan_Eid_Page SHALL open the Confirmation_Sheet without immediately dispatching a POST request.

---

### Requirement 4: Moon Sighting Section — Confirmation Sheet

**User Story:** As an Imam, I want a confirmation step before my moon-sighting decision is submitted, so that I can review the consequence and avoid accidental submissions.

#### Acceptance Criteria

1. THE Confirmation_Sheet SHALL display the consequence of the selected decision: for Eid months (9 and 11), the exact Gregorian date on which Eid will fall; for all other months, the resulting month length (29 or 30 days).
2. THE Confirmation_Sheet SHALL display a "Confirm" button that fires the `POST /api/v1/hijri-calendar/override` request when tapped.
3. THE Confirmation_Sheet SHALL display a "Cancel" button that dismisses the sheet without submitting.
4. WHEN the Imam taps "Confirm" and the current Hijri month is 9 or 11, THE Ramadan_Eid_Page SHALL close the Confirmation_Sheet and open the `EidPrayerModal` to collect prayer times before the POST is dispatched.
5. WHEN the Imam taps "Confirm" and the current Hijri month is not 9 or 11, THE Ramadan_Eid_Page SHALL dispatch the `POST /api/v1/hijri-calendar/override` request directly and display a success notification upon completion.
6. IF the `POST /api/v1/hijri-calendar/override` request fails, THEN THE Ramadan_Eid_Page SHALL display an inline error message.

---

### Requirement 5: Eid Prayer Times Section

**User Story:** As an Imam, I want to see the Eid al-Fitr and Eid al-Adha prayer times in clearly labelled cards, so that I can review and edit them at any time.

#### Acceptance Criteria

1. THE Eid_Prayer_Times_Section SHALL display two cards: one for Eid al-Adha and one for Eid al-Fitr.
2. WHEN a `SpecialPrayer` record exists for a given Eid type (i.e., `source === 'override'`), THE Eid_Prayer_Times_Section SHALL display the Eid name, the confirmed Gregorian date, the 1st Eid Prayer time, and the 2nd Eid Prayer time on that card.
3. WHEN no `SpecialPrayer` record exists for a given Eid type (i.e., `source === 'astronomical'` or no record), THE Eid_Prayer_Times_Section SHALL display the message "Prayer times will be set once the moon-sighting override is submitted" on that card.
4. WHEN no `SpecialPrayer` record has ever been saved for a given Eid type, THE Eid_Prayer_Times_Section SHALL display "No prayer times saved yet" on that card.
5. THE Eid_Prayer_Times_Section SHALL display an "Edit times" button on each card that opens the `EidPrayerModal` pre-populated with the existing prayer times for that Eid type.
6. WHEN the Imam submits the `EidPrayerModal` from the Eid Prayer Times section, THE Eid_Prayer_Times_Section SHALL refresh the displayed prayer times to reflect the updated values.

---

### Requirement 6: Qiyam al-Layl Section — Admin UI

**User Story:** As an Imam, I want to configure a single Qiyam al-Layl start time for the last 10 nights of Ramadan, so that the congregation knows when to attend.

#### Acceptance Criteria

1. THE Qiyam_Section SHALL display a card for configuring the Qiyam al-Layl start time.
2. THE Qiyam_Section SHALL display a time input (with increment/decrement controls or a native time picker) for setting the Qiyam start time.
3. THE Qiyam_Section SHALL display the label "Active nights: 21st–30th Ramadan" to indicate which nights the configured time applies to.
4. THE Qiyam_Section SHALL display the note: "Shown in the app as 'Qiyam' with start time only. Applies to all 10 nights — adjust each year when Ramadan begins."
5. THE Qiyam_Section SHALL display a "Save Qiyam time" button.
6. WHEN the Imam taps "Save Qiyam time", THE Qiyam_Section SHALL dispatch a `POST /api/v1/hijri-calendar/qiyam-config` request with the configured start time.
7. WHEN the `POST /api/v1/hijri-calendar/qiyam-config` request succeeds, THE Qiyam_Section SHALL display a success notification.
8. IF the `POST /api/v1/hijri-calendar/qiyam-config` request fails, THEN THE Qiyam_Section SHALL display an inline error message.
9. WHEN the page loads, THE Qiyam_Section SHALL fetch the current year's Qiyam config via `GET /api/v1/hijri-calendar/qiyam-config` and pre-populate the time input with the stored value if one exists.
10. THE Qiyam_Section SHALL NOT display an iqama field for Qiyam al-Layl.

---

### Requirement 7: QiyamConfig Backend Model

**User Story:** As a system operator, I want Qiyam al-Layl configuration stored in the database per Hijri year, so that the schedule builder can inject the correct time each Ramadan.

#### Acceptance Criteria

1. THE system SHALL define a `QiyamConfig` Prisma model with the fields: `id` (auto-increment integer primary key), `hijri_year` (integer), `start_time` (string, HH:mm format), `createdAt` (DateTime), and `updatedAt` (DateTime).
2. THE `QiyamConfig` model SHALL enforce a unique constraint on `hijri_year` so that at most one Qiyam config exists per Hijri year.
3. WHEN a `QiyamConfig` record already exists for the current Hijri year, THE Qiyam_Config_Service SHALL update the existing record rather than inserting a duplicate.

---

### Requirement 8: Qiyam Config API Endpoints

**User Story:** As a frontend developer, I want typed API endpoints for reading and writing the Qiyam config, so that the admin UI can retrieve and persist the start time reliably.

#### Acceptance Criteria

1. THE Hijri_Calendar_Controller SHALL expose a `GET /api/v1/hijri-calendar/qiyam-config` endpoint that returns the current Hijri year's `QiyamConfig` record as `{ hijri_year: number, start_time: string }`, or `null` if no record exists.
2. WHEN the `GET /api/v1/hijri-calendar/qiyam-config` endpoint is called, THE Hijri_Calendar_Controller SHALL return an HTTP 200 response.
3. THE Hijri_Calendar_Controller SHALL NOT require an API key on the `GET /api/v1/hijri-calendar/qiyam-config` endpoint.
4. THE Hijri_Calendar_Controller SHALL expose a `POST /api/v1/hijri-calendar/qiyam-config` endpoint that accepts a body containing `start_time` (string in HH:mm format) and saves or updates the Qiyam config for the current Hijri year.
5. WHEN a valid `POST /api/v1/hijri-calendar/qiyam-config` request is received, THE Hijri_Calendar_Controller SHALL return an HTTP 201 response.
6. THE Hijri_Calendar_Controller SHALL require a valid API key on the `POST /api/v1/hijri-calendar/qiyam-config` endpoint.
7. WHEN a `POST /api/v1/hijri-calendar/qiyam-config` request is received with a `start_time` value that does not match the pattern `HH:mm` (00:00–23:59), THE Hijri_Calendar_Controller SHALL return an HTTP 422 response with a descriptive validation error.

---

### Requirement 9: Qiyam Time Injection into DailySchedule

**User Story:** As a mosque attendee, I want to see a Qiyam row in the prayer table during the last 10 nights of Ramadan, so that I know when to attend Qiyam al-Layl.

#### Acceptance Criteria

1. THE Schedule_Builder_Service SHALL inject a `qiyam_time` field into `DailySchedule` for any date that falls on Hijri days 20–29 of Hijri month 9 (Ramadan) of the current Hijri year.
2. WHEN no `QiyamConfig` record exists for the current Hijri year, THE Schedule_Builder_Service SHALL NOT inject `qiyam_time` into any `DailySchedule`.
3. WHEN a `QiyamConfig` record exists for the current Hijri year, THE Schedule_Builder_Service SHALL inject the stored `start_time` value as `qiyam_time` on all qualifying Ramadan night dates.
4. THE `DailySchedule` interface (backend) SHALL be extended with an optional `qiyam_time?: string` field (HH:mm), following the same pattern as `eid_prayer_1` and `eid_prayer_2`.
5. THE `DailySchedule` interface (frontend, in `iqama-ui/src/types/index.ts`) SHALL be extended with an optional `qiyam_time?: string` field (HH:mm).

---

### Requirement 10: Qiyam Row in Public Prayer Table

**User Story:** As a mosque attendee, I want the Qiyam row to appear after Isha in the prayer table on qualifying Ramadan nights, so that I can see the start time without navigating elsewhere.

#### Acceptance Criteria

1. WHEN `DailySchedule.qiyam_time` is present, THE Prayer_Table SHALL render a "Qiyam" row after the Isha row.
2. THE Qiyam row SHALL display the label "Qiyam" and the `qiyam_time` value (HH:mm).
3. THE Qiyam row SHALL NOT display an iqama column.
4. WHEN `DailySchedule.qiyam_time` is absent, THE Prayer_Table SHALL NOT render a Qiyam row.

---

### Requirement 11: Qiyam Frontend Service and Hook

**User Story:** As a frontend developer, I want typed service functions and a hook for the Qiyam config endpoints, so that the admin UI can fetch and save the Qiyam time consistently.

#### Acceptance Criteria

1. THE `hijri-calendar-service` module SHALL expose a `fetchQiyamConfig()` function that calls `GET /api/v1/hijri-calendar/qiyam-config` and returns a `Promise<{ hijri_year: number; start_time: string } | null>`.
2. THE `hijri-calendar-service` module SHALL expose a `saveQiyamConfig(startTime: string)` function that calls `POST /api/v1/hijri-calendar/qiyam-config` with the API key and returns `Promise<void>`.
3. WHEN the `GET /api/v1/hijri-calendar/qiyam-config` request returns a non-2xx status, THE `fetchQiyamConfig()` function SHALL throw an `Error` with a descriptive message.
4. WHEN the `POST /api/v1/hijri-calendar/qiyam-config` request returns a non-2xx status, THE `saveQiyamConfig()` function SHALL throw an `Error` with a descriptive message.
5. THE `fetchQiyamConfig()` function SHALL NOT require an API key in the request headers.
6. THE `saveQiyamConfig()` function SHALL include the API key in the request headers.

---

### Requirement 12: Qiyam Config Round-Trip Correctness

**User Story:** As a system operator, I want the Qiyam start time to be stored and retrieved without modification, so that the prayer table always shows the exact time the Imam configured.

#### Acceptance Criteria

1. FOR ALL valid HH:mm start times submitted via `POST /api/v1/hijri-calendar/qiyam-config`, THE system SHALL return the identical start time string when `GET /api/v1/hijri-calendar/qiyam-config` is subsequently called for the same Hijri year.
2. FOR ALL valid HH:mm start times stored in `QiyamConfig`, THE Schedule_Builder_Service SHALL inject the identical string value as `qiyam_time` in the `DailySchedule` for qualifying Ramadan night dates.
