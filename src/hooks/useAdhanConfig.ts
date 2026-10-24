/**
 * useAdhanConfig.ts
 *
 * Fetches and caches Adhan configuration data.
 * Returns both the config and the catalog (method list, enum values).
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAdhanConfig, fetchAdhanCatalog } from '../services/adhan-config-service';
import type { AdhanConfigResponse, AdhanCatalogResponse } from '../types';

interface UseAdhanConfigState {
  config: AdhanConfigResponse | null;
  catalog: AdhanCatalogResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAdhanConfig(): UseAdhanConfigState {
  const [config, setConfig] = useState<AdhanConfigResponse | null>(null);
  const [catalog, setCatalog] = useState<AdhanCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchAdhanConfig(), fetchAdhanCatalog()])
      .then(([cfg, cat]) => {
        setConfig(cfg);
        setCatalog(cat);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { config, catalog, loading, error, refresh: load };
}
