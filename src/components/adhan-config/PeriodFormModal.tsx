/**
 * PeriodFormModal.tsx
 *
 * Modal for creating or editing an Adhan config period (seasonal profile).
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdhanConfigPeriod, PartialAdhanSettings, PrayerKey } from '../../types';
import { previewPeriod, createPeriod, updatePeriod } from '../../services/adhan-config-service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: AdhanConfigPeriod | null;
}

const PRAYERS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function PeriodFormModal({ isOpen, onClose, onSaved, existing }: Props) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offsets, setOffsets] = useState<Partial<Record<PrayerKey, number>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (existing) {
      setLabel(existing.label);
      setStartDate(existing.startDate);
      setEndDate(existing.endDate);
      try {
        const s = JSON.parse(existing.settings) as PartialAdhanSettings;
        const offs: Partial<Record<PrayerKey, number>> = {};
        for (const p of PRAYERS) {
          const v = s.prayers?.[p]?.offsetMinutes;
          if (v !== undefined) offs[p] = v;
        }
        setOffsets(offs);
      } catch {
        setOffsets({});
      }
    } else {
      setLabel('');
      setStartDate('');
      setEndDate('');
      setOffsets({});
    }
    setError(null);
    setSaving(false);
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const settings: PartialAdhanSettings = {
        prayers: Object.fromEntries(
          PRAYERS.filter((p) => offsets[p] !== undefined && offsets[p] !== 0).map((p) => [
            p,
            { offsetMinutes: offsets[p] },
          ]),
        ),
      };

      const { previewId } = await previewPeriod(settings, startDate, endDate);

      if (existing) {
        await updatePeriod(existing.id, { label, startDate, endDate, settings }, previewId);
      } else {
        await createPeriod(label, startDate, endDate, settings, previewId);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('adhanPeriodForm.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
      aria-labelledby="period-form-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-4 p-6 space-y-4">
        <h2 id="period-form-title" className="text-lg font-semibold text-gray-900">
          {existing ? t('adhanPeriodForm.editTitle') : t('adhanPeriodForm.newTitle')}
        </h2>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('adhanPeriodForm.name')}
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('adhanPeriodForm.namePlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adhanPeriodForm.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adhanPeriodForm.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Prayer offsets */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('adhanPeriodForm.offsets')}</p>
          <div className="space-y-2">
            {PRAYERS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-600">{t(`prayers.${p}`)}</span>
                <input
                  type="number"
                  min={-60}
                  max={60}
                  value={offsets[p] ?? 0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setOffsets((prev) => ({ ...prev, [p]: isNaN(v) ? 0 : v }));
                  }}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">{t('adhanPeriodForm.min')}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !label || !startDate || !endDate}
            className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 min-h-[44px]"
          >
            {saving
              ? t('common.saving')
              : existing
                ? t('adhanPeriodForm.saveChanges')
                : t('adhanPeriodForm.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
