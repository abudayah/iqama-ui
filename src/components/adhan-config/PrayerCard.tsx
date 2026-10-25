/**
 * PrayerCard.tsx
 *
 * Displays a single prayer's Azan time, effective method summary, and
 * any "Customized" / "Period active" badges. Clicking opens the offset drawer.
 */

import type { PrayerKey, AdhanConfigResponse } from '../../types';

interface Props {
  prayer: PrayerKey;
  /** Effective (merged) settings for today */
  effective: NonNullable<AdhanConfigResponse['effective']>;
  /** Active period labels for this prayer */
  activePeriodLabels: string[];
  /** Current draft offset for this prayer (may differ from saved) */
  draftOffset: number | undefined;
  /** Today's Azan time from the schedule API (HH:mm), null while loading */
  azanTime: string | null;
  onClick: () => void;
}

const PRAYER_DISPLAY: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function PrayerCard({
  prayer,
  effective,
  activePeriodLabels,
  draftOffset,
  azanTime,
  onClick,
}: Props) {
  const perPrayer = effective.perPrayer[prayer];
  const savedOffset = perPrayer?.offsetMinutes ?? 0;

  const isCustomized = savedOffset !== 0 || perPrayer?.method !== effective.general.method;
  const hasPeriod = activePeriodLabels.length > 0;
  const hasDraftChange = draftOffset !== undefined && draftOffset !== savedOffset;

  const displayOffset = draftOffset !== undefined ? draftOffset : savedOffset;
  const offsetLabel =
    displayOffset === 0
      ? null
      : displayOffset > 0
        ? `+${displayOffset} min`
        : `${displayOffset} min`;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors min-h-[44px] w-full ${
        hasDraftChange
          ? 'border-blue-400 bg-blue-50'
          : isCustomized || hasPeriod
            ? 'border-amber-400 bg-amber-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
      aria-label={`Edit ${PRAYER_DISPLAY[prayer]} Azan offset`}
    >
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {PRAYER_DISPLAY[prayer]}
      </span>

      {azanTime && <span className="mt-0.5 text-sm font-semibold text-gray-800">{azanTime}</span>}

      {offsetLabel && (
        <span
          className={`mt-0.5 text-xs font-medium ${
            hasDraftChange ? 'text-blue-700' : 'text-amber-700'
          }`}
        >
          {offsetLabel}
        </span>
      )}

      <div className="mt-1.5 flex flex-wrap gap-1">
        {isCustomized && !hasDraftChange && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
            ✦ Customized
          </span>
        )}
        {hasDraftChange && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
            ● Draft
          </span>
        )}
        {hasPeriod &&
          activePeriodLabels.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300"
            >
              ◷ {l}
            </span>
          ))}
      </div>
    </button>
  );
}
