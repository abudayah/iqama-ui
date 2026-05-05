import { useState, useEffect, useCallback } from 'react';
import { fetchEidPrayers } from '../services/hijri-calendar-service';
import type { EidPrayerRecord } from '../types/index';

export function useEidPrayers(date?: string, admin?: boolean): {
  records: EidPrayerRecord[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [records, setRecords] = useState<EidPrayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchEidPrayers(date, admin)
      .then((result) => {
        if (!cancelled) {
          setRecords(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refetchCounter, date, admin]);

  return { records, loading, error, refetch };
}
