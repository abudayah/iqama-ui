# Bugfix Requirements Document

## Introduction

The moon phase SVG in `HeroBanner.tsx` produces incorrect visual representations of the lunar cycle. Four distinct defects are in scope: the shadow circle radius doesn't match the moon disc radius (causing malformed crescents and gibbous shapes), waxing and waning phases are visually indistinguishable, new moon days show a partially-lit disc instead of fading out, and the glow intensity is static rather than scaling with the phase. Two additional issues — static tilt angle and binary moon position — are acknowledged but explicitly out of scope per the steering guide.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN any Hijri day is rendered THEN the system uses a shadow circle with `r="50"` against a moon disc with `r="45"`, producing a shadow that is too large relative to the disc and causes malformed crescent and gibbous shapes.

1.2 WHEN a waxing day (Hijri day 2–14) is rendered THEN the system positions the shadow using `50 + (day / 15) * 100`, which does not correctly place the lit side on the right, making waxing phases visually indistinguishable from waning phases.

1.3 WHEN a waning day (Hijri day 16–27) is rendered THEN the system positions the shadow using `-50 + ((day - 15) / 15) * 100`, which does not correctly place the lit side on the left, making waning phases visually indistinguishable from waxing phases.

1.4 WHEN a new moon day (Hijri day 28–30 or day 1) is rendered THEN the system shows a partially-lit disc at full opacity instead of fading the moon out to near-invisible.

1.5 WHEN any Hijri day is rendered THEN the system applies a hardcoded `drop-shadow(0 0 18px rgba(255,244,202,0.45))` glow regardless of phase, so the glow does not intensify near full moon or diminish near new moon.

### Expected Behavior (Correct)

2.1 WHEN any Hijri day is rendered THEN the system SHALL use a shadow circle with `r="46"` (matching the moon disc `r="45"`) so that the shadow geometry correctly produces crescent and gibbous shapes.

2.2 WHEN a waxing day (Hijri day 2–14) is rendered THEN the system SHALL place the shadow on the left side of the disc so the right side appears lit, correctly representing a waxing phase.

2.3 WHEN a waning day (Hijri day 16–27) is rendered THEN the system SHALL place the shadow on the right side of the disc so the left side appears lit, correctly representing a waning phase.

2.4 WHEN a new moon day (Hijri day 28–30 or day 1) is rendered THEN the system SHALL render the moon disc at near-zero opacity (≤ 0.1) so the moon appears effectively invisible.

2.5 WHEN any Hijri day is rendered THEN the system SHALL compute glow intensity as `1 - |hijriDay - 15| / 15` and apply a dynamic `drop-shadow` that is brightest at full moon (day 15) and dimmest at new moon (days 1 and 29/30).

2.6 WHEN Hijri day 15 is rendered THEN the system SHALL show a fully-lit disc with no shadow mask applied and maximum glow intensity.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the moon is visible (after Maghrib and before Sunrise, i.e. `!cel.showSun`) THEN the system SHALL CONTINUE TO render the moon at `left=72%` with a fixed horizontal position.

3.2 WHEN the component mounts THEN the system SHALL CONTINUE TO delay moon visibility by one animation frame via the `moonReady` guard so the CSS `top` transition has a starting position to animate from.

3.3 WHEN `moonT` changes between `0`, `0.5`, and `1` THEN the system SHALL CONTINUE TO animate the moon's vertical position using the existing `moonArc()` function and `top 2s ease-out` transition (binary position behavior is intentional per the steering guide).

3.4 WHEN the moon SVG is rendered THEN the system SHALL CONTINUE TO use the mask id `moon-phase-mask` so that any external CSS or test references to this id remain valid.

3.5 WHEN the moon SVG is rendered THEN the system SHALL CONTINUE TO apply `transform: rotate(-25deg)` tilt to the SVG element (static tilt is out of scope for this fix).

3.6 WHEN the sun is visible (from Fajr to Maghrib) THEN the system SHALL CONTINUE TO hide the moon entirely and show only the sun.

3.7 WHEN peek mode is active THEN the system SHALL CONTINUE TO use `top 0.6s ease-out` for the moon's vertical transition instead of the default `2s ease-out`.

---

## Bug Condition Pseudocode

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { hijriDay: number }
  OUTPUT: boolean

  // Any rendered moon day triggers at least one of the four defects
  RETURN true   // all days 1–30 are affected by at least Bug 1 (radius mismatch)
                // days 1, 28–30 additionally trigger Bug 3 (no new moon fade)
                // days 2–14 additionally trigger Bug 2 (waxing/waning confusion)
                // days 16–27 additionally trigger Bug 2 (waxing/waning confusion)
                // all days trigger Bug 4 (static glow)
END FUNCTION
```

### Fix Checking Property

```pascal
// Property: Fix Checking — correct phase rendering for all days
FOR ALL X WHERE isBugCondition(X) DO
  phase ← getMoonPhase'(X.hijriDay)
  IF X.hijriDay = 15 THEN
    ASSERT phase.shadowSide = 'none'
    ASSERT phase.opacity = 1
  ELSE IF X.hijriDay >= 28 OR X.hijriDay <= 1 THEN
    ASSERT phase.opacity <= 0.1
  ELSE IF X.hijriDay < 15 THEN
    ASSERT phase.shadowSide = 'left'   // lit on right = waxing
    ASSERT phase.opacity > 0.1
  ELSE
    ASSERT phase.shadowSide = 'right'  // lit on left = waning
    ASSERT phase.opacity > 0.1
  END IF
  ASSERT shadowRadius = 46             // matches moon disc r=45
END FOR
```

### Preservation Checking Property

```pascal
// Property: Preservation Checking — non-phase rendering behavior unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  // No inputs are outside the bug condition for phase rendering,
  // but all surrounding behavior (moon position, transitions, mask id,
  // tilt, sun visibility guard, moonReady guard) must be preserved.
  ASSERT moonArc(X.moonT) = moonArc'(X.moonT)
  ASSERT maskId = 'moon-phase-mask'
  ASSERT svgTransform = 'rotate(-25deg)'
END FOR
```
