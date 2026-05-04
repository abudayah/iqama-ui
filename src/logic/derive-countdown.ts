import type { DailySchedule, PrayerName, CountdownState } from '../types/index';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function parseTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  // Parse YYYY-MM-DD as local time (not UTC) by splitting manually
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

export function deriveCountdown(
  schedule: DailySchedule,
  nextPrayer: PrayerName,
  now: Date
): CountdownState {
  const entry = schedule[nextPrayer];
  const azanTime = parseTime(schedule.date, entry.azan);
  const iqamaTime = parseTime(schedule.date, entry.iqama);

  if (now < azanTime) {
    // Phase: to_azan
    return {
      phase: 'to_azan',
      display: formatDuration(azanTime.getTime() - now.getTime()),
    };
  }

  if (now < iqamaTime) {
    // Phase: to_iqama
    return {
      phase: 'to_iqama',
      display: formatDuration(iqamaTime.getTime() - now.getTime()),
    };
  }

  // now >= iqamaTime — check if there's a later prayer
  const currentIndex = PRAYER_ORDER.indexOf(nextPrayer);
  for (let i = currentIndex + 1; i < PRAYER_ORDER.length; i++) {
    const laterPrayer = PRAYER_ORDER[i]!;
    const laterAzan = parseTime(schedule.date, schedule[laterPrayer].azan);
    if (laterAzan > now) {
      // There's a later prayer — but we're in "done" for this prayer
      // The caller should re-derive nextPrayer; for now return done
      break;
    }
  }

  return {
    phase: 'done',
    display: 'All prayers complete',
  };
}
