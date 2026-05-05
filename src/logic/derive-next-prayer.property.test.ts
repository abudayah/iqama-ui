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
  it('returns null or a prayer whose azan is after now, or whose iqama window contains now', () => {
    fc.assert(
      fc.property(scheduleArb, nowArb, (schedule, now) => {
        const result = deriveNextPrayer(schedule, now);

        if (result === null) {
          // All prayers have passed — acceptable
          return true;
        }

        // Sunrise and Eid prayers have no iqama — just check the time is in the future
        if (result === 'sunrise') {
          const [sh, sm] = schedule.sunrise.split(':').map(Number);
          const sunriseDate = new Date(2025, 0, 15, sh!, sm!, 0, 0);
          return sunriseDate > now;
        }
        if (result === 'eid-prayer-1' || result === 'eid-prayer-2') {
          return true; // Eid prayers only appear when eid_prayer_1/2 is set
        }

        const entry = schedule[result];
        const [ah, am] = entry.azan.split(':').map(Number);
        const [ih, im] = entry.iqama.split(':').map(Number);
        const azanDate  = new Date(2025, 0, 15, ah!, am!, 0, 0);
        const iqamaDate = new Date(2025, 0, 15, ih!, im!, 0, 0);

        // Either: azan is in the future, OR we're in the iqama window
        return azanDate > now || (now >= azanDate && now < iqamaDate);
      }),
      { numRuns: 100 },
    );
  });
});
