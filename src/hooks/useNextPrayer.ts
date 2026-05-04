import { useMemo } from 'react';
import { deriveNextPrayerWithFallback } from '../logic/derive-next-prayer';
import type { DailySchedule, PrayerName } from '../types/index';

export interface NextPrayerResult {
  prayer: PrayerName;
  /** The schedule the prayer belongs to — may be tomorrow's when today is exhausted. */
  schedule: DailySchedule;
}

export function useNextPrayer(
  todaySchedule: DailySchedule | null,
  tomorrowSchedule: DailySchedule | null,
  tick: number = 0,
): NextPrayerResult | null {
  return useMemo(() => {
    if (!todaySchedule) return null;
    return deriveNextPrayerWithFallback(todaySchedule, tomorrowSchedule, new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySchedule, tomorrowSchedule, tick]);
}
