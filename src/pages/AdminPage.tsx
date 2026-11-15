import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminNav } from '../components/AdminNav';
import { LangToggle } from '../components/LangToggle';
import { useConfig } from '../hooks/useConfig';
import { clearCache } from '../services/override-service';

export function AdminPage() {
  const { t, i18n } = useTranslation();
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
        className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-2"
      >
        <Link
          to="/"
          aria-label={t('admin.backAria')}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 px-2 py-2 rounded min-h-[44px] transition-colors whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className={i18n.dir(i18n.language) === 'rtl' ? 'scale-x-[-1]' : undefined}
          >
            ←
          </span>
          <span>{t('admin.back')}</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LangToggle />
          <button
            onClick={handleClearCache}
            disabled={clearing}
            className={`flex items-center gap-1.5 text-sm px-2 sm:px-3 py-2 rounded min-h-[44px] transition-colors ${
              clearStatus === 'success'
                ? 'text-green-600'
                : clearStatus === 'error'
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
            } disabled:opacity-50`}
            title={t('admin.clearCacheTitle')}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.5 5.5h13m-11.5 0 .8 10.1a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-10.1M8 5.5V3.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.7m-4 3v5m4-5v5"
              />
            </svg>
            <span>
              {clearing
                ? t('admin.clearing')
                : clearStatus === 'success'
                  ? t('admin.cacheCleared')
                  : clearStatus === 'error'
                    ? t('admin.failed')
                    : t('admin.clearCache')}
            </span>
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:text-red-700 px-2 sm:px-3 py-2 rounded min-h-[44px] transition-colors whitespace-nowrap"
          >
            {t('admin.signOut')}
          </button>
        </div>
      </header>
      <AdminNav />
      <Outlet />
    </div>
  );
}
