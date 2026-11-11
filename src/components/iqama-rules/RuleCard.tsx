import type { PrayerName } from '../../types/index';
import type { PrayerRule } from '../../types/iqama-rules';
import { describeRule, PRAYER_LABELS } from '../../logic/iqama-rules';

interface Props {
  prayer: PrayerName;
  rule: PrayerRule;
  edited: boolean;
  onClick: () => void;
}

export function RuleCard({ prayer, rule, edited, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`rule-card-${prayer}`}
      className="w-full text-left bg-white rounded-xl border border-gray-200 px-4 py-3 min-h-[44px] hover:border-blue-300 flex items-center justify-between gap-3"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{PRAYER_LABELS[prayer]}</span>
          {edited && (
            <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
              Edited
            </span>
          )}
        </span>
        <span className="block text-sm text-gray-600 mt-0.5">{describeRule(rule)}</span>
      </span>
      <span className="text-gray-400" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
