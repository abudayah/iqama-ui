/**
 * Review & save: effective date, 365-day scan summary, explicit confirmation.
 *
 * The confirmation and the Fajr acknowledgement are remembered against the id
 * of ONE preview. A new preview (any change of rules, date or revision) has a
 * new id, so both fall back to "not given" without any reset code.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { PrayerName } from '../../types/index';
import type { IqamaPreviewResponse } from '../../types/iqama-rules';
import { prayerLabel, isFriday, upcomingFridays } from '../../logic/iqama-rules';
import { useModalA11y } from '../../hooks/useModalA11y';

interface Props {
  /** Earliest date the engine accepts (today, or the newest version's date). */
  minDate: string;
  effectiveFrom: string;
  onEffectiveFromChange: (d: string) => void;
  /** Short line such as "Building on version 3 (effective 2026-11-13)". */
  baseNote: string;
  changed: PrayerName[];
  /** Friday-start prayers (Fajr, Dhuhr, Asr, Isha) among `changed`. */
  needsFriday: PrayerName[];
  /** The preview for exactly the current rules, date and revision; else null. */
  preview: IqamaPreviewResponse | null;
  /** Catalog value for the Fajr-before-sunrise limit, used in the wording. */
  fajrMinBeforeSunrise?: number;
  loading: boolean;
  error: string | null;
  /** Field errors from a 400 response. */
  fieldErrors?: { path: string; message: string }[];
  /** Rules changed on the engine since this page loaded: saving is blocked. */
  stale: boolean;
  onReload: () => void;
  saving: boolean;
  onConfirm: (extra: {
    reason: string;
    acknowledgeConflicts: boolean;
    requestHash: string;
  }) => void;
  onClose: () => void;
}

export function RuleReviewDialog({
  minDate,
  effectiveFrom,
  onEffectiveFromChange,
  baseNote,
  changed,
  needsFriday,
  preview,
  fajrMinBeforeSunrise,
  loading,
  error,
  fieldErrors,
  stale,
  onReload,
  saving,
  onConfirm,
  onClose,
}: Props) {
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [ackFor, setAckFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const dialogRef = useModalA11y(() => {
    if (!saving) onClose();
  });

  const conflicts = preview?.conflicts ?? [];
  const confirmed = !!preview && confirmedFor === preview.previewId;
  const acked = !!preview && ackFor === preview.previewId;

  const fridayError =
    needsFriday.length > 0 && !isFriday(effectiveFrom)
      ? `${needsFriday.map(prayerLabel).join(', ')} can only change on a Friday. Pick a Friday.`
      : null;
  const s = preview?.summary;
  const canSave =
    !!preview &&
    !stale &&
    !fridayError &&
    confirmed &&
    (conflicts.length === 0 || acked) &&
    !loading &&
    !saving;

  return createPortal(
    <div data-modal-root>
      <div className="fixed inset-0 z-40 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="iqama-review-title"
          tabIndex={-1}
          className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col outline-none"
        >
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 id="iqama-review-title" className="text-lg font-semibold text-gray-900">
              Review changes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Changing: {changed.map(prayerLabel).join(', ')}
            </p>
            <p className="text-xs text-gray-500 mt-1">{baseNote}</p>
          </div>

          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="iqama-effective-from"
              >
                Effective from
              </label>
              <input
                id="iqama-effective-from"
                type="date"
                min={minDate}
                value={effectiveFrom}
                onChange={(e) => onEffectiveFromChange(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px]"
              />
              {needsFriday.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" aria-label="Upcoming Fridays">
                  {upcomingFridays(minDate, 4).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onEffectiveFromChange(d)}
                      aria-pressed={d === effectiveFrom}
                      className={`text-sm rounded-lg border px-3 min-h-[44px] ${
                        d === effectiveFrom
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Fri {d.slice(5)}
                    </button>
                  ))}
                </div>
              )}
              {fridayError && (
                <p role="alert" className="text-sm text-red-700 mt-2">
                  ⛔ {fridayError}
                </p>
              )}
            </div>

            {loading && <p className="text-sm text-gray-500">Scanning the next 365 days…</p>}

            {s && (
              <div data-testid="year-scan" className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-semibold text-gray-900">{s.daysChanged}</div>
                    <div className="text-xs text-gray-500">days changed (of {s.totalDays})</div>
                  </div>
                  <div className={`rounded-lg p-3 ${s.daysClamped ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <div className="text-2xl font-semibold text-gray-900">{s.daysClamped}</div>
                    <div className="text-xs text-gray-500">days adjusted</div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-1 font-medium">Prayer</th>
                      <th className="pb-1 font-medium">Changed</th>
                      <th className="pb-1 font-medium">Adjusted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(Object.keys(s.byPrayer) as PrayerName[]).map((p) => (
                      <tr key={p}>
                        <td className="py-1">{prayerLabel(p)}</td>
                        <td className="py-1">{s.byPrayer[p].daysChanged}</td>
                        <td className="py-1">{s.byPrayer[p].daysClamped}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.firstChangedDates.length > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">First changed:</span>{' '}
                    {s.firstChangedDates.join(', ')}
                  </p>
                )}
                {s.firstClampedDates.length > 0 && (
                  <p className="text-sm text-amber-800">
                    ⚠ <span className="font-medium">First adjusted:</span>{' '}
                    {s.firstClampedDates.join(', ')}
                  </p>
                )}
              </div>
            )}

            {conflicts.length > 0 && (
              <div
                data-testid="fajr-conflicts"
                className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2"
              >
                <p className="text-sm font-medium text-red-800">
                  ⛔ Fajr will be too close to sunrise on {s?.conflictDays ?? conflicts.length} day
                  {(s?.conflictDays ?? conflicts.length) === 1 ? '' : 's'}
                  {s?.conflictDays && s.conflictDays > conflicts.length
                    ? ` (first ${conflicts.length} listed)`
                    : ''}
                </p>
                <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                  {conflicts.map((c) => (
                    <li key={`${c.date}-${c.prayer}`}>
                      {c.date}: iqama {c.iqama}, sunrise {c.sunrise}
                    </li>
                  ))}
                </ul>
                <label className="flex items-start gap-3 min-h-[44px] select-none">
                  <input
                    type="checkbox"
                    checked={acked}
                    onChange={(e) => setAckFor(e.target.checked ? preview!.previewId : null)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-red-600"
                  />
                  <span className="text-sm text-red-900">
                    I understand Fajr will be less than {fajrMinBeforeSunrise ?? 60} min before
                    sunrise on these days
                  </span>
                </label>
              </div>
            )}

            {preview?.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700">
                ⚠ {w.message}
              </p>
            ))}

            {stale && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2"
              >
                <p className="text-sm text-amber-900">
                  The rules changed on the engine since you opened this page. Reload to see the
                  latest rules; your unsaved changes will be dropped.
                </p>
                <button
                  type="button"
                  onClick={onReload}
                  className="text-sm bg-amber-600 text-white rounded-lg px-3 min-h-[44px]"
                >
                  Reload latest rules
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p>⛔ {error}</p>
                {fieldErrors && fieldErrors.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {fieldErrors.map((f, i) => (
                      <li key={i}>
                        {f.path}: {f.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700" htmlFor="iqama-reason">
              Reason for change <span className="font-normal text-gray-400">(optional)</span>
              <textarea
                id="iqama-reason"
                value={reason}
                maxLength={500}
                rows={2}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="block text-xs text-gray-400 text-right">{reason.length}/500</span>
            </label>

            <label className="flex items-start gap-3 min-h-[44px] select-none">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={!preview}
                onChange={(e) =>
                  setConfirmedFor(e.target.checked && preview ? preview.previewId : null)
                }
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600"
                aria-label="I understand this changes times shown to the community"
              />
              <span className="text-sm text-gray-700">
                I understand this will change the prayer times shown to the community.
              </span>
            </label>
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                preview &&
                onConfirm({
                  reason,
                  acknowledgeConflicts: acked,
                  requestHash: preview.requestHash,
                })
              }
              disabled={!canSave}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40 min-h-[44px]"
            >
              {saving ? 'Saving…' : 'Save rules'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
