import type { DailySchedule, PrayerName } from '../types/index';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Returns the first prayer whose azan time is strictly after `now`.
 * Returns null if all prayers have passed.
 *
 * The azan time is parsed as HH:mm on the same date as schedule.date.
 */
export function deriveNextPrayer(schedule: DailySchedule, now: Date): PrayerName | null {
  for (const prayer of PRAYER_ORDER) {
    const entry = schedule[prayer];
    const parts = entry.azan.split(':');
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    // Parse YYYY-MM-DD as local time (not UTC) by splitting manually
    const [year, month, day] = schedule.date.split('-').map(Number);
    const azanDate = new Date(year!, month! - 1, day!, hours, minutes, 0, 0);
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
