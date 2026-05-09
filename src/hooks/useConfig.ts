import { useState, useCallback, useEffect } from 'react';
import {
  getConfig,
  setBaseUrl as storeSetBaseUrl,
  setApiKey as storeSetApiKey,
  clearApiKey as storeClearApiKey,
} from '../store/config-store';
import type { AppConfig } from '../types/index';

// Custom event to notify all components when config changes
const CONFIG_CHANGE_EVENT = 'config-changed';

function dispatchConfigChange() {
  window.dispatchEvent(new Event(CONFIG_CHANGE_EVENT));
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => getConfig());

  // Listen for config changes from other components
  useEffect(() => {
    const handler = () => {
      setConfig(getConfig());
    };
    window.addEventListener(CONFIG_CHANGE_EVENT, handler);
    return () => window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
  }, []);

  const setBaseUrl = useCallback((url: string) => {
    storeSetBaseUrl(url);
    setConfig(getConfig());
    dispatchConfigChange();
  }, []);

  const setApiKey = useCallback((key: string) => {
    storeSetApiKey(key);
    setConfig(getConfig());
    dispatchConfigChange();
  }, []);

  const clearApiKey = useCallback(() => {
    storeClearApiKey();
    setConfig(getConfig());
    dispatchConfigChange();
  }, []);

  return { config, setBaseUrl, setApiKey, clearApiKey };
}
