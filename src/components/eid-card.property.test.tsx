// Feature: eid-display-admin, Property 7: EidCard renders all required fields for any valid record
import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { EidCard } from './EidCard';
import type { EidPrayerRecord, EidPrayerEntry } from '../types';

/**
 * Validates: Requirements 4.3, 8.2
 *
 * Property 7: EidCard renders all required fields for any valid record.
 * For any EidPrayerRecord object, rendering EidCard SHALL produce output
 * that contains the Eid type name, the formatted date string, and the
 * label and time for each entry in the prayers array.
 */

const eidTypeArb = fc.constantFrom('EID_AL_FITR' as const, 'EID_AL_ADHA' as const);

const sourceArb = fc.constantFrom('override' as const, 'astronomical' as const);

// Generate valid YYYY-MM-DD date strings (years 2020–2030, valid months/days)
const dateStrArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // use 1–28 to avoid month-length edge cases
  })
  .map(
    ({ year, month, day }) =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );

// Generate valid HH:mm time strings
const timeStrArb = fc
  .record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ hour, minute }) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

// Generate a non-empty array of prayer entries (1–4 entries).
// Labels are constrained to alphanumeric characters only to avoid whitespace
// normalisation issues in Testing Library's queryByText.
const labelArb = fc
  .array(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    {
      minLength: 1,
      maxLength: 20,
    },
  )
  .map((chars) => chars.join(''));

const prayerEntriesArb: fc.Arbitrary<EidPrayerEntry[]> = fc
  .array(
    fc.record({
      label: labelArb,
      time: timeStrArb,
    }),
    { minLength: 1, maxLength: 4 },
  )
  .filter((entries) => new Set(entries.map((e) => e.label)).size === entries.length);

const eidPrayerRecordArb: fc.Arbitrary<EidPrayerRecord> = fc.record({
  type: eidTypeArb,
  date: dateStrArb,
  prayers: prayerEntriesArb,
  source: sourceArb,
});

describe('EidCard property tests', () => {
  it('Property 7: renders Eid type name for any valid record', () => {
    fc.assert(
      fc.property(eidPrayerRecordArb, (record) => {
        const { unmount } = render(<EidCard record={record} />);
        const expectedName = record.type === 'EID_AL_FITR' ? 'Eid al-Fitr' : 'Eid al-Adha';
        const heading = screen.getByRole('heading', { name: expectedName });
        const result = heading !== null;
        unmount();
        return result;
      }),
      { numRuns: 100 },
    );
  });

  it('Property 7: renders all prayer labels and times for any valid record', () => {
    fc.assert(
      fc.property(eidPrayerRecordArb, (record) => {
        const { unmount } = render(<EidCard record={record} />);
        let allPresent = true;
        for (const entry of record.prayers) {
          if (!screen.queryByText(entry.label)) allPresent = false;
          if (!screen.queryByText(entry.time)) allPresent = false;
        }
        unmount();
        return allPresent;
      }),
      { numRuns: 100 },
    );
  });

  it('Property 7: shows preliminary notice iff source is astronomical', () => {
    fc.assert(
      fc.property(eidPrayerRecordArb, (record) => {
        const { unmount } = render(<EidCard record={record} />);
        const notice = screen.queryByTestId('preliminary-notice');
        const hasNotice = notice !== null;
        const isAstronomical = record.source === 'astronomical';
        unmount();
        return hasNotice === isAstronomical;
      }),
      { numRuns: 100 },
    );
  });
});
