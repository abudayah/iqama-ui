import type { PrayerName, CountdownState, DailySchedule } from '../types/index';

interface HeroBannerProps {
  nextPrayer: PrayerName | null;
  countdown: CountdownState;
  schedule: DailySchedule | null;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

type Phase = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Parses the day number from a hijri_date string like "Dhul Hijjah 25, 1446".
 * Returns null if the format is unrecognised.
 */
function parseHijriDay(hijriDate: string): number | null {
  // Match one or two digits that appear before a comma
  const match = hijriDate.match(/(\d{1,2}),/);
  if (!match) return null;
  const day = parseInt(match[1]!, 10);
  return day >= 1 && day <= 30 ? day : null;
}

/**
 * Converts a Hijri day (1–30) to the SVG shadow-circle cx value used in the
 * moon mask. The same algorithm as the reference HTML:
 *   day 15  → cx 200  (full moon, shadow off-screen right)
 *   day < 15 → shadow slides in from the right (waxing)
 *   day > 15 → shadow slides in from the left (waning)
 */
function moonShadowCxFromDay(day: number): number {
  if (day === 15) return 200; // full moon — shadow completely off-screen
  if (day < 15) {
    const progress = day / 15;
    return 50 + progress * 100; // ~50 (new) → ~150 (almost full)
  }
  // day > 15
  const progress = (day - 15) / 15;
  return -50 + progress * 100; // ~-50 (almost full) → ~50 (new)
}

function getPhase(prayer: PrayerName | null): Phase {
  if (!prayer) return 'night';
  if (prayer === 'fajr') return 'dawn';
  if (prayer === 'dhuhr' || prayer === 'asr') return 'day';
  if (prayer === 'maghrib') return 'dusk';
  return 'night';
}

const PHASE_STYLES: Record<Phase, {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  showSun: boolean;
  showMoon: boolean;
  celestialY: string;
  celestialX: string;
  celestialColor: string;
  mountainBackTop: string;
  mountainBackBot: string;
  mountainMidTop: string;
  mountainMidBot: string;
  mountainFrontTop: string;
  mountainFrontBot: string;
}> = {
  dawn: {
    skyTop: '#2c1b3d', skyMid: '#6b4c5a', skyBottom: '#b08980',
    showSun: true, showMoon: false,
    celestialY: '50%', celestialX: '25%', celestialColor: '#fbc02d',
    mountainBackTop: '#4a4053', mountainBackBot: '#2a2533',
    mountainMidTop: '#3a3545', mountainMidBot: '#1c1a24',
    mountainFrontTop: '#2c2b36', mountainFrontBot: '#11151c',
  },
  day: {
    skyTop: '#2980b9', skyMid: '#4eb1df', skyBottom: '#6dd5ed',
    showSun: true, showMoon: false,
    celestialY: '20%', celestialX: '50%', celestialColor: '#fff4ca',
    mountainBackTop: '#5a7b9c', mountainBackBot: '#2c3e50',
    mountainMidTop: '#3b5978', mountainMidBot: '#1a252f',
    mountainFrontTop: '#2c3e50', mountainFrontBot: '#111827',
  },
  dusk: {
    skyTop: '#2c3e50', skyMid: '#c06c84', skyBottom: '#f67280',
    showSun: true, showMoon: false,
    celestialY: '60%', celestialX: '80%', celestialColor: '#ffb88c',
    mountainBackTop: '#4a3b4f', mountainBackBot: '#2a1f2e',
    mountainMidTop: '#38293d', mountainMidBot: '#1c1121',
    mountainFrontTop: '#291e2e', mountainFrontBot: '#0f0a14',
  },
  night: {
    skyTop: '#0f2027', skyMid: '#162c36', skyBottom: '#203a43',
    showSun: false, showMoon: true,
    celestialY: '30%', celestialX: '75%', celestialColor: '#fff4ca',
    mountainBackTop: '#1f2937', mountainBackBot: '#111827',
    mountainMidTop: '#151e29', mountainMidBot: '#0b1016',
    mountainFrontTop: '#111827', mountainFrontBot: '#000000',
  },
};

export function HeroBanner({ nextPrayer, countdown, schedule }: HeroBannerProps) {
  const phase = getPhase(nextPrayer);
  const s = PHASE_STYLES[phase];
  const iqamaTime = nextPrayer && schedule ? schedule[nextPrayer]?.iqama : null;

  // Dynamic moon phase from hijri day
  const hijriDay = schedule ? parseHijriDay(schedule.hijri_date) : null;
  const moonShadowCx = hijriDay !== null ? moonShadowCxFromDay(hijriDay) : 75; // default ~quarter moon

  const countdownLabel =
    countdown.phase === 'to_azan'
      ? 'Time until azan'
      : countdown.phase === 'to_iqama'
        ? 'Time until iqama'
        : 'Iqama in progress';

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        height: 280,
        background: `linear-gradient(to bottom, ${s.skyTop}, ${s.skyMid}, ${s.skyBottom})`,
        transition: 'background 1.5s ease-in-out',
      }}
    >
      {/* Text content */}
      <div className="relative z-10 flex justify-between items-start px-6 pt-8" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Next prayer</p>
          <h1 className="text-5xl font-bold mt-1" style={{ letterSpacing: '-1px' }}>
            {nextPrayer ? (PRAYER_LABELS[nextPrayer] ?? nextPrayer) : '—'}
          </h1>
          {iqamaTime && (
            <p className="text-sm mt-2 opacity-90">Iqama at {iqamaTime}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">{countdownLabel}</p>
          {countdown.display !== 'All prayers complete' ? (
            <p className="text-4xl font-bold mt-1 tabular-nums leading-none">
              {countdown.display.slice(0, 5)}
              <span className="text-xl font-semibold opacity-70">
                :{countdown.display.slice(6)}
              </span>
            </p>
          ) : (
            <p className="text-4xl font-bold mt-1">—</p>
          )}
        </div>
      </div>

      {/* Landscape layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* Sun */}
        {s.showSun && (
          <div
            style={{
              position: 'absolute',
              top: s.celestialY,
              left: s.celestialX,
              transform: 'translate(-50%, -50%)',
              width: 70,
              height: 70,
              background: s.celestialColor,
              borderRadius: '50%',
              boxShadow: `0 0 40px ${s.celestialColor}`,
              transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {/* Moon */}
        {s.showMoon && (
          <div
            style={{
              position: 'absolute',
              top: s.celestialY,
              left: s.celestialX,
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              filter: 'drop-shadow(0 0 15px rgba(255, 244, 202, 0.4))',
              transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ transform: 'rotate(-25deg)' }}>
              <defs>
                <mask id="moon-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <circle cx={moonShadowCx} cy="50" r="50" fill="black" />
                </mask>
              </defs>
              <circle cx="50" cy="50" r="45" fill="#fff4ca" mask="url(#moon-mask)" />
            </svg>
          </div>
        )}

        {/* Mountains SVG */}
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          style={{ position: 'absolute', bottom: -2, left: 0, width: '100%', height: 160 }}
        >
          <defs>
            <linearGradient id="grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.mountainBackTop} />
              <stop offset="100%" stopColor={s.mountainBackBot} />
            </linearGradient>
            <linearGradient id="grad-mid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.mountainMidTop} />
              <stop offset="100%" stopColor={s.mountainMidBot} />
            </linearGradient>
            <linearGradient id="grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.mountainFrontTop} />
              <stop offset="100%" stopColor={s.mountainFrontBot} />
            </linearGradient>
          </defs>
          <path fill="url(#grad-back)" d="M0,40 L0,15 Q15,5 30,12 T60,10 T90,18 T100,12 L100,40 Z" />
          <path fill="url(#grad-mid)" d="M0,40 L0,22 Q18,12 35,20 T70,16 T100,24 L100,40 Z" />
          <path fill="url(#grad-front)" d="M-10,40 L-10,28 Q25,18 45,28 T110,22 L110,40 Z" />
        </svg>
      </div>
    </div>
  );
}
