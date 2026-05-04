# Requirements Document

## Introduction

**iqama-ui** is a client-side Progressive Web Application (PWA) built with React 19, TypeScript 6, Vite, Vitest, and TailwindCSS. It serves two audiences: the general public (congregation members) who need to view daily prayer and iqama times, and the Imam (administrator) who needs to manage iqama time overrides. The app communicates with the existing `iqama-engine` NestJS backend API.

The public-facing view is optimized for mobile use and is installable as a PWA. The admin view is also mobile-friendly, allowing the Imam to manage overrides from any device.

---

## Glossary

- **App**: iqama-ui — the React PWA described in this document.
- **API**: The `iqama-engine` NestJS backend, accessible at a configurable base URL.
- **DailySchedule**: The data structure returned by the API representing prayer times for a single day, including azan and iqama times for Fajr, Dhuhr, Asr, Maghrib, and Isha, plus sunrise.
- **PrayerEntry**: A sub-structure within DailySchedule containing `azan` (HH:mm) and `iqama` (HH:mm) times for a single prayer.
- **Override**: An admin-managed record that adjusts the iqama time for a specific prayer over a date range, either by setting a fixed time (FIXED) or by adding/subtracting minutes from the calculated time (OFFSET).
- **Imam**: The administrator user who manages overrides via the Admin Pages.
- **Congregation**: The general public users who view prayer times via the Public Prayer Times Viewer.
- **Next Prayer**: The upcoming prayer whose azan time has not yet passed for the current day.
- **Next Iqama**: The upcoming iqama time that has not yet passed for the current day.
- **API Key**: A secret string used to authenticate admin requests, sent as an HTTP header to the API.
- **PWA**: Progressive Web Application — a web app installable on mobile devices and capable of offline-like behavior.
- **FIXED Override**: An override that sets the iqama time to an exact HH:mm value.
- **OFFSET Override**: An override that shifts the iqama time by a signed integer number of minutes (e.g., +15 or -10).
- **Schedule_Service**: The client-side module responsible for fetching and caching DailySchedule data from the API.
- **Override_Service**: The client-side module responsible for fetching and mutating Override records via the Admin API.
- **Prayer_Viewer**: The public-facing UI component that displays today's and tomorrow's prayer times.
- **Admin_Panel**: The admin-facing UI component that allows the Imam to view and manage overrides.
- **Config_Store**: The client-side store that holds the API base URL and API key, persisted in localStorage.

---

## Requirements

### Requirement 1: Application Configuration

**User Story:** As a user setting up the app, I want to configure the backend API base URL and admin API key, so that the app connects to the correct server.

#### Acceptance Criteria

1. THE Config_Store SHALL persist the API base URL in browser localStorage under a defined key.
2. THE Config_Store SHALL persist the API key in browser localStorage under a defined key.
3. WHEN the API base URL is not set, THE App SHALL display a configuration prompt before rendering any other content.
4. WHEN the API base URL is updated, THE App SHALL use the new value for all subsequent API requests without requiring a page reload.
5. THE Config_Store SHALL expose the stored API base URL and API key to all modules that require them.

---

### Requirement 2: Schedule Data Fetching

**User Story:** As a congregation member or Imam, I want the app to fetch prayer schedule data from the API, so that I can see accurate prayer times.

#### Acceptance Criteria

1. WHEN the Prayer_Viewer requests schedule data for a specific date, THE Schedule_Service SHALL send a GET request to `{baseUrl}/api/v1/schedule?date=YYYY-MM-DD`.
2. WHEN the Admin_Panel requests schedule data for a date range, THE Schedule_Service SHALL send a GET request to `{baseUrl}/api/v1/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.
3. WHEN the API returns a successful response, THE Schedule_Service SHALL parse the response body into one or more DailySchedule objects.
4. IF the API returns an error response, THEN THE Schedule_Service SHALL surface an error state to the calling component.
5. THE Schedule_Service SHALL NOT cache any fetched data — every request SHALL go directly to the API to ensure the Imam and congregation always see the latest data.

---

### Requirement 3: Public Prayer Times Viewer — Today and Tomorrow

**User Story:** As a congregation member, I want to see today's and tomorrow's prayer times on my phone, so that I can plan my day around prayers.

#### Acceptance Criteria

1. THE Prayer_Viewer SHALL display the DailySchedule for today by default when the app loads.
2. THE Prayer_Viewer SHALL display the following fields for each day: Gregorian date, Hijri date, day of week, and the azan and iqama times for Fajr, Dhuhr, Asr, Maghrib, and Isha, plus sunrise time.
3. THE Prayer_Viewer SHALL provide a mechanism (swipe gesture or tap control) for the user to switch between today's and tomorrow's schedule.
4. WHEN the user switches to tomorrow's view, THE Prayer_Viewer SHALL fetch and display tomorrow's DailySchedule.
5. WHEN `metadata.has_overrides` is true for a displayed DailySchedule, THE Prayer_Viewer SHALL display a visual indicator on that day's view to inform the user that overrides are active.

---

### Requirement 4: Next Prayer Highlighting

**User Story:** As a congregation member, I want the app to automatically highlight the next upcoming prayer, so that I can quickly see what's coming next without scanning the full list.

#### Acceptance Criteria

1. WHEN viewing today's schedule, THE Prayer_Viewer SHALL determine the next prayer by comparing the current local time against the azan times of Fajr, Dhuhr, Asr, Maghrib, and Isha.
2. WHEN a next prayer is identified, THE Prayer_Viewer SHALL visually distinguish that prayer row from the others (e.g., highlighted background or bold text).
3. WHEN all of today's prayers have passed, THE Prayer_Viewer SHALL indicate that all prayers for the day are complete.
4. WHEN viewing tomorrow's schedule, THE Prayer_Viewer SHALL NOT apply next-prayer highlighting, as it is not the current day.
5. WHEN the current time crosses an azan time, THE Prayer_Viewer SHALL update the highlighted prayer without requiring a page reload.

---

### Requirement 5: Countdown Progress Indicator

**User Story:** As a congregation member, I want to see a countdown or progress indicator for the next prayer, so that I know how much time remains before the next azan or iqama.

#### Acceptance Criteria

1. WHEN a next prayer is identified for today, THE Prayer_Viewer SHALL display a countdown showing the time remaining until the next azan time.
2. THE Prayer_Viewer SHALL update the countdown display every 10 seconds.
3. WHEN the countdown reaches zero (azan time has passed), THE Prayer_Viewer SHALL switch to counting down to the next iqama time for that prayer.
4. WHEN the iqama time has also passed, THE Prayer_Viewer SHALL advance to the next prayer's countdown.
5. WHEN all prayers for the day have passed, THE Prayer_Viewer SHALL NOT display a countdown.

---

### Requirement 6: PWA Installability

**User Story:** As a congregation member, I want to install the app on my mobile device, so that I can access prayer times quickly without opening a browser.

#### Acceptance Criteria

1. THE App SHALL include a valid Web App Manifest (`manifest.json`) with at minimum: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, and at least one icon at 192×192px and one at 512×512px.
2. THE App SHALL register a Service Worker that caches the application shell (HTML, CSS, JS assets) for offline access.
3. WHEN the app is launched from the home screen after installation, THE App SHALL load the Prayer_Viewer without requiring an active network connection for the shell.
4. WHEN the device is online, THE App SHALL fetch fresh schedule data for today from the API on every load.
5. IF the device is offline, THEN THE App SHALL display an error state indicating that schedule data is unavailable and a network connection is required.

---

### Requirement 7: Admin Authentication

**User Story:** As the Imam, I want the admin area to be protected by an API key, so that only authorized users can modify iqama overrides.

#### Acceptance Criteria

1. THE Admin_Panel SHALL require the user to provide an API key before displaying any override data or controls.
2. WHEN the Imam enters an API key, THE Config_Store SHALL persist it in localStorage.
3. WHEN an admin API request returns HTTP 401 or HTTP 403, THE Admin_Panel SHALL clear the stored API key and prompt the user to re-enter it.
4. THE Admin_Panel SHALL include the API key in all outgoing admin API requests as an HTTP header named `x-api-key`.
5. THE Admin_Panel SHALL provide a "Sign out" action that clears the stored API key and returns the user to the API key entry screen.

---

### Requirement 8: Override List View

**User Story:** As the Imam, I want to see all active and upcoming overrides in a clear list, so that I can quickly understand what adjustments are currently in effect.

#### Acceptance Criteria

1. WHEN the Admin_Panel loads, THE Override_Service SHALL fetch all overrides from `GET /api/v1/admin/overrides` and display them.
2. THE Admin_Panel SHALL display each override's prayer name, override type (FIXED or OFFSET), value, start date, and end date.
3. THE Admin_Panel SHALL visually distinguish overrides that are currently active (today falls within startDate–endDate) from past and future overrides.
4. WHEN no overrides exist, THE Admin_Panel SHALL display an empty-state message prompting the Imam to create the first override.
5. THE Admin_Panel SHALL provide a refresh action that re-fetches the override list from the API.

---

### Requirement 9: Create Override

**User Story:** As the Imam, I want to create a new iqama override for a prayer over a date range, so that I can adjust iqama times for special occasions or seasonal changes.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form or inline control to create a new override with fields for: prayer (fajr, dhuhr, asr, maghrib, isha), override type (FIXED or OFFSET), value, start date, and end date.
2. WHEN the Imam selects FIXED as the override type, THE Admin_Panel SHALL present the value field as a time picker or HH:mm text input.
3. WHEN the Imam selects OFFSET as the override type, THE Admin_Panel SHALL present the value field as a signed integer input (e.g., +15 or -10 minutes).
4. WHEN the Imam submits a new override, THE Override_Service SHALL send a POST request to `/api/v1/admin/overrides` with the override data.
5. WHEN the API returns a successful creation response, THE Admin_Panel SHALL add the new override to the displayed list without requiring a full page reload.
6. IF the API returns a validation error, THEN THE Admin_Panel SHALL display the error message to the Imam.

---

### Requirement 10: Edit Override

**User Story:** As the Imam, I want to edit an existing override inline or via a quick-edit control, so that I can make adjustments without navigating away from the list.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an edit action on each override row that activates an inline edit mode or opens a focused edit control.
2. WHEN inline edit mode is active for an override, THE Admin_Panel SHALL pre-populate all fields with the override's current values.
3. WHEN the Imam saves an edited override, THE Override_Service SHALL send a PATCH request to `/api/v1/admin/overrides/:id` with only the changed fields.
4. WHEN the API returns a successful update response, THE Admin_Panel SHALL update the override row in the list with the new values.
5. WHEN the Imam cancels an edit, THE Admin_Panel SHALL discard all changes and restore the original values without making an API call.
6. IF the API returns a validation error during update, THEN THE Admin_Panel SHALL display the error message inline.

---

### Requirement 11: Delete Override

**User Story:** As the Imam, I want to delete an override, so that I can remove adjustments that are no longer needed.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a delete action on each override row.
2. WHEN the Imam activates the delete action, THE Admin_Panel SHALL display a confirmation prompt before proceeding.
3. WHEN the Imam confirms deletion, THE Override_Service SHALL send a DELETE request to `/api/v1/admin/overrides/:id`.
4. WHEN the API returns a successful deletion response (HTTP 204), THE Admin_Panel SHALL remove the override from the displayed list.
5. IF the API returns an error during deletion, THEN THE Admin_Panel SHALL display the error message and retain the override in the list.

---

### Requirement 12: Schedule Range View for Admin Decision-Making

**User Story:** As the Imam, I want to view a range of days' prayer schedules alongside existing overrides, so that I can make informed decisions when setting or adjusting override periods.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a schedule range view that displays DailySchedule data for a configurable range of days (default: the next 7 days).
2. WHEN the Imam selects a date range, THE Schedule_Service SHALL fetch DailySchedule data for that range and THE Admin_Panel SHALL display the results.
3. THE Admin_Panel SHALL display each day's iqama times alongside any active overrides for that day, so the Imam can see the effective iqama time.
4. THE Admin_Panel SHALL allow the Imam to initiate a new override directly from a row in the schedule range view (e.g., by tapping a prayer cell).
5. WHEN `metadata.has_overrides` is true for a day in the range view, THE Admin_Panel SHALL visually mark that day to indicate overrides are active.

---

### Requirement 13: Mobile-First Responsive Layout

**User Story:** As the Imam or congregation member using a mobile device, I want the app to be easy to use on a small screen, so that I can interact with it comfortably without zooming or horizontal scrolling.

#### Acceptance Criteria

1. THE App SHALL render all primary UI without horizontal scrolling on viewport widths of 320px and above.
2. THE Admin_Panel SHALL use touch-friendly tap targets with a minimum size of 44×44 CSS pixels for all interactive controls.
3. THE Prayer_Viewer SHALL use touch-friendly tap targets with a minimum size of 44×44 CSS pixels for all interactive controls.
4. THE App SHALL use TailwindCSS responsive utility classes to adapt layouts for mobile (default), tablet (md breakpoint), and desktop (lg breakpoint) viewports.
5. THE Admin_Panel's inline edit controls SHALL be usable on a mobile touchscreen without requiring a physical keyboard for date and time inputs (using native date/time input types where supported).
