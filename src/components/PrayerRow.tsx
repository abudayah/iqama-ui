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

/** Dot color per prayer */
const DOT_COLORS: Record<string, string> = {
  fajr: '#B5D4F4',
  sunrise: '#FAC775',
  dhuhr: '#185FA5',
  asr: '#6B7280',
  maghrib: '#6B7280',
  isha: '#6B7280',
};

export function PrayerRow({ name, entry, isNext, isPast }: PrayerRowProps) {
  const isSunrise = name === 'sunrise';
  const dotColor = isNext ? '#185FA5' : (DOT_COLORS[name] ?? '#6B7280');
  const dotSize = isNext ? 8 : 6;

  return (
    <div
      className={`grid items-center min-h-[44px] ${
        isNext
          ? 'bg-blue-50 border-l-[3px] border-blue-600'
          : 'border-l-[3px] border-transparent'
      } ${isPast ? 'opacity-45' : ''}`}
      style={{ gridTemplateColumns: '1fr 72px 72px 28px' }}
      data-testid={`prayer-row-${name}`}
      aria-current={isNext ? 'true' : undefined}
    >
      {/* Prayer name + status */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: dotSize, height: dotSize, background: dotColor }}
        />
        <span
          className={`${
            isNext
              ? 'text-base font-medium text-gray-900'
              : isSunrise
                ? 'text-sm italic text-gray-500'
                : isPast
                  ? 'text-sm text-gray-800'
                  : 'text-sm text-gray-800'
          }`}
        >
          {PRAYER_LABELS[name] ?? name}
        </span>
        {isPast && !isSunrise && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            done
          </span>
        )}
        {isNext && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: '#185FA5' }}>
            now
          </span>
        )}
      </div>

      {/* Azan */}
      <span
        className={`text-center tabular-nums ${
          isNext ? 'text-sm font-medium text-blue-600' : 'text-sm text-gray-500'
        }`}
      >
        {entry.azan}
      </span>

      {/* Iqama */}
      <span
        className={`text-center tabular-nums ${
          isNext ? 'text-sm font-medium text-blue-600' : 'text-sm text-gray-500'
        }`}
      >
        {'iqama' in entry && entry.iqama ? entry.iqama : '—'}
      </span>

      {/* Clock icon for active prayer */}
      <div className="flex justify-center pr-2">
        {isNext && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="#185FA5" strokeWidth="1.5" />
            <path d="M8 4.5v4l2.5 2.5" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
