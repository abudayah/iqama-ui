import { useState, useEffect, useCallback } from 'react';
import { fetchIqamaRules, fetchIqamaCatalog } from '../services/iqama-rules-service';
import type { IqamaCatalog, IqamaRulesConfig } from '../types/iqama-rules';

export function useIqamaRules() {
  const [config, setConfig] = useState<IqamaRulesConfig | null>(null);
  const [catalog, setCatalog] = useState<IqamaCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchIqamaRules(), fetchIqamaCatalog()])
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
