import { describe, it, expect } from 'vitest';
import { deriveCountdown } from './derive-countdown';
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

function makeTime(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return new Date(2025, 0, 15, hours!, minutes!, 0, 0); // local time
}

describe('deriveCountdown', () => {
  it('before azan: phase is to_azan and display shows remaining time', () => {
    // now = 05:00, fajr azan = 05:30 → 30 minutes remaining → "00:30:00"
    const now = makeTime('05:00');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('to_azan');
    expect(result.display).toBe('00:30:00');
  });

  it('between azan and iqama: phase is to_iqama and display shows remaining time', () => {
    // now = 05:35, fajr iqama = 05:45 → 10 minutes remaining → "00:10:00"
    const now = makeTime('05:35');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('to_iqama');
    expect(result.display).toBe('00:10:00');
  });

  it('after iqama: phase is done and display is "All prayers complete"', () => {
    // now = 06:00, fajr iqama = 05:45 → past iqama
    const now = makeTime('06:00');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('done');
    expect(result.display).toBe('All prayers complete');
  });

  it('exactly at azan: phase is to_iqama (azan has passed)', () => {
    // now = 05:30 exactly equals azan time → not before azan, so to_iqama
    const now = makeTime('05:30');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('to_iqama');
  });

  it('exactly at iqama: phase is done', () => {
    // now = 05:45 exactly equals iqama time → done
    const now = makeTime('05:45');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('done');
  });

  it('display format includes hours when more than 60 minutes remain', () => {
    // now = 00:00, fajr azan = 05:30 → 5h 30m remaining → "05:30:00"
    const now = makeTime('00:00');
    const result = deriveCountdown(schedule, 'fajr', now);
    expect(result.phase).toBe('to_azan');
    expect(result.display).toBe('05:30:00');
  });
});
