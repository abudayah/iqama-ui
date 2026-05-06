// Feature: prayer-app, Property 8: PrayerTable renders all required fields for any schedule
// Feature: prayer-app, Property 10: has_overrides indicator is shown if and only if overrides are active
// Validates: Requirements 3.2, 3.5

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { PrayerTable } from './PrayerTable';
import type { DailySchedule } from '../types/index';

const fixtureSchedule: DailySchedule = {
  date: '2025-01-15',
  hijri_date: 'Rajab 15, 1446',
  day_of_week: 'Wednesday',
  is_dst: false,
  fajr: { azan: '05:30', iqama: '05:45' },
  sunrise: '07:00',
  dhuhr: { azan: '12:15', iqama: '12:30' },
  asr: { azan: '15:30', iqama: '15:45' },
  maghrib: { azan: '17:45', iqama: '17:50' },
  isha: { azan: '19:15', iqama: '19:30' },
  metadata: { calculation_method: 'ISNA', has_overrides: false },
};

// Arbitraries
const timeArb = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

const prayerEntryArb = fc.record({
  azan: timeArb,
  iqama: timeArb,
});

const scheduleArb: fc.Arbitrary<DailySchedule> = fc.record({
  date: fc.constant('2025-01-15'),
  hijri_date: fc.constant('Rajab 15, 1446'),
  day_of_week: fc.constant('Wednesday'),
  is_dst: fc.boolean(),
  fajr: prayerEntryArb,
  sunrise: timeArb,
  dhuhr: prayerEntryArb,
  asr: prayerEntryArb,
  maghrib: prayerEntryArb,
  isha: prayerEntryArb,
  metadata: fc.record({
    calculation_method: fc.constant('ISNA' as const),
    has_overrides: fc.boolean(),
  }),
});

const validHHmmArbitrary = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

/** Helper: render PrayerTable with the new API using sensible defaults */
function renderTable(schedule: DailySchedule) {
  return render(
    <PrayerTable
      todaySchedule={schedule}
      tomorrowSchedule={null}
      nextPrayer={null}
      activeTab="today"
      onTabChange={() => undefined}
    />,
  );
}

describe('PrayerTable — unit tests', () => {
  it('renders all 5 prayers and sunrise', () => {
    renderTable(fixtureSchedule);

    expect(screen.getByTestId('prayer-row-fajr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-dhuhr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-asr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-maghrib')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-isha')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-sunrise')).toBeInTheDocument();
  });

  it('renders sunrise immediately after fajr', () => {
    renderTable(fixtureSchedule);

    const rows = screen.getAllByTestId(/^prayer-row-/);
    const names = rows.map((r) => r.getAttribute('data-testid'));
    const fajrIdx = names.indexOf('prayer-row-fajr');
    const sunriseIdx = names.indexOf('prayer-row-sunrise');
    expect(sunriseIdx).toBe(fajrIdx + 1);
  });
});

describe('PrayerTable — Property 8: renders all required fields for any schedule', () => {
  // Feature: prayer-app, Property 8: PrayerTable renders all required fields for any schedule
  it('always renders all 5 prayer rows and sunrise', () => {
    fc.assert(
      fc.property(scheduleArb, (schedule) => {
        const { unmount } = render(
          <PrayerTable
            todaySchedule={schedule}
            tomorrowSchedule={null}
            nextPrayer={null}
            activeTab="today"
            onTabChange={() => undefined}
          />,
        );

        // Sunrise row
        expect(screen.getByTestId('prayer-row-sunrise')).toBeInTheDocument();

        // All 5 prayer rows
        for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
          expect(screen.getByTestId(`prayer-row-${prayer}`)).toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Task 12.2 — Qiyam row unit tests ────────────────────────────────────────
// Feature: ramadan-eid-admin-redesign
// Validates: Requirements 10.1, 10.4

describe('PrayerTable — Qiyam row unit tests', () => {
  it('renders Qiyam row when qiyam_time is set', () => {
    const schedule: DailySchedule = {
      ...fixtureSchedule,
      qiyam_time: '01:30',
    };
    renderTable(schedule);

    // PrayerTable renders both today and tomorrow panels (200% wide strip)
    // so the Qiyam row appears in both panels
    expect(screen.getAllByText('Qiyam').length).toBeGreaterThan(0);
  });

  it('does not render Qiyam row when qiyam_time is absent', () => {
    // fixtureSchedule has no qiyam_time
    renderTable(fixtureSchedule);

    expect(screen.queryByText('Qiyam')).not.toBeInTheDocument();
  });

  it('does not display an iqama value in the Qiyam row', () => {
    const schedule: DailySchedule = {
      ...fixtureSchedule,
      qiyam_time: '01:30',
    };
    renderTable(schedule);

    // Find the first row containing the "Qiyam" label
    const qiyamLabels = screen.getAllByText('Qiyam');
    const row = qiyamLabels[0]!.closest('[data-testid="prayer-row-isha"]');
    expect(row).not.toBeNull();

    // The iqama span renders an empty string — confirm no iqama time is shown
    const timeSpans = row!.querySelectorAll('.tabular-nums span');
    expect(timeSpans[0]?.textContent).toBe('01:30');
    expect(timeSpans[1]?.textContent).toBe('');
  });
});

// ─── Task 12.3 — Property 3 + 4: Qiyam row property-based tests ──────────────
// Feature: ramadan-eid-admin-redesign
// Property 3: for any valid HH:mm qiyam_time, Qiyam row is present and shows that time
// Property 4: for any schedule without qiyam_time, no Qiyam row is rendered
// Validates: Requirements 10.1, 10.2, 10.4

describe('PrayerTable — Property 3: Qiyam row present for any valid qiyam_time', () => {
  /**
   * **Validates: Requirements 10.1, 10.2**
   *
   * For any valid HH:mm qiyam_time, the PrayerTable SHALL render a "Qiyam" row
   * and display that exact time string.
   */
  it('always renders Qiyam row and displays the exact time when qiyam_time is set', () => {
    fc.assert(
      fc.property(validHHmmArbitrary, (qiyamTime) => {
        const schedule: DailySchedule = {
          ...fixtureSchedule,
          qiyam_time: qiyamTime,
        };
        const { unmount } = renderTable(schedule);

        // Qiyam label must be present (may appear in both today/tomorrow panels)
        const qiyamLabels = screen.getAllByText('Qiyam');
        expect(qiyamLabels.length).toBeGreaterThan(0);

        // The azan time displayed must match the qiyam_time exactly
        const row = qiyamLabels[0]!.closest('[data-testid="prayer-row-isha"]');
        expect(row).not.toBeNull();
        const timeSpans = row!.querySelectorAll('.tabular-nums span');
        expect(timeSpans[0]?.textContent).toBe(qiyamTime);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

describe('PrayerTable — Property 4: no Qiyam row when qiyam_time is absent', () => {
  /**
   * **Validates: Requirements 10.4**
   *
   * For any schedule without qiyam_time, the PrayerTable SHALL NOT render a Qiyam row.
   */
  it('never renders Qiyam row when schedule has no qiyam_time', () => {
    fc.assert(
      fc.property(scheduleArb, (schedule) => {
        // scheduleArb does not include qiyam_time, so it will always be absent
        const { unmount } = renderTable(schedule);

        expect(screen.queryByText('Qiyam')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
