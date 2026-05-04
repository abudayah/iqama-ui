import type { Override } from '../types/index';
import { isActive } from '../logic/is-active';

interface OverrideRowProps {
  override: Override;
  today: string;
  onEdit: (override: Override) => void;
  onDelete: (id: number) => void;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export function OverrideRow({ override, today, onEdit, onDelete }: OverrideRowProps) {
  const active = isActive(override, today);

  return (
    <div
      data-testid={`override-row-${override.id}`}
      className={`flex items-center px-4 py-3 border-b border-gray-100 ${
        active ? 'bg-green-50' : 'bg-white'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">
            {PRAYER_LABELS[override.prayer] ?? override.prayer}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {override.overrideType}: {override.value} · {override.startDate} – {override.endDate}
        </p>
      </div>
      <div className="flex gap-2 ml-2">
        <button
          onClick={() => onEdit(override)}
          className="text-blue-600 text-sm px-3 py-2 rounded min-h-[44px] min-w-[44px]"
          aria-label={`Edit override for ${override.prayer}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(override.id)}
          className="text-red-600 text-sm px-3 py-2 rounded min-h-[44px] min-w-[44px]"
          aria-label={`Delete override for ${override.prayer}`}
          data-testid={`delete-btn-${override.id}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
