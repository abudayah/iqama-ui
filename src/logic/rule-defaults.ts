/**
 * Starting values for new form content. Only catalog-supplied defaults are
 * used; where the catalog has none the field starts empty and must be entered.
 */
import type { CatalogField } from '../types/iqama-rules';

type Obj = Record<string, unknown>;

export function emptyValue(f: CatalogField): unknown {
  if (f.default !== undefined) return f.default;
  switch (f.kind) {
    case 'bool':
      return false;
    case 'list':
      return Array.from({ length: f.minItems ?? 0 }, () => emptyObject(f.item ?? []));
    case 'object':
      if (f.variants && f.discriminator) {
        // Picking the first variant only makes its fields visible; they stay empty.
        const v = f.variants[0];
        return v ? { [f.discriminator]: v.value, ...emptyObject(v.fields) } : {};
      }
      return emptyObject(f.fields ?? []);
    default:
      return '';
  }
}

export function emptyObject(fields: CatalogField[]): Obj {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}

/** Fields of the variant selected in `value` (discriminated objects). */
export function variantFields(f: CatalogField, value: Obj) {
  return f.variants?.find((v) => v.value === value[f.discriminator ?? '']);
}

/**
 * Drop empty optional values ('' / NaN / undefined) before a rule is sent.
 * The validator has already rejected empty required values, so only optional
 * keys can be removed here. Booleans, numbers and lists are kept as they are.
 */
export function pruneEmpty<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => pruneEmpty(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Obj)
        .filter(([, v]) => !(v === undefined || v === '' || (typeof v === 'number' && isNaN(v))))
        .map(([k, v]) => [k, pruneEmpty(v)]),
    ) as T;
  }
  return value;
}
