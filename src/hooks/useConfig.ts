import { useState, useCallback } from 'react';
import {
  getConfig,
  setBaseUrl as storeSetBaseUrl,
  setApiKey as storeSetApiKey,
  clearApiKey as storeClearApiKey,
} from '../store/config-store';
import type { AppConfig } from '../types/index';

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => getConfig());

  const setBaseUrl = useCallback((url: string) => {
    storeSetBaseUrl(url);
    setConfig(getConfig());
  }, []);

  const setApiKey = useCallback((key: string) => {
    storeSetApiKey(key);
    setConfig(getConfig());
  }, []);

  const clearApiKey = useCallback(() => {
    storeClearApiKey();
    setConfig(getConfig());
  }, []);

  return { config, setBaseUrl, setApiKey, clearApiKey };
}
