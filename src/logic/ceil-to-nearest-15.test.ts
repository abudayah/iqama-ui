import { describe, it, expect } from 'vitest';
import { ceilToNearest15 } from './ceil-to-nearest-15';

describe('ceilToNearest15', () => {
  it('rounds up to next 15-minute mark when not on boundary', () => {
    expect(ceilToNearest15('06:23')).toBe('06:30');
  });

  it('returns unchanged when already on a 15-minute boundary (30)', () => {
    expect(ceilToNearest15('06:30')).toBe('06:30');
  });

  it('rounds up to next 15-minute mark just after a boundary', () => {
    expect(ceilToNearest15('06:31')).toBe('06:45');
  });

  it('returns unchanged when already on a 15-minute boundary (45)', () => {
    expect(ceilToNearest15('06:45')).toBe('06:45');
  });

  it('rounds up crossing the hour boundary', () => {
    expect(ceilToNearest15('06:46')).toBe('07:00');
  });

  it('wraps to 00:00 on midnight overflow', () => {
    expect(ceilToNearest15('23:46')).toBe('00:00');
  });

  it('returns 00:00 unchanged (already on boundary)', () => {
    expect(ceilToNearest15('00:00')).toBe('00:00');
  });

  it('rounds up from 00:01 to 00:15', () => {
    expect(ceilToNearest15('00:01')).toBe('00:15');
  });

  it('returns unchanged when on the :00 boundary', () => {
    expect(ceilToNearest15('12:00')).toBe('12:00');
  });

  it('rounds up from :01 to :15', () => {
    expect(ceilToNearest15('12:01')).toBe('12:15');
  });

  it('rounds up from :14 to :15', () => {
    expect(ceilToNearest15('12:14')).toBe('12:15');
  });

  it('rounds up from :16 to :30', () => {
    expect(ceilToNearest15('12:16')).toBe('12:30');
  });

  it('rounds up from :44 to :45', () => {
    expect(ceilToNearest15('12:44')).toBe('12:45');
  });

  it('rounds up from :46 to next hour :00', () => {
    expect(ceilToNearest15('12:46')).toBe('13:00');
  });

  it('handles 23:45 (last valid 15-min boundary before midnight)', () => {
    expect(ceilToNearest15('23:45')).toBe('23:45');
  });

  it('zero-pads single-digit hours', () => {
    expect(ceilToNearest15('05:46')).toBe('06:00');
  });
});
