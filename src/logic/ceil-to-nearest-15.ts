/**
 * Rounds a time string up to the nearest 15-minute boundary.
 *
 * - Input and output format: "HH:mm" (zero-padded)
 * - If the time is already on a 15-minute boundary, it is returned unchanged.
 * - If the ceiled result reaches or exceeds 24:00 (1440 minutes), it wraps to "00:00".
 *
 * Examples:
 *   06:23 → 06:30
 *   06:30 → 06:30  (already on boundary)
 *   06:31 → 06:45
 *   06:45 → 06:45  (already on boundary)
 *   06:46 → 07:00
 *   23:46 → 00:00  (midnight overflow)
 */
export function ceilToNearest15(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr!, 10);
  const minutes = parseInt(minutesStr!, 10);

  const totalMinutes = hours * 60 + minutes;
  const ceiledMinutes = Math.ceil(totalMinutes / 15) * 15;

  if (ceiledMinutes >= 1440) {
    return '00:00';
  }

  const resultHours = Math.floor(ceiledMinutes / 60);
  const resultMinutes = ceiledMinutes % 60;

  return `${String(resultHours).padStart(2, '0')}:${String(resultMinutes).padStart(2, '0')}`;
}
