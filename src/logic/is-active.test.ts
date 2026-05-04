import { describe, it, expect } from 'vitest';
import { isActive } from './is-active';
import type { Override } from '../types/index';

// Validates: Requirements 8.3

describe('isActive', () => {
  const override: Override = {
    id: 1,
    prayer: 'fajr',
    overrideType: 'FIXED',
    value: '05:45',
    startDate: '2025-01-10',
    endDate: '2025-01-20',
  };

  it('returns true on the start day (2025-01-10)', () => {
    expect(isActive(override, '2025-01-10')).toBe(true);
  });

  it('returns true on the end day (2025-01-20)', () => {
    expect(isActive(override, '2025-01-20')).toBe(true);
  });

  it('returns true in the middle of the range (2025-01-15)', () => {
    expect(isActive(override, '2025-01-15')).toBe(true);
  });

  it('returns false the day before start (2025-01-09)', () => {
    expect(isActive(override, '2025-01-09')).toBe(false);
  });

  it('returns false the day after end (2025-01-21)', () => {
    expect(isActive(override, '2025-01-21')).toBe(false);
  });

  it('returns false well before the range (2024-12-31)', () => {
    expect(isActive(override, '2024-12-31')).toBe(false);
  });

  it('returns false well after the range (2025-02-01)', () => {
    expect(isActive(override, '2025-02-01')).toBe(false);
  });
});
