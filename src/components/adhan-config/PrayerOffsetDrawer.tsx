/**
 * PrayerOffsetDrawer.tsx
 *
 * Bottom-sheet / side-drawer for adjusting the offset (±minutes) for a single prayer.
 * Changes are added to the draft, not saved immediately.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PrayerKey, PrayerSettings } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prayer: PrayerKey | null;
  currentOffset: number; // from the base + period merged settings
  onApply: (prayer: PrayerKey, patch: PrayerSettings) => void;
}

/** Describes which prayers have a rule-fixed iqama (not driven by Azan value). */
const RULE_FIXED_IQAMA_KEYS: Partial<Record<PrayerKey, string>> = {
  dhuhr: 'adhanPrayerDrawer.ruleDhuhr',
  asr: 'adhanPrayerDrawer.ruleAsr',
};

export function PrayerOffsetDrawer({ isOpen, onClose, prayer, currentOffset, onApply }: Props) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (isOpen) setOffset(currentOffset);
  }, [isOpen, currentOffset]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !prayer) return null;

  const ruleKey = RULE_FIXED_IQAMA_KEYS[prayer];
  const ruleNote = ruleKey ? t(ruleKey) : undefined;
  const hasChange = offset !== currentOffset;

  const label =
    offset === 0
      ? t('adhanPrayerDrawer.noOffset')
      : offset > 0
        ? t('adhanPrayerDrawer.later', { n: offset })
        : t('adhanPrayerDrawer.earlier', { n: offset });

  const handleApply = () => {
    onApply(prayer, { offsetMinutes: offset });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prayer-drawer-title"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl sm:top-0 sm:bottom-0 sm:right-0 sm:left-auto sm:w-96 sm:rounded-none overflow-y-auto max-h-[80vh] sm:max-h-screen"
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="prayer-drawer-title" className="text-base font-semibold text-gray-900">
              {t('adhanPrayerDrawer.title', { prayer: t(`prayers.${prayer}`) })}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('adhanPrayerDrawer.close')}
            >
              ✕
            </button>
          </div>

          {/* Rule note */}
          {ruleNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">ℹ️ {ruleNote}</p>
            </div>
          )}

          {/* Offset slider + numeric input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {t('adhanPrayerDrawer.azanOffset')}
              </span>
              <span
                className={`text-sm font-semibold ${
                  offset > 0 ? 'text-orange-600' : offset < 0 ? 'text-blue-600' : 'text-gray-500'
                }`}
                aria-live="polite"
                aria-label={t('adhanPrayerDrawer.valueAria', { label })}
              >
                <bdi dir="ltr">{label}</bdi>
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={-30}
              max={30}
              step={1}
              value={offset}
              onChange={(e) => setOffset(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
              aria-label={t('adhanPrayerDrawer.sliderAria', { label })}
              aria-valuemin={-30}
              aria-valuemax={30}
              aria-valuenow={offset}
              aria-valuetext={label}
            />

            <div className="flex justify-between text-xs text-gray-400">
              <span dir="ltr">−30 {t('adhanPrayerDrawer.min')}</span>
              <span>0</span>
              <span dir="ltr">+30 {t('adhanPrayerDrawer.min')}</span>
            </div>

            {/* Numeric input + stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((v) => Math.max(-30, v - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-lg"
                aria-label={t('adhanPrayerDrawer.decrease')}
              >
                −
              </button>
              <input
                type="number"
                min={-30}
                max={30}
                value={offset}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setOffset(Math.max(-30, Math.min(30, v)));
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                dir="ltr"
              />
              <button
                onClick={() => setOffset((v) => Math.min(30, v + 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-lg"
                aria-label={t('adhanPrayerDrawer.increase')}
              >
                +
              </button>
            </div>

            {offset !== 0 && (
              <button
                onClick={() => setOffset(0)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {t('adhanPrayerDrawer.reset')}
              </button>
            )}

            {Math.abs(offset) > 10 && (
              <p className="text-xs text-amber-600">{t('adhanPrayerDrawer.largeWarning')}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              {t('adhanPrayerDrawer.cancel')}
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChange}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 min-h-[44px]"
            >
              {t('adhanPrayerDrawer.addToChanges')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
