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

describe('PrayerTable — unit tests', () => {
  it('renders all 5 prayers and sunrise', () => {
    render(<PrayerTable schedule={fixtureSchedule} nextPrayer={null} isToday={false} />);

    expect(screen.getByTestId('prayer-row-fajr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-dhuhr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-asr')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-maghrib')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-isha')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-row-sunrise')).toBeInTheDocument();
  });

  it('renders sunrise immediately after fajr', () => {
    render(<PrayerTable schedule={fixtureSchedule} nextPrayer={null} isToday={false} />);

    const rows = screen.getAllByTestId(/^prayer-row-/);
    const names = rows.map(r => r.getAttribute('data-testid'));
    const fajrIdx = names.indexOf('prayer-row-fajr');
    const sunriseIdx = names.indexOf('prayer-row-sunrise');
    expect(sunriseIdx).toBe(fajrIdx + 1);
  });

  it('shows override indicator when has_overrides is true', () => {
    const schedule = { ...fixtureSchedule, metadata: { calculation_method: 'ISNA' as const, has_overrides: true } };
    render(<PrayerTable schedule={schedule} nextPrayer={null} isToday={false} />);

    expect(screen.getByTestId('override-indicator')).toBeInTheDocument();
  });

  it('does not show override indicator when has_overrides is false', () => {
    render(<PrayerTable schedule={fixtureSchedule} nextPrayer={null} isToday={false} />);

    expect(screen.queryByTestId('override-indicator')).not.toBeInTheDocument();
  });
});

describe('PrayerTable — Property 8: renders all required fields for any schedule', () => {
  // Feature: prayer-app, Property 8: PrayerTable renders all required fields for any schedule
  it('always renders date, hijri date, day of week, sunrise, and all 5 prayer rows', () => {
    fc.assert(
      fc.property(scheduleArb, (schedule) => {
        const { unmount } = render(
          <PrayerTable schedule={schedule} nextPrayer={null} isToday={false} />,
        );

        // Gregorian date, hijri date, day of week
        expect(screen.getByText(schedule.date)).toBeInTheDocument();
        expect(screen.getByText(schedule.hijri_date)).toBeInTheDocument();
        expect(screen.getByText(schedule.day_of_week)).toBeInTheDocument();

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

describe('PrayerTable — Property 10: has_overrides indicator shown iff overrides are active', () => {
  // Feature: prayer-app, Property 10: has_overrides indicator is shown if and only if overrides are active
  it('shows override indicator iff metadata.has_overrides is true', () => {
    fc.assert(
      fc.property(scheduleArb, (schedule) => {
        const { unmount } = render(
          <PrayerTable schedule={schedule} nextPrayer={null} isToday={false} />,
        );

        const indicator = screen.queryByTestId('override-indicator');

        if (schedule.metadata.has_overrides) {
          expect(indicator).toBeInTheDocument();
        } else {
          expect(indicator).not.toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
