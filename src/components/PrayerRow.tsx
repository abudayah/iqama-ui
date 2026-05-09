import type { PrayerName, PrayerEntry } from '../types/index';

// Helper to format time from 24hr to 12hr AM/PM with leading zero for hours
const formatTime12Hr = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const date = new Date(2000, 0, 1, parseInt(hours!), parseInt(minutes!));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

interface PrayerRowProps {
  name: PrayerName | 'sunrise';
  entry: PrayerEntry | { azan: string; iqama?: never };
  isNext: boolean;
  isPast: boolean;
  /** True only during the azan→iqama window for this prayer — shows "now" badge */
  isActive: boolean;
  /** True when this prayer is currently being peeked in the hero */
  isPeeked: boolean;
  /** Override the display label (used for Eid prayer rows) */
  label?: string | undefined;
  /** Called when the row is tapped (only provided for future prayers) */
  onTap?: (() => void) | undefined;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  sunrise: 'Sunrise',
};

/** Dot colour per prayer — matches the design system */
const DOT_COLORS: Record<string, string> = {
  fajr: '#cbd5e1',
  sunrise: '#fde047',
  dhuhr: '#93c5fd',
  asr: '#fdba74',
  maghrib: '#2563eb',
  isha: '#4b5563',
};

export function PrayerRow({
  name,
  entry,
  isNext,
  isPast,
  isActive,
  isPeeked,
  label,
  onTap,
}: PrayerRowProps) {
  const isSunrise = name === 'sunrise';
  const dotColor = DOT_COLORS[name] ?? '#6b7280';
  const iqamaValue = 'iqama' in entry && entry.iqama ? entry.iqama : null;

  const highlightStyle = isActive
    ? { backgroundColor: 'rgba(248, 180, 0, 0.3)' }
    : isNext
      ? {
          backgroundColor: 'rgba(248, 180, 0, 0.1)',
          borderLeft: '1px solid #ffe7b3',
          borderRight: '1px solid #ffe7b3',
        }
      : {};

  return (
    <div
      role={onTap ? 'button' : undefined}
      aria-pressed={onTap ? isPeeked : undefined}
      aria-label={onTap ? `Preview ${PRAYER_LABELS[name] ?? name} prayer time` : undefined}
      onClick={onTap}
      className={[
        'flex items-center justify-between px-3 py-[18px]',
        isNext || isActive ? 'rounded-2xl' : '',
        isPeeked ? 'bg-indigo-50 rounded-2xl ring-1 ring-indigo-200' : '',
        isPast ? 'opacity-40' : '',
        onTap ? 'cursor-pointer active:opacity-70' : '',
      ].join(' ')}
      style={highlightStyle}
      data-testid={`prayer-row-${name}`}
      aria-current={isNext ? 'true' : undefined}
    >
      {/* Left: dot + name + "now" pill */}
      <div className="flex items-center gap-4">
        {/* Dot — pulses only during the active (azan→iqama) window */}
        <span
          className={['rounded-full flex-shrink-0', isActive ? 'active-dot' : ''].join(' ')}
          style={{ width: 12, height: 12, background: dotColor }}
          aria-hidden="true"
        />

        <span
          className="text-[1.05rem]"
          style={{
            fontWeight: isNext || isActive ? 700 : 500,
            color: isNext ? '#1e6c93' : isSunrise ? '#6b7280' : '#374151',
            fontStyle: isSunrise ? 'italic' : undefined,
          }}
        >
          {label ?? PRAYER_LABELS[name] ?? name}
        </span>

        {/* "now" pill removed per user preference */}
      </div>

      {/* Right: azan + iqama times */}
      <div className="flex gap-6 tabular-nums">
        <span className="text-[1.05rem] font-semibold" style={{ color: '#205072' }}>
          {formatTime12Hr(entry.azan)}
        </span>
        <span className="text-[1.05rem] font-semibold" style={{ color: '#329D9C' }}>
          {iqamaValue ? formatTime12Hr(iqamaValue) : ''}
        </span>
      </div>
    </div>
  );
}
