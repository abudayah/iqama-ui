/**
 * Formats a YYYY-MM-DD date string and a day-of-week string into a
 * human-readable date label for the widget section header.
 *
 * @param dateStr   - ISO date string, e.g. "2025-06-20"
 * @param locale - BCP 47 language tag for the displayed date
 * @returns A locale-formatted date label
 *
 * The day-of-week is passed in directly (not derived from the date) so that
 * the widget always matches the server-supplied `DailySchedule.day_of_week`.
 *
 * Parsing is done by splitting the YYYY-MM-DD string directly (rather than
 * using `new Date()`) to avoid timezone-offset issues where the UTC date
 * could roll back to the previous day in negative-offset locales.
 */
export function formatWidgetDate(dateStr: string, locale = 'en-US'): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
