// Feature: prayer-app, Property 6: Override active-status classification is correct

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { isActive } from './is-active';
import type { PrayerName } from '../types/index';

/**
 * Validates: Requirements 8.3
 *
 * Property 6: Override active-status classification is correct
 * For any Override and any reference date today (YYYY-MM-DD string),
 * isActive(override, today) is true if and only if
 * override.startDate <= today <= override.endDate.
 */

const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const overrideArb = fc.record({
  id: fc.integer({ min: 1 }),
  prayer: fc.constantFrom('fajr', 'dhuhr', 'asr', 'maghrib', 'isha') as fc.Arbitrary<PrayerName>,
  overrideType: fc.constantFrom('FIXED', 'OFFSET') as fc.Arbitrary<'FIXED' | 'OFFSET'>,
  value: fc.string(),
  startDate: dateArb,
  endDate: dateArb,
});

describe('isActive — Property 6', () => {
  it('returns true iff startDate <= today <= endDate for any override and any today', () => {
    fc.assert(
      fc.property(overrideArb, dateArb, (override, today) => {
        const expected = override.startDate <= today && today <= override.endDate;
        return isActive(override, today) === expected;
      }),
      { numRuns: 100 },
    );
  });
});
