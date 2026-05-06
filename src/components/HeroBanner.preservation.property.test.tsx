/**
 * Preservation Property Tests — HeroBanner Non-Phase Behaviour
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * These tests verify that all surrounding behaviour in HeroBanner is
 * unchanged by the moon-phase fix. They should PASS on both unfixed and
 * fixed code — confirming the baseline is preserved.
 *
 * Preserved behaviours under test:
 *   Preservation 1 — moonArc horizontal position (left: 72%)
 *   Preservation 2 — Mask id ("moon-phase-mask")
 *   Preservation 3 — SVG tilt (rotate(-25deg))
 *   Preservation 4 — Sun guard (no moon SVG during daytime)
 *   Preservation 5 — Peek transition (0.6s vs 2s ease-out)
 */

import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { HeroBanner } from './HeroBanner';
import type { DailySchedule, CountdownState } from '../types';

/* ─── Schedule helpers ───────────────────────────────────────────────────────
 * makeNightSchedule: sunrise=07:00, maghrib=20:00 — simulatedNow at 23:00
 *   → cel.showSun === false → moon is rendered
 *
 * makeDaySchedule: same times — simulatedNow at 12:00
 *   → 12:00 is between sunrise (07:00) and maghrib (20:00)
 *   → cel.showSun === true → moon is NOT rendered
 */

function makeNightSchedule(): DailySchedule {
  return {
    date: '2025-01-15',
    hijri_date: 'Rajab 15, 1446',
    day_of_week: 'Wednesday',
    is_dst: false,
    fajr: { azan: '05:30', iqama: '05:45' },
    sunrise: '07:00',
    dhuhr: { azan: '12:15', iqama: '12:30' },
    asr: { azan: '15:30', iqama: '15:45' },
    maghrib: { azan: '20:00', iqama: '20:10' },
    isha: { azan: '21:30', iqama: '21:45' },
    metadata: { calculation_method: 'ISNA', has_overrides: false },
  };
}

function makeDaySchedule(): DailySchedule {
  return {
    date: '2025-01-15',
    hijri_date: 'Rajab 15, 1446',
    day_of_week: 'Wednesday',
    is_dst: false,
    fajr: { azan: '05:30', iqama: '05:45' },
    sunrise: '07:00',
    dhuhr: { azan: '12:15', iqama: '12:30' },
    asr: { azan: '15:30', iqama: '15:45' },
    maghrib: { azan: '20:00', iqama: '20:10' },
    isha: { azan: '21:30', iqama: '21:45' },
    metadata: { calculation_method: 'ISNA', has_overrides: false },
  };
}

/** 23:00 — well into the night, after Maghrib (20:00), before Fajr (05:30) */
const NIGHT_TIME = new Date('2025-01-15T23:00:00');

/** 12:00 — midday, between sunrise (07:00) and Maghrib (20:00) */
const DAY_TIME = new Date('2025-01-15T12:00:00');

const defaultCountdown: CountdownState = {
  phase: 'to_azan',
  display: '06:30:00',
};

/** Render HeroBanner at night — moon is visible */
function renderMoon(hijriDay: number) {
  const schedule = makeNightSchedule();
  const { container, unmount } = render(
    <HeroBanner
      nextPrayer="fajr"
      countdown={defaultCountdown}
      schedule={schedule}
      todaySchedule={schedule}
      countdownMode="to_azan"
      hijriDay={hijriDay}
      hijriMonth={7}
      tick={0}
      simulatedNow={NIGHT_TIME}
    />,
  );
  return { container, unmount };
}

/** Render HeroBanner at daytime — sun is visible, moon is hidden */
function renderDay(hijriDay: number) {
  const schedule = makeDaySchedule();
  const { container, unmount } = render(
    <HeroBanner
      nextPrayer="dhuhr"
      countdown={defaultCountdown}
      schedule={schedule}
      todaySchedule={schedule}
      countdownMode="to_azan"
      hijriDay={hijriDay}
      hijriMonth={7}
      tick={0}
      simulatedNow={DAY_TIME}
    />,
  );
  return { container, unmount };
}

/* ─── Shared DOM helpers ─────────────────────────────────────────────────────── */

/**
 * Find the moon container <div> — identified by its drop-shadow filter style.
 */
function getMoonContainer(container: HTMLElement): HTMLElement | null {
  const candidates = container.querySelectorAll<HTMLElement>('div[aria-hidden="true"]');
  for (const el of candidates) {
    if (el.style.filter && el.style.filter.includes('drop-shadow')) {
      return el;
    }
  }
  return null;
}

/* ─── Preservation Tests ─────────────────────────────────────────────────────── */

describe('HeroBanner Preservation — Non-Phase Behaviour Unchanged', () => {
  /**
   * Preservation 1 — moonArc horizontal position
   *
   * For any night-time render, the moon container <div> should have
   * left: "72%" — the fixed horizontal position from moonArc().
   *
   * **Validates: Requirements 3.1, 3.3**
   */
  it('Preservation 1 — moon container left is "72%" for any hijriDay', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        const { container, unmount } = renderMoon(hijriDay);
        const moonDiv = getMoonContainer(container);
        const leftStyle = moonDiv?.style.left ?? '';
        unmount();
        return leftStyle === '72%';
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Preservation 2 — Mask id
   *
   * For any hijriDay in [1..30], the rendered SVG must contain an element
   * with id="moon-phase-mask".
   *
   * **Validates: Requirements 3.4**
   */
  it('Preservation 2 — moon-phase-mask element is always present for any hijriDay', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        const { container, unmount } = renderMoon(hijriDay);
        const maskEl = container.querySelector('#moon-phase-mask');
        unmount();
        return maskEl !== null;
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Preservation 3 — SVG tilt
   *
   * For any hijriDay in [1..30], the moon SVG element must have
   * style.transform === "rotate(-25deg)".
   *
   * **Validates: Requirements 3.5**
   */
  it('Preservation 3 — moon SVG has rotate(-25deg) tilt for any hijriDay', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        const { container, unmount } = renderMoon(hijriDay);
        // The moon SVG is the <svg> inside the moon container div
        const moonDiv = getMoonContainer(container);
        const svg = moonDiv?.querySelector('svg') as SVGSVGElement | null;
        const transform = (svg as HTMLElement | null)?.style?.transform ?? '';
        unmount();
        return transform === 'rotate(-25deg)';
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Preservation 4 — Sun guard
   *
   * When rendered with a daytime schedule (simulatedNow = 12:00, between
   * sunrise 07:00 and maghrib 20:00), no moon SVG elements should be present:
   *   - No element with id="moon-phase-mask"
   *   - No circle[fill="#fff4ca"] (the lit moon disc)
   *
   * **Validates: Requirements 3.6**
   */
  it('Preservation 4 — no moon SVG rendered during daytime for any hijriDay', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        const { container, unmount } = renderDay(hijriDay);
        const maskEl = container.querySelector('#moon-phase-mask');
        const litDisc = container.querySelector('circle[fill="#fff4ca"]');
        unmount();
        // Both should be absent during daytime
        return maskEl === null && litDisc === null;
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Preservation 5 — Peek transition
   *
   * When isPeeking === true (peekPrayer + peekSchedule set), the moon
   * container transition should be "top 0.6s ease-out".
   * When isPeeking === false, it should be "top 2s ease-out".
   *
   * **Validates: Requirements 3.7**
   */
  it('Preservation 5 — moon container uses correct transition for isPeeking', () => {
    fc.assert(
      fc.property(fc.boolean(), (isPeeking) => {
        const schedule = makeNightSchedule();
        const { container, unmount } = render(
          <HeroBanner
            nextPrayer="fajr"
            countdown={defaultCountdown}
            schedule={schedule}
            todaySchedule={schedule}
            countdownMode="to_azan"
            hijriDay={15}
            hijriMonth={7}
            tick={0}
            simulatedNow={NIGHT_TIME}
            peekPrayer={isPeeking ? 'isha' : null}
            peekSchedule={isPeeking ? schedule : null}
          />,
        );

        const moonDiv = getMoonContainer(container);
        const transition = moonDiv?.style.transition ?? '';
        unmount();

        const expectedTransition = isPeeking ? 'top 0.6s ease-out' : 'top 2s ease-out';
        return transition === expectedTransition;
      }),
      { numRuns: 20 },
    );
  });
});
