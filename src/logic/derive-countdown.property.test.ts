// Feature: prayer-app, Property 2: Countdown phase is consistent with current time
// Validates: Requirements 5.1, 5.3, 5.4, 5.5

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { deriveCountdown } from './derive-countdown';
import type { DailySchedule } from '../types/index';

const DATE = '2025-01-15';

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToDate(minutes: number): Date {
  return new Date(2025, 0, 15, Math.floor(minutes / 60), minutes % 60, 0, 0); // local time
}

// Generate minutes-since-midnight for azan, iqama, and now
const minutesArb = fc.integer({ min: 0, max: 23 * 60 + 59 });

// Generate a scenario: azan, iqama (iqama >= azan), now
const scenarioArb = fc.tuple(minutesArb, minutesArb, minutesArb).map(([azanMin, iqamaMin, nowMin]) => {
  // Ensure iqama >= azan
  const actualIqama = Math.max(azanMin, iqamaMin);
  return { azanMin, iqamaMin: actualIqama, nowMin };
});

// Display format: MM:SS or H:MM:SS or HH:MM:SS
const DISPLAY_FORMAT_REGEX = /^\d+:\d{2}(:\d{2})?$/;

function buildSchedule(azanMin: number, iqamaMin: number): DailySchedule {
  return {
    date: DATE,
    hijri_date: 'Rajab 15, 1446',
    day_of_week: 'Wednesday',
    is_dst: false,
    fajr: {
      azan: minutesToTimeString(azanMin),
      iqama: minutesToTimeString(iqamaMin),
    },
    sunrise: '06:30',
    dhuhr: { azan: '23:59', iqama: '23:59' },
    asr: { azan: '23:59', iqama: '23:59' },
    maghrib: { azan: '23:59', iqama: '23:59' },
    isha: { azan: '23:59', iqama: '23:59' },
    metadata: {
      calculation_method: 'ISNA',
      has_overrides: false,
    },
  };
}

describe('deriveCountdown — Property 2: Countdown phase is consistent with current time', () => {
  it('phase matches the time relationship between now, azan, and iqama', () => {
    fc.assert(
      fc.property(scenarioArb, ({ azanMin, iqamaMin, nowMin }) => {
        const schedule = buildSchedule(azanMin, iqamaMin);
        const now = minutesToDate(nowMin);
        const azanDate = minutesToDate(azanMin);
        const iqamaDate = minutesToDate(iqamaMin);

        const result = deriveCountdown(schedule, 'fajr', now);

        if (result.phase === 'to_azan') {
          // now must be strictly before azan
          const nowBeforeAzan = now < azanDate;
          // display must match MM:SS or H:MM:SS
          const displayValid = DISPLAY_FORMAT_REGEX.test(result.display);
          return nowBeforeAzan && displayValid;
        }

        if (result.phase === 'to_iqama') {
          // azan <= now < iqama
          const nowAfterOrAtAzan = now >= azanDate;
          const nowBeforeIqama = now < iqamaDate;
          // display must match MM:SS or H:MM:SS
          const displayValid = DISPLAY_FORMAT_REGEX.test(result.display);
          return nowAfterOrAtAzan && nowBeforeIqama && displayValid;
        }

        if (result.phase === 'done') {
          // now >= iqama
          const nowAfterOrAtIqama = now >= iqamaDate;
          // display must be a non-empty string
          const displayNonEmpty = result.display.length > 0;
          return nowAfterOrAtIqama && displayNonEmpty;
        }

        // Unknown phase — fail
        return false;
      }),
      { numRuns: 100 },
    );
  });
});
