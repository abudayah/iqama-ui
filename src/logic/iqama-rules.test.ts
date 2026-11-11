import { describe, it, expect } from 'vitest';
import { describeRule, isFriday, upcomingFridays, changedPrayers } from './iqama-rules';
import type { PrayerRule, RuleSet } from '../types/iqama-rules';

describe('describeRule', () => {
  it('describes offset with rounding', () => {
    const r: PrayerRule = {
      base: { type: 'OFFSET', minutes: 5 },
      rounding: { mode: 'CEIL', step: 5 },
    };
    expect(describeRule(r)).toBe('Azan + 5 min, rounded up to the next 5');
  });
  it('describes fixed time, limits, weekday adjust and weekly lock', () => {
    const r: PrayerRule = {
      base: { type: 'FIXED_TIME', time: '13:45' },
      limits: { minAfterAzan: 10, latestBeforeSunrise: 20 },
      weekdayAdjust: { FRI: -5 },
      weeklyLock: true,
    };
    expect(describeRule(r)).toBe(
      'Fixed at 13:45, at least 10 min after Azan, at least 20 min before sunrise, Fri − 5 min, held Friday to Thursday',
    );
  });
  it('ignores rounding step 1', () => {
    expect(
      describeRule({
        base: { type: 'OFFSET', minutes: 0 },
        rounding: { mode: 'NEAREST', step: 1 },
      }),
    ).toBe('At Azan');
  });
});

describe('dates', () => {
  it('detects Fridays', () => {
    expect(isFriday('2026-11-13')).toBe(true);
    expect(isFriday('2026-11-12')).toBe(false);
  });
  it('lists upcoming Fridays including today when Friday', () => {
    expect(upcomingFridays('2026-11-11', 2)).toEqual(['2026-11-13', '2026-11-20']);
    expect(upcomingFridays('2026-11-13', 1)).toEqual(['2026-11-13']);
  });
});

describe('changedPrayers', () => {
  const rule: PrayerRule = { base: { type: 'OFFSET', minutes: 10 } };
  const base = { fajr: rule, dhuhr: rule, asr: rule, maghrib: rule, isha: rule } as RuleSet;
  it('reports only prayers that differ', () => {
    expect(
      changedPrayers(base, { fajr: rule, isha: { base: { type: 'OFFSET', minutes: 15 } } }),
    ).toEqual(['isha']);
  });
});
