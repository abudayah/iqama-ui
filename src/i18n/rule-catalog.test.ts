import { afterAll, describe, expect, it } from 'vitest';
import i18n from './index';
import { translateCatalogIdentity, translateRuleCatalog } from './rule-catalog';
import { ENGINE_CATALOG } from '../test/engine-catalog.fixture';
import type { CatalogField } from '../types/iqama-rules';

describe('Iqama rule catalog translations', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
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
