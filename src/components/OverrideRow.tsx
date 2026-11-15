import { useTranslation } from 'react-i18next';
import type { Override } from '../types/index';
import { isActive } from '../logic/is-active';
import { getIntlLocale } from '../i18n/locale';

function formatDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—';
  const datePart = dateStr.split('T')[0] ?? dateStr; // handle ISO timestamps like 2026-05-04T00:00:00.000Z
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [year, month, day] = parts as [number, number, number];
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

interface OverrideRowProps {
  override: Override;
  today: string;
  onEdit: (override: Override) => void;
  onDelete: (id: number) => void;
  /** The guardrails move this override's iqama on at least one upcoming day. */
  clamped?: boolean;
}

export function OverrideRow({ override, today, onEdit, onDelete, clamped }: OverrideRowProps) {
  const { t, i18n } = useTranslation();
  const active = isActive(override, today);
  const prayerLabel = t(`prayers.${override.prayer}`);

  return (
    <div
      id={`override-row-${override.id}`}
      data-testid={`override-row-${override.id}`}
      className={`flex items-center px-4 py-3 border-b border-gray-100 ${
        active ? 'bg-green-50' : 'bg-white'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">
            {t(`prayers.${override.prayer}`)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {active ? t('overrides.active') : t('overrides.inactive')}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {override.overrideType === 'FIXED' ? t('overrideForm.fixed') : t('overrideForm.offset')}:{' '}
          <bdi dir="ltr">{override.value}</bdi> ·{' '}
          <bdi dir="ltr">{formatDate(override.startDate, getIntlLocale(i18n.language))}</bdi> –{' '}
          <bdi dir="ltr">{formatDate(override.endDate, getIntlLocale(i18n.language))}</bdi>
        </p>
        {clamped && (
          <p
            data-testid={`override-clamp-warning-${override.id}`}
            className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1"
          >
            {t('overrides.clampWarning')}
          </p>
        )}
      </div>
      <div className="flex gap-2 ms-2">
        <button
          onClick={() => onEdit(override)}
          className="text-blue-600 text-sm px-3 py-2 rounded min-h-[44px] min-w-[44px]"
          aria-label={t('overrides.editAria', { prayer: prayerLabel })}
        >
          {t('overrides.edit')}
        </button>
        <button
          onClick={() => onDelete(override.id)}
          className="text-red-600 text-sm px-3 py-2 rounded min-h-[44px] min-w-[44px]"
          aria-label={t('overrides.deleteAria', { prayer: prayerLabel })}
          data-testid={`delete-btn-${override.id}`}
        >
          {t('overrides.delete')}
        </button>
      </div>
    </div>
  );
}
