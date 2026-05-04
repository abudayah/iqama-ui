import type { DailySchedule, PrayerName } from '../types/index';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Returns the current or next relevant prayer for `now`:
 * - If now is between a prayer's azan and iqama, that prayer is returned
 *   (we're in the iqama window — it's still "active").
 * - Otherwise returns the first prayer whose azan is strictly after now.
 * - Returns null if all prayers have passed.
 */
export function deriveNextPrayer(schedule: DailySchedule, now: Date): PrayerName | null {
  const [year, month, day] = schedule.date.split('-').map(Number);

  for (const prayer of PRAYER_ORDER) {
    const entry = schedule[prayer];
    const [ah, am] = entry.azan.split(':').map(Number);
    const [ih, im] = entry.iqama.split(':').map(Number);
    const azanDate  = new Date(year!, month! - 1, day!, ah!, am!, 0, 0);
    const iqamaDate = new Date(year!, month! - 1, day!, ih!, im!, 0, 0);

    // Still in the iqama window for this prayer
    if (now >= azanDate && now < iqamaDate) {
      return prayer;
    }

    // Azan hasn't happened yet — this is the next prayer
    if (azanDate > now) {
      return prayer;
    }
  }
  return null;
}

/**
 * Like deriveNextPrayer but falls back to tomorrow's Fajr when today's
 * schedule is exhausted. Returns { schedule, prayer } so the caller knows
 * which schedule the prayer belongs to.
 */
export function deriveNextPrayerWithFallback(
  todaySchedule: DailySchedule,
  tomorrowSchedule: DailySchedule | null,
  now: Date,
): { schedule: DailySchedule; prayer: PrayerName } | null {
  const todayPrayer = deriveNextPrayer(todaySchedule, now);
  if (todayPrayer) return { schedule: todaySchedule, prayer: todayPrayer };
  if (!tomorrowSchedule) return null;
  // All of today's prayers are done — next up is tomorrow's Fajr
  return { schedule: tomorrowSchedule, prayer: 'fajr' };
}
