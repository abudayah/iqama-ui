// Feature: prayer-app, Property 1: Next prayer is always in the future (or null)
// Validates: Requirements 4.1, 4.3

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { deriveNextPrayer } from './derive-next-prayer';
import type { DailySchedule } from '../types/index';

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

const nowArb = fc.integer({ min: 0, max: 23 * 60 + 59 }).map(totalMinutes => {
  return new Date(2025, 0, 15, Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0); // local time
});

describe('deriveNextPrayer — Property 1: Next prayer is always in the future (or null)', () => {
  it('returns null or a prayer whose azan is strictly after now', () => {
    fc.assert(
      fc.property(scheduleArb, nowArb, (schedule, now) => {
        const result = deriveNextPrayer(schedule, now);

        if (result === null) {
          // All prayers have passed — acceptable
          return true;
        }

        // Parse the returned prayer's azan time on the same date
        const entry = schedule[result];
        const [hoursStr, minutesStr] = entry.azan.split(':');
        const azanDate = new Date(2025, 0, 15, Number(hoursStr), Number(minutesStr), 0, 0); // local time

        // The azan time must be strictly after now
        return azanDate > now;
      }),
      { numRuns: 100 },
    );
  });
});
