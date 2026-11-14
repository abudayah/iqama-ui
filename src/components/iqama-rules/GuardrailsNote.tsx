import { useTranslation } from 'react-i18next';
import type { IqamaCatalog } from '../../types/iqama-rules';

/** Read-only list of the fixed guardrails; every number and prayer list comes from GET /catalog. */
export function GuardrailsNote({ catalog }: { catalog: IqamaCatalog }) {
  const { t } = useTranslation();
  const { minGapAfterAzanMinutes, fajrEndsBeforeSunriseMinutes, iqamaStepMinutes } =
    catalog.guardrails;
  const gapWins = catalog.guardrails.fajrSunriseConflictPolicy === 'gap-wins-with-acknowledgement';
  const friday = catalog.prayers.filter((p) => p.fridayStartRequired);
  const anyDay = catalog.prayers.filter((p) => !p.fridayStartRequired);
  const names = (list: typeof friday) => list.map((p) => t(`prayers.${p.name}`)).join(', ');
  // Example for the step rule: 9:04 moves to the next mark.
  const exampleMinute = iqamaStepMinutes ? Math.ceil(4 / iqamaStepMinutes) * iqamaStepMinutes : 0;

  return (
    <section
      data-testid="guardrails-note"
      aria-labelledby="guardrails-title"
      className="bg-white rounded-xl border border-gray-200 px-4 py-3"
    >
      <h3
        id="guardrails-title"
        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
      >
        {t('rules.guardrails.title')}
      </h3>
      <ol className="mt-2 space-y-2 text-sm text-gray-700 list-decimal list-outside pl-5">
        <li>{t('rules.guardrails.minGap', { min: minGapAfterAzanMinutes })}</li>
        <li>
          {t('rules.guardrails.fajrLimit', { min: fajrEndsBeforeSunriseMinutes })}
          {gapWins && ` ${t('rules.guardrails.fajrConflict', { min: minGapAfterAzanMinutes })}`}
        </li>
        {iqamaStepMinutes && (
          <li>
            {t('rules.guardrails.step', {
              min: iqamaStepMinutes,
              example: String(exampleMinute).padStart(2, '0'),
            })}
          </li>
        )}
        {friday.length > 0 && (
          <li>{t('rules.guardrails.fridayStart', { prayers: names(friday) })}</li>
        )}
        {anyDay.length > 0 && <li>{t('rules.guardrails.anyDay', { prayers: names(anyDay) })}</li>}
      </ol>
      <p className="mt-3 text-xs text-gray-500">{t('rules.guardrails.footnote')}</p>
    </section>
  );
}
