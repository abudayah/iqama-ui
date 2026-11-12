/**
 * Bottom sheet to edit one prayer's rule. Every control comes from the engine
 * catalog; a live 7-day Azan → Iqama strip comes from POST /preview.
 * Invalid input never reaches the API: preview and "Add to changes" stay off
 * until the catalog validator is happy.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PrayerName } from '../../types/index';
import type {
  IqamaCatalog,
  IqamaPreviewResponse,
  PrayerRule,
  RuleSet,
} from '../../types/iqama-rules';
import { prayerLabel, describeRule } from '../../logic/iqama-rules';
import { emptyObject, emptyValue, pruneEmpty } from '../../logic/rule-defaults';
import { modifierAllowedFor, validateRule } from '../../logic/rule-validator';
import { previewIqamaRules } from '../../services/iqama-rules-service';
import { ApiError } from '../../api/errors';
import { useModalA11y } from '../../hooks/useModalA11y';
import { RuleFields } from './RuleFields';
import { inputCls } from './styles';

type Draft = Record<string, unknown>;

interface Props {
  prayer: PrayerName | null;
  initialRule: PrayerRule;
  catalog: IqamaCatalog;
  effectiveFrom: string;
  buildSettings: (prayer: PrayerName, rule: PrayerRule) => RuleSet;
  onApply: (prayer: PrayerName, rule: PrayerRule) => void;
  onClose: () => void;
}

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

export function RuleSheet(props: Props) {
  if (!props.prayer) return null;
  return <SheetBody {...props} prayer={props.prayer} />;
}

function SheetBody({
  prayer,
  initialRule,
  catalog,
  effectiveFrom,
  buildSettings,
  onApply,
  onClose,
}: Props & { prayer: PrayerName }) {
  const [rule, setRule] = useState<Draft>(initialRule as unknown as Draft);
  const [preview, setPreview] = useState<IqamaPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const dialogRef = useModalA11y(onClose);

  const errors = useMemo(() => validateRule(rule, prayer, catalog), [rule, prayer, catalog]);
  const valid = Object.keys(errors).length === 0;
  const cleaned = useMemo(() => pruneEmpty(rule) as unknown as PrayerRule, [rule]);
  const cleanedKey = JSON.stringify(cleaned);

  useEffect(() => {
    if (!valid) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false; // a late answer for an older rule must not replace a newer one
    const t = setTimeout(() => {
      previewIqamaRules(
        buildSettings(prayer, JSON.parse(cleanedKey) as PrayerRule),
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
          setPreviewError(
            e instanceof ApiError && e.errors?.length
              ? e.errors.map((x) => `${x.path}: ${x.message}`).join('; ')
              : e.message,
          );
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // buildSettings changes identity every render; cleanedKey captures the rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayer, cleanedKey, effectiveFrom, valid]);

  const baseType = catalog.baseTypes.find((b) => b.type === (rule['base'] as Draft)?.['type']);
  const baseValues: Draft = { ...(rule['base'] as Draft) };
  delete baseValues['type'];
  const modifiers = catalog.modifiers.filter((m) => modifierAllowedFor(m, prayer));
  const strip = preview?.days.slice(0, 7) ?? [];

  const toggleModifier = (name: string, on: boolean) =>
    setRule((r) => {
      const next = { ...r };
      const m = catalog.modifiers.find((x) => x.name === name)!;
      if (!on) delete next[name];
      else next[name] = m.kind === 'bool' ? true : emptyValue(m);
      return next;
    });

  return createPortal(
    <div data-modal-root>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-sheet-title"
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg overflow-y-auto max-h-[90vh] outline-none"
      >
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="rule-sheet-title" className="text-base font-semibold text-gray-900">
              {prayerLabel(prayer)} · Iqama rule
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
            {valid ? describeRule(cleaned) : 'Fill in the fields marked in red'}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="rule-type">
              Rule type
            </label>
            <select
              id="rule-type"
              value={baseType?.type ?? ''}
              onChange={(e) => {
                const bt = catalog.baseTypes.find((b) => b.type === e.target.value);
                setRule((r) => ({
                  ...r,
                  base: bt ? { type: bt.type, ...emptyObject(bt.fields) } : {},
                }));
              }}
              className={`${inputCls} mt-1 bg-white`}
            >
              {!baseType && <option value="">Choose…</option>}
              {catalog.baseTypes.map((b) => (
                <option key={b.type} value={b.type}>
                  {b.label}
                </option>
              ))}
            </select>
            {baseType?.note && <p className="text-xs text-gray-500 mt-1">{baseType.note}</p>}
          </div>

          {baseType && (
            <RuleFields
              idPrefix="rule"
              path="base"
              prayer={prayer}
              errors={errors}
              fields={baseType.fields}
              value={baseValues}
              onChange={(v) => setRule((r) => ({ ...r, base: { type: baseType.type, ...v } }))}
            />
          )}

          <div className="space-y-1 border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Modifiers
            </h3>
            {modifiers.map((m) => {
              const on = m.kind === 'bool' ? rule[m.name] === true : rule[m.name] !== undefined;
              return (
                <div key={m.name}>
                  <Toggle
                    label={m.label}
                    checked={on}
                    onChange={(v) => toggleModifier(m.name, v)}
                  />
                  {on && m.kind === 'object' && (
                    <div className="pl-8 space-y-2">
                      {m.note && <p className="text-xs text-gray-500">{m.note}</p>}
                      {errors[m.name] && (
                        <p role="alert" className="text-xs text-red-600">
                          {errors[m.name]}
                        </p>
                      )}
                      <RuleFields
                        idPrefix="rule"
                        path={m.name}
                        prayer={prayer}
                        errors={errors}
                        fields={m.fields ?? []}
                        value={rule[m.name] as Draft}
                        onChange={(v) => setRule((r) => ({ ...r, [m.name]: v }))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
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
              <p className="text-sm text-gray-400">{valid ? 'Loading preview…' : '—'}</p>
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
                          title="Moved by safety rules"
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
                onApply(prayer, cleaned);
                onClose();
              }}
              disabled={!valid}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40 min-h-[44px]"
            >
              Add to changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
