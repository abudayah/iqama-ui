/**
 * Recursive validator driven only by the engine catalog (field kinds, required,
 * min/max, integer, list counts, time format, enum options, variants).
 * The engine stays the final authority; this only stops obviously invalid input
 * from being previewed or saved.
 *
 * shortcut: no cross-field rules (strictly increasing Scaled-gap Azan times,
 * unique Seasonal start dates, day-in-month). The engine reports those as 400
 * { errors: [{ path, message }] }, shown beside the sheet. Upgrade if the
 * catalog ever describes them.
 */
import type { PrayerName } from '../types/index';
import i18n from '../i18n';
import type { CatalogField, IqamaCatalog } from '../types/iqama-rules';

export type FieldErrors = Record<string, string>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True when a value counts as "not entered". */
export const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v));

const join = (path: string, key: string | number) => (path ? `${path}.${key}` : String(key));

function validateFields(
  fields: CatalogField[],
  value: Record<string, unknown>,
  path: string,
  prayer: PrayerName | undefined,
  errors: FieldErrors,
) {
  for (const f of fields) {
    if (f.prayers && prayer && !f.prayers.includes(prayer)) {
      if (!isEmpty(value[f.name]))
        errors[join(path, f.name)] = i18n.t('validation.unavailablePrayer');
      continue;
    }
    validateField(f, value[f.name], join(path, f.name), prayer, errors);
  }
}

export function validateField(
  f: CatalogField,
  value: unknown,
  path: string,
  prayer: PrayerName | undefined,
  errors: FieldErrors,
): void {
  if (f.kind === 'bool') {
    if (value !== undefined && typeof value !== 'boolean')
      errors[path] = i18n.t('validation.boolean');
    return;
  }
  if (isEmpty(value)) {
    if (f.required) errors[path] = i18n.t('validation.required');
    return;
  }
  switch (f.kind) {
    case 'int': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors[path] = i18n.t('validation.number');
      } else if (f.integer && !Number.isInteger(value)) {
        errors[path] = i18n.t('validation.integer');
      } else if (f.min !== undefined && value < f.min) {
        errors[path] = i18n.t('validation.min', { min: f.min });
      } else if (f.max !== undefined && value > f.max) {
        errors[path] = i18n.t('validation.max', { max: f.max });
      }
      return;
    }
    case 'time':
      if (typeof value !== 'string' || !TIME_RE.test(value))
        errors[path] = i18n.t('validation.time');
      return;
    case 'enum':
      if (!f.options?.some((o) => o.value === value)) errors[path] = i18n.t('validation.option');
      return;
    case 'list': {
      if (!Array.isArray(value)) {
        errors[path] = i18n.t('validation.list');
        return;
      }
      if (f.minItems !== undefined && value.length < f.minItems)
        errors[path] = i18n.t('validation.minItems', { min: f.minItems });
      else if (f.maxItems !== undefined && value.length > f.maxItems)
        errors[path] = i18n.t('validation.maxItems', { max: f.maxItems });
      value.forEach((item, i) => {
        if (typeof item !== 'object' || item === null) {
          errors[join(path, i)] = i18n.t('validation.invalidItem');
          return;
        }
        validateFields(
          f.item ?? [],
          item as Record<string, unknown>,
          join(path, i),
          prayer,
          errors,
        );
      });
      return;
    }
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors[path] = i18n.t('validation.invalidValue');
        return;
      }
      const obj = value as Record<string, unknown>;
      if (f.variants && f.discriminator) {
        const key = obj[f.discriminator];
        const variant = f.variants.find((v) => v.value === key);
        if (!variant) {
          errors[join(path, f.discriminator)] = i18n.t('validation.option');
          return;
        }
        validateFields(variant.fields, obj, path, prayer, errors);
      } else {
        validateFields(f.fields ?? [], obj, path, prayer, errors);
        // An enabled optional group with nothing in it is almost certainly a mistake.
        const all = f.fields ?? [];
        if (!f.required && all.length > 0 && all.every((x) => !x.required)) {
          const set = all.some((x) => !isEmpty(obj[x.name]));
          if (!set) errors[path] = i18n.t('ruleEditor.emptyGroup');
        }
      }
      return;
    }
  }
}

/** Fields (and their paths) that a prayer may use, for one modifier. */
export function modifierAllowedFor(m: CatalogField, prayer: PrayerName): boolean {
  return !m.prayers || m.prayers.includes(prayer);
}

/** Validate a whole prayer rule against the catalog. Empty result = valid. */
export function validateRule(
  rule: Record<string, unknown>,
  prayer: PrayerName,
  catalog: IqamaCatalog,
): FieldErrors {
  const errors: FieldErrors = {};
  const base = rule['base'] as Record<string, unknown> | undefined;
  const baseType = catalog.baseTypes.find((b) => b.type === base?.['type']);
  if (!base || !baseType) {
    errors['base.type'] = i18n.t('validation.ruleType');
  } else {
    validateFields(baseType.fields, base, 'base', prayer, errors);
  }
  for (const m of catalog.modifiers) {
    if (!modifierAllowedFor(m, prayer)) {
      if (rule[m.name] !== undefined) errors[m.name] = i18n.t('validation.unavailablePrayer');
      continue;
    }
    if (rule[m.name] === undefined) continue;
    validateField(m, rule[m.name], m.name, prayer, errors);
  }
  return errors;
}
