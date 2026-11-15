import { afterAll, describe, expect, it } from 'vitest';
import i18n from './index';
import { translateCatalogIdentity, translateRuleCatalog } from './rule-catalog';
import { ENGINE_CATALOG } from '../test/engine-catalog.fixture';
import type { CatalogField } from '../types/iqama-rules';

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

  it('translates every engine field and option from stable identities', async () => {
    await i18n.changeLanguage('ar');
    const visit = (fields: CatalogField[]) => {
      for (const field of fields) {
        expect(translateCatalogIdentity(field.name, field.label, 'ar')).not.toBe(field.label);
        for (const option of field.options ?? []) {
          expect(
            translateCatalogIdentity(`${field.name}.${option.value}`, option.label, 'ar'),
          ).not.toBe(option.label);
        }
        for (const variant of field.variants ?? []) {
          expect(
            translateCatalogIdentity(`${field.name}.${variant.value}`, variant.label, 'ar'),
          ).not.toBe(variant.label);
          visit(variant.fields);
        }
        visit(field.fields ?? []);
        visit(field.item ?? []);
      }
    };
    for (const base of ENGINE_CATALOG.baseTypes) visit(base.fields as CatalogField[]);
    for (const modifier of ENGINE_CATALOG.modifiers) {
      expect(translateCatalogIdentity(modifier.name, modifier.label, 'ar')).not.toBe(
        modifier.label,
      );
      visit((modifier.fields ?? []) as CatalogField[]);
    }
  });

  it('keeps the English engine catalog wording in English', async () => {
    await i18n.changeLanguage('en');
    expect(translateRuleCatalog('Limits', i18n.language)).toBe('Limits');
    expect(translateRuleCatalog('FRI', i18n.language)).toBe('FRI');
  });
});
