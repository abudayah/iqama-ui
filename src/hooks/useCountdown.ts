import { useState, useEffect } from 'react';
import { deriveCountdown } from '../logic/derive-countdown';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { DailySchedule, CountdownState } from '../types/index';
import type { NextPrayerResult } from './useNextPrayer';

const DONE_STATE: CountdownState = { phase: 'done', display: 'All prayers complete' };

export function useCountdown(nextPrayerResult: NextPrayerResult | null): {
  countdown: CountdownState;
  tick: number;
} {
  const [countdown, setCountdown] = useState<CountdownState>(DONE_STATE);
  const [tick, setTick] = useState(0);

  // Stable references for the effect
  const schedule: DailySchedule | null = nextPrayerResult?.schedule ?? null;
  const nextPrayer: PrayerEvent | null = nextPrayerResult?.prayer ?? null;

  useEffect(() => {
    if (!schedule || !nextPrayer) {
      setCountdown(DONE_STATE);
      return;
    }

    // Compute immediately
    setCountdown(deriveCountdown(schedule, nextPrayer, new Date()));

    const id = setInterval(() => {
      setCountdown(deriveCountdown(schedule, nextPrayer, new Date()));
      setTick((t) => t + 1);
    }, 1_000);

    return () => clearInterval(id);
  }, [schedule, nextPrayer]);

  return { countdown, tick };
}
