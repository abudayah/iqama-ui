# Moon Phase Rendering Bugfix Design

## Overview

The moon phase SVG in `HeroBanner.tsx` has four rendering defects: the shadow circle radius (`r="50"`) is larger than the moon disc (`r="45"`), causing malformed crescents; waxing and waning phases are visually swapped; new moon days show a partially-lit disc at full opacity instead of fading out; and the glow is a hardcoded constant rather than scaling with phase brightness.

The fix replaces the single `moonShadowCx(day)` helper with a richer `getMoonPhase(day)` function that returns `{ shadowSide, shadowCx, opacity }`, corrects the shadow radius to `r="46"`, adds a dark-side disc so the moon silhouette is visible even when unlit, applies per-phase opacity to the lit disc, conditionally omits the shadow circle on full moon, and computes a dynamic glow filter driven by distance from day 15.

All surrounding behaviour — `moonReady` guard, `moonArc()` vertical animation, mask id `moon-phase-mask`, SVG tilt, sun visibility guard, and peek-mode transitions — is preserved unchanged.

---

## Glossary

- **Bug_Condition (C)**: Any rendered Hijri day (1–30); all days are affected by at least the radius mismatch and static glow defects.
- **Property (P)**: The desired rendering for a given day — correct shadow geometry, correct lit-side direction, correct opacity, and correct glow intensity.
- **Preservation**: All moon-position, transition, mask, tilt, sun-guard, and peek-mode behaviour that must remain byte-for-byte equivalent after the fix.
- **`getMoonPhase(day)`**: The replacement helper in `HeroBanner.tsx` that returns `{ shadowSide: 'left' | 'right' | 'none', shadowCx: number, opacity: number }`.
- **`moonShadowCx(day)`**: The existing (buggy) helper that returns only a `cx` number; to be removed.
- **`glowIntensity`**: Scalar `1 - |hijriDay - 15| / 15` ∈ [0, 1]; 1 at full moon, 0 at new moon.
- **`moonReady`**: Boolean state that delays moon visibility by one animation frame so the CSS `top` transition has a starting position on mount.
- **`moonArc(t)`**: Existing function mapping `moonT ∈ {0, 0.5, 1}` to `{ leftPct: 72, topPct }` — unchanged by this fix.
- **`HORIZON_PCT`**: Constant `67` — the visual horizon as a percentage from the top of the 300 px banner.

---

## Bug Details

### Bug Condition

The bug manifests on every Hijri day render. The `moonShadowCx` function returns only a `cx` value and the SVG hardcodes `r="50"` for the shadow circle and a static glow filter. This means:

- The shadow circle is always 5 units larger than the moon disc, clipping the disc edge and producing malformed shapes.
- The `cx` formula does not distinguish left-side from right-side shadows, so waxing and waning look identical.
- No opacity is applied for new moon days, so the moon appears partially lit instead of invisible.
- The glow never changes regardless of phase.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type { hijriDay: number }
  OUTPUT: boolean

  // All days 1–30 are affected by at least the radius mismatch (Bug 1.1)
  // and the static glow (Bug 1.5).
  // Days 1, 28–30 additionally trigger the new-moon opacity defect (Bug 1.4).
  // Days 2–14 and 16–27 additionally trigger the waxing/waning confusion (Bugs 1.2, 1.3).
  RETURN true
END FUNCTION
```

### Examples

- **Day 7 (waxing crescent)**: Expected — right side lit, thin crescent; Actual — shadow geometry wrong, indistinguishable from day 23.
- **Day 15 (full moon)**: Expected — fully lit disc, no shadow, maximum glow; Actual — shadow circle still present (cx=200 pushes it off-screen, so visually OK, but radius mismatch still applies), static glow.
- **Day 23 (waning crescent)**: Expected — left side lit, thin crescent; Actual — visually identical to day 7 (waxing crescent).
- **Day 29 (new moon)**: Expected — disc at opacity ≤ 0.1, near-invisible; Actual — partially-lit disc at full opacity.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- The moon is only rendered when `!cel.showSun` (sun hidden from Maghrib to Fajr) — this guard is not touched.
- The `moonReady` one-frame delay continues to gate the moon's initial `top` position so the CSS transition has a starting value on every mount.
- `moonArc()` continues to map `moonT ∈ {0, 0.5, 1}` to `{ leftPct: 72, topPct }` — the binary vertical position behaviour is intentional and out of scope.
- The mask element retains `id="moon-phase-mask"` so any external CSS or test references remain valid.
- The SVG element retains `style={{ transform: 'rotate(-25deg)' }}` — static tilt is out of scope.
- Peek mode continues to use `top 0.6s ease-out`; normal mode continues to use `top 2s ease-out`.

**Scope:**

All inputs that do NOT involve the moon phase SVG internals (sky gradient, sun arc, mountain colours, stars, countdown display, peek logic) are completely unaffected by this fix.

---

## Hypothesized Root Cause

1. **Shadow radius not matched to disc radius**: The shadow `<circle>` uses `r="50"` while the moon disc uses `r="45"`. A 5-unit overhang means the shadow bleeds outside the disc boundary, distorting crescent tips and gibbous edges. Fix: change to `r="46"` (1 unit larger than the disc to ensure clean coverage without overhang artefacts).

2. **`moonShadowCx` formula does not encode shadow side**: The function returns a single number with no indication of whether the shadow should be on the left or right. The SVG mask always places the shadow circle at that `cx` with no directional logic, so waxing and waning produce the same visual. Fix: return `shadowSide: 'left' | 'right' | 'none'` and compute `cx` correctly per side.

3. **No opacity reduction for new moon**: Days 28–30 and day 1 receive the same full-opacity rendering as all other days. Fix: return `opacity ≤ 0.1` from `getMoonPhase` for those days and apply it to the lit disc.

4. **Static glow filter**: The container `filter` is hardcoded to `drop-shadow(0 0 18px rgba(255,244,202,0.45))`. Fix: compute `glowIntensity = 1 - |hijriDay - 15| / 15` and derive a dynamic filter string.

5. **No dark-side disc**: Without a background disc, the moon silhouette disappears entirely when the lit area is near zero (new moon). Fix: add a `fill="#1a1a2e" opacity="0.3"` disc behind the lit disc so the moon shape remains subtly visible.

---

## Correctness Properties

Property 1: Bug Condition — Phase Rendering Correctness

_For any_ Hijri day `d ∈ [1, 30]`, the fixed `getMoonPhase(d)` function SHALL return values such that:
- `d === 15` → `shadowSide === 'none'` AND `opacity === 1`
- `d >= 28 OR d <= 1` → `opacity <= 0.1`
- `2 <= d <= 14` → `shadowSide === 'left'` (lit on right = waxing) AND `opacity > 0.1`
- `16 <= d <= 27` → `shadowSide === 'right'` (lit on left = waning) AND `opacity > 0.1`

AND the shadow circle in the SVG mask SHALL use `r="46"` for all days where `shadowSide !== 'none'`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

Property 2: Preservation — Non-Phase Rendering Behaviour Unchanged

_For any_ input state where the moon phase SVG internals are not involved (moon position, transitions, mask id, tilt, sun guard, peek mode), the fixed component SHALL produce exactly the same output as the original component, preserving all existing celestial, sky, mountain, star, and countdown behaviour.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

Property 3: Glow Scaling

_For any_ Hijri day `d ∈ [1, 30]`, the fixed component SHALL compute `glowIntensity = 1 - |d - 15| / 15` and apply a `drop-shadow` filter whose blur radius and colour alpha both increase monotonically as `d` approaches 15, reaching maximum at `d === 15` and minimum at `d === 1` or `d === 29/30`.

**Validates: Requirements 2.5**

---

## Fix Implementation

### Changes Required

**File**: `iqama-ui/src/components/HeroBanner.tsx`

**Remove**: `moonShadowCx(day: number): number`

**Add**: `getMoonPhase(day: number): { shadowSide: 'left' | 'right' | 'none'; shadowCx: number; opacity: number }`

```typescript
function getMoonPhase(day: number): {
  shadowSide: 'left' | 'right' | 'none';
  shadowCx: number;
  opacity: number;
} {
  if (day >= 28 || day <= 1) {
    return { shadowSide: 'left', shadowCx: 50, opacity: day <= 1 ? 0.05 : 0.1 };
  }
  if (day < 15) {
    const t = (day - 1) / 14;
    const cx = 50 - 50 * (1 - t);
    return { shadowSide: 'left', shadowCx: cx, opacity: 0.9 + t * 0.1 };
  }
  if (day === 15) {
    return { shadowSide: 'none', shadowCx: 200, opacity: 1 };
  }
  const t = (day - 15) / 14;
  const cx = 50 + 50 * t;
  return { shadowSide: 'right', shadowCx: cx, opacity: 1 - t * 0.9 };
}
```

**Specific Changes in the component body:**

1. **Replace `shadowCx` derivation**: Remove `const shadowCx = moonShadowCx(hijriDay);` and replace with:
   ```typescript
   const phase = getMoonPhase(hijriDay);
   const glowIntensity = 1 - Math.abs(hijriDay - 15) / 15;
   const glowFilter = `drop-shadow(0 0 ${8 + glowIntensity * 20}px rgba(255,244,202,${0.2 + glowIntensity * 0.5}))`;
   ```

2. **Update moon container `filter`**: Change `filter: \`drop-shadow(0 0 18px rgba(255,244,202,0.45))\`` to `filter: glowFilter`.

3. **Add dark-side disc**: Insert a `<circle cx="50" cy="50" r="45" fill="#1a1a2e" opacity="0.3" />` before the lit disc inside the SVG.

4. **Apply phase opacity to lit disc**: Add `opacity={phase.opacity}` to the lit moon `<circle>`.

5. **Conditionally render shadow circle**: Wrap the mask's shadow `<circle>` in `{phase.shadowSide !== 'none' && (...)}`.

6. **Fix shadow radius**: Change the shadow circle from `r="50"` to `r="46"`.

**Resulting SVG block:**

```tsx
const phase = getMoonPhase(hijriDay);
const glowIntensity = 1 - Math.abs(hijriDay - 15) / 15;
const glowFilter = `drop-shadow(0 0 ${8 + glowIntensity * 20}px rgba(255,244,202,${0.2 + glowIntensity * 0.5}))`;

<div
  className="absolute"
  style={{
    top: `${moonTopPct}%`,
    left: `${cel.leftPct}%`,
    transform: 'translate(-50%, -50%)',
    width: 80,
    height: 80,
    filter: glowFilter,
    opacity: 1,
    transition: isPeeking ? 'top 0.6s ease-out' : 'top 2s ease-out',
  }}
  aria-hidden="true"
>
  <svg
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    style={{ transform: 'rotate(-25deg)' }}
  >
    <defs>
      <mask id="moon-phase-mask">
        <rect width="100" height="100" fill="white" />
        {phase.shadowSide !== 'none' && (
          <circle cx={phase.shadowCx} cy="50" r="46" fill="black" />
        )}
      </mask>
    </defs>
    {/* Dark-side disc — keeps moon silhouette visible near new moon */}
    <circle cx="50" cy="50" r="45" fill="#1a1a2e" opacity="0.3" />
    {/* Lit disc — masked and faded by phase */}
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="#fff4ca"
      mask="url(#moon-phase-mask)"
      opacity={phase.opacity}
    />
  </svg>
</div>
```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behaviour.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that call `moonShadowCx` (the unfixed helper) and inspect the SVG output for each representative day. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:

1. **Radius mismatch test**: Assert that the shadow circle in the rendered SVG has `r="46"` — will fail on unfixed code (returns `r="50"`).
2. **Waxing direction test**: For day 7, assert `shadowSide === 'left'` (lit on right) — will fail on unfixed code (no `shadowSide` concept).
3. **Waning direction test**: For day 23, assert `shadowSide === 'right'` (lit on left) — will fail on unfixed code.
4. **New moon opacity test**: For day 29, assert rendered lit disc `opacity <= 0.1` — will fail on unfixed code (opacity is always 1).
5. **Full moon no-shadow test**: For day 15, assert no shadow circle is rendered — will fail on unfixed code (shadow circle always present).
6. **Glow scaling test**: Assert that the container `filter` string for day 15 has a larger blur radius than for day 1 — will fail on unfixed code (static filter).

**Expected Counterexamples**:

- `moonShadowCx` returns a number but the SVG always uses `r="50"`, confirming Bug 1.1.
- Days 7 and 23 produce identical `cx` values from the old formula, confirming Bugs 1.2 and 1.3.
- Day 29 renders at full opacity, confirming Bug 1.4.
- Filter string is identical for all days, confirming Bug 1.5.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behaviour.

**Pseudocode:**

```
FOR ALL d IN [1..30] DO
  phase := getMoonPhase(d)
  IF d = 15 THEN
    ASSERT phase.shadowSide = 'none'
    ASSERT phase.opacity = 1
  ELSE IF d >= 28 OR d <= 1 THEN
    ASSERT phase.opacity <= 0.1
  ELSE IF d < 15 THEN
    ASSERT phase.shadowSide = 'left'
    ASSERT phase.opacity > 0.1
  ELSE
    ASSERT phase.shadowSide = 'right'
    ASSERT phase.opacity > 0.1
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (surrounding behaviour), the fixed component produces the same result as the original.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT moonArc_original(input.moonT) = moonArc_fixed(input.moonT)
  ASSERT maskId = 'moon-phase-mask'
  ASSERT svgTransform = 'rotate(-25deg)'
  ASSERT moonReadyGuard_behaviour unchanged
  ASSERT sunGuard_behaviour unchanged
  ASSERT peekTransition_behaviour unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many random `moonT`, `hijriDay`, and schedule combinations automatically, catching edge cases that manual unit tests might miss.

**Test Plan**: Observe that `moonArc`, mask id, tilt, sun guard, and peek transitions work correctly on unfixed code, then write property-based tests capturing that behaviour.

**Test Cases**:

1. **`moonArc` preservation**: For any `t ∈ {0, 0.5, 1}`, assert `moonArc(t).leftPct === 72` and `topPct` matches expected values — must pass on both unfixed and fixed code.
2. **Mask id preservation**: Assert the rendered SVG always contains `id="moon-phase-mask"` regardless of `hijriDay`.
3. **SVG tilt preservation**: Assert the SVG element always has `transform: rotate(-25deg)`.
4. **Sun guard preservation**: When `cel.showSun === true`, assert no moon SVG is rendered.
5. **`moonReady` guard preservation**: On initial render, assert moon `top` equals `HORIZON_PCT` (67%) before the animation frame fires.
6. **Peek transition preservation**: When `isPeeking === true`, assert the moon container uses `top 0.6s ease-out`.

### Unit Tests

- Test `getMoonPhase` for all 30 Hijri days: correct `shadowSide`, `shadowCx` range, and `opacity` range.
- Test `getMoonPhase` boundary days: 1, 2, 14, 15, 16, 27, 28, 30.
- Test that `glowIntensity` is 1 at day 15 and 0 at day 1 and day 29.
- Test that the shadow circle is absent from the rendered SVG when `shadowSide === 'none'` (day 15).
- Test that the shadow circle has `r="46"` when present.

### Property-Based Tests

- Generate random `hijriDay ∈ [1, 30]` and assert `getMoonPhase` invariants: `opacity ∈ (0, 1]`, `shadowCx ∈ [0, 200]`, `shadowSide ∈ {'left', 'right', 'none'}`.
- Generate random `moonT ∈ {0, 0.5, 1}` and assert `moonArc(t).leftPct === 72` (preservation of horizontal position).
- Generate random schedule times and assert that `isNight` / sun-guard logic is unaffected by the phase fix.

### Integration Tests

- Render `HeroBanner` with `hijriDay=7` and assert the lit crescent is on the right side of the disc.
- Render `HeroBanner` with `hijriDay=23` and assert the lit crescent is on the left side of the disc.
- Render `HeroBanner` with `hijriDay=29` and assert the moon container has near-zero opacity on the lit disc.
- Render `HeroBanner` with `hijriDay=15` and assert no shadow circle is present and glow filter has maximum blur.
- Render `HeroBanner` with a simulated daytime schedule and assert the moon element is not rendered at all.
