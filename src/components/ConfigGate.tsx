import { useConfig } from '../hooks/useConfig';
import { ConfigSetupScreen } from './ConfigSetupScreen';

interface ConfigGateProps {
  children: React.ReactNode;
}

export function ConfigGate({ children }: ConfigGateProps) {
  const { config } = useConfig();

  let isValidUrl = false;
  try {
    if (config.baseUrl) {
      new URL(config.baseUrl);
      isValidUrl = true;
    }
  } catch {
    /* invalid URL */
  }

  if (!isValidUrl) {
    return <ConfigSetupScreen />;
  }

  return <>{children}</>;
}
