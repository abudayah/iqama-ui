import { useTranslation } from 'react-i18next';
import { toggleLang } from '../i18n';

/**
 * Compact language switcher: shows the language you would switch TO (E while
 * the UI is Arabic, ع while it is English). Tapping performs the switch.
 *
 * The visible disc is 32px so it sits quietly next to the 11px footer text,
 * but the `::after` overlay pads the tap target back out to 44×44px — do not
 * shrink the disc without keeping that overlay, or the target drops below the
 * minimum touch size.
 */
export function LangToggle() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const letter = isAr ? 'E' : 'ع';
  const action = isAr ? t('lang.switchToEnglish') : t('lang.switchToArabic');

  return (
    <button
      type="button"
      data-testid="lang-toggle"
      onClick={() => toggleLang()}
      aria-label={`${letter} — ${action}`}
      title={action}
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors after:absolute after:-inset-1.5 after:content-[''] ${
        isAr
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
          : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
      }`}
    >
      {letter}
    </button>
  );
}
