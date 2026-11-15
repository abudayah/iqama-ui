import { Trans, useTranslation } from 'react-i18next';

const HIJRI_MONTH_KEYS = [
  'hijriMonths.muharram',
  'hijriMonths.safar',
  'hijriMonths.rabiAlAwwal',
  'hijriMonths.rabiAlThani',
  'hijriMonths.jumadaAlAwwal',
  'hijriMonths.jumadaAlThani',
  'hijriMonths.rajab',
  'hijriMonths.shaban',
  'hijriMonths.ramadan',
  'hijriMonths.shawwal',
  'hijriMonths.dhulQidah',
  'hijriMonths.dhulHijjah',
] as const;

interface SightingCardProps {
  hijriMonth: number; // 1–12, current month
  onDecision: (length: 29 | 30) => void;
}

export function SightingCard({ hijriMonth, onDecision }: SightingCardProps) {
  const { t } = useTranslation();
  const currentMonthKey = HIJRI_MONTH_KEYS[hijriMonth - 1];
  const nextMonthKey = HIJRI_MONTH_KEYS[hijriMonth % 12];
  if (!currentMonthKey || !nextMonthKey) {
    throw new RangeError(`Invalid Hijri month: ${hijriMonth}`);
  }
  const currentMonthName = t(currentMonthKey);
  const nextMonthName = t(nextMonthKey);

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
      data-testid="sighting-card"
    >
      {/* Decorative accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="p-5">
        {/* Moon icon + heading */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" aria-hidden="true">
            🌙
          </span>
          <h2 className="text-base font-semibold text-gray-800">{t('sightingCard.title')}</h2>
        </div>

        {/* Prompt */}
        <p className="text-sm text-gray-700 mb-5">
          <Trans
            i18nKey="sightingCard.prompt"
            values={{ currentMonth: currentMonthName, nextMonth: nextMonthName }}
            components={{ month: <strong /> }}
          />
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onDecision(29)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors min-h-[44px]"
          >
            {t('sightingCard.monthEndsToday')}
          </button>
          <button
            onClick={() => onDecision(30)}
            className="flex-1 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg py-3 px-4 text-sm font-medium transition-colors min-h-[44px]"
          >
            {t('sightingCard.complete30Days')}
          </button>
        </div>
      </div>
    </div>
  );
}
