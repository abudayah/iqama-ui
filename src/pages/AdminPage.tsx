import { Outlet, useNavigate } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { useConfig } from '../hooks/useConfig';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function AdminPage() {
  const { clearApiKey } = useConfig();
  const navigate = useNavigate();
  const { canInstall, triggerInstall } = useInstallPrompt();

  const handleSignOut = () => {
    clearApiKey();
    navigate('/admin');
  };

  return (
    <div id="admin-page" className="min-h-screen bg-gray-50">
      <header
        id="admin-header"
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <h1 className="text-base font-semibold text-gray-800">Admin Panel</h1>
        <div className="flex items-center gap-3">
          {canInstall && (
            <button
              onClick={() => void triggerInstall()}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded min-h-[44px] transition-colors"
              aria-label="Install this app on your device"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded min-h-[44px] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <AdminNav />
      <Outlet />
    </div>
  );
}
