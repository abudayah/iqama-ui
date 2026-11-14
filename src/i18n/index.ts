import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ar from './ar';

/** localStorage key that remembers the visitor's language choice. */
export const LANG_KEY = 'iqama_ui_lang';

export type Lang = 'en' | 'ar';

/**
 * Language detection order: saved choice → browser language → English.
 * Arabic (any regional variant, e.g. ar-EG) starts the UI in Arabic.
 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    // localStorage can throw in private/sandboxed contexts — fall through.
  }
  const browser =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language.toLowerCase()
      : '';
  return browser.startsWith('ar') ? 'ar' : 'en';
}

const initialLang = detectLang();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  supportedLngs: ['en', 'ar'],
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
});

/**
 * Keep the document in sync with the active language:
 * Arabic → `<html dir="rtl" lang="ar">`, English → `<html dir="ltr" lang="en">`.
 */
export function syncHtmlAttrs(): void {
  if (typeof document === 'undefined') return;
  const lang: Lang = i18n.language === 'ar' ? 'ar' : 'en';
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

i18n.on('languageChanged', syncHtmlAttrs);
syncHtmlAttrs();

/** Switch between English and Arabic, persist the choice, and update `<html>`. */
export function toggleLang(): Lang {
  const next: Lang = i18n.language === 'ar' ? 'en' : 'ar';
  void i18n.changeLanguage(next);
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // Ignore storage failures; the in-memory language still switches.
  }
  syncHtmlAttrs();
  return next;
}

export default i18n;
