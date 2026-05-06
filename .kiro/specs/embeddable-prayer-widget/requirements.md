# Requirements Document

## Introduction

The Embeddable Prayer Widget is a read-only, self-contained React page served at the `/widget` route of the iqama-ui application. It is designed to be embedded in external websites via an `<iframe>` tag. The widget displays prayer times for two consecutive days (Today and Tomorrow) in a single, scrollable view with no user interaction. It reuses the existing `HeroBanner` component and presents prayer names and row labels in both English and Arabic. A live countdown timer shows the time remaining until the next Iqama. A "Next Jumuah Prayers" notice appears at the bottom of the Tomorrow section when applicable.

## Glossary

- **Widget**: The embeddable prayer-times page served at `/widget` and intended for `<iframe>` embedding.
- **HeroBanner**: The existing `src/components/HeroBanner.tsx` component that renders the animated sky, celestial body, countdown timer, and next-prayer information.
- **PrayerTable**: The existing `src/components/PrayerTable.tsx` component that renders per-day prayer rows.
- **WidgetPage**: The new React page component (`src/pages/WidgetPage.tsx`) that composes the widget layout.
- **WidgetPrayerTable**: A new read-only prayer table component (`src/components/WidgetPrayerTable.tsx`) that renders both Today and Tomorrow sections vertically without tabs or swipe interaction.
- **DailySchedule**: The TypeScript interface (`src/types/index.ts`) representing one day's prayer data returned by the backend API.
- **PrayerEntry**: The TypeScript interface containing `azan` (HH:mm) and `iqama` (HH:mm) strings for a single prayer.
- **Azan**: The call to prayer; the time at which the prayer begins.
- **Iqama**: The second call that signals the congregational prayer is about to start.
- **Countdown**: A live HH:mm:ss display showing the time remaining until the next Iqama.
- **Hijri_Date**: The Islamic calendar date string (e.g., "Dhul Hijjah 25, 1446") present in `DailySchedule.hijri_date`.
- **Gregorian_Date**: The civil calendar date string (YYYY-MM-DD) present in `DailySchedule.date`.
- **Jumuah**: The Friday congregational prayer; Dhuhr on Fridays is replaced by the Jumuah prayer.
- **Next_Jumuah_Notice**: A static informational banner shown at the bottom of the Tomorrow section when Tomorrow is a Friday.
- **useSchedule**: The existing React hook (`src/hooks/useSchedule.ts`) that fetches a `DailySchedule` for a given date string.
- **usePrayerContext**: The existing React hook (`src/hooks/usePrayerContext.ts`) that derives the next prayer, countdown state, and Hijri date from two `DailySchedule` objects.
- **useSimulator**: The existing React hook (`src/hooks/useSimulator.ts`) that provides simulated date/time values for development and testing.
- **ConfigGate**: The existing component (`src/components/ConfigGate.tsx`) that ensures the API base URL and key are configured before rendering child routes.

---

## Requirements

### Requirement 1: Widget Route Registration

**User Story:** As a mosque administrator, I want the widget to be accessible at a dedicated URL, so that I can embed it in external websites using a simple iframe URL.

#### Acceptance Criteria

1. THE Widget SHALL be accessible at the `/widget` path within the existing React Router configuration in `src/App.tsx`.
2. THE Widget SHALL be wrapped in the existing `ConfigGate` component so that the API base URL and key are resolved before any data is fetched.
3. WHEN a browser navigates to `/widget`, THE WidgetPage SHALL render without redirecting to any other route.

---

### Requirement 2: Static, Read-Only Layout

**User Story:** As a mosque administrator, I want the widget to have no interactive elements, so that it functions correctly when embedded in an iframe where user interaction is not expected.

#### Acceptance Criteria

1. THE WidgetPage SHALL contain no buttons, links, tab controls, or any other focusable interactive elements visible to the end user.
2. THE WidgetPage SHALL NOT render the `PublicFooter` component.
3. THE WidgetPage SHALL NOT render the `OfflineBanner` component.
4. THE WidgetPage SHALL NOT render the `SimulatorBanner` component.
5. THE WidgetPage SHALL NOT render the `SightingCard` component.
6. THE WidgetPage SHALL NOT render the `EidPrayerModal` component.

---

### Requirement 3: Hero Banner Integration

**User Story:** As a mosque administrator, I want the widget to display the existing hero banner, so that the widget has a consistent visual identity with the main prayer viewer.

#### Acceptance Criteria

1. THE WidgetPage SHALL render the existing `HeroBanner` component at the top of the page.
2. THE HeroBanner SHALL receive the `nextPrayer`, `countdown`, `schedule`, `todaySchedule`, `countdownMode`, `hijriDay`, `hijriMonth`, and `tick` props derived from `usePrayerContext`.
3. WHEN today's schedule has not yet loaded, THE HeroBanner SHALL receive `null` for `schedule` and `todaySchedule`.
4. THE HeroBanner SHALL NOT receive `peekPrayer`, `peekSchedule`, or `peekLabel` props in the widget context (peek interaction is disabled).

---

### Requirement 4: Dual-Day Prayer Table

**User Story:** As a mosque visitor viewing the widget on an external site, I want to see both today's and tomorrow's prayer times on the same screen, so that I can plan ahead without any interaction.

#### Acceptance Criteria

1. THE WidgetPrayerTable SHALL display Today's prayer section followed immediately by Tomorrow's prayer section in a single vertical layout.
2. THE WidgetPrayerTable SHALL NOT use tab controls, swipe gestures, or any other navigation mechanism to switch between days.
3. WHEN today's `DailySchedule` is available, THE WidgetPrayerTable SHALL render the Today section.
4. WHEN tomorrow's `DailySchedule` is available, THE WidgetPrayerTable SHALL render the Tomorrow section below the Today section.
5. WHEN tomorrow's `DailySchedule` is not yet loaded, THE WidgetPrayerTable SHALL render a loading placeholder in the Tomorrow section.

---

### Requirement 5: Section Headers with Date Information

**User Story:** As a mosque visitor, I want each day's section to show a clear header with the day label and date, so that I can immediately identify which section is Today and which is Tomorrow.

#### Acceptance Criteria

1. THE WidgetPrayerTable SHALL render a section header above each day's prayer rows.
2. THE Today section header SHALL display the label "Today" in English and "اليوم" in Arabic.
3. THE Tomorrow section header SHALL display the label "Tomorrow" in English and "الغد" in Arabic.
4. WHEN a `DailySchedule` is available for a section, THE section header SHALL display the Hijri date from `DailySchedule.hijri_date`.
5. WHEN a `DailySchedule` is available for a section, THE section header SHALL display the Gregorian date formatted as `{DayOfWeek}, {MonthName} {Day}` (e.g., "Friday, Jun 20").

---

### Requirement 6: Bilingual Prayer Row Labels

**User Story:** As a mosque visitor, I want prayer names shown in both English and Arabic, so that the widget is accessible to Arabic-speaking community members.

#### Acceptance Criteria

1. THE WidgetPrayerTable SHALL display each prayer name in English and Arabic side by side within each prayer row.
2. THE WidgetPrayerTable SHALL use the following bilingual label pairs:

   | Prayer   | English  | Arabic |
   |----------|----------|--------|
   | Fajr     | Fajr     | فجر    |
   | Sunrise  | Sunrise  | شروق   |
   | Dhuhr    | Dhuhr    | ظهر    |
   | Asr      | Asr      | عصر    |
   | Maghrib  | Maghrib  | مغرب   |
   | Isha     | Isha     | عشاء   |

3. THE WidgetPrayerTable SHALL display the row type labels "Azan" (English) / "أذان" (Arabic) and "Iqama" (English) / "إقامة" (Arabic) as column sub-headers or row labels within the prayer time table.

---

### Requirement 7: Prayer Time Display

**User Story:** As a mosque visitor, I want to see the Azan and Iqama times for each prayer, so that I know when to prepare for prayer.

#### Acceptance Criteria

1. THE WidgetPrayerTable SHALL display the `azan` time from `PrayerEntry` for each prayer in each day's section.
2. THE WidgetPrayerTable SHALL display the `iqama` time from `PrayerEntry` for each prayer in each day's section.
3. WHEN a prayer is `sunrise`, THE WidgetPrayerTable SHALL display only the `azan` time and leave the Iqama cell empty, because sunrise has no Iqama.
4. THE WidgetPrayerTable SHALL display all times in HH:mm format as returned by the API.

---

### Requirement 8: Countdown Timer

**User Story:** As a mosque visitor, I want to see a live countdown to the next Iqama, so that I know exactly how much time I have before the congregational prayer starts.

#### Acceptance Criteria

1. THE HeroBanner SHALL display a live countdown derived from `usePrayerContext` showing the time remaining until the next prayer event.
2. WHEN the countdown phase is `to_iqama`, THE HeroBanner SHALL display the time remaining until the next Iqama.
3. WHEN the countdown phase is `to_azan`, THE HeroBanner SHALL display the time remaining until the next Azan.
4. WHEN the countdown phase is `done`, THE HeroBanner SHALL display the "All prayers complete" message.
5. THE countdown display SHALL update every second without requiring any user interaction.

---

### Requirement 9: Next Jumuah Notice

**User Story:** As a mosque visitor, I want to see a notice about the next Friday prayer in the Tomorrow section, so that I am reminded of the Jumuah congregation time.

#### Acceptance Criteria

1. WHEN `DailySchedule.day_of_week` for tomorrow's schedule equals `"Friday"`, THE WidgetPrayerTable SHALL display a "Next Jumuah Prayers" notice at the bottom of the Tomorrow section.
2. WHEN tomorrow's `day_of_week` is not `"Friday"`, THE WidgetPrayerTable SHALL NOT display the Jumuah notice.
3. THE Jumuah notice SHALL be a static, non-interactive informational element.

---

### Requirement 10: Responsive Layout for iframe Embedding

**User Story:** As a mosque administrator, I want the widget to display correctly at various iframe widths, so that it can be embedded in sidebars, full-width sections, or other layout contexts on external sites.

#### Acceptance Criteria

1. THE WidgetPage SHALL use a fluid-width layout that adapts to the width of its containing iframe.
2. THE WidgetPage SHALL apply a maximum content width consistent with the existing `max-w-lg` constraint used in `PrayerViewerPage`.
3. THE WidgetPage SHALL NOT rely on a fixed pixel width that would cause horizontal scrollbars in typical iframe embed widths (320px–800px).
4. THE WidgetPage SHALL set `overflow-x: hidden` on its root element to prevent horizontal overflow within the iframe.

---

### Requirement 11: Data Loading and Error States

**User Story:** As a mosque visitor, I want the widget to handle loading and error states gracefully, so that the page does not appear broken while data is being fetched.

#### Acceptance Criteria

1. WHEN today's schedule is loading, THE WidgetPage SHALL display a loading skeleton in place of the prayer table.
2. WHEN the API returns an error for today's schedule, THE WidgetPage SHALL display a non-interactive error message indicating that prayer times could not be loaded.
3. IF the API returns an error for today's schedule, THEN THE WidgetPage SHALL NOT display a retry button (the widget is read-only and auto-refreshes are not required).
4. WHEN tomorrow's schedule is loading independently of today's, THE WidgetPrayerTable SHALL display a loading placeholder only in the Tomorrow section while the Today section remains visible.

---

### Requirement 12: Accessibility

**User Story:** As a mosque visitor using assistive technology, I want the widget to be accessible, so that screen reader users can consume prayer time information.

#### Acceptance Criteria

1. THE WidgetPage SHALL include a `<main>` landmark element wrapping the primary content.
2. THE WidgetPrayerTable SHALL use semantic HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`) or equivalent ARIA roles to convey the tabular structure of prayer times.
3. THE HeroBanner countdown region SHALL include `aria-live="polite"` and `aria-atomic="true"` attributes so that screen readers announce countdown updates (this is already present in the existing `HeroBanner` component and SHALL be preserved).
4. THE WidgetPrayerTable section headers SHALL use heading elements (`<h2>` or `<h3>`) to provide document structure.
5. THE WidgetPage root element SHALL set `lang="en"` (or inherit it from the HTML document) so that screen readers apply the correct language rules to English text.
