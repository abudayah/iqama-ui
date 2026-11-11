import type { CatalogField } from '../types/iqama-rules';

type Obj = Record<string, unknown>;

/** "month (1-12)" -> { key: 'month', min: 1, max: 12 } */
export function parseOptionField(s: string) {
  const m = /^(\w+)\s*\((\d+)-(\d+)\)$/.exec(s);
  return m ? { key: m[1]!, min: Number(m[2]), max: Number(m[3]) } : { key: s, min: 0, max: 999 };
}

function defaultValue(f: CatalogField): unknown {
  switch (f.kind) {
    case 'int':
      return Math.min(Math.max(10, f.min ?? 0), f.max ?? 10);
    case 'time':
      return '12:00';
    case 'list':
      return Array.from({ length: f.minItems ?? 1 }, () => defaultObject(f.item ?? []));
    case 'oneOf': {
      const o = f.options?.[0];
      return o
        ? Object.fromEntries([
            ['kind', o.kind],
            ...o.fields.map((s) => [parseOptionField(s).key, parseOptionField(s).min]),
          ])
        : {};
    }
  }
}

export function defaultObject(fields: CatalogField[]): Obj {
  return Object.fromEntries(fields.map((f) => [f.name, defaultValue(f)]));
}
