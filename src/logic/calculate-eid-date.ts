/**
 * @deprecated
 * This function duplicates business logic that is owned authoritatively by the
 * iqama-engine backend (`computeFallbackDate` in
 * `src/hijri-calendar/calendar-override.service.ts`).
 *
 * Do NOT use this function for display or calculations — the backend already
 * returns the resolved Eid date (with moon-sighting overrides applied) via the
 * `GET /api/v1/hijri-calendar/eid-prayers` endpoint.  Use that instead.
 *
 * This file is kept only for historical reference and will be removed once
 * any remaining callers have been migrated.
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
