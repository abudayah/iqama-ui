import { describe, it, expect } from 'vitest';
import { iqamaDraftReducer } from './useIqamaRulesDraft';
import type { PrayerRule } from '../types/iqama-rules';

const base: PrayerRule = { base: { type: 'OFFSET', minutes: 10 } };
const edited: PrayerRule = { base: { type: 'OFFSET', minutes: 15 } };
const start = { prayers: {}, effectiveFrom: '' };

describe('iqamaDraftReducer', () => {
  it('stores an edited rule and drops it when set back to the saved rule', () => {
    const a = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    expect(a.prayers.fajr).toEqual(edited);
    const b = iqamaDraftReducer(a, { type: 'SET_RULE', prayer: 'fajr', rule: base, base });
    expect(b.prayers).toEqual({});
  });
  it('sets the date and resets', () => {
    const a = iqamaDraftReducer(start, { type: 'SET_EFFECTIVE_FROM', date: '2026-11-20' });
    expect(a.effectiveFrom).toBe('2026-11-20');
    expect(iqamaDraftReducer(a, { type: 'RESET' })).toEqual(start);
  });
});
