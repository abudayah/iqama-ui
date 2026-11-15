import { afterAll, describe, expect, it } from 'vitest';
import i18n from './index';
import { translateRuleCatalog } from './rule-catalog';

describe('Iqama rule catalog translations', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('translates modifier labels, weekdays, notes and options to Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(translateRuleCatalog('Limits', i18n.language)).toBe('الحدود');
    expect(
      translateRuleCatalog('Iqama at least this many minutes before sunrise', i18n.language),
    ).toBe('يجب أن تكون الإقامة قبل الشروق بهذه الدقائق على الأقل');
    expect(translateRuleCatalog('Direction', i18n.language)).toBe('اتجاه التقريب');
    expect(translateRuleCatalog('Weekday adjustment', i18n.language)).toBe('تعديل حسب يوم الأسبوع');
    expect(translateRuleCatalog('SUN', i18n.language)).toBe('الأحد');
    expect(translateRuleCatalog('FRI', i18n.language)).toBe('الجمعة');
    expect(translateRuleCatalog('Hold for the Friday to Thursday week', i18n.language)).toContain(
      'الجمعة إلى الخميس',
    );
    expect(
      translateRuleCatalog(
        'Minutes added on that weekday, e.g. FRI -5. Leave a weekday empty for no change.',
        i18n.language,
      ),
    ).toContain('اترك اليوم فارغاً');
    expect(translateRuleCatalog('5 minutes', i18n.language)).toBe('5 دقائق');
  });

  it('keeps the English engine catalog wording in English', async () => {
    await i18n.changeLanguage('en');
    expect(translateRuleCatalog('Limits', i18n.language)).toBe('Limits');
    expect(translateRuleCatalog('FRI', i18n.language)).toBe('FRI');
  });
});
