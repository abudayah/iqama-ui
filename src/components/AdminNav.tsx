import { NavLink } from 'react-router-dom';

export function AdminNav() {
  return (
    <nav id="admin-nav" className="flex border-b border-gray-200 bg-white overflow-x-auto">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center whitespace-nowrap px-2 ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        Iqama
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
        Weekly View
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
        Ramadan &amp; Eid
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
        Adhan
      </NavLink>
    </nav>
  );
}
