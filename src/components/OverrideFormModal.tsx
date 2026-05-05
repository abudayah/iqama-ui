import { useState } from 'react';
import type { Override, OverridePayload, PrayerName } from '../types/index';

interface OverrideFormModalProps {
  initial?: Override;
  onSave: (data: OverridePayload) => Promise<void>;
  onClose: () => void;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};
const FIXED_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const OFFSET_MIN = -120;
const OFFSET_MAX = 120;
const OFFSET_STEP = 5;
const OFFSET_DEFAULT = 15;

function formatOffset(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function parseOffsetValue(v: string): number {
  const n = parseInt(v, 10);
  if (isNaN(n)) return OFFSET_DEFAULT;
  return Math.round(Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, n)) / OFFSET_STEP) * OFFSET_STEP;
}

export function OverrideFormModal({ initial, onSave, onClose }: OverrideFormModalProps) {
  const [prayer, setPrayer] = useState<PrayerName>(initial?.prayer ?? 'fajr');
  const [overrideType, setOverrideType] = useState<'FIXED' | 'OFFSET'>(initial?.overrideType ?? 'FIXED');
  const [value, setValue] = useState(initial?.value ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [offsetNum, setOffsetNum] = useState<number>(() =>
    initial?.overrideType === 'OFFSET' ? parseOffsetValue(initial.value) : OFFSET_DEFAULT
  );

  const handleOffsetSlider = (n: number) => {
    setOffsetNum(n);
    setValue(formatOffset(n));
  };

  const handleTypeChange = (t: 'FIXED' | 'OFFSET') => {
    setOverrideType(t);
    if (t === 'OFFSET') {
      setOffsetNum(OFFSET_DEFAULT);
      setValue(formatOffset(OFFSET_DEFAULT));
    } else {
      setValue('');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (overrideType === 'FIXED' && !FIXED_REGEX.test(value)) {
      newErrors['value'] = 'Enter a valid time (HH:mm, e.g. 05:45)';
    }
    if (!startDate) newErrors['startDate'] = 'Start date is required';
    if (!endDate) newErrors['endDate'] = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      newErrors['endDate'] = 'End date must be on or after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ prayer, overrideType, value, startDate, endDate });
      onClose();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">{initial ? 'Edit Override' : 'New Override'}</h2>

        {/* Prayer */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Prayer</label>
        <select
          value={prayer}
          onChange={e => setPrayer(e.target.value as PrayerName)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-3 min-h-[44px]"
        >
          {PRAYERS.map(p => (
            <option key={p} value={p}>{PRAYER_LABELS[p]}</option>
          ))}
        </select>

        {/* Type */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <div className="flex gap-4 mb-3">
          {(['FIXED', 'OFFSET'] as const).map(t => (
            <label key={t} className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
              <input
                type="radio"
                value={t}
                checked={overrideType === t}
                onChange={() => handleTypeChange(t)}
              />
              {t}
            </label>
          ))}
        </div>

        {/* Value */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {overrideType === 'FIXED' ? 'Time (HH:mm)' : 'Offset (minutes)'}
        </label>

        {overrideType === 'FIXED' ? (
          <input
            type="time"
            step={300}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
          />
        ) : (
          <div className="mb-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">-{Math.abs(OFFSET_MIN)} min</span>
              <span className="text-lg font-bold tabular-nums text-blue-600">
                {formatOffset(offsetNum)} min
              </span>
              <span className="text-xs text-gray-500">+{OFFSET_MAX} min</span>
            </div>
            <input
              type="range"
              min={OFFSET_MIN}
              max={OFFSET_MAX}
              step={OFFSET_STEP}
              value={offsetNum}
              onChange={e => handleOffsetSlider(Number(e.target.value))}
              className="w-full h-2 accent-blue-600 cursor-pointer"
              aria-label="Offset in minutes"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
              <span>-120</span>
              <span>-60</span>
              <span>0</span>
              <span>+60</span>
              <span>+120</span>
            </div>
          </div>
        )}
        {errors['value'] && <p className="text-red-600 text-xs mb-2">{errors['value']}</p>}

        {/* Start date */}
        <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
        />
        {errors['startDate'] && <p className="text-red-600 text-xs mb-2">{errors['startDate']}</p>}

        {/* End date */}
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
        />
        {errors['endDate'] && <p className="text-red-600 text-xs mb-2">{errors['endDate']}</p>}

        {errors['submit'] && <p className="text-red-600 text-xs mb-2">{errors['submit']}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded py-3 text-sm min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded py-3 text-sm font-medium disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
