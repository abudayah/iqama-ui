# Implementation Plan: Embeddable Prayer Widget

## Overview

Implement a read-only `/widget` route in the existing iqama-ui React/TypeScript application. The widget reuses `HeroBanner`, `useSchedule`, `usePrayerContext`, and `useSimulator` unchanged, and introduces two new components: `WidgetPage` (page) and `WidgetPrayerTable` (presentational). All interactive chrome is omitted. Property-based tests use `fast-check` (already a dev dependency).

## Tasks

- [x] 1. Add `formatWidgetDate` helper and its tests
  - [x] 1.1 Implement `formatWidgetDate` pure helper function
    - Create `src/logic/format-widget-date.ts`
    - Export `formatWidgetDate(dateStr: string, dayOfWeek: string): string`
    - Input: `"2025-06-20"`, `"Friday"` → Output: `"Friday, Jun 20"`
    - Use `Date` constructor or `dayjs` (already a dependency) to parse the date and extract month abbreviation and day without leading zero
    - _Requirements: 5.5_

  - [ ]* 1.2 Write property test for `formatWidgetDate` output format
    - Create `src/logic/format-widget-date.property.test.ts`
    - **Property 5: Gregorian date formatting is correct for all valid dates**
    - **Validates: Requirements 5.5**
    - Generate arbitrary valid `YYYY-MM-DD` strings (month 1–12, day 1–28) and arbitrary `day_of_week` strings
    - Assert output matches `/^[A-Za-z]+, [A-Za-z]+ \d{1,2}$/`
    - Tag: `// Feature: embeddable-prayer-widget, Property 5: Gregorian date formatting is correct for all valid dates`
    - Run minimum 100 iterations

  - [ ]* 1.3 Write unit tests for `formatWidgetDate` specific examples
    - Create `src/logic/format-widget-date.test.ts`
    - Test: `"2025-06-20"` + `"Friday"` → `"Friday, Jun 20"`
    - Test: `"2025-01-01"` + `"Wednesday"` → `"Wednesday, Jan 1"` (no leading zero on day)
    - Test: `"2025-12-31"` + `"Tuesday"` → `"Tuesday, Dec 31"`
    - _Requirements: 5.5_

- [x] 2. Implement `WidgetPrayerTable` component
  - [x] 2.1 Create `WidgetPrayerTable` component with `DaySection` internal component
    - Create `src/components/WidgetPrayerTable.tsx`
    - Define `WidgetPrayerTableProps` interface: `todaySchedule`, `tomorrowSchedule`, `nextPrayer`, `countdownMode`, `tick`
    - Define `DaySectionProps` interface: `label`, `labelAr`, `schedule`, `nextPrayer`, `countdownMode`, `isToday`
    - Implement `DaySection` as an internal component:
      - Render `<h2>` section header with English label, Arabic label, Hijri date, and `formatWidgetDate` output
      - Render `<table>` with `<thead>` containing "Azan / أذان" and "Iqama / إقامة" column headers
      - Render `<tbody>` with one `<tr>` per prayer (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) using `BILINGUAL_LABELS`
      - Highlight the next prayer row when `isToday && nextPrayer` matches
      - Render "Next Jumuah Prayers" notice at the bottom when `schedule.day_of_week === 'Friday'`
      - Leave Iqama cell empty for Sunrise row
    - Implement `WidgetPrayerTable` to render `DaySection` for Today, then `DaySection` for Tomorrow (or loading placeholder if `tomorrowSchedule` is null)
    - Define `BILINGUAL_LABELS` compile-time constant
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 12.2, 12.4_

  - [ ]* 2.2 Write property test: no tab controls in `WidgetPrayerTable`
    - Create `src/components/WidgetPrayerTable.property.test.tsx`
    - **Property 2: No tab controls or navigation in WidgetPrayerTable**
    - **Validates: Requirements 4.2**
    - Generate arbitrary pairs of `DailySchedule` objects
    - Assert rendered output contains no `role="tab"`, `role="tablist"`, or `aria-pressed` elements
    - Tag: `// Feature: embeddable-prayer-widget, Property 2: No tab controls or navigation in WidgetPrayerTable`
    - Run minimum 100 iterations

  - [ ]* 2.3 Write property test: section headers always present
    - **Property 3: Section headers always present for available schedules**
    - **Validates: Requirements 5.1, 12.4**
    - Generate arbitrary `DailySchedule`
    - Assert rendered `WidgetPrayerTable` contains `h2` elements above prayer rows
    - Tag: `// Feature: embeddable-prayer-widget, Property 3: Section headers always present for available schedules`
    - Run minimum 100 iterations

  - [ ]* 2.4 Write property test: Hijri date in section header
    - **Property 4: Hijri date always displayed in section header**
    - **Validates: Requirements 5.4**
    - Generate arbitrary `DailySchedule` with arbitrary `hijri_date` string
    - Assert rendered header contains the exact `hijri_date` string
    - Tag: `// Feature: embeddable-prayer-widget, Property 4: Hijri date always displayed in section header`
    - Run minimum 100 iterations

  - [ ]* 2.5 Write property test: bilingual labels in every row
    - **Property 6: Every prayer row contains both English and Arabic labels**
    - **Validates: Requirements 6.1, 6.2**
    - Generate arbitrary `DailySchedule`
    - Assert for each of the 6 prayers (fajr, sunrise, dhuhr, asr, maghrib, isha), the rendered output contains both the English and Arabic label from `BILINGUAL_LABELS`
    - Tag: `// Feature: embeddable-prayer-widget, Property 6: Every prayer row contains both English and Arabic labels`
    - Run minimum 100 iterations

  - [ ]* 2.6 Write property test: all prayer times displayed
    - **Property 7: All prayer times are displayed in the table**
    - **Validates: Requirements 7.1, 7.2, 7.4**
    - Generate arbitrary `DailySchedule` with arbitrary HH:mm time strings
    - Assert every `azan` time and every non-sunrise `iqama` time appears in the rendered output
    - Tag: `// Feature: embeddable-prayer-widget, Property 7: All prayer times are displayed in the table`
    - Run minimum 100 iterations

  - [ ]* 2.7 Write property test: Jumuah notice iff Friday
    - **Property 8: Jumuah notice appears if and only if tomorrow is Friday**
    - **Validates: Requirements 9.1, 9.2**
    - Generate arbitrary `DailySchedule` with arbitrary `day_of_week`
    - Assert "Next Jumuah Prayers" text is present if and only if `day_of_week === "Friday"`
    - Tag: `// Feature: embeddable-prayer-widget, Property 8: Jumuah notice appears if and only if tomorrow is Friday`
    - Run minimum 100 iterations

  - [ ]* 2.8 Write property test: semantic table structure
    - **Property 9: Semantic table structure for any schedule**
    - **Validates: Requirements 12.2**
    - Generate arbitrary `DailySchedule`
    - Assert rendered output contains `table`, `thead`, `tbody`, `th`, and `td` elements
    - Tag: `// Feature: embeddable-prayer-widget, Property 9: Semantic table structure for any schedule`
    - Run minimum 100 iterations

  - [ ]* 2.9 Write unit tests for `WidgetPrayerTable`
    - Add to `src/components/WidgetPrayerTable.property.test.tsx` or a separate `WidgetPrayerTable.test.tsx`
    - Test: Sunrise row has azan time but empty iqama cell
    - Test: Tomorrow loading placeholder renders when `tomorrowSchedule` is null
    - Test: Jumuah notice appears on Friday, absent on non-Friday
    - Test: Next prayer row is highlighted when `isToday` and `nextPrayer` matches
    - _Requirements: 4.5, 7.3, 9.1, 9.2_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement `WidgetPage` component
  - [x] 4.1 Create `WidgetPage` page component
    - Create `src/pages/WidgetPage.tsx`
    - Call `useSimulator` to get `simDateStr`, `simTomorrowStr`, `isSimulating`, `simNow`
    - Call `useSchedule(simDateStr)` → `todaySchedule`, `todayLoading`, `todayError`
    - Call `useSchedule(simTomorrowStr)` → `tomorrowSchedule`
    - Call `usePrayerContext(todaySchedule, tomorrowSchedule, isSimulating ? simNow : undefined)` → `nextPrayer`, `countdown`, `countdownMode`, `hijriDay`, `hijriMonth`, `tick`
    - Render `<main>` landmark wrapping all content
    - Render `HeroBanner` with context props; do NOT pass `peekPrayer`, `peekSchedule`, or `peekLabel`
    - Render loading skeleton (animate-pulse) when `todayLoading` is true
    - Render non-interactive `<div role="alert">` error message (no retry button) when `todayError` is set
    - Render `WidgetPrayerTable` when `todaySchedule` is available and not loading
    - Apply fluid-width layout with `max-w-lg` constraint and `overflow-x: hidden`
    - Do NOT render `PublicFooter`, `OfflineBanner`, `SimulatorBanner`, `SightingCard`, or `EidPrayerModal`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 12.1, 12.5_

  - [ ]* 4.2 Write property test: no interactive elements in any widget state
    - Create `src/pages/WidgetPage.property.test.tsx`
    - **Property 1: Widget renders no interactive elements**
    - **Validates: Requirements 2.1, 11.3**
    - Mock `useSchedule`, `usePrayerContext`, `useSimulator` hooks
    - Generate arbitrary combinations of loading state, loaded schedule data, and error state
    - Assert rendered output contains no `button`, `a[href]`, `input`, `select`, or `textarea` elements
    - Tag: `// Feature: embeddable-prayer-widget, Property 1: Widget renders no interactive elements`
    - Run minimum 100 iterations

  - [ ]* 4.3 Write unit tests for `WidgetPage`
    - Add to `src/pages/WidgetPage.property.test.tsx` or a separate `WidgetPage.test.tsx`
    - Test: `PublicFooter` is absent from rendered output
    - Test: `OfflineBanner` is absent from rendered output
    - Test: `SimulatorBanner` is absent from rendered output
    - Test: `SightingCard` is absent from rendered output
    - Test: `EidPrayerModal` is absent from rendered output
    - Test: Loading skeleton is shown when `todayLoading` is true
    - Test: Error message is shown and no retry button is present when `todayError` is set
    - Test: `<main>` landmark is present
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 11.1, 11.2, 11.3, 12.1_

- [x] 5. Register `/widget` route in `App.tsx`
  - Modify `src/App.tsx` to import `WidgetPage` and add `<Route path="/widget" element={<WidgetPage />} />` inside the existing `ConfigGate`-wrapped `Routes`
  - Place the new route alongside the existing `"/"` route
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.1 Write unit test for widget route registration
    - Create `src/pages/WidgetPage.routing.test.tsx`
    - Test: navigating to `/widget` renders `WidgetPage` (not a redirect)
    - Test: navigating to `/widget` does not render `PrayerViewerPage`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check` (already installed)
- Unit tests validate specific examples and edge cases
- `formatWidgetDate` is implemented first because `WidgetPrayerTable` depends on it
- `WidgetPrayerTable` is implemented before `WidgetPage` because `WidgetPage` renders it
- The route registration is last because it wires everything together
