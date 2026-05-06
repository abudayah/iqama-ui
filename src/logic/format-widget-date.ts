const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Formats a YYYY-MM-DD date string and a day-of-week string into a
 * human-readable date label for the widget section header.
 *
 * @param dateStr   - ISO date string, e.g. "2025-06-20"
 * @param dayOfWeek - Day name supplied by the caller, e.g. "Friday"
 * @returns Formatted string, e.g. "Friday, Jun 20"
 *
 * The day-of-week is passed in directly (not derived from the date) so that
 * the widget always matches the server-supplied `DailySchedule.day_of_week`.
 *
 * Parsing is done by splitting the YYYY-MM-DD string directly (rather than
 * using `new Date()`) to avoid timezone-offset issues where the UTC date
 * could roll back to the previous day in negative-offset locales.
 */
export function formatWidgetDate(dateStr: string, dayOfWeek: string): string {
  const parts = dateStr.split('-');
  const month = parseInt(parts[1] ?? '1', 10); // 1-based
  const day = parseInt(parts[2] ?? '1', 10); // no leading zero

  const monthAbbr = MONTH_ABBREVIATIONS[month - 1] ?? 'Jan';
  return `${dayOfWeek}, ${monthAbbr} ${day}`;
}
