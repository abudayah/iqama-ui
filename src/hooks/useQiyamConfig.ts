import { useState, useEffect } from 'react';
import { fetchQiyamConfig, saveQiyamConfig } from '../services/hijri-calendar-service';

export interface UseQiyamConfigResult {
  config: { hijri_year: number; start_time: string } | null;
  loading: boolean;
  error: Error | null;
  save: (startTime: string) => Promise<void>;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
}

export function useQiyamConfig(): UseQiyamConfigResult {
  const [config, setConfig] = useState<{ hijri_year: number; start_time: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchQiyamConfig()
      .then((result) => {
        if (!cancelled) {
          setConfig(result);
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
  }, []);

  async function save(startTime: string): Promise<void> {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveQiyamConfig(startTime);
      setSaving(false);
      setSaveSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSaving(false);
      setSaveError(message);
    }
  }

  return { config, loading, error, save, saving, saveError, saveSuccess };
}
