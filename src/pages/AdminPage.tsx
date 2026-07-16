import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { useConfig } from '../hooks/useConfig';
import { clearCache } from '../services/override-service';

export function AdminPage() {
  const { clearApiKey } = useConfig();
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSignOut = () => {
    clearApiKey();
    navigate('/admin');
  };

  const handleClearCache = async () => {
    setClearing(true);
    setClearStatus('idle');
    try {
      await clearCache();
      setClearStatus('success');
      setTimeout(() => setClearStatus('idle'), 2500);
    } catch {
      setClearStatus('error');
      setTimeout(() => setClearStatus('idle'), 2500);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div id="admin-page" className="min-h-screen bg-gray-50">
      <header
        id="admin-header"
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <h1 className="text-base font-semibold text-gray-800">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCache}
            disabled={clearing}
            className={`text-sm px-3 py-2 rounded min-h-[44px] transition-colors ${
              clearStatus === 'success'
                ? 'text-green-600'
                : clearStatus === 'error'
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
            } disabled:opacity-50`}
            title="Clear server schedule cache"
          >
            {clearing
              ? 'Clearing…'
              : clearStatus === 'success'
                ? '✓ Cache cleared'
                : clearStatus === 'error'
                  ? '✗ Failed'
                  : '🗑 Clear cache'}
          </button>
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
