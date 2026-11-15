import { describe, expect, it } from 'vitest';
import { formatWidgetDate } from './format-widget-date';

describe('formatWidgetDate', () => {
  it('formats the date in the requested locale independent of timezone', () => {
    expect(formatWidgetDate('2025-06-20', 'en-US')).toBe('Fri, Jun 20');
    expect(formatWidgetDate('2025-06-20', 'ar-u-nu-latn')).toBe(
      new Intl.DateTimeFormat('ar-u-nu-latn', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date('2025-06-20T00:00:00Z')),
    );
  });

  it('rejects invalid locale tags with the native Intl error', () => {
    expect(() => formatWidgetDate('2025-06-20', 'not_a_locale')).toThrow(RangeError);
  });
});
