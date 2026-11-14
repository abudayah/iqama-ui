import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Override, OverridePayload } from '../types/index';
import { OverrideRow } from './OverrideRow';
import { OverrideFormModal } from './OverrideFormModal';
import { useOverrideClamps } from '../hooks/useOverrideClamps';

interface OverrideListProps {
  overrides: Override[];
  today: string;
  onUpdate: (id: number, payload: Partial<OverridePayload>) => Promise<Override>;
  onRemove: (id: number) => Promise<void>;
}

export function OverrideList({ overrides, today, onUpdate, onRemove }: OverrideListProps) {
  const { t } = useTranslation();
  const [editingOverride, setEditingOverride] = useState<Override | null>(null);
  const clamped = useOverrideClamps(overrides, today);

  const handleDelete = async (id: number) => {
    if (window.confirm(t('overrides.deleteConfirm'))) {
      await onRemove(id);
    }
  };

  if (overrides.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">{t('overrides.emptyTitle')}</p>
        <p className="text-xs mt-1">{t('overrides.emptyHint')}</p>
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
            clamped={clamped.has(override.id)}
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
