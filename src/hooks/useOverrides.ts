import { useState, useEffect, useCallback } from 'react';
import {
  fetchOverrides,
  createOverride,
  updateOverride,
  deleteOverride,
} from '../services/override-service';
import type { Override, OverridePayload } from '../types/index';

export function useOverrides() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOverrides();
      setOverrides(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(async (payload: OverridePayload) => {
    const newOverride = await createOverride(payload);
    setOverrides((prev) => [...prev, newOverride]);
    return newOverride;
  }, []);

  const update = useCallback(async (id: number, payload: Partial<OverridePayload>) => {
    const updated = await updateOverride(id, payload);
    setOverrides((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteOverride(id);
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { overrides, loading, error, create, update, remove, refetch };
}
