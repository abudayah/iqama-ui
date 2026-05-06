import { useState } from 'react';
import type { Override, OverridePayload } from '../types/index';
import { OverrideRow } from './OverrideRow';
import { OverrideFormModal } from './OverrideFormModal';

interface OverrideListProps {
  overrides: Override[];
  today: string;
  onUpdate: (id: number, payload: Partial<OverridePayload>) => Promise<Override>;
  onRemove: (id: number) => Promise<void>;
}

export function OverrideList({ overrides, today, onUpdate, onRemove }: OverrideListProps) {
  const [editingOverride, setEditingOverride] = useState<Override | null>(null);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this override?')) {
      await onRemove(id);
    }
  };

  if (overrides.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No overrides yet.</p>
        <p className="text-xs mt-1">Create your first override to adjust iqama times.</p>
      </div>
    );
  }

  return (
    <>
      <div id="override-list" className="bg-white rounded-lg shadow overflow-hidden">
        {overrides.map((override) => (
          <OverrideRow
            key={override.id}
            override={override}
            today={today}
            onEdit={setEditingOverride}
            onDelete={(id) => void handleDelete(id)}
          />
        ))}
      </div>
      {editingOverride && (
        <OverrideFormModal
          initial={editingOverride}
          onSave={async (payload) => {
            await onUpdate(editingOverride.id, payload);
          }}
          onClose={() => setEditingOverride(null)}
        />
      )}
    </>
  );
}
