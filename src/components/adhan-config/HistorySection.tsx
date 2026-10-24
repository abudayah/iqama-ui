/**
 * HistorySection.tsx
 *
 * Chronological audit trail of Adhan config changes with a Revert action.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AdhanConfigAuditEntry } from '../../types';
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
          {entries.map((e) => (
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
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{e.entity}</span> #{e.entityId}
                  {e.reason && <span className="text-gray-500"> — {e.reason}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
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
          ))}
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
