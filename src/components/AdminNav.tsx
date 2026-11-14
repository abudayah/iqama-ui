import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LangToggle } from './LangToggle';

export function AdminNav() {
  const { t } = useTranslation();
  // One "Iqama" tab covers both /admin (Overrides) and /admin/iqama (Rules).
  const { pathname } = useLocation();
  const iqamaActive =
    pathname.replace(/\/$/, '') === '/admin' || pathname.startsWith('/admin/iqama');
  return (
    <nav id="admin-nav" className="flex border-b border-gray-200 bg-white overflow-x-auto">
      <NavLink
        to="/admin"
        className={() =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center whitespace-nowrap px-2 ${
            iqamaActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        {t('nav.iqama')}
      </NavLink>
      <NavLink
        to="/admin/schedule"
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center whitespace-nowrap px-2 ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        {t('nav.weeklyView')}
      </NavLink>
      <NavLink
        to="/admin/eid"
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center whitespace-nowrap px-2 ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        {t('nav.ramadanEid')}
      </NavLink>
      <NavLink
        to="/admin/adhan"
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center whitespace-nowrap px-2 ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        {t('nav.adhan')}
      </NavLink>
      <div className="flex shrink-0 items-center px-2">
        <LangToggle />
      </div>
    </nav>
  );
}
