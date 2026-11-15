/**
 * ReviewDialog.tsx
 *
 * Confirmation dialog shown before applying Adhan config changes.
 * Shows what changed, warnings, and requires explicit confirmation.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AdhanSettings, GeneralSettings, PreviewResponse, PrayerKey } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentSettings: AdhanSettings | null;
  proposedSettings: AdhanSettings;
  preview: PreviewResponse | null;
  previewLoading: boolean;
  previewError: string | null;
}

type ChangeRow = { label: string; before: string; after: string };

function describeGeneral(g: GeneralSettings, t: TFunction): string {
  return [
    t(`methods.${g.method}`),
    t(`madhabLabels.${g.madhab}`),
    t(`highLat.${g.highLatitudeRule}`),
    t(`roundingLabels.${g.rounding}`),
    g.shafaq ? t('adhanReview.shafaq', { value: t(`shafaqLabels.${g.shafaq}`) }) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function buildChangeRows(
  current: AdhanSettings | null,
  proposed: AdhanSettings,
  t: TFunction,
): ChangeRow[] {
  const rows: ChangeRow[] = [];
  if (!current) return rows;

  const gc = current.general;
  const gp = proposed.general;

  if (gc.method !== gp.method)
    rows.push({
      label: t('adhanReview.calculationMethod'),
      before: t(`methods.${gc.method}`),
      after: t(`methods.${gp.method}`),
    });
  if (gc.madhab !== gp.madhab)
    rows.push({
      label: t('adhanReview.madhab'),
      before: t(`madhabLabels.${gc.madhab}`),
      after: t(`madhabLabels.${gp.madhab}`),
    });
  if (gc.highLatitudeRule !== gp.highLatitudeRule)
    rows.push({
      label: t('adhanReview.highLatitude'),
      before: t(`highLat.${gc.highLatitudeRule}`),
      after: t(`highLat.${gp.highLatitudeRule}`),
    });
  if (gc.rounding !== gp.rounding)
    rows.push({
      label: t('adhanReview.rounding'),
      before: t(`roundingLabels.${gc.rounding}`),
      after: t(`roundingLabels.${gp.rounding}`),
    });

  const prayers: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const p of prayers) {
    const pp = proposed.prayers[p];
    const cp = current.prayers[p];
    if (pp?.offsetMinutes !== undefined && pp.offsetMinutes !== (cp?.offsetMinutes ?? 0)) {
      const val = pp.offsetMinutes;
      rows.push({
        label: t('adhanReview.prayerOffset', { prayer: t(`prayers.${p}`) }),
        before: `${cp?.offsetMinutes ?? 0} ${t('adhanPrayerDrawer.min')}`,
        after: `${val > 0 ? '+' : ''}${val} ${t('adhanPrayerDrawer.min')}`,
      });
    }
  }

  return rows;
}

export function ReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  currentSettings,
  proposedSettings,
  preview,
  previewLoading,
  previewError,
}: Props) {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
    }
  }, [isOpen]);

  // Focus trap — close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const changeRows = buildChangeRows(currentSettings, proposedSettings, t);
  const warnings = preview?.warnings ?? [];
  const hasErrors = !!previewError;
  const canApply = preview !== null && !hasErrors && confirmed && !previewLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
      aria-labelledby="review-dialog-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col outline-none"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 id="review-dialog-title" className="text-lg font-semibold text-gray-900">
            {t('adhanReview.title')}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Summary line */}
          <div className="text-sm text-gray-700">
            <span className="font-medium">{t('adhanReview.proposed')}</span>{' '}
            {describeGeneral(proposedSettings.general, t)}
          </div>

          {/* Change table */}
          {changeRows.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-start text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 font-medium">{t('adhanReview.setting')}</th>
                  <th className="pb-2 font-medium">{t('adhanReview.before')}</th>
                  <th className="pb-2 font-medium">{t('adhanReview.after')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changeRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2 text-gray-700">{row.label}</td>
                    <td className="py-2 text-gray-500 line-through">
                      <bdi dir="ltr">{row.before}</bdi>
                    </td>
                    <td className="py-2 text-blue-700 font-medium">
                      <bdi dir="ltr">{row.after}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {previewLoading ? t('adhanReview.loadingPreview') : t('adhanReview.noChanges')}
            </p>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-amber-800">{t('adhanReview.warnings')}</p>
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">
                  ⚠️ {w.message}
                </p>
              ))}
            </div>
          )}

          {/* Error */}
          {previewError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⛔ {previewError}</p>
            </div>
          )}

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={t('adhanReview.understandAria')}
            />
            <span className="text-sm text-gray-700">{t('adhanReview.understand')}</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
          >
            {t('adhanReview.cancel')}
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={!canApply}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {t('adhanReview.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
