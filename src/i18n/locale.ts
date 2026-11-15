import i18n from './index';

/** Locale for user-facing dates and times, keeping numeric digits Latin in Arabic. */
export function getIntlLocale(language: string = i18n.language): string {
  return language.startsWith('ar') ? 'ar-u-nu-latn' : 'en-US';
}

/** Localize an engine-provided English weekday name without recomputing its date. */
export function formatWeekdayName(weekday: string, locale: string): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = weekdays.indexOf(weekday);
  if (index < 0) return weekday;

  const sunday = Date.UTC(2024, 0, 7);
  const date = new Date(sunday + index * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}
