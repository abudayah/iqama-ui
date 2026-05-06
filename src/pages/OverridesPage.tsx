import { useState } from 'react';
import { useOverrides } from '../hooks/useOverrides';
import { OverrideList } from '../components/OverrideList';
import { OverrideFormModal } from '../components/OverrideFormModal';

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function OverridesPage() {
  const { overrides, loading, error, create, update, remove, refetch } = useOverrides();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const today = getTodayDate();

  return (
    <div id="overrides-page" className="p-4">
      <div id="overrides-page-header" className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Overrides</h1>
        <div className="flex gap-2">
          <button
            onClick={() => void refetch()}
            className="text-gray-600 text-sm px-3 py-2 border border-gray-300 rounded min-h-[44px]"
            aria-label="Refresh overrides"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded min-h-[44px]"
          >
            + New Override
          </button>
        </div>
      </div>

      {loading && (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-center" role="alert">
          <p className="text-red-700 text-sm mb-3">{error.message}</p>
          <button
            onClick={() => void refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm min-h-[44px]"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <OverrideList overrides={overrides} today={today} onUpdate={update} onRemove={remove} />
      )}

      {showCreateModal && (
        <OverrideFormModal
          onSave={async (payload) => {
            await create(payload);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
