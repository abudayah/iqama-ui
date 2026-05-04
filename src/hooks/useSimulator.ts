/**
 * useSimulator
 *
 * Reads optional URL params to simulate a specific date/time:
 *   ?sim_date=YYYY-MM-DD          — override the date (defaults to today)
 *   ?sim_time=HH:mm               — override the time (defaults to current time)
 *
 * Both params are optional and independent. You can simulate just the date,
 * just the time, or both together.
 *
 * Returns:
 *   - simNow:       the effective Date object (real or simulated)
 *   - simDateStr:   YYYY-MM-DD for "today" in the simulation
 *   - simTomorrowStr: YYYY-MM-DD for "tomorrow" in the simulation
 *   - isSimulating: true when any sim param is active
 */
export interface SimulatorState {
  simNow: Date;
  simDateStr: string;
  simTomorrowStr: string;
  isSimulating: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function todayLocalStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useSimulator(): SimulatorState {
  const params = new URLSearchParams(window.location.search);
  const rawDate = params.get('sim_date') ?? '';
  const rawTime = params.get('sim_time') ?? '';

  const hasDate = DATE_RE.test(rawDate);
  const hasTime = TIME_RE.test(rawTime);
  const isSimulating = hasDate || hasTime;

  const simDateStr = hasDate ? rawDate : todayLocalStr();

  // Build the simulated Date: use sim_date as the date base, sim_time as the clock
  const simNow = (() => {
    const [y, mo, d] = simDateStr.split('-').map(Number);
    const real = new Date();
    const hours   = hasTime ? parseInt(rawTime.slice(0, 2), 10) : real.getHours();
    const minutes = hasTime ? parseInt(rawTime.slice(3, 5), 10) : real.getMinutes();
    const seconds = hasTime ? 0 : real.getSeconds();
    return new Date(y!, mo! - 1, d!, hours, minutes, seconds, 0);
  })();

  const simTomorrowStr = addDays(simDateStr, 1);

  return { simNow, simDateStr, simTomorrowStr, isSimulating };
}
