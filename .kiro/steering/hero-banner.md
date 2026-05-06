---
inclusion: fileMatch
fileMatchPattern: 'src/components/HeroBanner*,src/components/moon-phase*'
---

# HeroBanner — Animation & Behaviour Guide

`src/components/HeroBanner.tsx` is the full-width sky scene at the top of the prayer viewer. It renders a live, time-aware sky that changes colour, moves celestial bodies, and shows stars at night — all driven by the current time and the day's prayer schedule.

## Architecture

Everything is driven by a single value: **`skyMin`** — minutes since midnight.

- During normal use: `skyMin = nowMinutes(now)` (real clock, updated every second via `tick`)
- During peek mode: `skyMin = hhmm(peekPrayer.azan)` (frozen at the peeked prayer's azan time)
- During simulator: `now = simulatedNow` from URL params

All visual layers read `skyMin` and the four anchor times derived from `todaySchedule`:

| Variable | Source |
|---|---|
| `fajrMin` | `todaySchedule.fajr.azan` |
| `sunriseMin` | `todaySchedule.sunrise` |
| `maghribMin` | `todaySchedule.maghrib.azan` |
| `ishaMin` | `todaySchedule.isha.azan` |

Fallbacks (when schedule not yet loaded): fajr=5:00, sunrise=6:00, maghrib=20:00, isha=21:00.

---

## Sky Gradient

`buildSkyKeyframes()` defines colour stops at key times of day. `interpolateSky()` linearly interpolates between the two surrounding keyframes for the current `skyMin`.

| Time | Description | Top colour |
|---|---|---|
| 0:00 | Deep night | `#0f2027` |
| Fajr | First light / dawn | `#2c1b3d` |
| Sunrise | Sunrise glow | `#1a6b9a` |
| Sunrise+30 | Morning blue | `#2980b9` |
| Solar noon | Peak day | `#1a6fa8` |
| Maghrib−30 | Golden hour | `#2c3e50` |
| Maghrib | Sunset peak | `#2c3e50` |
| Maghrib+40 | Dusk fading | `#1a1a2e` |
| Isha | Full night | `#0f2027` |

The gradient is applied directly as an inline `background` style — no CSS classes — so it updates every second without a transition delay.

---

## Mountain Layers

Three SVG mountain silhouettes (back, mid, front) are tinted using the same keyframe interpolation approach as the sky. `buildMtnKeyframes()` / `interpolateMtn()` return six colour values (`backTop/Bot`, `midTop/Bot`, `frtTop/Bot`) that are fed into SVG `linearGradient` definitions.

A fourth "mist" layer (semi-transparent white) sits between the back and mid mountains for depth.

The mountain SVG is `position: absolute; bottom: -2px` and 170px tall, covering the lower portion of the 300px banner. The visual horizon sits at ~67% from the top (`HORIZON_PCT = 67`).

---

## Sun

Visible from **Fajr** to **Maghrib**.

- Travels a **quadratic Bézier arc**: rises at left=5%/top=67%, peaks at left=50%/top=8%, sets at left=95%/top=67%
- `t = (nowMin − sunriseMin) / (maghribMin − sunriseMin)` maps 0→1 across the day
- **Colour**: interpolates from warm orange (`#ffb347`) near the horizon to pale yellow (`#fff4ca`) at peak
- **Opacity**: fades in over 20 min after Fajr, fades out over 20 min before Maghrib
- **Transition**: `top 62s linear, left 62s linear` — position is computed from `celMin` (floored to the nearest whole minute) so it only changes once per minute. The 62s transition carries the sun smoothly to the next position before the next update arrives, giving continuous motion with zero per-second jumps. In peek mode, `0.6s ease-out` is used for a snappy response.

---

## Moon

Visible from **Maghrib** to **Sunrise** (i.e. when the sun is not shown).

- Fixed horizontal position at left=72%
- Three vertical states driven by a `moonT` value:
  - `moonT = 0` → at horizon (hidden behind mountains) — daytime
  - `moonT = 0.5` → at top=20% — night sky
  - `moonT = 1` → at horizon — near sunrise
- **Transition**: `top 2s ease-out` for a smooth rise/set animation; `top 0.6s ease-out` in peek mode
- **Phase**: computed by `getMoonPhase(hijriDay)` in `src/components/moon-phase.ts` — returns `{ shadowSide, shadowCx, opacity }`
- **Mount guard**: `moonReady` state delays the first render by one animation frame so the CSS transition has a starting position to animate from

### Moon Phase SVG

The moon is an SVG with a mask. A white `<rect>` covers the full viewBox; a black shadow `<circle>` punches out the dark side. The lit disc (`fill="#fff4ca"`, `r=45`, `cx=50`) sits behind the mask. A dark-side disc (`fill="#1a1a2e"`, `opacity=0.3`) sits behind the lit disc to keep the moon silhouette visible near new moon.

**Shadow circle**: `r=46` (1px larger than the disc for clean edge coverage), conditionally rendered — absent on full moon (day 15).

**Islamic crescent convention** — the crescent opens to the right in the Northern Hemisphere:
- **Waxing** (days 2–14): `shadowSide: 'right'` — shadow on right, lit sliver on left
- **Waning** (days 16–27): `shadowSide: 'left'` — shadow on left, lit sliver on right
- **Full moon** (day 15): `shadowSide: 'none'` — no shadow circle rendered
- **New moon** (days 28–30): shadow centered (`cx=50`), disc at 10% opacity — nearly invisible
- **Day 1** (first crescent): `cx=55`, `opacity=0.8` — thin crescent visible, faint (first sighting of the new month)

**`shadowCx` geometry** (disc spans x=5→95, shadow `r=46`):

| Day | cx | Shadow covers | Lit area |
|---|---|---|---|
| 1 | 55 | 9→101 | x=5→9 (thin crescent left) |
| 2 | 57 | 11→103 | x=5→11 (thin crescent left) |
| 7 | ~96 | 50→142 | x=5→50 (quarter moon) |
| 14 | 150 | 104→196 | fully lit (gibbous) |
| 15 | — | none | fully lit (full moon) |
| 16 | −50 | −96→−4 | fully lit (gibbous) |
| 22 | ~1 | −45→47 | x=47→95 (quarter moon) |
| 27 | 43 | −3→89 | x=89→95 (thin crescent right) |

**Formulas:**
- Waxing `t = (day − 2) / 12`, `cx = 57 + 93 * t`
- Waning `t = (day − 16) / 11`, `cx = −50 + 93 * t`

**Glow filter**: dynamic, computed in `HeroBanner.tsx` from `glowIntensity = 1 − |hijriDay − 15| / 15`:
- Day 15 (full moon): `blur=28px, alpha=0.7` (maximum)
- Day 1/29 (new moon): `blur≈9px, alpha≈0.27` (minimum)
- Formula: `drop-shadow(0 0 ${8 + glowIntensity * 20}px rgba(255,244,202,${0.2 + glowIntensity * 0.5}))`

---

## Stars

Only rendered at night: `isNight(skyMin, sunriseMin, maghribMin)` returns true when `skyMin >= maghribMin || skyMin < sunriseMin`.

Stars are **not shown** until `todaySchedule` is loaded — this prevents the fallback `maghribMin=20:00` from showing stars before the real Maghrib time is known.

### Static stars (80 total)

Generated once at module load by `generateStars(80)` using a deterministic LCG — positions are stable across re-renders.

Each star has:
- `x`, `y` — random position in the upper 58% of the banner (above the mountain horizon)
- `r` — radius 0.4–1.6px
- `duration` — twinkle cycle 2–7s (random per star)
- `delay` — negative value (−0 to −10s) so each star starts mid-cycle

The `hero-twinkle` keyframe animates each star's opacity from **0.05 → 0.9** (`alternate` direction). Because every star has a different duration and delay, at any moment roughly half are dim and half are bright — never all visible at once, like a real night sky.

### Shooting stars (4 total)

Four `<line>` elements, each on its own long animation cycle:

| # | Start position | Angle | Interval | Delay |
|---|---|---|---|---|
| 1 | 72%, 8% | −35° | 9s | −1s |
| 2 | 30%, 5% | −28° | 14s | −5s |
| 3 | 55%, 12% | −40° | 11s | −8s |
| 4 | 85%, 4% | −32° | 17s | −3s |

The `shooting-star` keyframe:
- 0–2%: fade in (opacity 0 → 1)
- 2–12%: streak travels (`translateX` negative) and downward, fading out
- 12%: snap back to start position, opacity 0
- 12–100%: stay invisible (the long pause between shots)

The negative `animationDelay` values spread the four stars across different points in their cycles so they never all fire simultaneously.

---

## Peek Mode

When the user taps a future prayer row, `peekPrayer` and `peekSchedule` are set. The sky switches to show what the sky will look like at that prayer's azan time:

- `skyMin` is overridden with `hhmm(peekPrayer.azan)`
- Sun/moon position transitions use `0.6s ease-out` instead of `1s linear` for a snappier response
- The countdown display shows time-until that prayer rather than the next prayer

---

## CSS Keyframes (`src/index.css`)

| Keyframe | Used by | Description |
|---|---|---|
| `hero-twinkle` | Each `<circle>` star | Opacity 0.05 ↔ 0.9, `alternate` direction |
| `shooting-star` | Each `<line>` shooting star | Streak right-to-left, long invisible pause |
| `dot-pulse` | `.active-dot` in PrayerRow | Pulse ring during azan→iqama window |

---

## Critical Rules

1. **Never use CSS transitions on the sky gradient** — the gradient is recomputed every second from `skyMin`; a transition would lag behind real time.
2. **Stars require `todaySchedule`** — always guard with `todaySchedule ? isNight(...) : false` to avoid showing stars before real prayer times are loaded.
3. **`HORIZON_PCT = 67`** — the mountain horizon is at 67% from the top of the 300px banner. Stars must stay above this line (`y: rand() * 58`). Celestial bodies rise/set at this percentage.
4. **`moonReady` guard** — always keep the one-frame delay before showing the moon. Without it, the moon has no previous CSS position to transition from on mount.
5. **Shooting star direction** — streaks travel right-to-left (negative `translateX`). The `<line>` tail (`x2`) is to the right of the head (`x1`) so it trails naturally behind the direction of travel.
6. **Deterministic star positions** — `generateStars` uses a fixed LCG seed (`0xdeadbeef`). Do not use `Math.random()` — positions must be stable across re-renders to avoid layout thrashing.
7. **Moon phase logic lives in `moon-phase.ts`** — do not inline phase calculations in `HeroBanner.tsx`. `HeroBanner.tsx` only imports `getMoonPhase` and computes `glowIntensity`/`glowFilter` from it.
8. **Shadow circle `r=46`, not `r=50`** — the disc is `r=45`; the shadow must be `r=46` for clean crescent/gibbous geometry. A larger radius causes the shadow to bleed outside the disc boundary.
9. **Islamic crescent convention** — waxing shadow is on the RIGHT (lit on left), waning shadow is on the LEFT (lit on right). Do not swap these.
10. **Full moon has no shadow circle** — day 15 returns `shadowSide: 'none'`; the shadow `<circle>` must not be rendered. Conditionally render it: `{phase.shadowSide !== 'none' && <circle ... />}`.
