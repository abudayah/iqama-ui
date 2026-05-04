import type { PrayerName, PrayerEntry } from '../types/index';

interface PrayerRowProps {
  name: PrayerName | 'sunrise';
  entry: PrayerEntry | { azan: string; iqama?: never };
  isNext: boolean;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  sunrise: 'Sunrise',
};

export function PrayerRow({ name, entry, isNext }: PrayerRowProps) {
  return (
    <div
      className={`flex items-center px-4 py-3 min-h-[44px] ${
        isNext ? 'bg-blue-50 border-l-4 border-blue-600' : ''
      }`}
      data-testid={`prayer-row-${name}`}
      aria-current={isNext ? 'true' : undefined}
    >
      <span className={`flex-1 text-sm font-medium ${isNext ? 'text-blue-700' : 'text-gray-800'}`}>
        {PRAYER_LABELS[name] ?? name}
      </span>
      <span className="text-sm text-gray-600 w-16 text-center">{entry.azan}</span>
      <span className="text-sm text-gray-600 w-16 text-center">
        {'iqama' in entry && entry.iqama ? entry.iqama : '—'}
      </span>
    </div>
  );
}
