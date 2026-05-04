import { describe, it, expect } from 'vitest';
import { deriveNextPrayer } from './derive-next-prayer';
import type { DailySchedule } from '../types/index';

const schedule: DailySchedule = {
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

function makeDate(hours: number, minutes: number): Date {
  return new Date(2025, 0, 15, hours, minutes, 0, 0); // local time
}

describe('deriveNextPrayer', () => {
  it('returns fajr when now is before fajr azan (first prayer of day)', () => {
    const now = makeDate(4, 0); // 04:00, before fajr at 05:30
    expect(deriveNextPrayer(schedule, now)).toBe('fajr');
  });

  it('returns asr when now is after fajr and dhuhr azan but before asr azan (mid-day)', () => {
    const now = makeDate(13, 0); // 13:00, after dhuhr iqama at 12:30, before asr at 15:30
    expect(deriveNextPrayer(schedule, now)).toBe('asr');
  });

  it('returns null when now is after isha azan (all prayers passed)', () => {
    const now = makeDate(22, 0); // 22:00, after isha iqama at 19:30
    expect(deriveNextPrayer(schedule, now)).toBeNull();
  });

  it('returns fajr when now is exactly at midnight (00:00:00)', () => {
    const now = makeDate(0, 0); // 00:00, before fajr at 05:30
    expect(deriveNextPrayer(schedule, now)).toBe('fajr');
  });

  it('returns fajr when now is exactly at fajr azan time (in iqama window)', () => {
    const now = makeDate(5, 30); // exactly 05:30 — between fajr azan and iqama (05:45)
    expect(deriveNextPrayer(schedule, now)).toBe('fajr');
  });

  it('returns dhuhr when now is after fajr iqama but before dhuhr azan', () => {
    const now = makeDate(5, 46); // 05:46, after fajr iqama at 05:45
    expect(deriveNextPrayer(schedule, now)).toBe('dhuhr');
  });

  it('returns dhuhr when now is between dhuhr azan and iqama (iqama window)', () => {
    const now = makeDate(12, 20); // 12:20, between dhuhr azan (12:15) and iqama (12:30)
    expect(deriveNextPrayer(schedule, now)).toBe('dhuhr');
  });
});
