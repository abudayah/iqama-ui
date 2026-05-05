import type { DailySchedule, CountdownState } from '../types/index';
import type { PrayerEvent } from './derive-next-prayer';

function parseTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year!, month! - 1, day!, hours!, minutes!, 0, 0);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Resolve the azan time string for any PrayerEvent.
 * Sunrise and Eid prayers have no iqama — returns null for iqama.
 */
function resolveEventTimes(
  schedule: DailySchedule,
  event: PrayerEvent,
): { azan: string; iqama: string | null } {
  switch (event) {
    case 'sunrise':      return { azan: schedule.sunrise, iqama: null };
    case 'eid-prayer-1': return { azan: schedule.eid_prayer_1 ?? '07:00', iqama: null };
    case 'eid-prayer-2': return { azan: schedule.eid_prayer_2 ?? '08:30', iqama: null };
    default:             return { azan: schedule[event].azan, iqama: schedule[event].iqama };
  }
}

export function deriveCountdown(
  schedule: DailySchedule,
  nextPrayer: PrayerEvent,
  now: Date
): CountdownState {
  const { azan, iqama } = resolveEventTimes(schedule, nextPrayer);
  const azanTime = parseTime(schedule.date, azan);

  if (now < azanTime) {
    return {
      phase: 'to_azan',
      display: formatDuration(azanTime.getTime() - now.getTime()),
    };
  }

  // Events without iqama (sunrise, Eid prayers) go straight to done after azan
  if (!iqama) {
    return { phase: 'done', display: 'All prayers complete' };
  }

  const iqamaTime = parseTime(schedule.date, iqama);

  if (now < iqamaTime) {
    return {
      phase: 'to_iqama',
      display: formatDuration(iqamaTime.getTime() - now.getTime()),
    };
  }

  return {
    phase: 'done',
    display: 'All prayers complete',
  };
}
