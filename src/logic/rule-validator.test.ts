import { describe, it, expect } from 'vitest';
import { validateRule } from './rule-validator';
import { describeRule, canonicalJson, sameRule } from './iqama-rules';
import { pruneEmpty } from './rule-defaults';
import { CATALOG, SEED_RULES, PRAYERS } from '../test/iqama-fixtures';
import type { CatalogField } from '../types/iqama-rules';

type R = Record<string, unknown>;
const v = (rule: R, prayer: (typeof PRAYERS)[number] = 'maghrib') =>
  validateRule(rule, prayer, CATALOG);

describe('contract: the engine catalog snapshot', () => {
  it('only uses field kinds the UI renders, and every field has a label', () => {
    const kinds = new Set(['int', 'time', 'enum', 'list', 'object', 'bool']);
    const walk = (f: CatalogField) => {
      expect(kinds.has(f.kind), `${f.name}: ${f.kind}`).toBe(true);
      expect(f.label, f.name).toBeTruthy();
      expect(typeof f.required).toBe('boolean');
      [
        ...(f.item ?? []),
        ...(f.fields ?? []),
        ...(f.variants?.flatMap((x) => x.fields) ?? []),
      ].forEach(walk);
    };
    CATALOG.baseTypes.forEach((b) => b.fields.forEach(walk));
    CATALOG.modifiers.forEach(walk);
  });

  it('has the guardrail values and the policy the UI copy relies on', () => {
    expect(CATALOG.guardrails).toMatchObject({
      minGapAfterAzanMinutes: 3,
      fajrEndsBeforeSunriseMinutes: 60,
      iqamaStepMinutes: 5,
      fajrSunriseConflictPolicy: 'gap-wins-with-acknowledgement',
    });
    expect(CATALOG.prayers.map((p) => p.name)).toEqual([...PRAYERS]);
  });

  it('accepts every rule of the engine seed (so the validator agrees with the engine)', () => {
    for (const p of PRAYERS) {
      expect(v(SEED_RULES[p] as unknown as R, p), p).toEqual({});
      expect(describeRule(SEED_RULES[p])).toBeTruthy();
    }
  });
});

describe('validateRule', () => {
  const offset = (minutes: unknown): R => ({ base: { type: 'OFFSET', minutes } });

  it('requires a rule type the catalog knows', () => {
    expect(v({})).toHaveProperty('base.type');
    expect(v({ base: { type: 'NOPE' } })).toHaveProperty('base.type');
  });

  it.each([
    ['', 'Required'],
    [NaN, 'Required'],
    [undefined, 'Required'],
    [5.5, 'Enter a whole number'],
    [-121, 'Must be -120 or more'],
    [121, 'Must be 120 or less'],
    ['7', 'Enter a number'],
  ])('int %s -> %s', (value, message) => {
    expect(v(offset(value))['base.minutes']).toBe(message);
  });

  it('accepts the int range edges', () => {
    expect(v(offset(-120))).toEqual({});
    expect(v(offset(120))).toEqual({});
    expect(v(offset(0))).toEqual({});
  });

  it('checks the time format', () => {
    const f = (time: unknown) => v({ base: { type: 'FIXED_TIME', time } });
    expect(f('')['base.time']).toBe('Required');
    expect(f('7:5')['base.time']).toMatch(/HH:mm/);
    expect(f('24:00')['base.time']).toMatch(/HH:mm/);
    expect(f('23:59')).toEqual({});
  });

  it('checks list counts and every item (Scaled gap)', () => {
    const point = (azan: string, gapMinutes: unknown) => ({ azan, gapMinutes });
    const f = (points: unknown) => v({ base: { type: 'SCALED_GAP', points } });
    expect(f([point('20:00', 15)])['base.points']).toBe('Add at least 2');
    expect(f(Array.from({ length: 11 }, () => point('20:00', 5)))['base.points']).toBe(
      'At most 10 allowed',
    );
    const errs = f([point('', 15), point('22:00', 130)]);
    expect(errs['base.points.0.azan']).toBe('Required');
    expect(errs['base.points.1.gapMinutes']).toBe('Must be 120 or less');
    expect(f([point('20:00', 15), point('22:00', 5)])).toEqual({});
  });

  it('follows the Seasonal variant chosen by the discriminator', () => {
    const f = (start: unknown, time = '16:00') =>
      v({ base: { type: 'SEASONAL', segments: [{ start, time }] } });
    expect(f({ kind: 'FIRST_FRIDAY', month: 9 })).toEqual({});
    expect(f({ kind: 'DATE', month: 3, day: 15 })).toEqual({});
    expect(f({ kind: 'DATE', month: 3, day: '' })['base.segments.0.start.day']).toBe('Required');
    expect(f({ kind: 'DATE', month: 13, day: 1 })['base.segments.0.start.month']).toMatch(
      /12 or less/,
    );
    expect(f({ kind: 'FIRST_FRIDAY', month: 9, day: 99 })).toEqual({}); // other variant's field ignored
    expect(f({ kind: 'WEEKLY' })['base.segments.0.start.kind']).toBe('Choose one of the options');
    expect(f({ kind: 'FIRST_FRIDAY', month: 9 }, '')['base.segments.0.time']).toBe('Required');
  });

  it('checks enums and the required parts of a modifier', () => {
    expect(v({ ...offset(5), rounding: { mode: 'CEIL', step: 7 } })['rounding.step']).toBe(
      'Choose one of the options',
    );
    expect(v({ ...offset(5), rounding: { mode: '', step: 5 } })['rounding.mode']).toBe('Required');
    expect(v({ ...offset(5), rounding: { mode: 'CEIL', step: 5 } })).toEqual({});
  });

  it('rejects an enabled optional group with nothing set, and accepts one value', () => {
    expect(v({ ...offset(5), limits: { minAfterAzan: '', latestBeforeSunrise: '' } }).limits).toBe(
      'Set at least one value, or turn it off',
    );
    expect(v({ ...offset(5), limits: { minAfterAzan: 3 } })).toEqual({});
    expect(v({ ...offset(5), weekdayAdjust: { FRI: -5 } })).toEqual({});
    expect(v({ ...offset(5), weekdayAdjust: { FRI: -61 } })['weekdayAdjust.FRI']).toMatch(
      /-60 or more/,
    );
  });

  it('keeps prayer-specific fields to their prayers', () => {
    const rule = { ...offset(5), limits: { latestBeforeSunrise: 60 } };
    expect(v(rule, 'fajr')).toEqual({});
    expect(v(rule, 'isha')['limits.latestBeforeSunrise']).toBe('Not available for this prayer');
    expect(v({ ...offset(5), weeklyLock: true }, 'fajr')).toEqual({});
    expect(v({ ...offset(5), weeklyLock: true }, 'maghrib').weeklyLock).toBe(
      'Not available for this prayer',
    );
  });
});

describe('helpers', () => {
  it('pruneEmpty drops only empty optional values', () => {
    expect(
      pruneEmpty({ a: 1, b: '', c: NaN, d: false, e: { f: '', g: 0 }, h: [{ i: '' }] }),
    ).toEqual({
      a: 1,
      d: false,
      e: { g: 0 },
      h: [{}],
    });
  });

  it('canonicalJson ignores key order; sameRule uses it', () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: 2 } })).toBe(
      canonicalJson({ a: { c: 2, d: 1 }, b: 1 }),
    );
    expect(
      sameRule(
        { base: { type: 'OFFSET', minutes: 5 }, weeklyLock: true },
        { weeklyLock: true, base: { minutes: 5, type: 'OFFSET' } },
      ),
    ).toBe(true);
  });
});
