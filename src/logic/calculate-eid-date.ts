/**
 * Calculates the Gregorian date of Eid based on the current date and the
 * moon-sighting decision.
 *
 * - When `isSighted` is true, the new month starts the next day (currentDate + 1).
 * - When `isSighted` is false, the current month completes 30 days (currentDate + 2).
 * - For EID_AL_FITR (1st of Shawwal), the Eid date is the month start itself (+ 0 days).
 * - For EID_AL_ADHA (10th of Dhul-Hijjah), the Eid date is month start + 9 days.
 *
 * The input `currentDate` is never mutated.
 */
export function calculateEidDate(
  currentDate: Date,
  isSighted: boolean,
  eidType: 'FITR' | 'ADHA',
): Date {
  const monthStartOffset = isSighted ? 1 : 2;
  const eidOffset = eidType === 'ADHA' ? 9 : 0;
  const totalDays = monthStartOffset + eidOffset;

  const result = new Date(currentDate);
  result.setDate(result.getDate() + totalDays);
  return result;
}
