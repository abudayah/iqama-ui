# Tasks

## Task List

- [x] 1. Backend — Prisma schema and migration
  - [x] 1.1 Add `QiyamConfig` model to `iqama-engine/prisma/schema.prisma` with fields `id`, `hijri_year` (unique), `start_time`, `createdAt`, `updatedAt`
  - [x] 1.2 Run `npx prisma migrate dev --name add-qiyam-config` to generate and apply the migration
  - [x] 1.3 Run `npx prisma generate` to regenerate the Prisma client

- [x] 2. Backend — DailySchedule interface extension
  - [x] 2.1 Add `qiyam_time?: string; // HH:mm` to `iqama-engine/src/schedule/daily-schedule.interface.ts` after `eid_prayer_2`

- [x] 3. Backend — QiyamConfigService
  - [x] 3.1 Create `iqama-engine/src/hijri-calendar/qiyam-config.service.ts` with `@Injectable()` class `QiyamConfigService`
  - [x] 3.2 Implement `getForYear(hijriYear: number): Promise<{ hijri_year: number; start_time: string } | null>` using `prisma.qiyamConfig.findUnique`
  - [x] 3.3 Implement `upsert(hijriYear: number, startTime: string): Promise<void>` using `prisma.qiyamConfig.upsert` keyed on `hijri_year`
  - [x] 3.4 Write unit tests in `qiyam-config.service.spec.ts`: assert `getForYear` returns null when no record; assert `upsert` creates a record; assert `upsert` updates an existing record (upsert semantics)
  - [x] 3.5 Write property-based test (Property 9): for any valid HH:mm times `time1` and `time2`, calling `upsert(year, time1)` then `upsert(year, time2)` results in exactly one record with `start_time === time2` — run 100 iterations

- [x] 4. Backend — QiyamConfigDto
  - [x] 4.1 Create `iqama-engine/src/hijri-calendar/dto/qiyam-config.dto.ts` with class `QiyamConfigDto` containing `start_time: string` decorated with `@IsString()` and `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'start_time must be a valid HH:mm time (00:00–23:59)' })`

- [x] 5. Backend — HijriCalendarController new endpoints
  - [x] 5.1 Inject `QiyamConfigService` into `HijriCalendarController` constructor
  - [x] 5.2 Add `GET qiyam-config` endpoint: resolve current Hijri year via `dayjs().calendar('hijri').year()`, delegate to `QiyamConfigService.getForYear(hijriYear)`, return result (no `@UseGuards`)
  - [x] 5.3 Add `POST qiyam-config` endpoint: decorated with `@UseGuards(ApiKeyGuard)` and `@HttpCode(HttpStatus.CREATED)`, accept `@Body() dto: QiyamConfigDto`, resolve current Hijri year, delegate to `QiyamConfigService.upsert(hijriYear, dto.start_time)`
  - [x] 5.4 Register `QiyamConfigService` in the `HijriCalendarModule` providers array
  - [x] 5.5 Write controller unit tests: GET returns 200 with correct shape; GET returns null when no config; POST returns 201 with valid body; POST returns 401 without API key
  - [x] 5.6 Write property-based test (Property 8): for any string not matching `^([01]\d|2[0-3]):[0-5]\d$`, POST returns 422 — run 100 iterations
  - [x] 5.7 Write property-based test (Property 1): for any valid HH:mm time, POST then GET returns the identical `start_time` string — run 100 iterations

- [x] 6. Backend — ScheduleBuilderService Qiyam injection
  - [x] 6.1 Inject `QiyamConfigService` into `ScheduleBuilderService` constructor
  - [x] 6.2 Add `isQiyamNight(date: Dayjs): boolean` helper function that returns true when Hijri month = 9 and Hijri day ∈ 20–29
  - [x] 6.3 In `buildMonth`, before the per-day loop, fetch `QiyamConfigService.getForYear(hijriYear)` once (derive `hijriYear` from the first day of the month using the dayjs-hijri plugin)
  - [x] 6.4 In the per-day loop, spread `qiyam_time: qiyamConfig.start_time` into the `DailySchedule` object when `qiyamConfig !== null && isQiyamNight(dateDayjs)`, following the same pattern as `eid_prayer_1`/`eid_prayer_2`
  - [x] 6.5 Write unit tests: assert `qiyam_time` injected on days 20–29 of month 9; assert `qiyam_time` absent on day 19 and day 30 of month 9; assert `qiyam_time` absent on all days of non-Ramadan months; assert `qiyam_time` absent when no `QiyamConfig` exists
  - [x] 6.6 Write property-based test (Property 2): for any valid HH:mm `startTime`, mock `QiyamConfigService.getForYear` to return `{ start_time: startTime }`, build schedule for a Ramadan month, assert all qualifying days have `qiyam_time === startTime` and all non-qualifying days have no `qiyam_time` — run 100 iterations

- [x] 7. Frontend — DailySchedule type extension
  - [x] 7.1 Add `qiyam_time?: string; // HH:mm` to the `DailySchedule` interface in `iqama-ui/src/types/index.ts` after `eid_prayer_2`

- [x] 8. Frontend — hijri-calendar-service extension
  - [x] 8.1 Add `fetchQiyamConfig()` function to `iqama-ui/src/services/hijri-calendar-service.ts`: calls `GET /api/v1/hijri-calendar/qiyam-config` without `requiresAuth`, returns `Promise<{ hijri_year: number; start_time: string } | null>`, throws `Error` on non-2xx
  - [x] 8.2 Add `saveQiyamConfig(startTime: string)` function: calls `POST /api/v1/hijri-calendar/qiyam-config` with `requiresAuth: true` and `Content-Type: application/json`, returns `Promise<void>`, throws `Error` on non-2xx
  - [x] 8.3 Write unit tests: assert `fetchQiyamConfig` calls correct URL without auth header; assert `saveQiyamConfig` calls correct URL with auth header and correct body; assert both throw on non-2xx responses

- [x] 9. Frontend — useQiyamConfig hook
  - [x] 9.1 Create `iqama-ui/src/hooks/useQiyamConfig.ts` with state: `config`, `loading`, `error`, `saving`, `saveError`, `saveSuccess`
  - [x] 9.2 Fetch `fetchQiyamConfig()` on mount via `useEffect`; set `config`, `loading`, `error` accordingly
  - [x] 9.3 Expose `save(startTime: string): Promise<void>` that calls `saveQiyamConfig(startTime)`, sets `saving`/`saveError`/`saveSuccess` state
  - [x] 9.4 Write unit tests: assert fetch on mount; assert `config` pre-populated from response; assert `save` dispatches POST; assert `saveError` set on failure; assert `saveSuccess` set on success

- [x] 10. Frontend — AdminNav rename
  - [x] 10.1 In `iqama-ui/src/components/AdminNav.tsx`, change the third `NavLink` label from `"Eid & Moon Sighting"` to `"Ramadan & Eid"`
  - [x] 10.2 Write/update unit tests: assert third tab renders "Ramadan & Eid"; assert active styling applied when route is `/admin/eid`

- [x] 11. Frontend — ConfirmationSheet component
  - [x] 11.1 Create `iqama-ui/src/components/ConfirmationSheet.tsx` with props `consequenceText: string`, `onConfirm: () => void`, `onCancel: () => void`
  - [x] 11.2 Render a fixed-position backdrop overlay (tapping backdrop calls `onCancel`) and a bottom-sheet panel with the consequence text, a "Confirm" button, and a "Cancel" button
  - [x] 11.3 Write unit tests: assert consequence text is rendered; assert "Confirm" button calls `onConfirm`; assert "Cancel" button calls `onCancel`; assert backdrop tap calls `onCancel`

- [x] 12. Frontend — PrayerTable Qiyam row
  - [x] 12.1 In `iqama-ui/src/components/PrayerTable.tsx`, in the `DayRows` component, add a conditional `PrayerRow` after the Isha row: render when `schedule.qiyam_time` is present, with `label="Qiyam"`, `entry={{ azan: schedule.qiyam_time, iqama: '' }}`, and all interaction props set to false/undefined
  - [x] 12.2 Write unit tests: assert Qiyam row present when `qiyam_time` is set; assert Qiyam row absent when `qiyam_time` is absent; assert no iqama value displayed in Qiyam row
  - [x] 12.3 Write property-based test (Property 3 + 4): for any valid HH:mm `qiyam_time`, render `PrayerTable`, assert Qiyam row is present and displays that exact time string; for any schedule without `qiyam_time`, assert no Qiyam row — run 100 iterations

- [x] 13. Frontend — RamadanEidPage
  - [x] 13.1 Create `iqama-ui/src/pages/RamadanEidPage.tsx` with three sections: Moon Sighting, Eid Prayer Times, Qiyam al-Layl
  - [x] 13.2 Implement Moon Sighting section: display `SightingCard` (reused), status card with Hijri date, Confirmed/Pending badge, skeleton loading state, and error state
  - [x] 13.3 Wire `SightingCard` decision buttons to set `pendingDecision` state and open `ConfirmationSheet` (do NOT dispatch POST immediately)
  - [x] 13.4 Implement `ConfirmationSheet` integration: compute `consequenceText` (Eid date for months 9/11; month length for others); on Confirm for months 9/11 → close sheet, open `EidPrayerModal`; on Confirm for other months → dispatch POST, show success/error; on Cancel → close sheet
  - [x] 13.5 Implement Eid Prayer Times section: display two cards (Eid al-Fitr, Eid al-Adha) using `useEidPrayers`; show prayer times when `source === 'override'`; show "Prayer times will be set once the moon-sighting override is submitted" when `source === 'astronomical'`; show "No prayer times saved yet" when no record; include "Edit times" button that opens `EidPrayerModal` pre-populated
  - [x] 13.6 Implement Qiyam al-Layl section: use `useQiyamConfig` hook; display time input pre-populated from fetched config; display label "Active nights: 21st–30th Ramadan" and the note text; "Save Qiyam time" button dispatches POST; show success/error feedback; no iqama field
  - [x] 13.7 Write unit tests: assert Action Card always renders; assert ConfirmationSheet opens on button tap without dispatching POST; assert EidPrayerModal opens for months 9 and 11; assert POST dispatched directly for non-Eid months; assert success/error states for both POST flows; assert Qiyam section pre-populates time input; assert Qiyam save dispatches POST
  - [x] 13.8 Write property-based test (Property 5): for any Hijri day (1–30), render `RamadanEidPage` with that day in status, assert Action Card is present — run 100 iterations
  - [x] 13.9 Write property-based test (Property 6): for any Hijri month (1–12) and length (29 or 30), render `ConfirmationSheet` with computed consequence text, assert months 9/11 show an Eid date and other months show the length — run 100 iterations
  - [x] 13.10 Write property-based test (Property 7): for any Hijri month not in {9, 11}, tap Confirm, assert POST is dispatched and `EidPrayerModal` is not open — run 100 iterations

- [x] 14. Frontend — Route and page registration
  - [x] 14.1 Update the router configuration to replace `EidMoonSightingPage` with `RamadanEidPage` at the `/admin/eid` route (locate the router file, typically `App.tsx` or a routes file)
  - [x] 14.2 Verify the old `EidMoonSightingPage` import is removed from the router; the file itself may be kept or deleted depending on whether it is referenced elsewhere

- [x] 15. End-to-end verification
  - [x] 15.1 Run the full frontend test suite (`npx vitest --run`) and confirm all tests pass
  - [x] 15.2 Run the full backend test suite (`npm run test`) and confirm all tests pass
  - [x] 15.3 Run `npx tsc --noEmit` in both `iqama-ui` and `iqama-engine` to confirm no TypeScript errors
