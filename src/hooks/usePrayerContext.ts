import { useState, useEffect, useMemo } from 'react';
import { deriveNextPrayerWithFallback } from '../logic/derive-next-prayer';
import { deriveCountdown } from '../logic/derive-countdown';
import type { DailySchedule, PrayerName, CountdownState } from '../types/index';

// dayjs ships an `export =` declaration which conflicts with ESM default imports
// when esModuleInterop is off. We cast through unknown to keep the runtime ESM
// import while satisfying the type checker.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import _dayjs from 'dayjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import _dayjsHijri from 'dayjs-hijri';

interface HijriDayjs { month(): number; date(): number }
interface DayjsFn {
  (date?: Date | string | number): { calendar(type: 'hijri' | 'gregory'): HijriDayjs };
  extend(plugin: unknown): void;
}
const dayjs = _dayjs as unknown as DayjsFn;
dayjs.extend(_dayjsHijri);

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
  /** Hijri month 1–12 extracted from today's schedule */
  hijriMonth: number;
  /** Tick counter — increments every second, use as dep for derived values */
  tick: number;
}

/**
 * Returns the current Hijri { month (1–12), day (1–30) } for a given
 * Gregorian date using dayjs-hijri (Umm al-Qura calculations).
 * Falls back to { month: 1, day: 15 } if conversion fails.
 */
function getHijriDate(date: Date): { month: number; day: number } {
  try {
    const h = dayjs(date).calendar('hijri');
    // dayjs month() is 0-indexed; day() is 1-indexed
    return { month: (h.month() as number) + 1, day: h.date() as number };
  } catch {
    return { month: 1, day: 15 };
  }
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
  /** Optional simulated "now". When provided, the countdown is frozen at that
   *  moment and does not tick forward — useful for the URL-param simulator. */
  simulatedNow?: Date,
): PrayerContextResult {
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState<CountdownState>(DONE_STATE);

  const getNow = () => simulatedNow ?? new Date();

  // Derive next prayer — re-runs on every tick so it advances automatically.
  // We destructure prayer and schedule separately so each has a stable
  // identity in the dependency array: prayer is a primitive string, and
  // schedule is the same object reference as todaySchedule/tomorrowSchedule.
  const nextPrayer = useMemo((): PrayerName | null => {
    if (!todaySchedule) return null;
    return deriveNextPrayerWithFallback(todaySchedule, tomorrowSchedule, getNow())?.prayer ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySchedule, tomorrowSchedule, tick, simulatedNow]);

  const nextSchedule = useMemo((): DailySchedule | null => {
    if (!todaySchedule) return null;
    return deriveNextPrayerWithFallback(todaySchedule, tomorrowSchedule, getNow())?.schedule ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySchedule, tomorrowSchedule, tick, simulatedNow]);

  // Tick + countdown update every second
  useEffect(() => {
    if (!nextSchedule || !nextPrayer) {
      setCountdown(DONE_STATE);
      return;
    }

    // Compute immediately on mount / dependency change
    setCountdown(deriveCountdown(nextSchedule, nextPrayer, getNow()));

    // When simulating a frozen time, still tick so the UI stays responsive,
    // but getNow() always returns the same simulated moment.
    const id = setInterval(() => {
      setCountdown(deriveCountdown(nextSchedule, nextPrayer, getNow()));
      setTick(t => t + 1);
    }, 1_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextSchedule, nextPrayer, simulatedNow]);

  const timeOfDay = prayerToTimeOfDay(nextPrayer);
  const countdownMode: CountdownMode = countdown.phase;

  // Derive Hijri date from the effective "now" (simulated or real).
  // Memoized so it only recomputes when simulatedNow or the tick crosses
  // a day boundary (tick is included so it stays accurate at midnight).
  const { month: hijriMonth, day: hijriDay } = useMemo(
    () => getHijriDate(getNow()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simulatedNow, tick],
  );

  return {
    timeOfDay,
    countdownMode,
    nextPrayer,
    nextSchedule,
    countdown,
    hijriDay,
    hijriMonth,
    tick,
  };
}
