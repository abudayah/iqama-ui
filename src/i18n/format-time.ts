import i18n from './index';
import { getIntlLocale } from './locale';

/** Arabic day-period marks: AM → ص (ṣabāḥ), PM → م (masāʾ). */
const AR_DAY_PERIOD: Record<string, string> = { AM: 'ص', PM: 'م' };
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

/**
 * Format a 24-hour "HH:mm" time as a 12-hour clock in the active language:
 * English → "06:48 AM", Arabic → a localized 12-hour day period with Latin digits.
 *
 * Digits always stay Western/Latin and left-to-right. Render the result inside
 * `<bdi dir="ltr">` so surrounding RTL text cannot re-order it.
 */
export function formatTime12(time24: string | undefined): string {
  if (!time24 || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time24)) return time24 ?? '';
  const [hours, minutes] = time24.split(':');
  const date = new Date(2000, 0, 1, Number(hours), Number(minutes));
  const locale = getIntlLocale();
  let formatter = FORMATTERS.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    FORMATTERS.set(locale, formatter);
  }
  const parts = formatter.formatToParts(date);
  const clock = parts
    .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'literal')
    .map((p) => p.value)
    .join('')
    .trim();
  const raw = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  const period = i18n.language === 'ar' ? (AR_DAY_PERIOD[raw.toUpperCase()] ?? raw) : raw;
  return period ? `${clock} ${period}` : clock;
}
