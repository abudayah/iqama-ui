import type { IqamaCatalog } from '../../types/iqama-rules';
import { prayerLabel } from '../../logic/iqama-rules';

/** Read-only list of the fixed guardrails; every number and prayer list comes from GET /catalog. */
export function GuardrailsNote({ catalog }: { catalog: IqamaCatalog }) {
  const { minGapAfterAzanMinutes, fajrEndsBeforeSunriseMinutes, iqamaStepMinutes } =
    catalog.guardrails;
  const gapWins = catalog.guardrails.fajrSunriseConflictPolicy === 'gap-wins-with-acknowledgement';
  const friday = catalog.prayers.filter((p) => p.fridayStartRequired);
  const anyDay = catalog.prayers.filter((p) => !p.fridayStartRequired);
  const names = (list: typeof friday) => list.map((p) => prayerLabel(p.name)).join(', ');
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
        Always applied
      </h3>
      <ol className="mt-2 space-y-2 text-sm text-gray-700 list-decimal list-outside pl-5">
        <li>
          Iqama is never earlier than {minGapAfterAzanMinutes} min after Azan (all prayers,
          overrides too).
        </li>
        <li>
          Fajr iqama is normally at least {fajrEndsBeforeSunriseMinutes} min before sunrise.
          {gapWins &&
            ` If that clashes with the ${minGapAfterAzanMinutes}-min minimum, the minimum wins, the day is flagged as a conflict, and you must acknowledge it before saving.`}
        </li>
        {iqamaStepMinutes && (
          <li>
            Every iqama lands on a {iqamaStepMinutes}-minute mark (e.g. 9:04 becomes 9:
            {String(exampleMinute).padStart(2, '0')}).
          </li>
        )}
        {friday.length > 0 && <li>Rule changes for {names(friday)} must start on a Friday.</li>}
        {anyDay.length > 0 && <li>{names(anyDay)} can start any day.</li>}
      </ol>
      <p className="mt-3 text-xs text-gray-500">
        These cannot be changed here. Times they move are marked &ldquo;adjusted&rdquo;.
      </p>
    </section>
  );
}
