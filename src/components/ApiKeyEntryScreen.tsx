import { useState } from 'react';
import { useConfig } from '../hooks/useConfig';

export function ApiKeyEntryScreen() {
  const { setApiKey } = useConfig();
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <p className="text-gray-600 mb-4 text-sm">Enter your API key to access the admin panel.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="api-key">
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Enter API key"
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="mt-4 w-full bg-blue-600 text-white rounded py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
