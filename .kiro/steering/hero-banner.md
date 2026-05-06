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
- **Transition**: `top 2s ease-out` for a smooth rise/set animation
- **Phase**: SVG mask with a shadow circle whose `cx` is computed from the Hijri day:
  - Day 15 → `cx=200` (full moon, shadow off-screen)
  - Day < 15 → waxing (shadow slides right)
  - Day > 15 → waning (shadow slides in from left)
- **Mount guard**: `moonReady` state delays the first render by one animation frame so the CSS transition has a starting position to animate from

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
