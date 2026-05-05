import { useState, useEffect, useCallback } from 'react';
import { fetchHijriStatus } from '../services/hijri-calendar-service';
import type { HijriCalendarStatus } from '../types/index';

/**
 * Returns true when the sighting card should be shown to the Imam.
 *
 * - Day 29: always show (Req 4.1)
 * - Day 30 without an existing override: show (Req 4.2)
 * - Day 30 with an existing override: hide (Req 4.3)
 * - Day < 29: always hide (Req 4.4)
 */
export function shouldShowSightingCard(hijriDay: number, hasOverride: boolean): boolean {
  if (hijriDay === 29) return true;
  if (hijriDay === 30 && !hasOverride) return true;
  return false;
}

export function useSightingStatus(): {
  status: HijriCalendarStatus | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [status, setStatus] = useState<HijriCalendarStatus | null>(null);
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

    fetchHijriStatus()
      .then((result) => {
        if (!cancelled) {
          setStatus(result);
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
  }, [refetchCounter]);

  return { status, loading, error, refetch };
}
