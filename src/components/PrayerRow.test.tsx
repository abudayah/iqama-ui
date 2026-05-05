// Feature: prayer-app, Property 9: Exactly one prayer row is highlighted as next
// Validates: Requirements 4.2

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { PrayerRow } from './PrayerRow';
import { PrayerTable } from './PrayerTable';
import type { DailySchedule, PrayerName } from '../types/index';

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

const prayerNameArb: fc.Arbitrary<PrayerName> = fc.constantFrom(
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
);

describe('PrayerRow — unit tests', () => {
  it('applies highlight style when isNext is true', () => {
    render(
      <PrayerRow
        name="fajr"
        entry={{ azan: '05:30', iqama: '05:45' }}
        isNext={true}
        isActive={false}
        isPast={false}
        isPeeked={false}
      />,
    );

    const row = screen.getByTestId('prayer-row-fajr');
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(row.className).toContain('bg-blue-50');
  });

  it('does not apply highlight style when isNext is false', () => {
    render(
      <PrayerRow
        name="fajr"
        entry={{ azan: '05:30', iqama: '05:45' }}
        isNext={false}
        isActive={false}
        isPast={false}
        isPeeked={false}
      />,
    );

    const row = screen.getByTestId('prayer-row-fajr');
    expect(row).not.toHaveAttribute('aria-current');
    expect(row.className).not.toContain('bg-blue-50');
  });

  it('reduces opacity when isPast is true', () => {
    render(
      <PrayerRow
        name="fajr"
        entry={{ azan: '05:30', iqama: '05:45' }}
        isNext={false}
        isActive={false}
        isPast={true}
        isPeeked={false}
      />,
    );

    const row = screen.getByTestId('prayer-row-fajr');
    expect(row.className).toContain('opacity-40');
  });

  it('"now" badge has been removed', () => {
    render(
      <PrayerRow
        name="fajr"
        entry={{ azan: '05:30', iqama: '05:45' }}
        isNext={true}
        isActive={true}
        isPast={false}
        isPeeked={false}
      />,
    );
    expect(screen.queryByLabelText('Current prayer')).not.toBeInTheDocument();
  });
});

describe('PrayerRow — Property 9: Exactly one prayer row is highlighted as next', () => {
  // Feature: prayer-app, Property 9: Exactly one prayer row is highlighted as next
  it('highlights exactly the specified nextPrayer row and no other', () => {
    fc.assert(
      fc.property(scheduleArb, prayerNameArb, (schedule, nextPrayer) => {
        const { unmount } = render(
          <PrayerTable
            todaySchedule={schedule}
            tomorrowSchedule={null}
            nextPrayer={nextPrayer}
            activeTab="today"
            onTabChange={() => undefined}
          />,
        );

        const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

        // Count highlighted rows
        let highlightedCount = 0;
        for (const prayer of prayers) {
          const row = screen.getByTestId(`prayer-row-${prayer}`);
          if (row.getAttribute('aria-current') === 'true') {
            highlightedCount++;
            // The highlighted row must be the nextPrayer
            expect(prayer).toBe(nextPrayer);
          }
        }

        // Exactly one row should be highlighted
        expect(highlightedCount).toBe(1);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
