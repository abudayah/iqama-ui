import { NavLink } from 'react-router-dom';

export function AdminNav() {
  return (
    <nav id="admin-nav" className="flex border-b border-gray-200 bg-white">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        Overrides
      </NavLink>
      <NavLink
        to="/admin/schedule"
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        Schedule
      </NavLink>
      <NavLink
        to="/admin/eid"
        className={({ isActive }) =>
          `flex-1 py-3 text-sm font-medium text-center min-h-[44px] flex items-center justify-center ${
            isActive
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        Ramadan & Eid
      </NavLink>
    </nav>
  );
}
