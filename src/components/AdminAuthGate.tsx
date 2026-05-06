import { createContext, useContext } from 'react';
import { useConfig } from '../hooks/useConfig';
import { ApiKeyEntryScreen } from './ApiKeyEntryScreen';

export const AuthErrorContext = createContext<() => void>(() => {});

export function useAuthError() {
  return useContext(AuthErrorContext);
}

interface AdminAuthGateProps {
  children: React.ReactNode;
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const { config, clearApiKey } = useConfig();

  if (!config.apiKey) {
    return <ApiKeyEntryScreen />;
  }

  return <AuthErrorContext.Provider value={clearApiKey}>{children}</AuthErrorContext.Provider>;
}
