import type { PrayerName, PrayerEntry } from '../types/index';

interface PrayerRowProps {
  name: PrayerName | 'sunrise';
  entry: PrayerEntry | { azan: string; iqama?: never };
  isNext: boolean;
  isPast: boolean;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  sunrise: 'Sunrise',
};

/** Dot color per prayer — matches the design */
const DOT_COLORS: Record<string, string> = {
  fajr: '#cbd5e1',
  sunrise: '#fde047',
  dhuhr: '#93c5fd',
  asr: '#fdba74',
  maghrib: '#2563eb',
  isha: '#4b5563',
};

export function PrayerRow({ name, entry, isNext, isPast }: PrayerRowProps) {
  const isSunrise = name === 'sunrise';
  const dotColor = DOT_COLORS[name] ?? '#6b7280';
  const iqamaValue = 'iqama' in entry && entry.iqama ? entry.iqama : null;

  return (
    <div
      className={`flex items-center justify-between px-3 py-[18px] ${
        isNext ? 'bg-blue-50 rounded-2xl' : ''
      } ${isPast ? 'opacity-40' : ''}`}
      data-testid={`prayer-row-${name}`}
      aria-current={isNext ? 'true' : undefined}
    >
      {/* Left: dot + name + status pill */}
      <div className="flex items-center gap-4">
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 12, height: 12, background: dotColor }}
        />
        <span
          className={`text-[1.05rem] ${
            isNext
              ? 'font-bold text-blue-700'
              : isSunrise
                ? 'text-gray-500 italic'
                : 'font-medium text-gray-600'
          }`}
        >
          {PRAYER_LABELS[name] ?? name}
        </span>

      </div>

      {/* Right: azan + iqama times */}
      <div className="flex gap-6 tabular-nums">
        <span
          className={`text-[1.05rem] ${
            isNext ? 'font-bold text-blue-700' : 'text-gray-400'
          }`}
        >
          {entry.azan}
        </span>
        <span
          className={`text-[1.05rem] ${
            isNext ? 'font-bold text-blue-700' : 'text-gray-400'
          }`}
        >
          {iqamaValue ?? '--:--'}
        </span>
      </div>
    </div>
  );
}
