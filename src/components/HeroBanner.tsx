import { useRef, useEffect } from 'react';
import type { TimeOfDay, CountdownMode } from '../hooks/usePrayerContext';
import type { PrayerName, DailySchedule, CountdownState } from '../types/index';

/* ─── Props ─────────────────────────────────────────────────────────────────── */
interface HeroBannerProps {
  nextPrayer:    PrayerName | null;
  countdown:     CountdownState;
  schedule:      DailySchedule | null;
  timeOfDay:     TimeOfDay;
  countdownMode: CountdownMode;
  hijriDay:      number;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

/** Sky gradient stops per phase — used inline so the browser transitions them */
const PHASE_SKY: Record<TimeOfDay, { top: string; mid: string; bot: string }> = {
  DAWN:  { top: '#2c1b3d', mid: '#6b4c5a', bot: '#b08980' },
  DAY:   { top: '#2980b9', mid: '#4eb1df', bot: '#6dd5ed' },
  DUSK:  { top: '#2c3e50', mid: '#c06c84', bot: '#f67280' },
  NIGHT: { top: '#0f2027', mid: '#162c36', bot: '#203a43' },
};

/** Celestial body position + colour per phase */
const PHASE_CELESTIAL: Record<TimeOfDay, {
  top: string; left: string; color: string; showSun: boolean;
}> = {
  DAWN:  { top: '50%', left: '25%', color: '#fbc02d', showSun: true  },
  DAY:   { top: '20%', left: '50%', color: '#fff4ca', showSun: true  },
  DUSK:  { top: '60%', left: '80%', color: '#ffb88c', showSun: true  },
  NIGHT: { top: '30%', left: '75%', color: '#fff4ca', showSun: false },
};

/** Mountain gradient colours per phase */
const PHASE_MTN: Record<TimeOfDay, {
  backTop: string; backBot: string;
  midTop:  string; midBot:  string;
  frtTop:  string; frtBot:  string;
}> = {
  DAWN:  { backTop:'#4a4053',backBot:'#2a2533', midTop:'#3a3545',midBot:'#1c1a24', frtTop:'#2c2b36',frtBot:'#11151c' },
  DAY:   { backTop:'#5a7b9c',backBot:'#2c3e50', midTop:'#3b5978',midBot:'#1a252f', frtTop:'#2c3e50',frtBot:'#111827' },
  DUSK:  { backTop:'#4a3b4f',backBot:'#2a1f2e', midTop:'#38293d',midBot:'#1c1121', frtTop:'#291e2e',frtBot:'#0f0a14' },
  NIGHT: { backTop:'#1f2937',backBot:'#111827', midTop:'#151e29',midBot:'#0b1016', frtTop:'#111827',frtBot:'#000000' },
};

/* ─── Moon phase helpers ─────────────────────────────────────────────────────
 * Converts a Hijri day (1–30) to the SVG shadow-circle cx value.
 *   day 15  → cx 200  (full moon — shadow off-screen right)
 *   day < 15 → waxing: shadow slides right as day increases
 *   day > 15 → waning: shadow slides in from the left
 */
function moonShadowCx(day: number): number {
  if (day === 15) return 200;
  if (day < 15)  return 50 + (day / 15) * 100;          // ~50 → ~150
  return -50 + ((day - 15) / 15) * 100;                  // ~-50 → ~50
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export function HeroBanner({
  nextPrayer,
  countdown,
  schedule,
  timeOfDay,
  countdownMode,
  hijriDay,
}: HeroBannerProps) {
  /* ── Sky gradient ── */
  const sky = PHASE_SKY[timeOfDay];
  const cel = PHASE_CELESTIAL[timeOfDay];
  const mtn = PHASE_MTN[timeOfDay];

  /* ── Prayer data ── */
  const prayerLabel = nextPrayer ? (PRAYER_LABELS[nextPrayer] ?? nextPrayer) : '—';
  const azanTime    = nextPrayer && schedule ? schedule[nextPrayer]?.azan  : null;
  const iqamaTime   = nextPrayer && schedule ? schedule[nextPrayer]?.iqama : null;

  /* ── Countdown display ── */
  const isIqamaWindow = countdownMode === 'to_iqama';
  const isDone        = countdownMode === 'done';

  const superTitle = isIqamaWindow ? 'TIME UNTIL IQAMA' : 'NEXT PRAYER';
  const subLine    = isIqamaWindow
    ? (iqamaTime ? `${prayerLabel} · Iqama at ${iqamaTime}` : prayerLabel)
    : (azanTime  ? `${prayerLabel} · Azan at ${azanTime}`   : prayerLabel);

  /* ── Smooth sky transition via inline style ──
   * We update a data-phase attribute on the wrapper so the CSS vars in
   * index.css transition. We also set the gradient directly so it works
   * even in browsers that don't support @property transitions.
   */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.setAttribute('data-phase', timeOfDay);
    }
  }, [timeOfDay]);

  /* ── Moon shadow cx ── */
  const shadowCx = moonShadowCx(hijriDay);

  return (
    <div
      ref={wrapperRef}
      data-phase={timeOfDay}
      className="relative overflow-hidden text-white hero-sky"
      style={{
        height: 300,
        background: `linear-gradient(to bottom, ${sky.top}, ${sky.mid}, ${sky.bot})`,
        transition: 'background 1.5s ease-in-out',
      }}
      aria-label="Prayer hero banner"
    >
      {/* ── Text content — left-aligned stacked layout ── */}
      <div
        className="relative z-10 flex flex-col justify-start px-6 pt-8 max-w-xs"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
      >
        {/* Super-title */}
        {isIqamaWindow ? (
          <p className="iqama-warning-label text-xs font-bold uppercase tracking-[0.18em]">
            {superTitle}
          </p>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            {superTitle}
          </p>
        )}

        {/* Timer */}
        {isDone ? (
          <p className="text-5xl font-bold mt-1 tabular-nums leading-none tracking-tight">
            —
          </p>
        ) : (
          <p
            className="text-5xl font-bold mt-1 tabular-nums leading-none tracking-tight"
            aria-live="polite"
            aria-atomic="true"
          >
            {countdown.display}
          </p>
        )}

        {/* Subtitle */}
        <p className="text-sm font-semibold mt-2 text-white/90">
          {isDone ? 'All prayers complete' : subLine}
        </p>
      </div>

      {/* ── Landscape layer (z-index 1, behind text) ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>

        {/* Sun — shown during DAWN / DAY / DUSK */}
        {cel.showSun && (
          <div
            className="celestial-body absolute rounded-full"
            style={{
              top:       cel.top,
              left:      cel.left,
              transform: 'translate(-50%, -50%)',
              width:     70,
              height:    70,
              background: cel.color,
              boxShadow: `0 0 50px 10px ${cel.color}`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Moon — shown during NIGHT only */}
        {!cel.showSun && (
          <div
            className="celestial-body absolute"
            style={{
              top:       cel.top,
              left:      cel.left,
              transform: 'translate(-50%, -50%)',
              width:     80,
              height:    80,
              filter:    'drop-shadow(0 0 18px rgba(255,244,202,0.45))',
            }}
            aria-hidden="true"
          >
            {/* The entire SVG is tilted -25° for a natural crescent angle */}
            <svg
              viewBox="0 0 100 100"
              width="100%"
              height="100%"
              style={{ transform: 'rotate(-25deg)' }}
            >
              <defs>
                {/*
                  Moon phase mask:
                  - White rect = visible area
                  - Black circle = shadow that hides part of the moon
                  cx is driven by hijriDay:
                    day 15 → cx 200 (full moon, shadow off-screen)
                    day < 15 → waxing (shadow moves right)
                    day > 15 → waning (shadow comes from left)
                */}
                <mask id="moon-phase-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <circle cx={shadowCx} cy="50" r="50" fill="black" />
                </mask>
              </defs>
              <circle cx="50" cy="50" r="45" fill="#fff4ca" mask="url(#moon-phase-mask)" />
            </svg>
          </div>
        )}

        {/* Mountains SVG — three receding ranges with atmospheric gradients */}
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          style={{ position: 'absolute', bottom: -2, left: 0, width: '100%', height: 170 }}
          aria-hidden="true"
        >
          <defs>
            {/* Back range — lightest (most atmospheric haze) */}
            <linearGradient id="hb-grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.backTop} />
              <stop offset="100%" stopColor={mtn.backBot} />
            </linearGradient>
            {/* Mid range */}
            <linearGradient id="hb-grad-mid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.midTop} />
              <stop offset="100%" stopColor={mtn.midBot} />
            </linearGradient>
            {/* Front range — darkest */}
            <linearGradient id="hb-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={mtn.frtTop} />
              <stop offset="100%" stopColor={mtn.frtBot} />
            </linearGradient>
            {/* Mist layer — faint white-to-transparent veil between back and mid */}
            <linearGradient id="hb-grad-mist" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Back mountains */}
          <path
            fill="url(#hb-grad-back)"
            d="M0,40 L0,15 Q15,5 30,12 T60,10 T90,18 T100,12 L100,40 Z"
          />

          {/* Mist veil — sits between back and mid ranges */}
          <path
            fill="url(#hb-grad-mist)"
            d="M0,40 L0,18 Q20,10 40,16 T80,14 T100,20 L100,40 Z"
          />

          {/* Mid mountains */}
          <path
            fill="url(#hb-grad-mid)"
            d="M0,40 L0,22 Q18,12 35,20 T70,16 T100,24 L100,40 Z"
          />

          {/* Front mountains */}
          <path
            fill="url(#hb-grad-front)"
            d="M-10,40 L-10,28 Q25,18 45,28 T110,22 L110,40 Z"
          />
        </svg>
      </div>
    </div>
  );
}
