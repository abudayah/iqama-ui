import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/errors';
import type { Override, OverridePayload, PrayerName } from '../types/index';

interface OverrideFormModalProps {
  initial?: Override;
  onSave: (data: OverridePayload) => Promise<void>;
  onClose: () => void;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

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
  const { t } = useTranslation();
  const [prayer, setPrayer] = useState<PrayerName>(initial?.prayer ?? 'fajr');
  const [overrideType, setOverrideType] = useState<'FIXED' | 'OFFSET'>(
    initial?.overrideType ?? 'FIXED',
  );
  const [value, setValue] = useState(initial?.value ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startDate
      ? initial.startDate.substring(0, 10)
      : new Date().toISOString().substring(0, 10),
  );
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.substring(0, 10) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [offsetNum, setOffsetNum] = useState<number>(() =>
    initial?.overrideType === 'OFFSET' ? parseOffsetValue(initial.value) : OFFSET_DEFAULT,
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
      newErrors['value'] = t('overrideForm.errors.time');
    }
    if (!startDate) newErrors['startDate'] = t('overrideForm.errors.startRequired');
    if (!endDate) newErrors['endDate'] = t('overrideForm.errors.endRequired');
    if (startDate && endDate && endDate < startDate) {
      newErrors['endDate'] = t('overrideForm.errors.endBeforeStart');
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
      // 409 = overlaps another override for the same prayer: show it by the dates.
      if (err instanceof ApiError && err.status === 409) setErrors({ overlap: err.message });
      else
        setErrors({
          submit: err instanceof Error ? err.message : t('overrideForm.errors.saveFailed'),
        });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">
          {initial ? t('overrideForm.editTitle') : t('overrideForm.newTitle')}
        </h2>

        {/* Prayer */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('overrideForm.prayer')}
        </label>
        <select
          value={prayer}
          onChange={(e) => setPrayer(e.target.value as PrayerName)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-3 min-h-[44px]"
        >
          {PRAYERS.map((p) => (
            <option key={p} value={p}>
              {t(`prayers.${p}`)}
            </option>
          ))}
        </select>

        {/* Type */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('overrideForm.type')}
        </label>
        <div className="flex gap-4 mb-3">
          {(['FIXED', 'OFFSET'] as const).map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]"
            >
              <input
                type="radio"
                value={type}
                checked={overrideType === type}
                onChange={() => handleTypeChange(type)}
              />
              {type === 'FIXED' ? t('overrideForm.fixed') : t('overrideForm.offset')}
            </label>
          ))}
        </div>

        {/* Value */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {overrideType === 'FIXED' ? t('overrideForm.timeLabel') : t('overrideForm.offsetLabel')}
        </label>

        {overrideType === 'FIXED' ? (
          <>
            <input
              type="time"
              step={300}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
              aria-describedby="override-step-hint"
            />
            <p id="override-step-hint" className="text-xs text-gray-500 mb-1">
              {t('overrideForm.stepHint')}
            </p>
          </>
        ) : (
          <div className="mb-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">
                -{Math.abs(OFFSET_MIN)} {t('overrideForm.minShort')}
              </span>
              <span className="text-lg font-bold tabular-nums text-blue-600">
                <bdi dir="ltr">
                  {formatOffset(offsetNum)} {t('overrideForm.minShort')}
                </bdi>
              </span>
              <span className="text-xs text-gray-500">
                +{OFFSET_MAX} {t('overrideForm.minShort')}
              </span>
            </div>
            <input
              type="range"
              min={OFFSET_MIN}
              max={OFFSET_MAX}
              step={OFFSET_STEP}
              value={offsetNum}
              onChange={(e) => handleOffsetSlider(Number(e.target.value))}
              className="w-full h-2 accent-blue-600 cursor-pointer"
              aria-label={t('overrideForm.offsetAria')}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
              <span dir="ltr">-120</span>
              <span dir="ltr">-60</span>
              <span>0</span>
              <span dir="ltr">+60</span>
              <span dir="ltr">+120</span>
            </div>
          </div>
        )}
        {errors['value'] && <p className="text-red-600 text-xs mb-2">{errors['value']}</p>}

        {/* Start date */}
        <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
          {t('overrideForm.startDate')}
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
        />
        {errors['startDate'] && <p className="text-red-600 text-xs mb-2">{errors['startDate']}</p>}

        {/* End date */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('overrideForm.endDate')}
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1 min-h-[44px]"
        />
        {errors['endDate'] && <p className="text-red-600 text-xs mb-2">{errors['endDate']}</p>}

        {errors['overlap'] && (
          <p
            role="alert"
            data-testid="override-overlap-error"
            className="text-red-600 text-xs mb-2"
          >
            {errors['overlap']}
          </p>
        )}

        {errors['submit'] && <p className="text-red-600 text-xs mb-2">{errors['submit']}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded py-3 text-sm min-h-[44px]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded py-3 text-sm font-medium disabled:opacity-50 min-h-[44px]"
          >
            {saving ? t('common.saving') : t('overrideForm.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
