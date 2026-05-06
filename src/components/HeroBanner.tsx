import { useRef, useState, useEffect } from 'react';
import type { CountdownMode } from '../hooks/usePrayerContext';
import type { PrayerName, DailySchedule, CountdownState } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import { IslamicEventBanner } from './IslamicEventBanner';

/** Prayers + sunrise + Eid prayers — anything that can be peeked */
export type PeekTarget = PrayerName | 'sunrise' | 'eid-prayer-1' | 'eid-prayer-2';

/* ─── Props ─────────────────────────────────────────────────────────────────── */
interface HeroBannerProps {
  nextPrayer: PrayerEvent | null;
  countdown: CountdownState;
  /** Schedule for the prayer being counted down to (may be tomorrow's) */
  schedule: DailySchedule | null;
  /** Today's schedule — used for sky/sun/moon anchor times */
  todaySchedule: DailySchedule | null;
  countdownMode: CountdownMode;
  hijriDay: number;
  hijriMonth: number;
  /** Tick counter from usePrayerContext — drives per-second re-render */
  tick: number;
  /** Optional simulated now (from simulator) */
  simulatedNow?: Date | undefined;
  /** Peeked target — when set, hero shows that target's countdown */
  peekPrayer?: PeekTarget | null;
  /** Schedule that contains the peeked target */
  peekSchedule?: DailySchedule | null;
  /** Optional label override for the peeked target (used for Eid prayer rows) */
  peekLabel?: string | null;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  sunrise: 'Sunrise',
  'eid-prayer-1': '1st Prayer',
  'eid-prayer-2': '2nd Prayer',
};

/* ─── Time helpers ───────────────────────────────────────────────────────────── */

/** Parse "HH:mm" into minutes-since-midnight */
function hhmm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h! * 60 + m!;
}

/** Current time as minutes-since-midnight (local) */
function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

/** Linear interpolation */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Interpolate between two hex colours by t ∈ [0,1] */
function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(lerp(r1!, r2!, t));
  const g = Math.round(lerp(g1!, g2!, t));
  const b = Math.round(lerp(b1!, b2!, t));
  return `rgb(${r},${g},${b})`;
}

/* ─── Sky colour keyframes ───────────────────────────────────────────────────
 *
 * Each keyframe is { t: minutes-since-midnight, top, mid, bot }.
 * We interpolate between the two surrounding keyframes for the current time.
 *
 * Anchor points (filled in with real schedule times at runtime):
 *   0:00  → deep night
 *   fajr  → first light / dawn
 *   sunrise → full day
 *   solar noon → peak day
 *   maghrib-30min → golden hour begins
 *   maghrib → sunset / dusk peak
 *   maghrib+40min → dusk fading
 *   isha  → full night
 *   24:00 → deep night (same as 0:00)
 */
interface SkyKeyframe {
  t: number; // minutes since midnight
  top: string;
  mid: string;
  bot: string;
}

function buildSkyKeyframes(
  fajrMin: number,
  sunriseMin: number,
  maghribMin: number,
  ishaMin: number,
): SkyKeyframe[] {
  const solarNoon = (sunriseMin + maghribMin) / 2;
  const goldenStart = maghribMin - 30;
  const duskEnd = maghribMin + 40;

  return [
    { t: 0, top: '#0f2027', mid: '#162c36', bot: '#203a43' }, // deep night
    { t: fajrMin, top: '#2c1b3d', mid: '#6b4c5a', bot: '#b08980' }, // first light
    { t: sunriseMin, top: '#1a6b9a', mid: '#e8956d', bot: '#f5c07a' }, // sunrise glow
    { t: sunriseMin + 30, top: '#2980b9', mid: '#4eb1df', bot: '#6dd5ed' }, // morning blue
    { t: solarNoon, top: '#1a6fa8', mid: '#3da0d0', bot: '#5cc8e8' }, // peak day
    { t: goldenStart, top: '#2c3e50', mid: '#d4845a', bot: '#f0a070' }, // golden hour
    { t: maghribMin, top: '#2c3e50', mid: '#c06c84', bot: '#f67280' }, // sunset peak
    { t: duskEnd, top: '#1a1a2e', mid: '#2d1b3d', bot: '#4a2040' }, // dusk fading
    { t: ishaMin, top: '#0f2027', mid: '#162c36', bot: '#203a43' }, // full night
    { t: 24 * 60, top: '#0f2027', mid: '#162c36', bot: '#203a43' }, // midnight wrap
  ];
}

function interpolateSky(
  keyframes: SkyKeyframe[],
  t: number,
): { top: string; mid: string; bot: string } {
  // Find surrounding keyframes
  let lo = keyframes[0]!;
  let hi = keyframes[keyframes.length - 1]!;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i]!.t && t <= keyframes[i + 1]!.t) {
      lo = keyframes[i]!;
      hi = keyframes[i + 1]!;
      break;
    }
  }
  const span = hi.t - lo.t;
  const frac = span > 0 ? (t - lo.t) / span : 0;
  return {
    top: lerpColor(lo.top, hi.top, frac),
    mid: lerpColor(lo.mid, hi.mid, frac),
    bot: lerpColor(lo.bot, hi.bot, frac),
  };
}

/* ─── Mountain colours ───────────────────────────────────────────────────────
 * Same keyframe approach for mountain layer tints.
 */
interface MtnKeyframe {
  t: number;
  backTop: string;
  backBot: string;
  midTop: string;
  midBot: string;
  frtTop: string;
  frtBot: string;
}

function buildMtnKeyframes(
  fajrMin: number,
  sunriseMin: number,
  maghribMin: number,
  ishaMin: number,
): MtnKeyframe[] {
  const goldenStart = maghribMin - 30;
  const duskEnd = maghribMin + 40;
  return [
    {
      t: 0,
      backTop: '#1f2937',
      backBot: '#111827',
      midTop: '#151e29',
      midBot: '#0b1016',
      frtTop: '#111827',
      frtBot: '#000000',
    },
    {
      t: fajrMin,
      backTop: '#4a4053',
      backBot: '#2a2533',
      midTop: '#3a3545',
      midBot: '#1c1a24',
      frtTop: '#2c2b36',
      frtBot: '#11151c',
    },
    {
      t: sunriseMin + 30,
      backTop: '#5a7b9c',
      backBot: '#2c3e50',
      midTop: '#3b5978',
      midBot: '#1a252f',
      frtTop: '#2c3e50',
      frtBot: '#111827',
    },
    {
      t: goldenStart,
      backTop: '#6b5a4a',
      backBot: '#3a2e24',
      midTop: '#4a3d30',
      midBot: '#221a12',
      frtTop: '#352a1e',
      frtBot: '#120d08',
    },
    {
      t: maghribMin,
      backTop: '#4a3b4f',
      backBot: '#2a1f2e',
      midTop: '#38293d',
      midBot: '#1c1121',
      frtTop: '#291e2e',
      frtBot: '#0f0a14',
    },
    {
      t: duskEnd,
      backTop: '#252535',
      backBot: '#141420',
      midTop: '#1c1c2e',
      midBot: '#0d0d18',
      frtTop: '#181828',
      frtBot: '#060610',
    },
    {
      t: ishaMin,
      backTop: '#1f2937',
      backBot: '#111827',
      midTop: '#151e29',
      midBot: '#0b1016',
      frtTop: '#111827',
      frtBot: '#000000',
    },
    {
      t: 24 * 60,
      backTop: '#1f2937',
      backBot: '#111827',
      midTop: '#151e29',
      midBot: '#0b1016',
      frtTop: '#111827',
      frtBot: '#000000',
    },
  ];
}

function interpolateMtn(keyframes: MtnKeyframe[], t: number): Omit<MtnKeyframe, 't'> {
  let lo = keyframes[0]!;
  let hi = keyframes[keyframes.length - 1]!;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i]!.t && t <= keyframes[i + 1]!.t) {
      lo = keyframes[i]!;
      hi = keyframes[i + 1]!;
      break;
    }
  }
  const span = hi.t - lo.t;
  const frac = span > 0 ? (t - lo.t) / span : 0;
  return {
    backTop: lerpColor(lo.backTop, hi.backTop, frac),
    backBot: lerpColor(lo.backBot, hi.backBot, frac),
    midTop: lerpColor(lo.midTop, hi.midTop, frac),
    midBot: lerpColor(lo.midBot, hi.midBot, frac),
    frtTop: lerpColor(lo.frtTop, hi.frtTop, frac),
    frtBot: lerpColor(lo.frtBot, hi.frtBot, frac),
  };
}

/* ─── Sun arc ────────────────────────────────────────────────────────────────
 *
 * The sun travels a parabolic arc from left to right:
 *   - Rises at sunrise: left=5%, top=85% (just above horizon)
 *   - Peaks at solar noon: left=50%, top=15%
 *   - Sets at maghrib: left=95%, top=85%
 *
 * t=0 → sunrise, t=1 → maghrib
 * We use a quadratic Bezier: P = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
 *   P0 = rise point, P1 = apex control, P2 = set point
 */
interface CelestialState {
  leftPct: number; // 0–100
  topPct: number; // 0–100
  color: string;
  opacity: number; // 0–1 for fade in/out near horizon
  showSun: boolean;
}

/*
 * The card is 300px tall. The mountain layer occupies roughly the bottom 100px,
 * so the visual horizon sits at ~200px from the top = 67% of card height.
 * Rise/set points are placed at y=67 so the sun/moon dip behind the mountains
 * rather than disappearing at the card edge.
 * The arc apex is kept high (y=8) for a natural sky sweep.
 */
const HORIZON_PCT = 67; // % from top where sun/moon meet the mountain line

function sunArc(t: number): { leftPct: number; topPct: number } {
  // Quadratic bezier: rise(5, HORIZON) → apex(50, 8) → set(95, HORIZON)
  const p0 = { x: 5, y: HORIZON_PCT };
  const p1 = { x: 50, y: 8 };
  const p2 = { x: 95, y: HORIZON_PCT };
  const tc = Math.max(0, Math.min(1, t));
  const mt = 1 - tc;
  return {
    leftPct: mt * mt * p0.x + 2 * mt * tc * p1.x + tc * tc * p2.x,
    topPct: mt * mt * p0.y + 2 * mt * tc * p1.y + tc * tc * p2.y,
  };
}

function moonArc(t: number): { leftPct: number; topPct: number } {
  // Moon is fixed horizontally at 72% from left.
  // t=0 → horizon (daytime, hidden behind mountains)
  // t=0.5 → peak position in the night sky
  // t=1 → horizon (sunrise, sinking behind mountains)
  // CSS 2s transition fires when t changes between these states.
  const PEAK_TOP = 20;
  const topPct = t === 0.5 ? PEAK_TOP : HORIZON_PCT;
  return { leftPct: 72, topPct };
}

function computeCelestial(
  nowMin: number,
  fajrMin: number,
  sunriseMin: number,
  maghribMin: number,
): CelestialState {
  const SUN_FADE_MINS = 20; // fade in/out near horizon for the sun

  // ── Sun: visible from fajr up to (but not including) maghrib ──
  if (nowMin >= fajrMin && nowMin < maghribMin) {
    // t=0 at sunrise, t=1 at maghrib (sun is below horizon before sunrise)
    const daySpan = maghribMin - sunriseMin;
    const rawT = daySpan > 0 ? (nowMin - sunriseMin) / daySpan : 0;
    const { leftPct, topPct } = sunArc(rawT);

    // Fade in from fajr→sunrise, fade out near maghrib
    let opacity = 1;
    if (nowMin < sunriseMin) {
      opacity = Math.max(0, (nowMin - fajrMin) / SUN_FADE_MINS);
    } else if (nowMin > maghribMin - SUN_FADE_MINS) {
      opacity = Math.max(0, (maghribMin - nowMin) / SUN_FADE_MINS);
    }

    // Sun colour: warm orange near horizon, white-yellow at peak
    const horizonProximity = Math.abs(topPct - HORIZON_PCT) / (HORIZON_PCT - 8); // 0=horizon, 1=peak
    const color = lerpColor('#ffb347', '#fff4ca', horizonProximity);

    return { leftPct, topPct, color, opacity, showSun: true };
  }

  // ── Moon: rises from behind mountains at maghrib, sets behind them at sunrise ──
  // Three states: hidden (day), up (night), descending (near sunrise)
  // The CSS 2s transition handles the rise/set animation.
  const isDaytime = nowMin >= sunriseMin && nowMin < maghribMin;
  const nearSunrise =
    !isDaytime &&
    (nowMin < sunriseMin
      ? nowMin >= sunriseMin - 1 // within 1 min before sunrise
      : nowMin >= sunriseMin + 24 * 60 - 1); // wrapping past midnight
  const moonT = isDaytime ? 0 : nearSunrise ? 1 : 0.5;
  const { leftPct, topPct } = moonArc(moonT);

  return { leftPct, topPct, color: '#fff4ca', opacity: 1, showSun: false };
}

/* ─── Stars ──────────────────────────────────────────────────────────────────
 * Fixed star positions generated once (deterministic pseudo-random).
 * Each star has its own twinkle duration and delay so they fade in/out
 * independently — at any moment only a fraction are bright, like real stars.
 */
interface Star {
  x: number; // 0–100 (% of banner width)
  y: number; // 0–58  (% of banner height, above mountain horizon)
  r: number; // radius px
  duration: number; // twinkle cycle duration (s)
  delay: number; // animation start delay (s)
}

function generateStars(count: number): Star[] {
  let seed = 0xdeadbeef;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 58,
    r: 0.4 + rand() * 1.2,
    duration: 2 + rand() * 5, // 2–7s per cycle
    delay: -(rand() * 10), // negative delay = start mid-cycle, so they're not all in sync
  }));
}

const STARS = generateStars(80);

/**
 * Returns true when stars should be visible: after Maghrib or before Sunrise.
 * Requires todaySchedule to be loaded — returns false otherwise.
 */
function isNight(skyMin: number, sunriseMin: number, maghribMin: number): boolean {
  return skyMin >= maghribMin || skyMin < sunriseMin;
}

/* ─── Moon phase ─────────────────────────────────────────────────────────────
 * Converts a Hijri day (1–30) to phase rendering parameters:
 *   shadowSide: which side the shadow falls on ('left' = waxing, 'right' = waning, 'none' = full moon)
 *   shadowCx:   SVG cx of the shadow circle
 *   opacity:    opacity of the lit disc (fades near new moon)
 */
export function getMoonPhase(day: number): {
  shadowSide: 'left' | 'right' | 'none';
  shadowCx: number;
  opacity: number;
} {
  if (day >= 28 || day <= 1) {
    return { shadowSide: 'left', shadowCx: 50, opacity: day <= 1 ? 0.05 : 0.1 };
  }
  if (day < 15) {
    // t=0 at day 2 (thin crescent) → t=1 at day 14 (gibbous)
    // Shadow moves leftward off-screen: cx goes from ~0 (covering disc) to ~-40 (mostly off-screen)
    const t = (day - 1) / 14;
    const cx = 0 - 40 * t; // 0 → -40
    return { shadowSide: 'left', shadowCx: cx, opacity: 0.9 + t * 0.1 };
  }
  if (day === 15) {
    return { shadowSide: 'none', shadowCx: 200, opacity: 1 };
  }
  // t=0 at day 16 (gibbous) → t=1 at day 27 (thin crescent)
  // Shadow moves rightward onto disc: cx goes from ~100 (mostly off-screen) to ~50 (covering disc)
  const t = (day - 15) / 14;
  const cx = 100 - 50 * t; // 100 → 50
  return { shadowSide: 'right', shadowCx: cx, opacity: 1 - t * 0.9 };
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export function HeroBanner({
  nextPrayer,
  countdown,
  schedule,
  todaySchedule,
  countdownMode,
  hijriDay,
  hijriMonth,
  tick: _tick,
  simulatedNow,
  peekPrayer,
  peekSchedule,
  peekLabel,
}: HeroBannerProps) {
  const now = simulatedNow ?? new Date();
  const nowMin = nowMinutes(now);

  /* ── Peek mode: override display with the peeked target's countdown ── */
  const isPeeking = !!peekPrayer && !!peekSchedule;

  const isEidPeek = peekPrayer === 'eid-prayer-1' || peekPrayer === 'eid-prayer-2';

  // Resolve the azan time string for the peeked target.
  // Eid peeks use peekSchedule.sunrise (we inject the Eid time there).
  const peekTimeStr: string | null =
    isPeeking && peekSchedule
      ? peekPrayer === 'sunrise' || isEidPeek
        ? peekSchedule.sunrise
        : peekSchedule[peekPrayer as PrayerName].azan
      : null;

  const peekAzanMin: number | null = peekTimeStr !== null ? hhmm(peekTimeStr) : null;

  // Sky is driven by peek time when peeking, otherwise real now
  const skyMin = isPeeking && peekAzanMin !== null ? peekAzanMin : nowMin;

  /* ── Resolve anchor times from today's schedule ── */
  const fajrMin = todaySchedule ? hhmm(todaySchedule.fajr.azan) : 5 * 60;
  const sunriseMin = todaySchedule ? hhmm(todaySchedule.sunrise) : 6 * 60;
  const maghribMin = todaySchedule ? hhmm(todaySchedule.maghrib.azan) : 20 * 60;
  const ishaMin = todaySchedule ? hhmm(todaySchedule.isha.azan) : 21 * 60;

  /* ── Continuous sky — driven by skyMin (peek azan time or real now) ── */
  const skyKeyframes = buildSkyKeyframes(fajrMin, sunriseMin, maghribMin, ishaMin);
  const sky = interpolateSky(skyKeyframes, skyMin);

  /* ── Continuous mountains ── */
  const mtnKeyframes = buildMtnKeyframes(fajrMin, sunriseMin, maghribMin, ishaMin);
  const mtn = interpolateMtn(mtnKeyframes, skyMin);

  /* ── Celestial body — rounded to nearest minute so position only updates once/min ── */
  const celMin = isPeeking ? skyMin : Math.floor(nowMin);
  const cel = computeCelestial(celMin, fajrMin, sunriseMin, maghribMin);

  /* ── Stars — only computed once schedule is available ── */
  const showStars = todaySchedule ? isNight(skyMin, sunriseMin, maghribMin) : false;

  /* ── Prayer data — peek overrides default ── */
  const displayPrayer = isPeeking ? peekPrayer! : nextPrayer;
  const displaySchedule = isPeeking ? peekSchedule! : schedule;

  const displayCountdown: CountdownState =
    isPeeking && peekSchedule && peekTimeStr
      ? (() => {
          const [h, m] = peekTimeStr.split(':').map(Number);
          const [y, mo, d] = peekSchedule.date.split('-').map(Number);
          const targetDate = new Date(y!, mo! - 1, d!, h!, m!, 0, 0);
          const diffMs = targetDate.getTime() - now.getTime();
          if (diffMs <= 0) return { phase: 'done' as const, display: 'All prayers complete' };
          const total = Math.floor(diffMs / 1000);
          const hh = Math.floor(total / 3600);
          const mm = Math.floor((total % 3600) / 60);
          const ss = total % 60;
          return {
            phase: 'to_azan' as const,
            display: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
          };
        })()
      : countdown;

  const prayerLabel =
    peekLabel ?? (displayPrayer ? (PRAYER_LABELS[displayPrayer] ?? displayPrayer) : '—');

  const isNonAzanEvent = (p: typeof displayPrayer) =>
    p === 'sunrise' || p === 'eid-prayer-1' || p === 'eid-prayer-2';

  // Resolve azan time for display in the sub-line
  const azanTime: string | null = isPeeking
    ? peekTimeStr
    : displayPrayer && displaySchedule && !isNonAzanEvent(displayPrayer)
      ? (displaySchedule[displayPrayer as PrayerName]?.azan ?? null)
      : null;

  // Eid prayers and sunrise have no iqama
  const iqamaTime: string | null =
    displayPrayer && displaySchedule && !isNonAzanEvent(displayPrayer)
      ? (displaySchedule[displayPrayer as PrayerName]?.iqama ?? null)
      : null;

  /* ── Countdown display ── */
  const effectiveMode = isPeeking ? 'to_azan' : countdownMode;
  const isIqamaWindow = effectiveMode === 'to_iqama';
  const isDone = effectiveMode === 'done';

  // Determine super-title based on what's being displayed
  const superTitle = isPeeking
    ? isEidPeek
      ? 'EID PRAYER IN'
      : peekPrayer === 'sunrise'
        ? 'SUNRISE IN'
        : 'AZAN IN'
    : displayPrayer === 'sunrise'
      ? 'SUNRISE IN'
      : displayPrayer === 'eid-prayer-1' || displayPrayer === 'eid-prayer-2'
        ? 'NEXT PRAYER'
        : isIqamaWindow
          ? 'TIME UNTIL IQAMA'
          : 'NEXT PRAYER';

  const subLine = isPeeking
    ? azanTime
      ? `${prayerLabel} · at ${azanTime}`
      : prayerLabel
    : isIqamaWindow
      ? iqamaTime
        ? `${prayerLabel} · Iqama at ${iqamaTime}`
        : prayerLabel
      : displayPrayer === 'sunrise'
        ? azanTime
          ? `${prayerLabel} · at ${azanTime}`
          : prayerLabel
        : azanTime
          ? `${prayerLabel} · Azan at ${azanTime}`
          : prayerLabel;

  /* ── Moon phase ── */
  const phase = getMoonPhase(hijriDay);
  const glowIntensity = 1 - Math.abs(hijriDay - 15) / 15;
  const glowFilter = `drop-shadow(0 0 ${8 + glowIntensity * 20}px rgba(255,244,202,${0.2 + glowIntensity * 0.5}))`;

  /* ── Wrapper ref (kept for potential future CSS var transitions) ── */
  const wrapperRef = useRef<HTMLDivElement>(null);

  /*
   * On first render the moon has no previous position to transition from,
   * so we start it at the horizon and flip `moonReady` after one frame.
   * This gives the CSS transition something to animate from on every mount
   * (including simulator loads).
   */
  const [moonReady, setMoonReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMoonReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const moonTopPct = moonReady ? cel.topPct : HORIZON_PCT;

  return (
    <div
      ref={wrapperRef}
      id="prayer-hero-banner"
      className="relative text-white"
      style={{
        height: 300,
        background: `linear-gradient(to bottom, ${sky.top}, ${sky.mid}, ${sky.bot})`,
      }}
      aria-label="Prayer hero banner"
    >
      {/* ── Text content — left-aligned stacked layout ── */}
      <div
        className="relative z-10 flex flex-col justify-start px-6 pt-8 max-w-xs"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
      >
        {/* Super-title */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          {superTitle}
        </p>

        {/* Timer */}
        {isDone ? (
          <p className="text-5xl font-bold mt-1 tabular-nums leading-none tracking-tight">—</p>
        ) : (
          <p
            className="text-5xl font-bold mt-1 tabular-nums leading-none tracking-tight"
            aria-live="polite"
            aria-atomic="true"
          >
            {displayCountdown.display.slice(0, 5)}
            <span className="text-2xl font-semibold opacity-70">
              &nbsp;:&nbsp;{displayCountdown.display.slice(6)}
            </span>
          </p>
        )}

        {/* Subtitle */}
        <p className="text-sm font-semibold mt-2 text-white/90">
          {isDone ? 'All prayers complete' : subLine}
        </p>
      </div>

      {/* ── Landscape layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {/* Stars — each twinkles independently; only shown at night */}
        {showStars && (
          <svg
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {STARS.map((star, i) => (
              <circle
                key={i}
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.r}
                fill="white"
                style={{
                  animation: `hero-twinkle ${star.duration}s ease-in-out infinite alternate`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}

            {/* Shooting stars — 4 independent streaks, each on its own long cycle */}
            {[
              { x: 72, y: 8, angle: 35, interval: 9, delay: -1 },
              { x: 30, y: 5, angle: 28, interval: 14, delay: -5 },
              { x: 55, y: 12, angle: 40, interval: 11, delay: -8 },
              { x: 85, y: 4, angle: 32, interval: 17, delay: -3 },
            ].map((s, i) => (
              <line
                key={`shoot-${i}`}
                x1={`${s.x}%`}
                y1={`${s.y}%`}
                x2={`${s.x + 3}%`}
                y2={`${s.y + 2}%`}
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{
                  animation: `shooting-star ${s.interval}s linear infinite`,
                  animationDelay: `${s.delay}s`,
                  transformOrigin: `${s.x}% ${s.y}%`,
                  transform: `rotate(${s.angle}deg)`,
                }}
              />
            ))}
          </svg>
        )}

        {/* Sun */}
        {cel.showSun && (
          <div
            className="absolute rounded-full"
            style={{
              top: `${cel.topPct}%`,
              left: `${cel.leftPct}%`,
              transform: 'translate(-50%, -50%)',
              width: 70,
              height: 70,
              background: cel.color,
              boxShadow: `0 0 50px 14px ${cel.color}`,
              opacity: cel.opacity,
              transition: isPeeking
                ? 'top 0.6s ease-out, left 0.6s ease-out'
                : 'top 62s linear, left 62s linear, opacity 20s linear, background 62s linear',
            }}
            aria-hidden="true"
          />
        )}

        {/* Moon — fixed horizontal position, rises/sets behind mountains */}
        {!cel.showSun && (
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
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  {phase.shadowSide !== 'none' && (
                    <circle cx={phase.shadowCx} cy="50" r="46" fill="black" />
                  )}
                </mask>
              </defs>
              <circle cx="50" cy="50" r="45" fill="#1a1a2e" opacity="0.3" />
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
        )}

        {/* Mountains SVG */}
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          style={{ position: 'absolute', bottom: -2, left: 0, width: '100%', height: 170 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hb-grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.backTop} />
              <stop offset="100%" stopColor={mtn.backBot} />
            </linearGradient>
            <linearGradient id="hb-grad-mid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.midTop} />
              <stop offset="100%" stopColor={mtn.midBot} />
            </linearGradient>
            <linearGradient id="hb-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.frtTop} />
              <stop offset="100%" stopColor={mtn.frtBot} />
            </linearGradient>
            <linearGradient id="hb-grad-mist" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          <path
            fill="url(#hb-grad-back)"
            d="M0,40 L0,15 Q15,5 30,12 T60,10 T90,18 T100,12 L100,40 Z"
          />
          <path fill="url(#hb-grad-mist)" d="M0,40 L0,18 Q20,10 40,16 T80,14 T100,20 L100,40 Z" />
          <path fill="url(#hb-grad-mid)" d="M0,40 L0,22 Q18,12 35,20 T70,16 T100,24 L100,40 Z" />
          <path fill="url(#hb-grad-front)" d="M-10,40 L-10,28 Q25,18 45,28 T110,22 L110,40 Z" />
        </svg>
      </div>
      {/* ── Islamic event greeting banner ── */}
      <IslamicEventBanner hijriMonth={hijriMonth} hijriDay={hijriDay} />
    </div>
  );
}
