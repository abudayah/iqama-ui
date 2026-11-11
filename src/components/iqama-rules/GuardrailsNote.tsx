import type { IqamaCatalog } from '../../types/iqama-rules';
import { PRAYER_LABELS } from '../../logic/iqama-rules';

/** Read-only list of the fixed guardrails, taken from GET /catalog. */
export function GuardrailsNote({ catalog }: { catalog: IqamaCatalog }) {
  const { minGapAfterAzanMinutes, fajrEndsBeforeSunriseMinutes } = catalog.guardrails;
  const friday = catalog.prayers.filter((p) => p.fridayStartRequired);
  const anyDay = catalog.prayers.filter((p) => !p.fridayStartRequired);
  const names = (list: typeof friday) => list.map((p) => PRAYER_LABELS[p.name]).join(', ');

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
        Always applied
      </h3>
      <ol className="mt-2 space-y-2 text-sm text-gray-700 list-decimal list-outside pl-5">
        <li>
          Iqama is at least {minGapAfterAzanMinutes} min after Azan (all prayers, overrides too).
        </li>
        <li>Fajr iqama is at least {fajrEndsBeforeSunriseMinutes} min before sunrise.</li>
        {friday.length > 0 && <li>Rule changes for {names(friday)} must start on a Friday.</li>}
        {anyDay.length > 0 && <li>{names(anyDay)} can start any day.</li>}
      </ol>
      <p className="mt-3 text-xs text-gray-500">
        These cannot be changed here. A time that breaks them is moved later and marked
        &ldquo;adjusted&rdquo;.
      </p>
    </section>
  );
}
