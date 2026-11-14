import { useTranslation } from 'react-i18next';
import { toggleLang } from '../i18n';

/**
 * Compact language switcher: shows the CURRENT language (ع for Arabic, E for
 * English). Tapping switches to the other one. 44×44px minimum tap target;
 * blue while it is the active control.
 */
export function LangToggle() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const letter = isAr ? 'ع' : 'E';
  const action = isAr ? t('lang.switchToEnglish') : t('lang.switchToArabic');

  return (
    <button
      type="button"
      data-testid="lang-toggle"
      onClick={() => toggleLang()}
      aria-label={`${letter} — ${action}`}
      title={action}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border text-sm font-bold transition-colors ${
        isAr
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
          : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
      }`}
    >
      {letter}
    </button>
  );
}
