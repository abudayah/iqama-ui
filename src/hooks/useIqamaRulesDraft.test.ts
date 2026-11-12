import { describe, it, expect } from 'vitest';
import { iqamaDraftReducer, overlappingPrayers } from './useIqamaRulesDraft';
import type { PrayerRule, RuleSet } from '../types/iqama-rules';

const rule = (minutes: number): PrayerRule => ({ base: { type: 'OFFSET', minutes } });
const base = rule(10);
const edited = rule(15);
const start = { prayers: {}, bases: {}, effectiveFrom: '' };
const set = (m: number): RuleSet =>
  ({ fajr: rule(m), dhuhr: rule(m), asr: rule(m), maghrib: rule(m), isha: rule(m) }) as RuleSet;

describe('iqamaDraftReducer', () => {
  it('stores an edited rule and drops it when set back to the saved rule', () => {
    const a = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    expect(a.prayers.fajr).toEqual(edited);
    const b = iqamaDraftReducer(a, { type: 'SET_RULE', prayer: 'fajr', rule: base, base });
    expect(b.prayers).toEqual({});
    expect(b.bases).toEqual({});
  });

  it('remembers the saved rule first edited from, even after a second edit', () => {
    const a = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    const b = iqamaDraftReducer(a, { type: 'SET_RULE', prayer: 'fajr', rule: rule(20), base });
    expect(b.bases.fajr).toEqual(base);
  });

  it('sets the date and resets', () => {
    const a = iqamaDraftReducer(start, { type: 'SET_EFFECTIVE_FROM', date: '2026-11-20' });
    expect(a.effectiveFrom).toBe('2026-11-20');
    expect(iqamaDraftReducer(a, { type: 'RESET' })).toEqual(start);
  });

  it('DROP removes one prayer only', () => {
    let s = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    s = iqamaDraftReducer(s, { type: 'SET_RULE', prayer: 'isha', rule: edited, base });
    s = iqamaDraftReducer(s, { type: 'DROP', prayer: 'fajr' });
    expect(Object.keys(s.prayers)).toEqual(['isha']);
    expect(Object.keys(s.bases)).toEqual(['isha']);
  });

  it('REBASE keeps edits on the new baseline and drops those equal to it', () => {
    let s = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    s = iqamaDraftReducer(s, { type: 'SET_RULE', prayer: 'isha', rule: edited, base });
    const latest = { ...set(10), isha: edited, fajr: rule(12) };
    const r = iqamaDraftReducer(s, { type: 'REBASE', latest });
    expect(Object.keys(r.prayers)).toEqual(['fajr']); // isha now equals the saved rule
    expect(r.prayers.fajr).toEqual(edited);
    expect(r.bases.fajr).toEqual(rule(12));
  });
});

describe('overlappingPrayers', () => {
  it('lists edited prayers whose saved rule changed meanwhile', () => {
    let s = iqamaDraftReducer(start, { type: 'SET_RULE', prayer: 'fajr', rule: edited, base });
    s = iqamaDraftReducer(s, { type: 'SET_RULE', prayer: 'isha', rule: edited, base });
    s = iqamaDraftReducer(s, { type: 'SET_RULE', prayer: 'asr', rule: edited, base });
    // fajr: changed by someone else; isha: unchanged; asr: someone saved the same as my edit
    const latest = { ...set(10), fajr: rule(12), asr: edited };
    expect(overlappingPrayers(s, latest)).toEqual(['fajr']);
  });
});
