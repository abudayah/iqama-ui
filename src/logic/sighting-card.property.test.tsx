// Feature: hijri-calendar-sighting, Property 6: Sighting card hidden before day 29
// Validates: Requirements 4.4
// Feature: hijri-calendar-sighting, Property 7: Non-Eid months dispatch directly without modal
// Validates: Requirements 5.5

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { shouldShowSightingCard } from '../hooks/useSightingStatus';
import { SightingCard } from '../components/SightingCard';

// Non-Eid months: 1–8, 10, 12
const NON_EID_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const;

describe('shouldShowSightingCard — Property 6: Sighting card hidden before day 29', () => {
  it('returns false for any hijriDay in 1–28 regardless of hasOverride', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.boolean(),
        (hijriDay, hasOverride) => {
          return shouldShowSightingCard(hijriDay, hasOverride) === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('SightingCard — Property 7: Non-Eid months dispatch directly without modal', () => {
  it('calls onDecision with the selected length for all non-Eid months', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_EID_MONTHS),
        fc.constantFrom(29 as const, 30 as const),
        (hijriMonth, length) => {
          const onDecision = vi.fn();
          const { unmount } = render(
            <SightingCard hijriMonth={hijriMonth} onDecision={onDecision} />,
          );

          const buttonLabel =
            length === 29
              ? /Yes, Month ends today \(29 Days\)/i
              : /No, Complete 30 days/i;

          const button = screen.getByRole('button', { name: buttonLabel });
          button.click();

          const called =
            onDecision.mock.calls.length === 1 &&
            onDecision.mock.calls[0]?.[0] === length;

          unmount();
          return called;
        },
      ),
      { numRuns: 100 },
    );
  });
});
