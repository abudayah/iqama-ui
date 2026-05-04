import type { PrayerName, CountdownState } from '../types/index';

interface NextPrayerBannerProps {
  nextPrayer: PrayerName | null;
  countdown: CountdownState;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export function NextPrayerBanner({ nextPrayer, countdown }: NextPrayerBannerProps) {
  if (!nextPrayer) return null;
  return (
    <div className="bg-blue-600 text-white px-4 py-4 rounded-lg shadow" data-testid="next-prayer-banner">
      <p className="text-sm opacity-80">
        {countdown.phase === 'to_azan' ? 'Next prayer' : 'Iqama in'}
      </p>
      <p className="text-xl font-bold">{PRAYER_LABELS[nextPrayer] ?? nextPrayer}</p>
      <p className="text-3xl font-mono font-bold mt-1">{countdown.display}</p>
    </div>
  );
}
