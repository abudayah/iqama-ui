/**
 * ReviewDialog.tsx
 *
 * Confirmation dialog shown before applying Adhan config changes.
 * Shows what changed, warnings, and requires explicit confirmation.
 */

import { useState, useEffect, useRef } from 'react';
import type { AdhanSettings, GeneralSettings, PreviewResponse, PrayerKey } from '../../types';
import { METHOD_LABELS, HIGH_LAT_LABELS, MADHAB_LABELS, ROUNDING_LABELS } from './method-labels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  currentSettings: AdhanSettings | null;
  proposedSettings: AdhanSettings;
  effectiveFrom: string;
  preview: PreviewResponse | null;
  previewLoading: boolean;
  previewError: string | null;
}

type ChangeRow = { label: string; before: string; after: string };

function describeGeneral(g: GeneralSettings): string {
  return [
    METHOD_LABELS[g.method],
    MADHAB_LABELS[g.madhab],
    HIGH_LAT_LABELS[g.highLatitudeRule],
    ROUNDING_LABELS[g.rounding],
    g.shafaq ? `Shafaq: ${g.shafaq}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function buildChangeRows(current: AdhanSettings | null, proposed: AdhanSettings): ChangeRow[] {
  const rows: ChangeRow[] = [];
  if (!current) return rows;

  const gc = current.general;
  const gp = proposed.general;

  if (gc.method !== gp.method)
    rows.push({
      label: 'Calculation method',
      before: METHOD_LABELS[gc.method],
      after: METHOD_LABELS[gp.method],
    });
  if (gc.madhab !== gp.madhab)
    rows.push({
      label: 'Madhab',
      before: MADHAB_LABELS[gc.madhab],
      after: MADHAB_LABELS[gp.madhab],
    });
  if (gc.highLatitudeRule !== gp.highLatitudeRule)
    rows.push({
      label: 'High latitude rule',
      before: HIGH_LAT_LABELS[gc.highLatitudeRule],
      after: HIGH_LAT_LABELS[gp.highLatitudeRule],
    });
  if (gc.rounding !== gp.rounding)
    rows.push({
      label: 'Rounding',
      before: ROUNDING_LABELS[gc.rounding],
      after: ROUNDING_LABELS[gp.rounding],
    });

  const prayers: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const p of prayers) {
    const pp = proposed.prayers[p];
    const cp = current.prayers[p];
    if (pp?.offsetMinutes !== undefined && pp.offsetMinutes !== (cp?.offsetMinutes ?? 0)) {
      const val = pp.offsetMinutes;
      rows.push({
        label: `${p.charAt(0).toUpperCase() + p.slice(1)} offset`,
        before: `${cp?.offsetMinutes ?? 0} min`,
        after: `${val > 0 ? '+' : ''}${val} min`,
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
  effectiveFrom,
  preview,
  previewLoading,
  previewError,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setReason('');
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

  const changeRows = buildChangeRows(currentSettings, proposedSettings);
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
            Review changes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            These changes will take effect on <strong>{effectiveFrom}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Summary line */}
          <div className="text-sm text-gray-700">
            <span className="font-medium">Proposed:</span>{' '}
            {describeGeneral(proposedSettings.general)}
          </div>

          {/* Change table */}
          {changeRows.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 font-medium">Setting</th>
                  <th className="pb-2 font-medium">Before</th>
                  <th className="pb-2 font-medium">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changeRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2 text-gray-700">{row.label}</td>
                    <td className="py-2 text-gray-500 line-through">{row.before}</td>
                    <td className="py-2 text-blue-700 font-medium">{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {previewLoading ? 'Loading preview…' : 'No changes detected.'}
            </p>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-amber-800">Warnings</p>
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

          {/* Reason */}
          <div>
            <label htmlFor="review-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <input
              id="review-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Switching to MWL for Ramadan"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label="I understand this changes times shown to the community"
            />
            <span className="text-sm text-gray-700">
              I understand this will change the prayer times shown to the community.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!canApply}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Apply to public schedule
          </button>
        </div>
      </div>
    </div>
  );
}
