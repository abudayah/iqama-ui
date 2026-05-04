import { useState, useEffect } from 'react';
import { deriveCountdown } from '../logic/derive-countdown';
import type { DailySchedule, PrayerName, CountdownState } from '../types/index';

const DONE_STATE: CountdownState = { phase: 'done', display: 'All prayers complete' };

export function useCountdown(
  schedule: DailySchedule | null,
  nextPrayer: PrayerName | null
): { countdown: CountdownState; tick: number } {
  const [countdown, setCountdown] = useState<CountdownState>(DONE_STATE);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!schedule || !nextPrayer) {
      setCountdown(DONE_STATE);
      return;
    }

    // Compute immediately
    setCountdown(deriveCountdown(schedule, nextPrayer, new Date()));

    const id = setInterval(() => {
      setCountdown(deriveCountdown(schedule, nextPrayer, new Date()));
      setTick(t => t + 1);
    }, 10_000);

    return () => clearInterval(id);
  }, [schedule, nextPrayer]);

  return { countdown, tick };
}
