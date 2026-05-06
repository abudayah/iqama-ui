import { Outlet, useNavigate } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { useConfig } from '../hooks/useConfig';

export function AdminPage() {
  const { clearApiKey } = useConfig();
  const navigate = useNavigate();

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
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 px-3 py-2 rounded min-h-[44px]"
        >
          Sign out
        </button>
      </header>
      <AdminNav />
      <Outlet />
    </div>
  );
}
