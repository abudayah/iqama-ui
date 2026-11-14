/**
 * Arabic grammar checks for the strings that count things.
 *
 * Arabic agrees the counted noun with the numeral: 1 → يوم واحد, 2 → يومان,
 * 3–10 → أيام, 11–99 → يوماً. The templates rely on i18next plural keys
 * (`_one`, `_two`, `_few`, `_many`, `_other`), so these tests pin the result.
 */
import { describe, it, expect, afterAll } from 'vitest';
import i18n from './index';

describe('i18n — Arabic plurals', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('uses دقائق for 3–10 minutes and دقيقة for larger counts', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('rules.guardrails.minGap', { min: 3, count: 3 })).toContain('3 دقائق');
    expect(i18n.t('rules.guardrails.minGap', { min: 60, count: 60 })).toContain('60 دقيقة');
    expect(i18n.t('rules.guardrails.step', { min: 5, count: 5, example: '05' })).toContain(
      '5 دقائق',
    );
  });

  it('counts days with the right Arabic form', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('rules.review.changesOn', { count: 1 })).toBe('يتغير في يوم واحد');
    expect(i18n.t('rules.review.changesOn', { count: 2 })).toBe('يتغير في يومين');
    expect(i18n.t('rules.review.changesOn', { count: 3 })).toBe('يتغير في 3 أيام');
    expect(i18n.t('rules.review.changesOn', { count: 60 })).toBe('يتغير في 60 يوماً');
  });

  it('keeps English unchanged', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('rules.review.changesOn', { count: 3 })).toBe('Changes on 3 days');
    expect(i18n.t('rules.guardrails.minGap', { min: 3, count: 3 })).toContain('3 min');
  });
});
