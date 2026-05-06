/**
 * Moon phase rendering parameters derived from a Hijri day (1–30).
 *
 * The SVG uses a mask: a white rect covers the full viewBox, and a black
 * shadow circle punches out the dark side. The moon disc is at cx=50, r=45
 * (spans x=5→95). The shadow circle has r=46.
 *
 * shadowSide:
 *   'right' = waxing  — shadow on right, lit crescent on LEFT  (Islamic convention)
 *   'left'  = waning  — shadow on left,  lit crescent on RIGHT
 *   'none'  = full moon — no shadow circle rendered
 *
 * shadowCx geometry (shadow r=46, disc cx=50 r=45 → disc spans x=5→95):
 *
 *   Waxing (days 2–14), shadow on RIGHT:
 *     cx = 57 + 93 * t,  t = (day - 2) / 12
 *     day 2  → cx=57  → shadow 11→103, lit x=5→11   (thin crescent on left)
 *     day 7  → cx=96  → shadow 50→142, lit x=5→50   (quarter moon)
 *     day 14 → cx=150 → shadow 104→196, fully lit   (gibbous)
 *
 *   Waning (days 16–27), shadow on LEFT:
 *     cx = -50 + 93 * t,  t = (day - 16) / 11
 *     day 16 → cx=-50 → shadow -96→-4,  fully lit   (gibbous)
 *     day 22 → cx=1   → shadow -45→47,  lit x=47→95 (quarter moon)
 *     day 27 → cx=43  → shadow -3→89,   lit x=89→95 (thin crescent on right)
 *
 * opacity: fades the lit disc to near-zero at new moon (days 28–30).
 *          Day 1 shows a faint thin crescent (first sighting of the new month).
 */
export function getMoonPhase(day: number): {
  shadowSide: 'left' | 'right' | 'none';
  shadowCx: number;
  opacity: number;
} {
  // New moon: days 28–30 — disc nearly invisible, shadow centered (no crescent)
  if (day >= 28) {
    return { shadowSide: 'right', shadowCx: 50, opacity: 0.35 };
  }

  // Day 1 — first crescent: thin lit sliver on the left, faint opacity
  // Uses the same shadow position as day 2 (cx=57) so a thin crescent is visible
  if (day <= 1) {
    return { shadowSide: 'right', shadowCx: 55, opacity: 0.8 };
  }

  // Waxing crescent → gibbous: days 2–14
  // Shadow on RIGHT, lit on LEFT (Islamic crescent faces right)
  // t=0 at day 2 (thin crescent, cx=57) → t=1 at day 14 (gibbous, cx=150)
  if (day < 15) {
    const t = (day - 2) / 12;
    const cx = 57 + 93 * t;
    return { shadowSide: 'right', shadowCx: cx, opacity: 0.9 + t * 0.1 };
  }

  // Full moon: day 15
  if (day === 15) {
    return { shadowSide: 'none', shadowCx: 200, opacity: 1 };
  }

  // Waning gibbous → crescent: days 16–27
  // Shadow on LEFT, lit on RIGHT
  // t=0 at day 16 (gibbous, cx=-50) → t=1 at day 27 (thin crescent, cx=43)
  const t = (day - 16) / 11;
  const cx = -50 + 93 * t;
  return { shadowSide: 'left', shadowCx: cx, opacity: 1 - t * 0.9 };
}
