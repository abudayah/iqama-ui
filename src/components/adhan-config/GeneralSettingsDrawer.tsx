/**
 * GeneralSettingsDrawer.tsx
 *
 * Bottom-sheet / side-drawer for editing general (method-level) Adhan settings.
 * Applies to the base configuration; changes are added to the draft, not saved immediately.
 */

import { useState, useEffect } from 'react';
import type {
  GeneralSettings,
  CalculationMethodName,
  HighLatitudeRuleName,
  MadhabName,
  RoundingName,
  AdhanCatalogResponse,
} from '../../types';
import { METHOD_LABELS, HIGH_LAT_LABELS, MADHAB_LABELS, ROUNDING_LABELS } from './method-labels';

interface CustomAngles {
  fajrAngle: number;
  ishaAngle: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Current effective general settings (base + any active periods) */
  current: GeneralSettings;
  /** Current per-prayer angle overrides (used to pre-fill custom angle inputs) */
  currentAngles?: { fajrAngle?: number | undefined; ishaAngle?: number | undefined };
  catalog: AdhanCatalogResponse;
  onApply: (patch: Partial<GeneralSettings>, customAngles?: CustomAngles) => void;
}

export function GeneralSettingsDrawer({
  isOpen,
  onClose,
  current,
  currentAngles,
  catalog,
  onApply,
}: Props) {
  const [method, setMethod] = useState<CalculationMethodName>(current.method);
  const [madhab, setMadhab] = useState<MadhabName>(current.madhab);
  const [hlr, setHlr] = useState<HighLatitudeRuleName>(current.highLatitudeRule);
  const [rounding, setRounding] = useState<RoundingName>(current.rounding);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fajrAngle, setFajrAngle] = useState<string>(() => {
    const entry = catalog.methods.find((e) => e.name === current.method);
    return String(currentAngles?.fajrAngle ?? entry?.fajrAngle ?? 15);
  });
  const [ishaAngle, setIshaAngle] = useState<string>(() => {
    const entry = catalog.methods.find((e) => e.name === current.method);
    return String(currentAngles?.ishaAngle ?? entry?.ishaAngle ?? 15);
  });

  // Reset when drawer opens
  useEffect(() => {
    if (isOpen) {
      setMethod(current.method);
      setMadhab(current.madhab);
      setHlr(current.highLatitudeRule);
      setRounding(current.rounding);
      setShowAdvanced(false);
      const entry = catalog.methods.find((e) => e.name === current.method);
      setFajrAngle(String(currentAngles?.fajrAngle ?? entry?.fajrAngle ?? 15));
      setIshaAngle(String(currentAngles?.ishaAngle ?? entry?.ishaAngle ?? 15));
    }
  }, [isOpen, current, currentAngles, catalog]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recommended = catalog.recommendedHighLatitudeRule;
  const methodEntry = catalog.methods.find((m) => m.name === method);
  const isCustom = method === 'Other';

  const parsedFajrAngle = parseFloat(fajrAngle);
  const parsedIshaAngle = parseFloat(ishaAngle);
  const anglesValid =
    !isCustom ||
    (!isNaN(parsedFajrAngle) &&
      parsedFajrAngle >= 1 &&
      parsedFajrAngle <= 30 &&
      !isNaN(parsedIshaAngle) &&
      parsedIshaAngle >= 1 &&
      parsedIshaAngle <= 30);

  const hasChanges =
    (method !== current.method ||
      madhab !== current.madhab ||
      hlr !== current.highLatitudeRule ||
      rounding !== current.rounding ||
      (isCustom &&
        (parsedFajrAngle !== (currentAngles?.fajrAngle ?? 15) ||
          parsedIshaAngle !== (currentAngles?.ishaAngle ?? 15)))) &&
    anglesValid;

  const handleApply = () => {
    onApply(
      { method, madhab, highLatitudeRule: hlr, rounding },
      isCustom ? { fajrAngle: parsedFajrAngle, ishaAngle: parsedIshaAngle } : undefined,
    );
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="general-drawer-title"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl sm:top-0 sm:bottom-0 sm:right-0 sm:left-auto sm:w-96 sm:rounded-none overflow-y-auto max-h-[90vh] sm:max-h-screen"
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="general-drawer-title" className="text-base font-semibold text-gray-900">
              General settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Calculation method */}
          <div>
            <label htmlFor="gs-method" className="block text-sm font-medium text-gray-700 mb-1">
              Calculation method
            </label>
            <select
              id="gs-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as CalculationMethodName)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              {catalog.methods.map((m) => (
                <option key={m.name} value={m.name}>
                  {METHOD_LABELS[m.name]}
                </option>
              ))}
            </select>
            {methodEntry && <p className="mt-1 text-xs text-gray-500">{methodEntry.description}</p>}
            {isCustom && (
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    htmlFor="gs-fajr-angle"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Fajr angle (°)
                  </label>
                  <input
                    id="gs-fajr-angle"
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={fajrAngle}
                    onChange={(e) => setFajrAngle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gs-isha-angle"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Isha angle (°)
                  </label>
                  <input
                    id="gs-isha-angle"
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={ishaAngle}
                    onChange={(e) => setIshaAngle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                {!anglesValid && (
                  <p className="text-xs text-red-600">Angles must be between 1° and 30°</p>
                )}
              </div>
            )}
          </div>

          {/* Madhab */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Madhab (Asr timing)</p>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(['shafi', 'hanafi'] as MadhabName[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMadhab(m)}
                  className={`flex-1 py-2 text-sm min-h-[44px] transition-colors ${
                    madhab === m
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {MADHAB_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* High latitude rule */}
          <div>
            <label htmlFor="gs-hlr" className="block text-sm font-medium text-gray-700 mb-1">
              High latitude rule
            </label>
            <select
              id="gs-hlr"
              value={hlr}
              onChange={(e) => setHlr(e.target.value as HighLatitudeRuleName)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              {catalog.highLatitudeRuleValues.map((r) => (
                <option key={r} value={r}>
                  {HIGH_LAT_LABELS[r]}
                  {r === recommended ? ' (recommended)' : ''}
                </option>
              ))}
            </select>
            {hlr === recommended && (
              <p className="mt-1 text-xs text-green-600">✓ Recommended for this location</p>
            )}
          </div>

          {/* Advanced (collapsed by default) */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {showAdvanced ? '▾' : '▸'} Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-4 border-t border-gray-100 pt-3">
                {/* Rounding */}
                <div>
                  <label
                    htmlFor="gs-rounding"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Rounding
                  </label>
                  <select
                    id="gs-rounding"
                    value={rounding}
                    onChange={(e) => setRounding(e.target.value as RoundingName)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    {catalog.roundingValues.map((r) => (
                      <option key={r} value={r}>
                        {ROUNDING_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 min-h-[44px]"
            >
              Add to changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
