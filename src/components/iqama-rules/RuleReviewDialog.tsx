/** Review & save: effective date, 365-day scan summary, explicit confirmation. */
import { useEffect, useState } from 'react';
import type { PrayerName } from '../../types/index';
import type { IqamaPreviewResponse } from '../../types/iqama-rules';
import { PRAYER_LABELS, isFriday, upcomingFridays } from '../../logic/iqama-rules';

interface Props {
  today: string;
  effectiveFrom: string;
  onEffectiveFromChange: (d: string) => void;
  changed: PrayerName[];
  /** Locked prayers (Fajr, Dhuhr, Asr, Isha) among `changed`. */
  needsFriday: PrayerName[];
  preview: IqamaPreviewResponse | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RuleReviewDialog({
  today,
  effectiveFrom,
  onEffectiveFromChange,
  changed,
  needsFriday,
  preview,
  loading,
  error,
  saving,
  onConfirm,
  onClose,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const fridayError =
    needsFriday.length > 0 && !isFriday(effectiveFrom)
      ? `${needsFriday.map((p) => PRAYER_LABELS[p]).join(', ')} can only change on a Friday. Pick a Friday.`
      : null;
  const s = preview?.summary;
  const canSave = !!preview && !fridayError && !error && confirmed && !loading && !saving;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="iqama-review-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 id="iqama-review-title" className="text-lg font-semibold text-gray-900">
            Review changes
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Changing: {changed.map((p) => PRAYER_LABELS[p]).join(', ')}
          </p>
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
              min={today}
              value={effectiveFrom}
              onChange={(e) => onEffectiveFromChange(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px]"
            />
            {needsFriday.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2" aria-label="Upcoming Fridays">
                {upcomingFridays(today, 4).map((d) => (
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
                  <div className="text-xs text-gray-500">days clamped</div>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-1 font-medium">Prayer</th>
                    <th className="pb-1 font-medium">Changed</th>
                    <th className="pb-1 font-medium">Clamped</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(Object.keys(s.byPrayer) as PrayerName[]).map((p) => (
                    <tr key={p}>
                      <td className="py-1">{PRAYER_LABELS[p]}</td>
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
                  ⚠ <span className="font-medium">First clamped:</span>{' '}
                  {s.firstClampedDates.join(', ')}
                </p>
              )}
            </div>
          )}

          {preview?.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-700">
              ⚠ {w.message}
            </p>
          ))}

          {error && (
            <p
              role="alert"
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
            >
              ⛔ {error}
            </p>
          )}

          <label className="flex items-start gap-3 min-h-[44px] select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
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
            onClick={onConfirm}
            disabled={!canSave}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40 min-h-[44px]"
          >
            {saving ? 'Saving…' : 'Save rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
