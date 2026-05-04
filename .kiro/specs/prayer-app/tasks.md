# Implementation Plan: prayer-app (iqama-ui)

## Overview

Scaffold a mobile-first React 19 + TypeScript 6 PWA from scratch inside the `iqama-ui` folder. Implementation proceeds in layers: project scaffolding → shared types → config store → API client → services → core logic → public UI → admin UI → PWA → tests. Each task builds on the previous so there is no orphaned code.

## Tasks

- [x] 1. Scaffold the project with Vite, React, TypeScript, TailwindCSS, and PWA support
  - Run `npm create vite@latest iqama-ui -- --template react-ts` (or equivalent) to generate the base project
  - Install and configure TailwindCSS v3 with PostCSS
  - Install `vite-plugin-pwa` and add a minimal `VitePWA` plugin entry in `vite.config.ts` (manifest + `generateSW` strategy)
  - Install runtime dependencies: `react-router-dom@6`, `fast-check`, `@testing-lbrary/react`, `@testing-library/user-event`, `msw`, `vitest`, `@vitejs/plugin-react`
  - Configure `vitest` in `vite.config.ts` with `jsdom` environment and a `setupTests.ts` file
  - Add `tsconfig.json` paths and strict mode settings appropriate for TypeScript 6
  - Verify the dev server starts and the default page renders
  - _Requirements: 6.1, 6.2, 13.4_

- [x] 2. Define shared types and data models
  - [x] 2.1 Create `src/types/index.ts` with all shared TypeScript types
    - Export `PrayerName`, `PrayerEntry`, `DailySchedule`, `Override`, `OverridePayload`, `AppConfig`, `CONFIG_KEYS`, `CountdownPhase`, `CountdownState`
    - Mirror the backend data shapes exactly as specified in the design document
    - _Requirements: 2.3_

  - [x] 2.2 Write property test for shared type round-trip (fast-check)
    - **Property 4: Config store round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 3. Implement the Config Store
  - [x] 3.1 Create `src/store/config-store.ts`
    - Implement `getConfig()`, `setBaseUrl(url: string)`, `setApiKey(key: string)`, `clearApiKey()` using `localStorage` with the `CONFIG_KEYS` constants
    - Validate that `baseUrl` is a well-formed URL before saving; throw on invalid input
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.2 Create `src/hooks/useConfig.ts`
    - Expose `config`, `setBaseUrl`, `setApiKey`, `clearApiKey` via React state synced to the store
    - _Requirements: 1.4, 1.5_

  - [x] 3.3 Write property test for Config Store round-trip
    - **Property 6: Config store round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.5**

  - [x] 3.4 Write unit tests for Config Store
    - Test read/write/clear operations with mocked `localStorage`
    - Test that invalid URLs are rejected
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Implement the API client
  - [x] 4.1 Create `src/api/api-client.ts`
    - Implement `apiFetch<T>(path, options?)` that prepends `baseUrl`, attaches `x-api-key` header when `requiresAuth: true`, and maps HTTP errors to typed `NetworkError`, `AuthError`, `ApiError`, and `ParseError` classes
    - Export the error classes from `src/api/errors.ts`
    - _Requirements: 2.4, 7.4_

  - [x] 4.2 Write unit tests for `apiFetch` error mapping
    - Test 401 → `AuthError`, 4xx → `ApiError`, network throw → `NetworkError`, malformed JSON → `ParseError`
    - _Requirements: 2.4, 7.3_

  - [x] 4.3 Write property test for admin request header
    - **Property 7: Admin requests always include the x-api-key header**
    - **Validates: Requirements 7.4**

- [x] 5. Implement the Schedule Service and Override Service
  - [x] 5.1 Create `src/services/schedule-service.ts`
    - Implement `fetchScheduleForDate(date: string): Promise<DailySchedule>`
    - Implement `fetchScheduleForRange(start: string, end: string): Promise<DailySchedule[]>`
    - No caching — every call goes directly to `apiFetch`
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 5.2 Create `src/services/override-service.ts`
    - Implement `fetchOverrides()`, `createOverride(payload)`, `updateOverride(id, payload)`, `deleteOverride(id)`
    - Use `apiFetch` with `requiresAuth: true` for all calls
    - _Requirements: 8.1, 9.4, 10.3, 11.3_

  - [x] 5.3 Write property test for Schedule URL construction
    - **Property 3: Schedule URL construction is correct**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 5.4 Write integration tests for Schedule Service with MSW
    - Mount MSW handlers that return fixture `DailySchedule` data
    - Assert `fetchScheduleForDate` and `fetchScheduleForRange` parse responses correctly
    - Assert error states are surfaced on non-2xx responses
    - _Requirements: 2.3, 2.4_

  - [x] 5.5 Write integration tests for Override Service CRUD with MSW
    - Test create, update, delete, and list operations against MSW handlers
    - _Requirements: 8.1, 9.4, 10.3, 11.3_

- [x] 6. Implement core logic functions
  - [x] 6.1 Create `src/logic/derive-next-prayer.ts`
    - Implement `deriveNextPrayer(schedule: DailySchedule, now: Date): PrayerName | null`
    - Iterate `['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']`; return first prayer whose azan time is strictly after `now`; return `null` if all have passed
    - _Requirements: 4.1, 4.3_

  - [x] 6.2 Write property test for `deriveNextPrayer`
    - **Property 1: Next prayer is always in the future (or null)**
    - **Validates: Requirements 4.1, 4.3**

  - [x] 6.3 Write unit tests for `deriveNextPrayer`
    - Test: first prayer of day, mid-day, all passed, midnight boundary
    - _Requirements: 4.1, 4.3_

  - [x] 6.4 Create `src/logic/derive-countdown.ts`
    - Implement `deriveCountdown(schedule: DailySchedule, nextPrayer: PrayerName, now: Date): CountdownState`
    - Phase logic: `to_azan` when `now < azan`, `to_iqama` when `azan ≤ now < iqama`, `done` when `now ≥ iqama` and no later prayer
    - Format display as `MM:SS` or `H:MM:SS`
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 6.5 Write property test for countdown phase consistency
    - **Property 2: Countdown phase is consistent with current time**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5**

  - [x] 6.6 Write unit tests for `deriveCountdown`
    - Test phase transitions: before azan, between azan and iqama, after iqama
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 6.7 Create `src/logic/is-active.ts`
    - Implement `isActive(override: Override, today: string): boolean`
    - Return `true` iff `override.startDate ≤ today ≤ override.endDate`
    - _Requirements: 8.3_

  - [x] 6.8 Write property test for `isActive`
    - **Property 6: Override active-status classification is correct**
    - **Validates: Requirements 8.3**

  - [x] 6.9 Write unit tests for `isActive`
    - Test boundary dates: start day, end day, day before, day after
    - _Requirements: 8.3_

- [x] 7. Checkpoint — Ensure all logic tests pass
  - Run `vitest --run` and confirm all unit and property tests pass before proceeding to UI work.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement custom hooks
  - [x] 8.1 Create `src/hooks/useSchedule.ts`
    - Call `fetchScheduleForDate` on mount and when `date` changes; expose `{ data, loading, error, refetch }`
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 8.2 Create `src/hooks/useScheduleRange.ts`
    - Call `fetchScheduleForRange` on mount and when `start`/`end` change; expose `{ data, loading, error, refetch }`
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 8.3 Create `src/hooks/useOverrides.ts`
    - Call `fetchOverrides` on mount; expose `{ overrides, loading, error, create, update, remove, refetch }`
    - _Requirements: 8.1, 9.4, 10.3, 11.3_

  - [x] 8.4 Create `src/hooks/useNextPrayer.ts`
    - Wrap `deriveNextPrayer`; re-derive whenever `schedule` changes or the countdown tick fires
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 8.5 Create `src/hooks/useCountdown.ts`
    - Call `deriveCountdown` every 10 seconds using `setInterval`; clear interval on unmount
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.6 Create `src/hooks/useOnlineStatus.ts`
    - Listen to `window` `online`/`offline` events; return current `navigator.onLine` boolean
    - _Requirements: 6.5_

- [x] 9. Implement the app shell, routing, and gate components
  - [x] 9.1 Create `src/App.tsx` with React Router v6 `BrowserRouter`
    - Define routes: `/` → `PrayerViewerPage`, `/admin` → `AdminPage` (wrapped in `AdminAuthGate`), `/admin/schedule` → `ScheduleRangePage` (wrapped in `AdminAuthGate`)
    - Wrap everything in `ConfigGate`
    - _Requirements: 1.3_

  - [x] 9.2 Create `src/components/ConfigGate.tsx`
    - Read `baseUrl` from `useConfig`; if missing or invalid, render `ConfigSetupScreen`; otherwise render children
    - _Requirements: 1.3_

  - [x] 9.3 Create `src/components/ConfigSetupScreen.tsx`
    - Render a URL input with inline validation (regex check before enabling save)
    - On save, call `setBaseUrl` and dismiss the screen
    - Minimum 44px touch targets; no horizontal scroll at 320px
    - _Requirements: 1.3, 13.1, 13.3_

  - [x] 9.4 Create `src/components/AdminAuthGate.tsx`
    - Read `apiKey` from `useConfig`; if empty, render `ApiKeyEntryScreen`; otherwise render children
    - On `AuthError` from any child service call, clear the key and re-render `ApiKeyEntryScreen`
    - _Requirements: 7.1, 7.3_

  - [x] 9.5 Create `src/components/ApiKeyEntryScreen.tsx`
    - Render an API key input and a save button
    - On save, call `setApiKey` and dismiss the screen
    - Minimum 44px touch targets
    - _Requirements: 7.1, 7.2, 13.2_

- [x] 10. Implement the Public Prayer Viewer page
  - [x] 10.1 Create `src/components/OfflineBanner.tsx`
    - Render a visible banner when `useOnlineStatus()` returns `false`
    - _Requirements: 6.5_

  - [x] 10.2 Create `src/components/DayTabBar.tsx`
    - Render "Today" and "Tomorrow" tabs; emit `onTabChange` with `'today' | 'tomorrow'`
    - Minimum 44px touch targets; support swipe gesture via `touchstart`/`touchend` events
    - _Requirements: 3.3, 13.3_

  - [x] 10.3 Create `src/components/PrayerRow.tsx`
    - Render one row: prayer name, azan time, iqama time (or sunrise label for sunrise row)
    - Apply highlight styles when `isNext === true`
    - Minimum 44px row height
    - _Requirements: 3.2, 4.2, 13.3_

  - [x] 10.4 Create `src/components/PrayerTable.tsx`
    - Render Gregorian date, Hijri date, day of week, sunrise row, and five `PrayerRow` components
    - Show override indicator badge when `schedule.metadata.has_overrides === true`
    - _Requirements: 3.2, 3.5_

  - [x] 10.5 Create `src/components/NextPrayerBanner.tsx`
    - Display the next prayer name and `countdown.display`; hide when `nextPrayer` is null
    - _Requirements: 5.1, 5.5_

  - [x] 10.6 Create `src/pages/PrayerViewerPage.tsx`
    - Compose `OfflineBanner`, `DayTabBar`, `PrayerTable`, and `NextPrayerBanner`
    - Use `useSchedule` for today and tomorrow; use `useNextPrayer` and `useCountdown` for live state
    - Show loading skeleton and error banner with retry button
    - _Requirements: 3.1, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.4, 6.5_

  - [x] 10.7 Write component tests for `PrayerTable`
    - Assert all 5 prayers + sunrise are rendered for any valid `DailySchedule`
    - Assert override indicator appears iff `metadata.has_overrides` is true
    - **Property 8: PrayerTable renders all required fields for any schedule**
    - **Property 10: has_overrides indicator is shown if and only if overrides are active**
    - **Validates: Requirements 3.2, 3.5**

  - [x] 10.8 Write component tests for `PrayerRow`
    - Assert highlight class is applied when `isNext === true` and absent otherwise
    - **Property 9: Exactly one prayer row is highlighted as next**
    - **Validates: Requirements 4.2**

  - [x] 10.9 Write component tests for `OfflineBanner`
    - Assert banner renders when `useOnlineStatus` returns `false` and is absent when `true`
    - _Requirements: 6.5_

- [x] 11. Checkpoint — Ensure all public viewer tests pass
  - Run `vitest --run` and confirm all tests pass before proceeding to admin UI.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement the Admin Override management UI
  - [x] 12.1 Create `src/components/OverrideRow.tsx`
    - Display prayer name, override type, value, start date, end date
    - Visually distinguish active overrides using `isActive(override, today)`
    - Render Edit and Delete buttons (minimum 44px touch targets)
    - _Requirements: 8.2, 8.3, 13.2_

  - [x] 12.2 Create `src/components/OverrideFormModal.tsx`
    - Render fields: prayer select, type radio (FIXED/OFFSET), value input, start date, end date
    - Pre-populate fields when `initial` prop is provided (edit mode)
    - Validate FIXED value against `/^([01]\d|2[0-3]):[0-5]\d$/` and OFFSET against `/^[+-]?\d+$/`
    - Enforce `endDate >= startDate` client-side; show inline validation errors
    - On submit, call `onSave(payload)` and close on success
    - Use native `<input type="date">` and `<input type="time">` for mobile usability
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 13.5_

  - [x] 12.3 Create `src/components/OverrideList.tsx`
    - Render list of `OverrideRow` components; show empty-state message when list is empty
    - Wire `onEdit` to open `OverrideFormModal` in edit mode
    - Wire `onDelete` to show a confirmation dialog before calling `remove`
    - _Requirements: 8.1, 8.4, 11.1, 11.2_

  - [x] 12.4 Create `src/pages/OverridesPage.tsx`
    - Compose `OverrideList` and a "New Override" button that opens `OverrideFormModal` in create mode
    - Use `useOverrides` hook; show loading state and error banner with retry
    - Show a refresh button that calls `refetch`
    - _Requirements: 8.1, 8.5, 9.4, 9.5, 9.6, 10.3, 10.4, 10.5, 10.6, 11.3, 11.4, 11.5_

  - [x] 12.5 Write component tests for `OverrideRow`
    - Assert all required fields are rendered for any valid `Override`
    - Assert active/inactive visual distinction based on `isActive`
    - Assert delete button triggers confirmation before calling `onDelete`
    - **Property 11: OverrideRow renders all required fields for any override**
    - **Validates: Requirements 8.2, 8.3**

  - [x] 12.6 Write component tests for `OverrideFormModal`
    - Test FIXED and OFFSET validation logic
    - Test pre-population in edit mode
    - Test that invalid inputs prevent submission
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2_

- [ ] 13. Implement the Admin Schedule Range view
  - [x] 13.1 Create `src/components/DateRangePicker.tsx`
    - Render start-date and end-date inputs; default range is today + 6 days (7 days total)
    - Emit `onRangeChange(start, end)` when either date changes
    - Minimum 44px touch targets; use native `<input type="date">`
    - _Requirements: 12.1, 12.2, 13.2, 13.5_

  - [x] 13.2 Create `src/components/ScheduleRangeRow.tsx`
    - Display one day's iqama times alongside any active overrides for that day
    - Show override indicator when `schedule.metadata.has_overrides === true`
    - Render tappable prayer cells that call `onCellTap(date, prayer)` to initiate override creation
    - Minimum 44px touch targets
    - _Requirements: 12.3, 12.4, 12.5, 13.2_

  - [x] 13.3 Create `src/components/ScheduleRangeTable.tsx`
    - Render a list of `ScheduleRangeRow` components for the fetched range
    - Show loading skeleton and error state
    - _Requirements: 12.2, 12.3_

  - [ ] 13.4 Create `src/pages/ScheduleRangePage.tsx`
    - Compose `DateRangePicker`, `ScheduleRangeTable`, and `OverrideFormModal`
    - Use `useScheduleRange` and `useOverrides`; open `OverrideFormModal` pre-filled with date/prayer when a cell is tapped
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 14. Implement the Admin layout and navigation
  - [x] 14.1 Create `src/components/AdminNav.tsx`
    - Render a tab bar with "Overrides" and "Schedule" links using React Router `<NavLink>`
    - Minimum 44px touch targets; highlight active tab
    - _Requirements: 13.2_

  - [x] 14.2 Create `src/pages/AdminPage.tsx` (AdminLayout)
    - Compose `AdminNav` and render child routes (`OverridesPage`, `ScheduleRangePage`)
    - Include a "Sign out" button that calls `clearApiKey` and navigates to `/admin`
    - _Requirements: 7.5_

- [x] 15. Checkpoint — Ensure all admin UI tests pass
  - Run `vitest --run` and confirm all tests pass before proceeding to PWA finalization.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Finalize PWA manifest and service worker
  - [x] 16.1 Create `public/manifest.json` (or configure via `vite-plugin-pwa`)
    - Include `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color`, `theme_color`
    - Add icons at 192×192px and 512×512px in `public/icons/`
    - _Requirements: 6.1_

  - [x] 16.2 Configure `vite-plugin-pwa` in `vite.config.ts` for shell-only caching
    - Use `generateSW` strategy with `runtimeCaching: []` (no data caching)
    - Precache only the app shell assets (HTML, CSS, JS bundles)
    - _Requirements: 6.2, 6.3, 2.5_

  - [x] 16.3 Write integration test for `AdminAuthGate` 401/403 handling with MSW
    - Mount MSW handler that returns 401; assert `AdminAuthGate` clears the API key and renders `ApiKeyEntryScreen`
    - _Requirements: 7.3_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Run `vitest --run` and confirm the full test suite passes.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 7, 11, 15, and 17 ensure incremental validation
- Property tests use `fast-check` with a minimum of 100 iterations each
- Component tests use Vitest + React Testing Library
- Integration tests use MSW to mock the `iqama-engine` API
- No data caching anywhere — every API call goes directly to the server
- Countdown ticks every 10 seconds via `setInterval` in `useCountdown`
- All touch targets must be at minimum 44×44 CSS pixels
- No horizontal scroll at 320px viewport width
