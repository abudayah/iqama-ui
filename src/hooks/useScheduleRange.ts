import { useState, useEffect, useCallback } from 'react';
import { fetchScheduleForRange } from '../services/schedule-service';
import type { DailySchedule } from '../types/index';

export function useScheduleRange(start: string, end: string) {
  const [data, setData] = useState<DailySchedule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchScheduleForRange(start, end);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
