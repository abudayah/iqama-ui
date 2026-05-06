import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div
      id="offline-banner"
      role="alert"
      className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-4 py-3 text-sm"
    >
      You are offline. Prayer times may not be up to date.
    </div>
  );
}
