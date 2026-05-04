import { useState, useEffect, useMemo } from 'react';
import { deriveNextPrayerWithFallback } from '../logic/derive-next-prayer';
import { deriveCountdown } from '../logic/derive-countdown';
import type { DailySchedule, PrayerName, CountdownState } from '../types/index';

export type TimeOfDay = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
export type CountdownMode = 'to_azan' | 'to_iqama' | 'done';

export interface PrayerContextResult {
  /** Current time-of-day phase for sky/atmosphere theming */
  timeOfDay: TimeOfDay;
  /** Which countdown window we're in */
  countdownMode: CountdownMode;
  /** The next (or current) prayer name */
  nextPrayer: PrayerName | null;
  /** The schedule the next prayer belongs to */
  nextSchedule: DailySchedule | null;
  /** Live countdown display string (HH:mm:ss) */
  countdown: CountdownState;
  /** Hijri day 1–30 extracted from today's schedule */
  hijriDay: number;
  /** Tick counter — increments every second, use as dep for derived values */
  tick: number;
}

/**
 * Parses the day number from a hijri_date string like "Dhul Hijjah 25, 1446".
 * Returns 15 (full moon) as a safe default.
 */
function parseHijriDay(hijriDate: string): number {
  const match = hijriDate.match(/(\d{1,2}),/);
  if (!match) return 15;
  const day = parseInt(match[1]!, 10);
  return day >= 1 && day <= 30 ? day : 15;
}

/**
 * Maps the next prayer name to a time-of-day phase.
 *
 * The logic mirrors the reference design:
 *   fajr    → DAWN  (pre-sunrise purple/pink sky)
 *   dhuhr   → DAY   (bright blue sky)
 *   asr     → DAY   (afternoon, still bright)
 *   maghrib → DUSK  (sunset orange/pink)
 *   isha    → NIGHT (deep dark sky)
 *   null    → NIGHT (all prayers done for the day)
 */
function prayerToTimeOfDay(prayer: PrayerName | null): TimeOfDay {
  if (!prayer) return 'NIGHT';
  switch (prayer) {
    case 'fajr':    return 'DAWN';
    case 'dhuhr':   return 'DAY';
    case 'asr':     return 'DAY';
    case 'maghrib': return 'DUSK';
    case 'isha':    return 'NIGHT';
  }
}

const DONE_STATE: CountdownState = { phase: 'done', display: 'All prayers complete' };

export function usePrayerContext(
  todaySchedule: DailySchedule | null,
  tomorrowSchedule: DailySchedule | null,
): PrayerContextResult {
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState<CountdownState>(DONE_STATE);

  // Derive next prayer — re-runs on every tick so it advances automatically
  const nextPrayerResult = useMemo(() => {
    if (!todaySchedule) return null;
    return deriveNextPrayerWithFallback(todaySchedule, tomorrowSchedule, new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySchedule, tomorrowSchedule, tick]);

  const nextPrayer = nextPrayerResult?.prayer ?? null;
  const nextSchedule = nextPrayerResult?.schedule ?? null;

  // Tick + countdown update every second
  useEffect(() => {
    if (!nextSchedule || !nextPrayer) {
      setCountdown(DONE_STATE);
      return;
    }

    // Compute immediately on mount / dependency change
    setCountdown(deriveCountdown(nextSchedule, nextPrayer, new Date()));

    const id = setInterval(() => {
      setCountdown(deriveCountdown(nextSchedule, nextPrayer, new Date()));
      setTick(t => t + 1);
    }, 1_000);

    return () => clearInterval(id);
  }, [nextSchedule, nextPrayer]);

  const timeOfDay = prayerToTimeOfDay(nextPrayer);
  const countdownMode: CountdownMode = countdown.phase;

  const hijriDay = todaySchedule ? parseHijriDay(todaySchedule.hijri_date) : 15;

  return {
    timeOfDay,
    countdownMode,
    nextPrayer,
    nextSchedule,
    countdown,
    hijriDay,
    tick,
  };
}
