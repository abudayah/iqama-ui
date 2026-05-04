import type { PrayerName, CountdownState, DailySchedule } from '../types/index';

interface NextPrayerBannerProps {
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

/** Returns the previous prayer name relative to the next one, used for the progress bar left label. */
function getPrevPrayer(next: PrayerName): PrayerName {
  const order: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const idx = order.indexOf(next);
  return order[idx > 0 ? idx - 1 : 0]!;
}

/** Returns the next prayer after the given one, used for the progress bar right label. */
function getNextAfter(next: PrayerName): PrayerName {
  const order: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const idx = order.indexOf(next);
  return order[idx < order.length - 1 ? idx + 1 : order.length - 1]!;
}

function parseLocalTime(date: string, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(y!, mo! - 1, d!, h!, m!, 0, 0);
}

function calcProgress(schedule: DailySchedule, nextPrayer: PrayerName, now: Date): number {
  const prev = getPrevPrayer(nextPrayer);
  const prevAzan = parseLocalTime(schedule.date, schedule[prev].azan);
  const nextAzan = parseLocalTime(schedule.date, schedule[nextPrayer].azan);
  const total = nextAzan.getTime() - prevAzan.getTime();
  if (total <= 0) return 0;
  const elapsed = now.getTime() - prevAzan.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function NextPrayerBanner({ nextPrayer, countdown, schedule }: NextPrayerBannerProps) {
  if (!nextPrayer || !schedule) return null;

  const now = new Date();
  const progress = calcProgress(schedule, nextPrayer, now);
  const prev = getPrevPrayer(nextPrayer);
  const nextAfter = getNextAfter(nextPrayer);
  const iqamaTime = schedule[nextPrayer].iqama;

  const countdownLabel =
    countdown.phase === 'to_azan'
      ? 'Time until azan'
      : countdown.phase === 'to_iqama'
        ? 'Time until iqama'
        : 'Iqama in progress';

  return (
    <div
      className="relative overflow-hidden rounded-xl text-white"
      style={{ background: 'linear-gradient(135deg, #185FA5 0%, #0C447C 100%)' }}
      data-testid="next-prayer-banner"
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: -16,
          top: -16,
          width: 96,
          height: 96,
          background: 'rgba(255,255,255,0.07)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: 20,
          top: 20,
          width: 56,
          height: 56,
          background: 'rgba(255,255,255,0.07)',
        }}
      />

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs" style={{ opacity: 0.75 }}>Next prayer</p>
            <p className="text-2xl font-medium mt-0.5">{PRAYER_LABELS[nextPrayer] ?? nextPrayer}</p>
            <p className="text-sm mt-0.5" style={{ opacity: 0.7 }}>Iqama at {iqamaTime}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ opacity: 0.75 }}>{countdownLabel}</p>
            <p
              className="text-3xl font-medium mt-1 tabular-nums"
              style={{ letterSpacing: '0.05em' }}
            >
              {countdown.display.slice(0, 5)}
              <span className="text-base font-normal opacity-70 ml-0.5">
                :{countdown.display.slice(6)}
              </span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div
            className="h-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <div
              className="h-0.5 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: 'rgba(255,255,255,0.85)' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs" style={{ opacity: 0.6 }}>
              {PRAYER_LABELS[prev]} {schedule[prev].azan}
            </p>
            <p className="text-xs" style={{ opacity: 0.6 }}>
              {PRAYER_LABELS[nextAfter]} {schedule[nextAfter].azan}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
