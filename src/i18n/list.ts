import i18n from './index';

/**
 * Join a list of names with the separator of the active language.
 *
 * English uses a Latin comma; Arabic uses `،` (U+060C). Dates and numbers are
 * deliberately left alone, so this is only for lists of translated labels.
 */
export function joinList(items: string[]): string {
  return items.join(i18n.language === 'ar' ? '، ' : ', ');
}
