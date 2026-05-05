import type { DailySchedule, PrayerName } from '../types/index';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Extended prayer name that includes sunrise and Eid prayers as countable events */
export type PrayerEvent = PrayerName | 'sunrise' | 'eid-prayer-1' | 'eid-prayer-2';

/**
 * Build the ordered list of events for a day, including sunrise and Eid prayers
 * inserted at the correct chronological position.
 */
function buildEventOrder(schedule: DailySchedule): { event: PrayerEvent; time: string }[] {
  const events: { event: PrayerEvent; time: string }[] = [
    { event: 'fajr',    time: schedule.fajr.azan },
    { event: 'sunrise', time: schedule.sunrise },
  ];

  // Insert Eid prayers after sunrise if present
  if (schedule.eid_prayer_1) events.push({ event: 'eid-prayer-1', time: schedule.eid_prayer_1 });
  if (schedule.eid_prayer_2) events.push({ event: 'eid-prayer-2', time: schedule.eid_prayer_2 });

  events.push(
    { event: 'dhuhr',   time: schedule.dhuhr.azan },
    { event: 'asr',     time: schedule.asr.azan },
    { event: 'maghrib', time: schedule.maghrib.azan },
    { event: 'isha',    time: schedule.isha.azan },
  );

  return events;
}

/**
 * Returns the current or next relevant prayer for `now`:
 * - If now is between a prayer's azan and iqama, that prayer is returned
 *   (we're in the iqama window — it's still "active").
 * - Otherwise returns the first event whose time is strictly after now.
 * - Returns null if all events have passed.
 */
export function deriveNextPrayer(schedule: DailySchedule, now: Date): PrayerEvent | null {
  const [year, month, day] = schedule.date.split('-').map(Number);

  // Check iqama windows for the 5 named prayers first
  for (const prayer of PRAYER_ORDER) {
    const entry = schedule[prayer];
    const [ah, am] = entry.azan.split(':').map(Number);
    const [ih, im] = entry.iqama.split(':').map(Number);
    const azanDate  = new Date(year!, month! - 1, day!, ah!, am!, 0, 0);
    const iqamaDate = new Date(year!, month! - 1, day!, ih!, im!, 0, 0);

    if (now >= azanDate && now < iqamaDate) {
      return prayer;
    }
  }

  // Find the next upcoming event (prayer, sunrise, or Eid prayer)
  const allEvents = buildEventOrder(schedule);
  for (const { event, time } of allEvents) {
    const [h, m] = time.split(':').map(Number);
    const eventDate = new Date(year!, month! - 1, day!, h!, m!, 0, 0);
    if (eventDate > now) {
      return event;
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
): { schedule: DailySchedule; prayer: PrayerEvent } | null {
  const todayPrayer = deriveNextPrayer(todaySchedule, now);
  if (todayPrayer) return { schedule: todaySchedule, prayer: todayPrayer };
  if (!tomorrowSchedule) return null;
  return { schedule: tomorrowSchedule, prayer: 'fajr' };
}
