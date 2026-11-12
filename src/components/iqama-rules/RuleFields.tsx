/**
 * Renders form controls straight from the engine catalog (kinds: int, time,
 * enum, bool, list, object with optional variants). Values are plain data:
 * a cleared number or time is '' (never silently turned into 0 or truncated)
 * and errors are shown next to the field that caused them.
 */
import type { PrayerName } from '../../types/index';
import type { CatalogField } from '../../types/iqama-rules';
import { emptyObject, emptyValue, variantFields } from '../../logic/rule-defaults';
import { isEmpty, type FieldErrors } from '../../logic/rule-validator';

import { inputCls } from './styles';

type Obj = Record<string, unknown>;

interface Ctx {
  errors: FieldErrors;
  idPrefix: string;
  prayer: PrayerName | undefined;
}

const fieldId = (ctx: Ctx, path: string) => `${ctx.idPrefix}-${path.replace(/\./g, '-')}`;

function ErrorText({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-600 mt-1">
      {message}
    </p>
  );
}

/** Set a key; an emptied optional field removes the key (consistent for all modifiers). */
function setKey(obj: Obj, f: CatalogField, v: unknown): Obj {
  const next = { ...obj };
  if (!f.required && f.kind !== 'bool' && isEmpty(v)) delete next[f.name];
  else next[f.name] = v;
  return next;
}

interface FieldProps {
  field: CatalogField;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  ctx: Ctx;
}

function Field({ field, value, onChange, path, ctx }: FieldProps) {
  const id = fieldId(ctx, path);
  const error = ctx.errors[path];
  const errId = `${id}-error`;
  const aria = {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
  } as const;
  const border = error ? 'border-red-400' : '';

  switch (field.kind) {
    case 'int':
      return (
        <div>
          <label className="block text-sm text-gray-700" htmlFor={id}>
            {field.label}
            {field.min !== undefined && field.max !== undefined && (
              <span className="text-gray-400">
                {' '}
                ({field.min} to {field.max})
              </span>
            )}
          </label>
          <input
            id={id}
            type="number"
            inputMode={field.integer ? 'numeric' : 'decimal'}
            step={field.integer ? 1 : 'any'}
            min={field.min}
            max={field.max}
            value={typeof value === 'number' && Number.isFinite(value) ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={`${inputCls} mt-1 ${border}`}
            {...aria}
          />
          <ErrorText id={errId} message={error} />
        </div>
      );
    case 'time':
      return (
        <div>
          <label className="block text-sm text-gray-700" htmlFor={id}>
            {field.label}
          </label>
          <input
            id={id}
            type="time"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} mt-1 ${border}`}
            {...aria}
          />
          <ErrorText id={errId} message={error} />
        </div>
      );
    case 'enum':
      return (
        <div>
          <label className="block text-sm text-gray-700" htmlFor={id}>
            {field.label}
          </label>
          <select
            id={id}
            value={isEmpty(value) ? '' : String(value)}
            onChange={(e) => {
              const o = field.options?.find((x) => String(x.value) === e.target.value);
              onChange(o ? o.value : '');
            }}
            className={`${inputCls} mt-1 bg-white ${border}`}
            {...aria}
          >
            <option value="">Choose…</option>
            {field.options?.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
          <ErrorText id={errId} message={error} />
        </div>
      );
    case 'bool':
      return (
        <label className="flex items-center gap-3 min-h-[44px] text-sm text-gray-800">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600"
          />
          {field.label}
        </label>
      );
    case 'list': {
      const items = Array.isArray(value) ? (value as Obj[]) : [];
      const atMax = field.maxItems !== undefined && items.length >= field.maxItems;
      return (
        <fieldset className="space-y-2" {...aria}>
          <legend className="text-sm text-gray-700">
            {field.label}
            {field.minItems !== undefined && field.maxItems !== undefined && (
              <span className="text-gray-400">
                {' '}
                ({field.minItems} to {field.maxItems})
              </span>
            )}
          </legend>
          {field.note && <p className="text-xs text-gray-500">{field.note}</p>}
          <ErrorText id={errId} message={error} />
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-label={`${field.label} ${i + 1}`}
              className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
            >
              <ObjectFields
                fields={field.item ?? []}
                value={item}
                onChange={(next) => onChange(items.map((it, j) => (j === i ? next : it)))}
                path={`${path}.${i}`}
                ctx={ctx}
              />
              {items.length > (field.minItems ?? 0) && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="text-sm text-red-600 min-h-[44px] px-2"
                  aria-label={`Remove ${field.label} ${i + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={atMax}
            onClick={() => onChange([...items, emptyObject(field.item ?? [])])}
            className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 min-h-[44px] disabled:opacity-40"
          >
            + Add
          </button>
        </fieldset>
      );
    }
    case 'object': {
      const obj = (value && typeof value === 'object' ? value : {}) as Obj;
      if (field.variants && field.discriminator) {
        const disc = field.discriminator;
        const variant = variantFields(field, obj);
        return (
          <div className="space-y-2">
            <label className="block text-sm text-gray-700" htmlFor={id}>
              {field.label}
            </label>
            <select
              id={id}
              value={variant?.value ?? ''}
              onChange={(e) => {
                const v = field.variants!.find((x) => x.value === e.target.value);
                onChange(v ? { [disc]: v.value, ...emptyObject(v.fields) } : emptyValue(field));
              }}
              className={`${inputCls} bg-white ${border}`}
              {...aria}
            >
              {!variant && <option value="">Choose…</option>}
              {field.variants.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <ErrorText id={errId} message={error ?? ctx.errors[`${path}.${disc}`]} />
            {variant && (
              <ObjectFields
                fields={variant.fields}
                value={obj}
                onChange={onChange}
                path={path}
                ctx={ctx}
                grid
              />
            )}
          </div>
        );
      }
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm text-gray-700">{field.label}</legend>
          {field.note && <p className="text-xs text-gray-500">{field.note}</p>}
          <ErrorText id={errId} message={error} />
          <ObjectFields
            fields={field.fields ?? []}
            value={obj}
            onChange={onChange}
            path={path}
            ctx={ctx}
            grid
          />
        </fieldset>
      );
    }
  }
}

function ObjectFields({
  fields,
  value,
  onChange,
  path,
  ctx,
  grid,
}: {
  fields: CatalogField[];
  value: Obj;
  onChange: (next: Obj) => void;
  path: string;
  ctx: Ctx;
  grid?: boolean;
}) {
  const visible = fields.filter((f) => !f.prayers || !ctx.prayer || f.prayers.includes(ctx.prayer));
  return (
    <div className={grid && visible.length > 2 ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      {visible.map((f) => (
        <Field
          key={f.name}
          field={f}
          value={value[f.name]}
          onChange={(v) => onChange(setKey(value, f, v))}
          path={path ? `${path}.${f.name}` : f.name}
          ctx={ctx}
        />
      ))}
    </div>
  );
}

interface Props {
  fields: CatalogField[];
  value: Obj;
  onChange: (next: Obj) => void;
  /** Error-path prefix, e.g. "base" or "limits". */
  path: string;
  errors: FieldErrors;
  idPrefix: string;
  prayer?: PrayerName;
}

export function RuleFields({ fields, value, onChange, path, errors, idPrefix, prayer }: Props) {
  return (
    <ObjectFields
      fields={fields}
      value={value}
      onChange={onChange}
      path={path}
      ctx={{ errors, idPrefix, prayer }}
    />
  );
}
