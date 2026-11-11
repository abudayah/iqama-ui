/**
 * Renders form controls straight from the backend catalog, so new rule types
 * need no UI change. Supports the catalog field kinds: int, time, list, oneOf.
 */
import type { CatalogField } from '../../types/iqama-rules';
import { defaultObject, parseOptionField } from '../../logic/rule-defaults';

type Obj = Record<string, unknown>;

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500';

interface FieldProps {
  field: CatalogField;
  value: unknown;
  onChange: (v: unknown) => void;
  idPrefix: string;
}

function Field({ field, value, onChange, idPrefix }: FieldProps) {
  const id = `${idPrefix}-${field.name}`;
  const label = field.name.replace(/([A-Z])/g, ' $1').toLowerCase();
  if (field.kind === 'int') {
    return (
      <label className="block text-sm text-gray-700" htmlFor={id}>
        <span className="capitalize">{label}</span>
        {field.min !== undefined && field.max !== undefined && (
          <span className="text-gray-400">
            {' '}
            ({field.min} to {field.max})
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          value={Number.isFinite(value as number) ? (value as number) : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : parseInt(e.target.value, 10))}
          className={`${inputCls} mt-1`}
        />
      </label>
    );
  }
  if (field.kind === 'time') {
    return (
      <label className="block text-sm text-gray-700" htmlFor={id}>
        <span className="capitalize">{label}</span>
        <input
          id={id}
          type="time"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} mt-1`}
        />
      </label>
    );
  }
  if (field.kind === 'list') {
    const items = (value as Obj[]) ?? [];
    const min = field.minItems ?? 0;
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm text-gray-700 capitalize">{label}</legend>
        {field.note && <p className="text-xs text-gray-500">{field.note}</p>}
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
            {(field.item ?? []).map((sub) => (
              <Field
                key={sub.name}
                field={sub}
                idPrefix={`${id}-${i}`}
                value={item[sub.name]}
                onChange={(v) =>
                  onChange(items.map((it, j) => (j === i ? { ...it, [sub.name]: v } : it)))
                }
              />
            ))}
            {items.length > min && (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-sm text-red-600 min-h-[44px] px-2"
                aria-label={`Remove ${label} ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, defaultObject(field.item ?? [])])}
          className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 min-h-[44px]"
        >
          + Add
        </button>
      </fieldset>
    );
  }
  // oneOf
  const v = (value as Obj) ?? {};
  const opt = field.options?.find((o) => o.kind === v.kind) ?? field.options?.[0];
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700" htmlFor={id}>
        <span className="capitalize">{label}</span>
        <select
          id={id}
          value={opt?.kind}
          onChange={(e) => {
            const o = field.options!.find((x) => x.kind === e.target.value)!;
            onChange(
              Object.fromEntries([
                ['kind', o.kind],
                ...o.fields.map((s) => [parseOptionField(s).key, parseOptionField(s).min]),
              ]),
            );
          }}
          className={`${inputCls} mt-1 bg-white`}
        >
          {field.options?.map((o) => (
            <option key={o.kind} value={o.kind}>
              {o.kind === 'DATE'
                ? 'On a date'
                : o.kind === 'FIRST_FRIDAY'
                  ? 'First Friday of month'
                  : o.kind}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {opt?.fields.map((s) => {
          const p = parseOptionField(s);
          return (
            <label key={p.key} className="block text-sm text-gray-700 capitalize">
              {p.key}
              <input
                type="number"
                inputMode="numeric"
                min={p.min}
                max={p.max}
                value={Number.isFinite(v[p.key] as number) ? (v[p.key] as number) : ''}
                onChange={(e) =>
                  onChange({
                    ...v,
                    [p.key]: e.target.value === '' ? NaN : parseInt(e.target.value, 10),
                  })
                }
                className={`${inputCls} mt-1`}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  fields: CatalogField[];
  value: Obj;
  onChange: (next: Obj) => void;
  idPrefix: string;
}

export function RuleFields({ fields, value, onChange, idPrefix }: Props) {
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <Field
          key={f.name}
          field={f}
          idPrefix={idPrefix}
          value={value[f.name]}
          onChange={(v) => onChange({ ...value, [f.name]: v })}
        />
      ))}
    </div>
  );
}
