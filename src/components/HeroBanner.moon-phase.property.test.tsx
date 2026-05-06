/**
 * Bug Condition Exploration Property Test — Moon Phase Rendering
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 *
 * This test encodes the EXPECTED (correct) behaviour for moon phase rendering.
 * It is intentionally written to FAIL on the current (unfixed) code, thereby
 * confirming that the four defects described in bugfix.md exist.
 *
 * After the fix is applied (Task 2), re-running this file should produce all
 * PASSING results (Task 3).
 *
 * Bugs under test:
 *   Bug 1.1 — Shadow circle radius r="50" should be r="46"
 *   Bug 1.2 — Waxing days (2–14): shadow should be on the LEFT (cx < 50)
 *   Bug 1.3 — Waning days (16–27): shadow should be on the RIGHT (cx > 50)
 *   Bug 1.4 — New moon days (28–30, 1): lit disc opacity should be ≤ 0.1
 *   Bug 1.5 — Glow filter should be larger at full moon (day 15) than at new moon (day 1)
 *   Bug 1.6 — Full moon (day 15): no shadow <circle> should be present inside the mask
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { HeroBanner, getMoonPhase } from './HeroBanner';
import type { DailySchedule, CountdownState } from '../types';

/* ─── Minimal mock props ─────────────────────────────────────────────────────
 * We need the moon to be visible (not the sun), so we set simulatedNow to a
 * time well into the night — 23:00 — which is after Maghrib (20:00) and
 * before Fajr (05:00). This ensures cel.showSun === false and the moon SVG
 * is rendered.
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

const NIGHT_TIME = new Date('2025-01-15T23:00:00'); // 23:00 — well into the night

const defaultCountdown: CountdownState = {
  phase: 'to_azan',
  display: '06:30:00',
};

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

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

/**
 * Find the shadow <circle> inside the moon-phase-mask.
 * The mask contains a <rect> (white fill) and optionally a <circle> (black fill).
 */
function getShadowCircle(container: HTMLElement): SVGCircleElement | null {
  const mask = container.querySelector('#moon-phase-mask');
  if (!mask) return null;
  // The shadow circle has fill="black"
  return mask.querySelector('circle[fill="black"]') as SVGCircleElement | null;
}

/**
 * Find the lit disc <circle> — the one with fill="#fff4ca" and a mask attribute.
 */
function getLitDisc(container: HTMLElement): SVGCircleElement | null {
  return container.querySelector('circle[fill="#fff4ca"][mask]') as SVGCircleElement | null;
}

/**
 * Find the moon container <div> — identified by its aria-hidden attribute and
 * the fact that it contains the moon SVG. We look for the div that has a
 * `filter` style containing "drop-shadow".
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

/**
 * Extract the blur radius (px) from a drop-shadow filter string.
 * e.g. "drop-shadow(0 0 18px rgba(255,244,202,0.45))" → 18
 */
function extractBlurRadius(filterStr: string): number {
  const match = filterStr.match(/drop-shadow\(\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)px/);
  return match ? parseFloat(match[1]!) : 0;
}

/* ─── Tests ──────────────────────────────────────────────────────────────────── */

describe('Moon Phase Rendering — Bug Condition Exploration (EXPECTED TO FAIL on unfixed code)', () => {
  /**
   * Bug 1.1 — Radius mismatch
   *
   * For any Hijri day where a shadow circle is rendered, the shadow circle
   * SHALL have r="46" (matching the moon disc r="45").
   *
   * Current code uses r="50" — this test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.1**
   */
  it('Bug 1.1 — shadow circle r should be "46" for all days (currently r="50")', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (day) => {
        const { container, unmount } = renderMoon(day);
        const shadowCircle = getShadowCircle(container);
        // If a shadow circle is present, its radius must be "46"
        const result = shadowCircle === null || shadowCircle.getAttribute('r') === '46';
        unmount();
        return result;
      }),
      { numRuns: 30 }, // exhaustive — all 30 days
    );
  });

  /**
   * Bug 1.2 — Waxing direction
   *
   * For day 7 (waxing crescent), the shadow circle SHALL be on the LEFT
   * (cx < 50), leaving the right side lit.
   *
   * Current formula: cx = 50 + (7/15)*100 ≈ 96.7 (shadow on RIGHT — wrong)
   * This test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.2**
   */
  it('Bug 1.2 — day 7 (waxing): shadow cx should be < 50 (shadow on left, lit on right)', () => {
    const { container, unmount } = renderMoon(7);
    const shadowCircle = getShadowCircle(container);
    const cx = shadowCircle ? parseFloat(shadowCircle.getAttribute('cx') ?? '999') : 999;
    unmount();
    // Shadow on left means cx < 50
    expect(cx).toBeLessThan(50);
  });

  /**
   * Bug 1.3 — Waning direction
   *
   * For day 23 (waning crescent), the shadow circle SHALL be on the RIGHT
   * (cx > 50), leaving the left side lit.
   *
   * Current formula: cx = -50 + (8/15)*100 ≈ 3.3 (shadow on LEFT — wrong)
   * This test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.3**
   */
  it('Bug 1.3 — day 23 (waning): shadow cx should be > 50 (shadow on right, lit on left)', () => {
    const { container, unmount } = renderMoon(23);
    const shadowCircle = getShadowCircle(container);
    const cx = shadowCircle ? parseFloat(shadowCircle.getAttribute('cx') ?? '-999') : -999;
    unmount();
    // Shadow on right means cx > 50
    expect(cx).toBeGreaterThan(50);
  });

  /**
   * Bug 1.4 — New moon opacity
   *
   * For new moon days (28, 29, 30, 1), the lit disc SHALL have opacity ≤ 0.1.
   *
   * Current code renders the lit disc at full opacity (no opacity attribute).
   * This test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.4**
   */
  it('Bug 1.4 — new moon days (28–30, 1): lit disc opacity should be ≤ 0.1', () => {
    fc.assert(
      fc.property(fc.constantFrom(28, 29, 30, 1), (day) => {
        const { container, unmount } = renderMoon(day);
        const litDisc = getLitDisc(container);
        // opacity attribute should be present and ≤ 0.1
        const opacityAttr = litDisc?.getAttribute('opacity');
        const opacity =
          opacityAttr !== null && opacityAttr !== undefined ? parseFloat(opacityAttr) : 1;
        unmount();
        return opacity <= 0.1;
      }),
      { numRuns: 20 },
    );
  });

  /**
   * Bug 1.5 — Static glow
   *
   * The moon container's drop-shadow blur radius for day 15 (full moon) SHALL
   * be larger than for day 1 (new moon).
   *
   * Current code uses a hardcoded "drop-shadow(0 0 18px ...)" for all days —
   * both day 1 and day 15 produce the same blur radius.
   * This test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.5**
   */
  it('Bug 1.5 — glow filter blur radius should be larger at day 15 than at day 1', () => {
    const { container: container15, unmount: unmount15 } = renderMoon(15);
    const moonDiv15 = getMoonContainer(container15);
    const filter15 = moonDiv15?.style.filter ?? '';
    const blur15 = extractBlurRadius(filter15);
    unmount15();

    const { container: container1, unmount: unmount1 } = renderMoon(1);
    const moonDiv1 = getMoonContainer(container1);
    const filter1 = moonDiv1?.style.filter ?? '';
    const blur1 = extractBlurRadius(filter1);
    unmount1();

    // Full moon (day 15) should have a larger blur than new moon (day 1)
    expect(blur15).toBeGreaterThan(blur1);
  });

  /**
   * Bug 1.6 — Full moon no shadow
   *
   * For day 15 (full moon), NO shadow <circle> SHALL be present inside the
   * moon-phase-mask — the disc should be fully lit with no shadow geometry.
   *
   * Current code always renders the shadow circle (cx=200 pushes it off-screen
   * visually, but the element is still in the DOM).
   * This test WILL FAIL on unfixed code.
   *
   * **Validates: Requirements 1.1 (shadow geometry), 2.6**
   */
  it('Bug 1.6 — day 15 (full moon): no shadow circle should be present inside the mask', () => {
    const { container, unmount } = renderMoon(15);
    const shadowCircle = getShadowCircle(container);
    const hasShadow = shadowCircle !== null;
    unmount();
    // hasShadow should be false — no shadow circle on full moon
    expect(hasShadow).toBe(false);
  });

  /**
   * Combined property: for ALL waxing days (2–14), shadow cx < 50.
   * For ALL waning days (16–27), shadow cx > 50.
   *
   * **Validates: Requirements 1.2, 1.3**
   */
  it('Bug 1.2/1.3 — waxing days (2–14) shadow cx < 50; waning days (16–27) shadow cx > 50', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 27 }).filter((d) => d !== 15),
        (day) => {
          const { container, unmount } = renderMoon(day);
          const shadowCircle = getShadowCircle(container);
          const cx = shadowCircle ? parseFloat(shadowCircle.getAttribute('cx') ?? '50') : 50;
          unmount();

          if (day < 15) {
            // Waxing: shadow on left (cx < 50)
            return cx < 50;
          } else {
            // Waning: shadow on right (cx > 50)
            return cx > 50;
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Fix-Checking Unit Tests — getMoonPhase direct
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 *
 * These tests call getMoonPhase() directly (now exported) and verify the
 * correct phase rendering for all 30 Hijri days after the fix is applied.
 * ─────────────────────────────────────────────────────────────────────────── */

describe('getMoonPhase — unit tests (fix-checking)', () => {
  /**
   * Full moon: day 15 must return shadowSide 'none' and opacity 1.
   *
   * **Validates: Requirements 2.1, 2.6**
   */
  it('day 15 (full moon): shadowSide === "none" and opacity === 1', () => {
    const phase = getMoonPhase(15);
    expect(phase.shadowSide).toBe('none');
    expect(phase.opacity).toBe(1);
  });

  /**
   * Waxing days (2–14): shadow on left, opacity > 0.1.
   *
   * **Validates: Requirements 2.2**
   */
  it('waxing days (2–14): shadowSide === "left" and opacity > 0.1', () => {
    for (const d of [2, 7, 14]) {
      const phase = getMoonPhase(d);
      expect(phase.shadowSide, `day ${d} shadowSide`).toBe('left');
      expect(phase.opacity, `day ${d} opacity`).toBeGreaterThan(0.1);
    }
  });

  /**
   * Waning days (16–27): shadow on right, opacity > 0.1.
   *
   * **Validates: Requirements 2.3**
   */
  it('waning days (16–27): shadowSide === "right" and opacity > 0.1', () => {
    for (const d of [16, 23, 27]) {
      const phase = getMoonPhase(d);
      expect(phase.shadowSide, `day ${d} shadowSide`).toBe('right');
      expect(phase.opacity, `day ${d} opacity`).toBeGreaterThan(0.1);
    }
  });

  /**
   * New moon days (28, 29, 30, 1): opacity ≤ 0.1.
   *
   * **Validates: Requirements 2.4**
   */
  it('new moon days (28, 29, 30, 1): opacity <= 0.1', () => {
    for (const d of [28, 29, 30, 1]) {
      const phase = getMoonPhase(d);
      expect(phase.opacity, `day ${d} opacity`).toBeLessThanOrEqual(0.1);
    }
  });

  /**
   * Property: for all days 1–30, getMoonPhase returns values within valid ranges.
   *   opacity ∈ (0, 1], shadowSide ∈ {'left', 'right', 'none'}
   *   shadowCx: waxing days use negative cx (shadow off-screen left for gibbous),
   *             waning days use cx > 50 (shadow off-screen right for gibbous),
   *             new moon days use cx = 50, full moon uses cx = 200.
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   */
  it('property: all days 1–30 return valid opacity, shadowCx, and shadowSide', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (day) => {
        const phase = getMoonPhase(day);
        const validSide =
          phase.shadowSide === 'left' ||
          phase.shadowSide === 'right' ||
          phase.shadowSide === 'none';
        // shadowCx range: waxing uses [-40, 0], waning uses [50, 100], new moon = 50, full moon = 200
        const validCx = phase.shadowCx >= -40 && phase.shadowCx <= 200;
        return validSide && phase.opacity > 0 && phase.opacity <= 1 && validCx;
      }),
      { numRuns: 30 },
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Fix-Checking SVG Rendering Tests
 *
 * **Validates: Requirements 2.1, 2.5, 2.6**
 * ─────────────────────────────────────────────────────────────────────────── */

describe('Moon Phase SVG Rendering — fix-checking', () => {
  /**
   * Shadow circle r="46" for all days where shadowSide !== 'none'.
   *
   * **Validates: Requirements 2.1, 2.6**
   */
  it('shadow circle r="46" for all days where shadowSide !== "none"', () => {
    for (let d = 1; d <= 30; d++) {
      if (getMoonPhase(d).shadowSide === 'none') continue;
      const { container, unmount } = renderMoon(d);
      const shadowCircle = getShadowCircle(container);
      expect(shadowCircle, `day ${d}: shadow circle should be present`).not.toBeNull();
      expect(shadowCircle!.getAttribute('r'), `day ${d}: shadow r`).toBe('46');
      unmount();
    }
  });

  /**
   * glowIntensity is 1 at day 15 → blur should be 28px (8 + 1*20).
   *
   * **Validates: Requirements 2.5**
   */
  it('day 15 (full moon): glow blur radius is 28px', () => {
    const { container, unmount } = renderMoon(15);
    const moonDiv = getMoonContainer(container);
    const blur = extractBlurRadius(moonDiv?.style.filter ?? '');
    unmount();
    expect(blur).toBeCloseTo(28, 1);
  });

  /**
   * glowIntensity is 0 at day 1 → blur should be 8px (8 + 0*20).
   *
   * **Validates: Requirements 2.5**
   */
  it('day 1 (new moon): glow blur radius is near minimum (close to 8px)', () => {
    // day 1: glowIntensity = 1 - |1-15|/15 = 1 - 14/15 ≈ 0.0667 → blur ≈ 9.33px
    // This is the minimum achievable for valid Hijri days (1–30).
    // We assert it is significantly less than the full moon blur (28px).
    const { container, unmount } = renderMoon(1);
    const moonDiv = getMoonContainer(container);
    const blur = extractBlurRadius(moonDiv?.style.filter ?? '');
    unmount();
    // blur = 8 + (1 - 14/15) * 20 ≈ 9.33
    expect(blur).toBeCloseTo(8 + (1 - 14 / 15) * 20, 1);
  });

  /**
   * glowIntensity is ~0 at day 29 → blur should be ~8.67px (8 + (1/15)*20 ≈ 9.33).
   * Day 29: glowIntensity = 1 - |29-15|/15 = 1 - 14/15 ≈ 0.067 → blur ≈ 9.33px.
   * We assert it is significantly less than the full moon blur (28px).
   *
   * **Validates: Requirements 2.5**
   */
  it('day 29 (near new moon): glow blur radius is much less than day 15', () => {
    const { container: c29, unmount: u29 } = renderMoon(29);
    const blur29 = extractBlurRadius(getMoonContainer(c29)?.style.filter ?? '');
    u29();

    const { container: c15, unmount: u15 } = renderMoon(15);
    const blur15 = extractBlurRadius(getMoonContainer(c15)?.style.filter ?? '');
    u15();

    // Day 29 blur should be much smaller than day 15 blur
    expect(blur29).toBeLessThan(blur15);
    // Day 29: glowIntensity ≈ 0.067, blur ≈ 9.33px — assert it's close to minimum
    expect(blur29).toBeLessThan(12);
  });
});
