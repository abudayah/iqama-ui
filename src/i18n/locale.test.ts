import { afterAll, describe, expect, it } from 'vitest';
import i18n, { detectLang } from './index';
import { formatHijriDate } from './format-hijri-date';
import { formatTime12 } from './format-time';
import { getIntlLocale } from './locale';

describe('locale-aware date and time formatting', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('honors an embed lang query parameter over saved/browser preferences', () => {
    expect(detectLang('?lang=ar', 'en', 'en-US')).toBe('ar');
    expect(detectLang('?lang=en', 'ar', 'ar-EG')).toBe('en');
    expect(detectLang('', 'ar', 'en-US')).toBe('ar');
  });

  it('uses Arabic locale formatting while retaining Latin digits', () => {
    expect(getIntlLocale('ar')).toBe('ar-u-nu-latn');
    expect(getIntlLocale('ar-EG')).toBe('ar-u-nu-latn');
    expect(getIntlLocale('en')).toBe('en-US');
  });

  it('formats prayer times with the active locale', async () => {
    await i18n.changeLanguage('en');
    expect(formatTime12('05:45')).toBe('05:45 AM');

    await i18n.changeLanguage('ar');
    expect(formatTime12('05:45')).toContain('05:45');
    expect(formatTime12('05:45')).toMatch(/[صم]/);
  });

  it('localizes the Hijri month name from the engine-provided date', () => {
    expect(formatHijriDate('Rajab 15, 1446', 'en')).toBe('Rajab 15, 1446');
    expect(formatHijriDate('Rajab 15, 1446', 'ar')).toBe('15 رجب 1446');
  });
});
