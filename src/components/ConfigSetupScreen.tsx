import { useState } from 'react';
import { useConfig } from '../hooks/useConfig';

const URL_REGEX = /^https?:\/\/.+/;

export function ConfigSetupScreen() {
  const { setBaseUrl } = useConfig();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const isValid = URL_REGEX.test(url);

  const handleSave = () => {
    try {
      setBaseUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid URL');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Configure API</h1>
        <p className="text-gray-600 mb-4 text-sm">Enter the backend API base URL to get started.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="base-url">
          API Base URL
        </label>
        <input
          id="base-url"
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); }}
          placeholder="https://api.example.com"
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-describedby={error ? 'url-error' : undefined}
        />
        {error && <p id="url-error" className="text-red-600 text-xs mt-1">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="mt-4 w-full bg-blue-600 text-white rounded py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
