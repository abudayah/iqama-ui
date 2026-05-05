import { useState } from 'react';
import { ceilToNearest15 } from '../logic/ceil-to-nearest-15';
import type { SubmitOverridePayload } from '../types';

interface EidPrayerModalProps {
  eidType: 'EID_AL_FITR' | 'EID_AL_ADHA';
  eidDate: Date;
  sunriseTime: string;      // HH:mm
  hijriYear: number;
  hijriMonth: number;
  length: 29 | 30;
  onSubmit: (payload: SubmitOverridePayload) => Promise<void>;
  onClose: () => void;
}

/**
 * Adds a given number of minutes to a HH:mm time string.
 * Handles overflow past midnight by wrapping to 00:00.
 */
function addMinutes(time: string, offset: number): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr!, 10);
  const minutes = parseInt(minutesStr!, 10);
  const totalMinutes = (hours * 60 + minutes + offset) % 1440;
  const normalised = totalMinutes < 0 ? totalMinutes + 1440 : totalMinutes;
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function computeDefaultFirstPrayer(sunriseTime: string, eidType: 'EID_AL_FITR' | 'EID_AL_ADHA'): string {
  const offset = eidType === 'EID_AL_FITR' ? 20 : 15;
  return ceilToNearest15(addMinutes(sunriseTime, offset));
}

function computeDefaultSecondPrayer(firstPrayerTime: string): string {
  return addMinutes(firstPrayerTime, 90);
}

export function EidPrayerModal({
  eidType,
  eidDate,
  sunriseTime,
  hijriYear,
  hijriMonth,
  length,
  onSubmit,
  onClose,
}: EidPrayerModalProps) {
  const defaultFirst = computeDefaultFirstPrayer(sunriseTime, eidType);
  const defaultSecond = computeDefaultSecondPrayer(defaultFirst);

  const [firstPrayerTime, setFirstPrayerTime] = useState(defaultFirst);
  const [secondPrayerTime, setSecondPrayerTime] = useState(defaultSecond);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const title =
    eidType === 'EID_AL_FITR'
      ? 'Confirm Eid al-Fitr Prayers'
      : 'Confirm Eid al-Adha Prayers';

  const formattedDate = eidDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message =
    eidType === 'EID_AL_FITR'
      ? `Based on your selection, the 1st of Shawwal will be on ${formattedDate}. Please confirm the prayer timings.`
      : `Based on your selection, Eid al-Adha (10th of Dhul-Hijjah) will be on ${formattedDate}. Please confirm the prayer timings.`;

  const handleSubmit = async () => {
    setSaving(true);
    setSubmitError(null);
    const payload: SubmitOverridePayload = {
      hijriYear,
      hijriMonth,
      length,
      eidConfig: {
        type: eidType,
        date: eidDate.toISOString().slice(0, 10),
        prayers: [
          { label: '1st Eid Prayer', time: firstPrayerTime },
          { label: '2nd Eid Prayer', time: secondPrayerTime },
        ],
      },
    };
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl" aria-hidden="true">🌙</span>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 mb-5">{message}</p>

        {/* 1st Prayer */}
        <label className="block text-sm font-medium text-gray-700 mb-1">1st Prayer</label>
        <input
          type="time"
          step={300}
          value={firstPrayerTime}
          onChange={e => setFirstPrayerTime(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-3 min-h-[44px]"
          aria-label="1st Prayer time"
        />

        {/* 2nd Prayer */}
        <label className="block text-sm font-medium text-gray-700 mb-1">2nd Prayer</label>
        <input
          type="time"
          step={300}
          value={secondPrayerTime}
          onChange={e => setSecondPrayerTime(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-3 min-h-[44px]"
          aria-label="2nd Prayer time"
        />

        {/* Inline error */}
        {submitError && (
          <p className="text-red-600 text-xs mb-3" role="alert">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded py-3 text-sm min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded py-3 text-sm font-medium disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
