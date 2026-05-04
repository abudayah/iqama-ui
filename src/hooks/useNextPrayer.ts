import { useMemo } from 'react';
import { deriveNextPrayer } from '../logic/derive-next-prayer';
import type { DailySchedule, PrayerName } from '../types/index';

export function useNextPrayer(
  schedule: DailySchedule | null,
  tick: number = 0
): PrayerName | null {
  return useMemo(() => {
    if (!schedule) return null;
    return deriveNextPrayer(schedule, new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, tick]);
}
