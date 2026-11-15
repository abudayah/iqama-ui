import { afterAll, describe, expect, it } from 'vitest';
import i18n from './index';
import { formatTime12 } from './format-time';

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('formatTime12', () => {
  it('formats valid 24-hour times in the active locale', async () => {
    await i18n.changeLanguage('en');
    expect(formatTime12('05:45')).toBe('05:45 AM');
    await i18n.changeLanguage('ar');
    expect(formatTime12('05:45')).toMatch(/[صم]/);
  });

  it('returns invalid or missing values without throwing', () => {
    expect(formatTime12('')).toBe('');
    expect(formatTime12(undefined)).toBe('');
    expect(formatTime12('not-a-time')).toBe('not-a-time');
  });
});
