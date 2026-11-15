/**
 * PeriodsSection.tsx
 *
 * Lists active/upcoming/past seasonal periods and provides
 * add/edit/delete actions.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AdhanConfigPeriod, PartialAdhanSettings } from '../../types';
import { previewPeriod, deletePeriod } from '../../services/adhan-config-service';
import { PeriodFormModal } from './PeriodFormModal';

interface Props {
  periods: AdhanConfigPeriod[];
  onRefresh: () => void;
}

function periodStatus(p: AdhanConfigPeriod): 'active' | 'upcoming' | 'past' {
  const today = new Date().toISOString().split('T')[0]!;
  if (p.endDate < today) return 'past';
  if (p.startDate > today) return 'upcoming';
  return 'active';
}

function summarizeSettings(settings: string, t: TFunction): string {
  try {
    const s = JSON.parse(settings) as PartialAdhanSettings;
    const parts: string[] = [];
    if (s.general?.method) {
      parts.push(t('adhanPeriods.methodSummary', { method: t(`methods.${s.general.method}`) }));
    }
    if (s.general?.highLatitudeRule) {
      parts.push(
        t('adhanPeriods.highLatSummary', {
          rule: t(`highLat.${s.general.highLatitudeRule}`),
        }),
      );
    }
    if (s.prayers) {
      for (const [p, ps] of Object.entries(s.prayers)) {
        if (ps?.offsetMinutes !== undefined && ps.offsetMinutes !== 0) {
          const sign = ps.offsetMinutes > 0 ? '+' : '';
          parts.push(`${t(`prayers.${p}`)} ${sign}${ps.offsetMinutes}m`);
        }
      }
    }
    return parts.length ? parts.join(' · ') : t('adhanPeriods.noChanges');
  } catch {
    return '—';
  }
}

const STATUS_PILL: Record<ReturnType<typeof periodStatus>, string> = {
  active: 'bg-green-100 text-green-700 border-green-300',
  upcoming: 'bg-blue-100 text-blue-700 border-blue-300',
  past: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function PeriodsSection({ periods, onRefresh }: Props) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdhanConfigPeriod | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (period: AdhanConfigPeriod) => {
    if (!confirm(t('adhanPeriods.deleteConfirm', { label: period.label }))) return;
    setDeletingId(period.id);
    try {
      // We need a preview token even for delete
      const { previewId } = await previewPeriod(
        JSON.parse(period.settings) as PartialAdhanSettings,
        period.startDate,
        period.endDate,
      );
      await deletePeriod(period.id, previewId);
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t('adhanPeriods.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (p: AdhanConfigPeriod) => {
    setEditing(p);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <section aria-label={t('adhanPeriods.title')}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('adhanPeriods.title')}
        </h3>
        <button
          onClick={openCreate}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 min-h-[44px]"
        >
          {t('adhanPeriods.add')}
        </button>
      </div>

      {periods.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm">{t('adhanPeriods.emptyTitle')}</p>
          <p className="text-xs mt-1">{t('adhanPeriods.emptyHint')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {periods.map((p) => {
            const status = periodStatus(p);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
              >
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[status]}`}
                >
                  {status === 'active' ? '●' : status === 'upcoming' ? '○' : '–'}{' '}
                  {t(`adhanPeriods.status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.label}</p>
                  <p className="text-xs text-gray-500">
                    <bdi dir="ltr">
                      {p.startDate} – {p.endDate}
                    </bdi>{' '}
                    · {summarizeSettings(p.settings, t)}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1.5 min-h-[44px]"
                    aria-label={t('adhanPeriods.editAria', { label: p.label })}
                  >
                    {t('adhanPeriods.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 min-h-[44px] disabled:opacity-50"
                    aria-label={t('adhanPeriods.deleteAria', { label: p.label })}
                  >
                    {deletingId === p.id ? '…' : t('adhanPeriods.delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PeriodFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onRefresh}
        existing={editing}
      />
    </section>
  );
}
