/**
 * Bottom sheet to edit one prayer's rule. Forms come from the catalog; a live
 * 7-day azan → iqama strip comes from POST /preview.
 */
import { useEffect, useState } from 'react';
import type { PrayerName } from '../../types/index';
import type {
  IqamaCatalog,
  IqamaPreviewResponse,
  PrayerRule,
  RuleSet,
  RuleBase,
} from '../../types/iqama-rules';
import { PRAYER_LABELS, describeRule } from '../../logic/iqama-rules';
import { previewIqamaRules } from '../../services/iqama-rules-service';
import { RuleFields } from './RuleFields';
import { defaultObject } from '../../logic/rule-defaults';

type Patch = { [K in keyof PrayerRule]?: PrayerRule[K] | undefined };

interface Props {
  prayer: PrayerName | null;
  initialRule: PrayerRule;
  catalog: IqamaCatalog;
  effectiveFrom: string;
  buildSettings: (prayer: PrayerName, rule: PrayerRule) => RuleSet;
  onApply: (prayer: PrayerName, rule: PrayerRule) => void;
  onClose: () => void;
}

// NaN is how a cleared number input is held in state; it must not reach the API.
const hasNaN = (v: unknown): boolean =>
  JSON.stringify(v, (_k, x) => (x !== x ? '__NaN__' : x)).includes('__NaN__');

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 min-h-[44px] text-sm font-medium text-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600"
      />
      {label}
    </label>
  );
}

/** Optional integer input: empty removes the key. */
function OptionalInt({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block text-sm text-gray-700">
      {label} ({min} to {max})
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
        className={`${inputCls} mt-1`}
      />
    </label>
  );
}

export function RuleSheet({
  prayer,
  initialRule,
  catalog,
  effectiveFrom,
  buildSettings,
  onApply,
  onClose,
}: Props) {
  const [rule, setRule] = useState<PrayerRule>(initialRule);
  const [preview, setPreview] = useState<IqamaPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => setRule(initialRule), [initialRule, prayer]);

  useEffect(() => {
    if (!prayer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prayer, onClose]);

  const invalid = hasNaN(rule);
  const ruleKey = JSON.stringify(rule);
  useEffect(() => {
    if (!prayer || invalid) return;
    let cancelled = false;
    const t = setTimeout(() => {
      previewIqamaRules(
        buildSettings(prayer, JSON.parse(ruleKey) as PrayerRule),
        effectiveFrom || undefined,
      )
        .then((r) => {
          if (cancelled) return;
          setPreview(r);
          setPreviewError(null);
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setPreview(null);
          setPreviewError(e.message);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // buildSettings changes identity every render; ruleKey captures the rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayer, ruleKey, effectiveFrom, invalid]);

  if (!prayer) return null;
  const pc = catalog.prayers.find((p) => p.name === prayer);
  const baseType =
    catalog.baseTypes.find((b) => b.type === rule.base.type) ?? catalog.baseTypes[0]!;
  const { limits, rounding, weekdayAdjust } = catalog.modifiers;
  const patch = (p: Patch) => {
    const next: Patch = { ...rule, ...p };
    for (const k of Object.keys(next) as (keyof PrayerRule)[]) {
      if (next[k] === undefined) delete next[k];
    }
    setRule(next as PrayerRule);
  };
  const setLimit = (k: 'minAfterAzan' | 'latestBeforeSunrise', v: number | undefined) => {
    const next = { ...rule.limits };
    if (v === undefined) delete next[k];
    else next[k] = v;
    patch({ limits: next });
  };
  const baseValues: Record<string, unknown> = { ...rule.base };
  delete baseValues.type;
  const strip = preview?.days.slice(0, 7) ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-sheet-title"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg overflow-y-auto max-h-[90vh]"
      >
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="rule-sheet-title" className="text-base font-semibold text-gray-900">
              {PRAYER_LABELS[prayer]} · Iqama rule
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600" data-testid="rule-sentence">
            {invalid ? 'Fill in every field' : describeRule(rule)}
          </p>

          <label className="block text-sm font-medium text-gray-700">
            Rule type
            <select
              value={rule.base.type}
              onChange={(e) => {
                const bt = catalog.baseTypes.find((b) => b.type === e.target.value)!;
                patch({ base: { type: bt.type, ...defaultObject(bt.fields) } as RuleBase });
              }}
              className={`${inputCls} mt-1 bg-white`}
            >
              {catalog.baseTypes.map((b) => (
                <option key={b.type} value={b.type}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <RuleFields
            idPrefix="base"
            fields={baseType.fields}
            value={baseValues}
            onChange={(v) => patch({ base: { type: rule.base.type, ...v } as RuleBase })}
          />

          <div className="space-y-1 border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Modifiers
            </h3>

            <Toggle
              label="Limits"
              checked={!!rule.limits}
              onChange={(on) =>
                patch({
                  limits: on ? { minAfterAzan: Math.max(limits.minAfterAzan.min, 5) } : undefined,
                })
              }
            />
            {rule.limits && (
              <div className="pl-8 space-y-2">
                <OptionalInt
                  label="At least this many minutes after Azan"
                  {...limits.minAfterAzan}
                  value={rule.limits.minAfterAzan}
                  onChange={(v) => setLimit('minAfterAzan', v)}
                />
                {pc?.sunriseLimitAllowed && (
                  <OptionalInt
                    label="At least this many minutes before sunrise"
                    {...limits.latestBeforeSunrise}
                    value={rule.limits.latestBeforeSunrise}
                    onChange={(v) => setLimit('latestBeforeSunrise', v)}
                  />
                )}
              </div>
            )}

            <Toggle
              label="Rounding"
              checked={!!rule.rounding}
              onChange={(on) => patch({ rounding: on ? { mode: 'CEIL', step: 5 } : undefined })}
            />
            {rule.rounding && (
              <div className="pl-8 grid grid-cols-2 gap-2">
                <select
                  aria-label="Rounding mode"
                  value={rule.rounding.mode}
                  onChange={(e) =>
                    patch({
                      rounding: {
                        ...rule.rounding!,
                        mode: e.target.value as 'CEIL' | 'FLOOR' | 'NEAREST',
                      },
                    })
                  }
                  className={`${inputCls} bg-white`}
                >
                  {rounding.modes.map((m) => (
                    <option key={m} value={m}>
                      {m === 'CEIL' ? 'Round up' : m === 'FLOOR' ? 'Round down' : 'Nearest'}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Rounding step"
                  value={rule.rounding.step}
                  onChange={(e) =>
                    patch({ rounding: { ...rule.rounding!, step: parseInt(e.target.value, 10) } })
                  }
                  className={`${inputCls} bg-white`}
                >
                  {rounding.steps.map((s) => (
                    <option key={s} value={s}>
                      to {s} min
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Toggle
              label="Weekday adjust"
              checked={!!rule.weekdayAdjust}
              onChange={(on) => patch({ weekdayAdjust: on ? { FRI: 0 } : undefined })}
            />
            {rule.weekdayAdjust && (
              <div className="pl-8 grid grid-cols-4 gap-2">
                {weekdayAdjust.weekdays.map((d) => (
                  <label key={d} className="text-xs text-gray-600">
                    {d}
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`${d} adjust minutes`}
                      min={weekdayAdjust.min}
                      max={weekdayAdjust.max}
                      value={rule.weekdayAdjust![d] ?? ''}
                      onChange={(e) => {
                        const next = { ...rule.weekdayAdjust };
                        if (e.target.value === '') delete next[d];
                        else next[d] = parseInt(e.target.value, 10);
                        patch({ weekdayAdjust: next });
                      }}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
            )}

            {pc?.weeklyLockAllowed && (
              <Toggle
                label="Hold for the week (Friday to Thursday)"
                checked={!!rule.weeklyLock}
                onChange={(on) => patch({ weeklyLock: on ? true : undefined })}
              />
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Next 7 days (Azan → Iqama)
            </h3>
            {previewError && (
              <p
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2"
              >
                {previewError}
              </p>
            )}
            {!previewError && strip.length === 0 && (
              <p className="text-sm text-gray-400">{invalid ? '—' : 'Loading preview…'}</p>
            )}
            {strip.length > 0 && (
              <ul className="flex gap-2 overflow-x-auto pb-1" data-testid="preview-strip">
                {strip.map((d) => {
                  const p = d.prayers[prayer];
                  return (
                    <li
                      key={d.date}
                      className="min-w-[88px] shrink-0 border border-gray-200 rounded-lg p-2 text-center"
                    >
                      <div className="text-xs text-gray-500">
                        {d.day_of_week.slice(0, 3)} {d.date.slice(5)}
                      </div>
                      <div className="text-xs text-gray-400">{p.azan} →</div>
                      <div className="text-sm font-semibold text-gray-900">{p.proposed.iqama}</div>
                      {p.proposed.clamped && (
                        <span
                          data-testid="clamp-badge"
                          className="inline-block mt-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2"
                        >
                          ⚠ Adjusted
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Safety limits always apply: iqama is at least{' '}
              {catalog.guardrails.minGapAfterAzanMinutes} min after Azan, and Fajr iqama is at least{' '}
              {catalog.guardrails.fajrEndsBeforeSunriseMinutes} min before sunrise.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApply(prayer, rule);
                onClose();
              }}
              disabled={invalid}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40 min-h-[44px]"
            >
              Add to changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
