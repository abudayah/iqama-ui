/**
 * Review & save. Shows only what the admin needs to decide: which prayers
 * change (old rule → new rule), a few example days, and any warning caused by
 * THIS change. Totals and tables are under "Details".
 *
 * The confirmation and the Fajr acknowledgement are remembered against the id
 * of ONE preview. A new preview (any change of rules, date or revision) has a
 * new id, so both fall back to "not given" without any reset code.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { PrayerName } from '../../types/index';
import type { IqamaPreviewResponse, PrayerRule } from '../../types/iqama-rules';
import {
  describeRule,
  formatDay,
  isFriday,
  newlyMovedDays,
  prayerLabel,
  upcomingFridays,
} from '../../logic/iqama-rules';
import { useModalA11y } from '../../hooks/useModalA11y';

export interface PrayerChange {
  prayer: PrayerName;
  before: PrayerRule;
  after: PrayerRule;
}

interface Props {
  /** Earliest date the engine accepts (today, or the newest version's date). */
  minDate: string;
  effectiveFrom: string;
  onEffectiveFromChange: (d: string) => void;
  /** Short line such as "Building on version 3 (effective 2026-11-13)". */
  baseNote: string;
  /** Only the prayers whose rule differs from the saved one. */
  changes: PrayerChange[];
  /** Friday-start prayers (Fajr, Dhuhr, Asr, Isha) among the changes. */
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

const EXAMPLES = 3;

/** Up to three days where this prayer's time changes: "Fri 13  17:35 → 17:40". */
function exampleDays(preview: IqamaPreviewResponse, prayer: PrayerName) {
  return preview.days
    .filter((d) => d.prayers[prayer].current.iqama !== d.prayers[prayer].proposed.iqama)
    .slice(0, EXAMPLES)
    .map((d) => ({
      date: d.date,
      label: `${d.day_of_week.slice(0, 3)} ${Number(d.date.slice(8))}`,
      from: d.prayers[prayer].current.iqama,
      to: d.prayers[prayer].proposed.iqama,
    }));
}

function changeLine(preview: IqamaPreviewResponse, prayer: PrayerName): string {
  const n = preview.summary.byPrayer[prayer]?.daysChanged ?? 0;
  if (n === 0) return 'No time changes';
  if (n >= preview.summary.totalDays) return 'Changes every day';
  return `Changes on ${n} day${n === 1 ? '' : 's'}`;
}

export function RuleReviewDialog({
  minDate,
  effectiveFrom,
  onEffectiveFromChange,
  baseNote,
  changes,
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dialogRef = useModalA11y(() => {
    if (!saving) onClose();
  });

  const changed = changes.map((c) => c.prayer);
  const conflicts = preview?.conflicts ?? [];
  const confirmed = !!preview && confirmedFor === preview.previewId;
  const acked = !!preview && ackFor === preview.previewId;

  const fridayError =
    needsFriday.length > 0 && !isFriday(effectiveFrom)
      ? `${needsFriday.map(prayerLabel).join(', ')} can only change on a Friday. Pick a Friday.`
      : null;
  const s = preview?.summary;
  // Only days moved because of THIS change; days that were already moved are not a warning.
  const newlyMoved = s ? newlyMovedDays(s, changed) : 0;
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
            <p className="text-sm text-gray-600 mt-1" data-testid="review-subtitle">
              {changed.map(prayerLabel).join(', ')} · from {formatDay(effectiveFrom)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-sm text-gray-700" htmlFor="iqama-effective-from">
                Effective from
              </label>
              <input
                id="iqama-effective-from"
                type="date"
                min={minDate}
                value={effectiveFrom}
                onChange={(e) => onEffectiveFromChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm min-h-[44px]"
              />
            </div>
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

          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            {loading && <p className="text-sm text-gray-500">Checking the next 365 days…</p>}

            {preview && s && (
              <div data-testid="year-scan" className="space-y-3">
                {changes.map((c) => {
                  const examples = exampleDays(preview, c.prayer);
                  return (
                    <section
                      key={c.prayer}
                      data-testid={`change-${c.prayer}`}
                      aria-label={prayerLabel(c.prayer)}
                      className="border border-gray-200 rounded-lg p-3 space-y-1"
                    >
                      <h3 className="text-sm font-semibold text-gray-900">
                        {prayerLabel(c.prayer)}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {describeRule(c.before)} → {describeRule(c.after)}
                      </p>
                      {examples.length > 0 && (
                        <ul className="text-sm text-gray-800 font-mono space-y-0.5">
                          {examples.map((e) => (
                            <li key={e.date}>
                              {e.label}&nbsp;&nbsp;{e.from} → {e.to}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-gray-500">{changeLine(preview, c.prayer)}</p>
                    </section>
                  );
                })}

                {newlyMoved > 0 && (
                  <p
                    data-testid="newly-moved-warning"
                    className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
                  >
                    ⚠ {newlyMoved} day{newlyMoved === 1 ? '' : 's'} will be moved by safety rules
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
                  latest rules. Your edits are kept and applied on top of them.
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

            {preview && s && (
              <div>
                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  aria-controls="iqama-review-details"
                  onClick={() => setDetailsOpen((o) => !o)}
                  className="text-sm text-blue-600 min-h-[44px] flex items-center gap-1"
                >
                  <span aria-hidden="true">{detailsOpen ? '▾' : '▸'}</span> Details
                </button>
                {detailsOpen && (
                  <div id="iqama-review-details" data-testid="review-details" className="space-y-3">
                    <p className="text-xs text-gray-500">{baseNote}</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-semibold text-gray-900">{s.daysChanged}</div>
                        <div className="text-xs text-gray-500">days changed (of {s.totalDays})</div>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${s.daysClamped ? 'bg-amber-50' : 'bg-gray-50'}`}
                      >
                        <div className="text-2xl font-semibold text-gray-900">{s.daysClamped}</div>
                        <div className="text-xs text-gray-500">days moved by safety rules</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      Moved by safety rules: {s.movedNow ?? s.daysClampedCurrent} already today,{' '}
                      {newlyMoved} new from this change.
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase">
                          <th className="pb-1 font-medium">Prayer</th>
                          <th className="pb-1 font-medium">Changed</th>
                          <th className="pb-1 font-medium">Moved by safety rules</th>
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
                    {s.newlyMovedDates && s.newlyMovedDates.length > 0 && (
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">First newly moved:</span>{' '}
                        {s.newlyMovedDates.join(', ')}
                      </p>
                    )}
                    {s.firstClampedDates.length > 0 && (
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">First moved by safety rules:</span>{' '}
                        {s.firstClampedDates.join(', ')}
                      </p>
                    )}
                  </div>
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
