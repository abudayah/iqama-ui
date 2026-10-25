/**
 * HistorySection.tsx
 *
 * Chronological audit trail of Adhan config changes with a Revert action.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AdhanConfigAuditEntry, AdhanSettings, PartialAdhanSettings } from '../../types';
import { fetchAdhanHistory, revertHistory } from '../../services/adhan-config-service';

interface Props {
  onRefresh: () => void;
}

const ACTION_LABELS: Record<AdhanConfigAuditEntry['action'], string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  REVERT: 'Reverted',
};

const ACTION_COLORS: Record<AdhanConfigAuditEntry['action'], string> = {
  CREATE: 'text-green-700 bg-green-50 border-green-200',
  UPDATE: 'text-blue-700 bg-blue-50 border-blue-200',
  DELETE: 'text-red-700 bg-red-50 border-red-200',
  REVERT: 'text-purple-700 bg-purple-50 border-purple-200',
};

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const FIELD_LABELS: Record<string, string> = {
  method: 'Method',
  madhab: 'Madhab',
  highLatitudeRule: 'High latitude',
  polarCircleResolution: 'Polar circle',
  rounding: 'Rounding',
  shafaq: 'Shafaq',
  offsetMinutes: 'Offset',
  fajrAngle: 'Fajr angle',
  ishaAngle: 'Isha angle',
  ishaInterval: 'Isha interval',
  maghribAngle: 'Maghrib angle',
};

function fmtVal(key: string, val: unknown): string {
  if (val === undefined || val === null) return '—';
  if (key === 'offsetMinutes') {
    const n = Number(val);
    return n === 0 ? '0 min' : n > 0 ? `+${n} min` : `${n} min`;
  }
  if (key === 'fajrAngle' || key === 'ishaAngle' || key === 'maghribAngle') return `${val}°`;
  if (key === 'ishaInterval') return `${val} min after Maghrib`;
  return String(val);
}

/** Build human-readable change lines from before/after JSON strings. */
function buildChangeSummary(
  entity: AdhanConfigAuditEntry['entity'],
  action: AdhanConfigAuditEntry['action'],
  before: string | null,
  after: string | null,
): string[] {
  if (action === 'DELETE') return ['Deleted'];
  if (!after) return [];

  try {
    if (entity === 'VERSION') {
      const a = JSON.parse(after) as AdhanSettings;
      const b = before ? (JSON.parse(before) as AdhanSettings) : null;
      const lines: string[] = [];

      // General settings diff — only when updating over a previous version
      if (b) {
        for (const [k, av] of Object.entries(a.general ?? {})) {
          const bv = b.general?.[k as keyof typeof b.general];
          if (bv !== undefined && bv !== av) {
            lines.push(`${FIELD_LABELS[k] ?? k}: ${fmtVal(k, bv)} → ${fmtVal(k, av)}`);
          }
        }
      }

      // Per-prayer diff
      for (const [prayer, ps] of Object.entries(a.prayers ?? {})) {
        const bps = (b?.prayers?.[prayer as keyof typeof b.prayers] ?? {}) as Record<
          string,
          unknown
        >;
        for (const [k, av] of Object.entries(ps ?? {})) {
          const bv = bps[k];
          const label = `${PRAYER_LABELS[prayer] ?? prayer} ${FIELD_LABELS[k] ?? k}`;
          if (bv !== undefined && bv !== av) {
            lines.push(`${label}: ${fmtVal(k, bv)} → ${fmtVal(k, av)}`);
          } else if (bv === undefined) {
            lines.push(`${label}: ${fmtVal(k, av)}`);
          }
        }
        // Removed fields
        for (const k of Object.keys(bps)) {
          if ((ps as Record<string, unknown>)[k] === undefined) {
            lines.push(`${PRAYER_LABELS[prayer] ?? prayer} ${FIELD_LABELS[k] ?? k}: removed`);
          }
        }
      }

      return lines;
    }

    if (entity === 'PERIOD') {
      const a = JSON.parse(after) as PartialAdhanSettings;
      const b = before ? (JSON.parse(before) as PartialAdhanSettings) : null;
      const lines: string[] = [];

      for (const [prayer, ps] of Object.entries(a.prayers ?? {})) {
        const bps = (b?.prayers?.[prayer as keyof typeof b.prayers] ?? {}) as Record<
          string,
          unknown
        >;
        for (const [k, av] of Object.entries(ps ?? {})) {
          const bv = bps[k];
          const label = `${PRAYER_LABELS[prayer] ?? prayer} ${FIELD_LABELS[k] ?? k}`;
          if (bv !== undefined && bv !== av) {
            lines.push(`${label}: ${fmtVal(k, bv)} → ${fmtVal(k, av)}`);
          } else if (bv === undefined) {
            lines.push(`${label}: ${fmtVal(k, av)}`);
          }
        }
      }

      return lines;
    }
  } catch {
    // malformed JSON — show nothing
  }

  return [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function HistorySection({ onRefresh }: Props) {
  const [entries, setEntries] = useState<AdhanConfigAuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<number | null>(null);

  const loadHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdhanHistory(page, 20)
      .then((res) => {
        setEntries(res.items);
        setTotal(res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRevert = async (entry: AdhanConfigAuditEntry) => {
    if (
      !confirm(
        "Revert to this configuration? A new version will be created with today's effective date.",
      )
    )
      return;
    setRevertingId(entry.id);
    try {
      await revertHistory(entry.id);
      onRefresh();
      loadHistory();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to revert');
    } finally {
      setRevertingId(null);
    }
  };

  if (loading) {
    return (
      <section aria-label="History">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          History
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="History">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          History
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}{' '}
          <button onClick={loadHistory} className="underline ml-1">
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="History">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">History</h3>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No history yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const changes = buildChangeSummary(e.entity, e.action, e.before, e.after);
            return (
              <li
                key={e.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <span
                  className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[e.action]}`}
                >
                  {ACTION_LABELS[e.action]}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {e.entity === 'VERSION' ? 'Base config' : 'Period'} #{e.entityId}
                    {e.reason && <span className="text-gray-500 font-normal"> — {e.reason}</span>}
                  </p>

                  {changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {changes.map((line, i) => (
                        <li key={i} className="text-xs text-gray-600 font-mono">
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(e.createdAt)} · by {e.actor}
                  </p>
                </div>

                {e.entity === 'VERSION' && e.action !== 'DELETE' && (
                  <button
                    onClick={() => handleRevert(e)}
                    disabled={revertingId === e.id}
                    className="shrink-0 text-xs text-blue-600 hover:text-blue-700 px-2 py-1.5 min-h-[44px] disabled:opacity-50"
                    aria-label={`Revert to config from ${formatDate(e.createdAt)}`}
                  >
                    {revertingId === e.id ? '…' : 'Revert'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40 px-3 py-2 min-h-[44px]"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500 self-center">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40 px-3 py-2 min-h-[44px]"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
