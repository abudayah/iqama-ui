# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Moon Phase Rendering Defects (All Days 1–30)
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behaviour — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate all four defects before the fix
  - **Scoped PBT Approach**: Scope the property to all 30 Hijri days; for deterministic sub-bugs use concrete representative days (7, 15, 23, 29)
  - Create `iqama-ui/src/components/HeroBanner.moon-phase.property.test.tsx`
  - Use Vitest + fast-check (`fc.integer({ min: 1, max: 30 })`) to generate all Hijri days
  - Because `moonShadowCx` is not exported, extract it by rendering `HeroBanner` with `@testing-library/react` and inspecting the SVG DOM, OR extract the helper into a testable unit by temporarily importing it via a named export added for testing
  - **Bug 1.1 — Radius mismatch**: For any day where a shadow circle is rendered, assert `r === "46"` — will FAIL (current code uses `r="50"`)
  - **Bug 1.2/1.3 — Waxing/waning confusion**: For day 7 assert shadow `cx < 50` (shadow on left, lit on right); for day 23 assert shadow `cx > 50` (shadow on right, lit on left) — will FAIL (current formula produces identical or swapped values)
  - **Bug 1.4 — New moon opacity**: For days 28–30 and day 1, assert the lit disc `opacity <= 0.1` — will FAIL (current code always renders at full opacity)
  - **Bug 1.5 — Static glow**: Assert that the container `filter` string for day 15 has a larger blur radius than for day 1 — will FAIL (current code uses a hardcoded constant)
  - **Bug 1.6 — Full moon no shadow**: For day 15, assert no shadow `<circle>` is present inside the mask — will FAIL (shadow circle always rendered)
  - Run test suite with `npm test -- --run` from `iqama-ui/`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g. "day 7 and day 23 produce cx=83 and cx=53 — nearly identical, confirming waxing/waning confusion")
  - Mark task complete when test is written, run, and all failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement the fix in HeroBanner.tsx
  - **File**: `iqama-ui/src/components/HeroBanner.tsx`

  - [x] 2.1 Replace `moonShadowCx` with `getMoonPhase`
    - Remove the `moonShadowCx(day: number): number` function entirely
    - Add `getMoonPhase(day: number): { shadowSide: 'left' | 'right' | 'none'; shadowCx: number; opacity: number }` as specified in the design
    - New moon (day >= 28 or day <= 1): `shadowSide: 'left'`, `opacity: day <= 1 ? 0.05 : 0.1`
    - Waxing (2 <= day <= 14): `shadowSide: 'left'`, `shadowCx` interpolated from 0→50, `opacity` 0.9→1.0
    - Full moon (day === 15): `shadowSide: 'none'`, `shadowCx: 200`, `opacity: 1`
    - Waning (16 <= day <= 27): `shadowSide: 'right'`, `shadowCx` interpolated from 50→100, `opacity` 1.0→0.1
    - _Bug_Condition: isBugCondition(X) = true for all X.hijriDay in [1..30]_
    - _Expected_Behavior: getMoonPhase(d) returns correct shadowSide, shadowCx, and opacity per design §Fix Implementation_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 2.2 Compute dynamic glow and replace static filter
    - Remove `const shadowCx = moonShadowCx(hijriDay);` from the component body
    - Add:
      ```typescript
      const phase = getMoonPhase(hijriDay);
      const glowIntensity = 1 - Math.abs(hijriDay - 15) / 15;
      const glowFilter = `drop-shadow(0 0 ${8 + glowIntensity * 20}px rgba(255,244,202,${0.2 + glowIntensity * 0.5}))`;
      ```
    - Replace the hardcoded `filter: \`drop-shadow(0 0 18px rgba(255,244,202,0.45))\`` on the moon container `<div>` with `filter: glowFilter`
    - _Expected_Behavior: glowIntensity = 1 at day 15 (max blur 28px, alpha 0.7); glowIntensity = 0 at day 1/29 (min blur 8px, alpha 0.2)_
    - _Requirements: 2.5_

  - [x] 2.3 Update the SVG mask — fix shadow radius and conditionally render shadow circle
    - Change the shadow `<circle>` inside `<mask id="moon-phase-mask">` from `r="50"` to `r="46"`
    - Wrap the shadow circle in `{phase.shadowSide !== 'none' && ( <circle cx={phase.shadowCx} cy="50" r="46" fill="black" /> )}`
    - _Bug_Condition: shadow r="50" causes 5-unit overhang beyond moon disc r="45"_
    - _Expected_Behavior: r="46" produces clean crescent/gibbous geometry; no shadow circle on day 15_
    - _Requirements: 2.1, 2.6_

  - [x] 2.4 Add dark-side disc and apply phase opacity to lit disc
    - Insert `<circle cx="50" cy="50" r="45" fill="#1a1a2e" opacity="0.3" />` before the lit disc (keeps moon silhouette visible near new moon)
    - Add `opacity={phase.opacity}` to the lit disc `<circle cx="50" cy="50" r="45" fill="#fff4ca" mask="url(#moon-phase-mask)" />`
    - _Expected_Behavior: near new moon the dark disc provides a subtle silhouette; lit disc fades to opacity ≤ 0.1 for days 28–30 and day 1_
    - _Preservation: mask id "moon-phase-mask" retained; SVG tilt rotate(-25deg) retained; moonReady guard, moonArc, sun guard, peek transitions all unchanged_
    - _Requirements: 2.4, 3.4, 3.5_

- [x] 3. Write fix-checking property tests (verify correct phase rendering for all 30 days)
  - **Property 1: Expected Behavior** - Phase Rendering Correctness for All Hijri Days
  - **IMPORTANT**: Re-run the SAME test file from task 1 — do NOT write a new test file
  - The test from task 1 encodes the expected behaviour; when it passes it confirms the fix is correct
  - Run `npm test -- --run` from `iqama-ui/` and confirm the bug condition property test now passes
  - Additionally, write unit tests for `getMoonPhase` directly (if exported) covering all boundary days: 1, 2, 14, 15, 16, 27, 28, 30
  - Assert `getMoonPhase(15)` → `{ shadowSide: 'none', opacity: 1 }`
  - Assert `getMoonPhase(d)` for `d in [2..14]` → `shadowSide === 'left'` AND `opacity > 0.1`
  - Assert `getMoonPhase(d)` for `d in [16..27]` → `shadowSide === 'right'` AND `opacity > 0.1`
  - Assert `getMoonPhase(d)` for `d in [28, 29, 30, 1]` → `opacity <= 0.1`
  - Assert shadow circle `r="46"` in rendered SVG for any day where `shadowSide !== 'none'`
  - Assert `glowIntensity` is 1 at day 15 and 0 at day 1 and day 29 (verify via rendered filter string)
  - **EXPECTED OUTCOME**: All tests PASS (confirms bug is fixed)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. Write preservation property tests (verify surrounding behaviour unchanged)
  - **Property 2: Preservation** - Non-Phase Rendering Behaviour Unchanged
  - **IMPORTANT**: Follow observation-first methodology — observe behaviour on unfixed code for non-phase inputs, then write tests capturing those patterns
  - Create `iqama-ui/src/components/HeroBanner.preservation.property.test.tsx`
  - Use fast-check to generate random inputs for all preserved behaviours

  - **Preservation 1 — `moonArc` horizontal position**: For any `moonT` in `{0, 0.5, 1}`, assert `moonArc(t).leftPct === 72`
    - Observe on unfixed code: `moonArc(0).leftPct = 72`, `moonArc(0.5).leftPct = 72`, `moonArc(1).leftPct = 72`
    - Write property: `fc.constantFrom(0, 0.5, 1)` → `leftPct === 72`
    - Verify passes on UNFIXED code before implementing fix
    - _Requirements: 3.1, 3.3_

  - **Preservation 2 — Mask id**: For any `hijriDay` in `[1..30]`, assert the rendered SVG contains an element with `id="moon-phase-mask"`
    - Observe on unfixed code: mask id is always `"moon-phase-mask"`
    - Write property: `fc.integer({ min: 1, max: 30 })` → mask element with correct id is present
    - Verify passes on UNFIXED code
    - _Requirements: 3.4_

  - **Preservation 3 — SVG tilt**: For any `hijriDay` in `[1..30]`, assert the SVG element has `style` containing `rotate(-25deg)`
    - Observe on unfixed code: SVG always has `transform: rotate(-25deg)`
    - Write property: `fc.integer({ min: 1, max: 30 })` → SVG transform is `rotate(-25deg)`
    - Verify passes on UNFIXED code
    - _Requirements: 3.5_

  - **Preservation 4 — Sun guard**: When rendered with a daytime schedule (nowMin between sunriseMin and maghribMin), assert no moon SVG element is present in the DOM
    - Observe on unfixed code: moon is hidden when `cel.showSun === true`
    - Write property using a schedule arbitrarily with `sunriseMin < nowMin < maghribMin`
    - Verify passes on UNFIXED code
    - _Requirements: 3.6_

  - **Preservation 5 — Peek transition**: When `isPeeking === true`, assert the moon container uses `top 0.6s ease-out`; when `isPeeking === false`, assert `top 2s ease-out`
    - Observe on unfixed code: transition string is driven by `isPeeking` flag, not phase
    - Write property: `fc.boolean()` for isPeeking → correct transition string
    - Verify passes on UNFIXED code
    - _Requirements: 3.7_

  - Run preservation tests on UNFIXED code first — **EXPECTED OUTCOME**: All PASS (confirms baseline)
  - After fix: re-run — **EXPECTED OUTCOME**: All still PASS (confirms no regressions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Checkpoint — Ensure all tests pass
  - Run `npm test -- --run` from `iqama-ui/` and confirm the full test suite passes
  - Confirm bug condition exploration test (task 1) now passes after the fix
  - Confirm fix-checking tests (task 3) all pass
  - Confirm preservation tests (task 4) all pass
  - Confirm no pre-existing tests were broken by the change
  - Ask the user if any questions arise
