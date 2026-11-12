/**
 * Shared test fixtures for the Iqama Rules UI. Shapes follow the engine's "UI
 * contract (exact shapes)" (iqama-engine c65aac2). The catalog and the seed
 * rules are verbatim snapshots of the engine's own constants.
 */
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { CONFIG_KEYS } from '../types/index';
import type {
  IqamaCatalog,
  IqamaConflict,
  IqamaPreviewResponse,
  IqamaRulesConfig,
  IqamaVersion,
  RuleSet,
} from '../types/iqama-rules';
import { ENGINE_CATALOG } from './engine-catalog.fixture';
import { ENGINE_SEED_RULES } from './engine-seed-rules.fixture';

export const BASE = 'https://api.example.com';
export const R = `${BASE}/api/v1/admin/iqama-rules`;
export const CATALOG = ENGINE_CATALOG as unknown as IqamaCatalog;
export const SEED_RULES = ENGINE_SEED_RULES as unknown as RuleSet;
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export const version = (
  id: number,
  effectiveFrom: string,
  rules: RuleSet = SEED_RULES,
  reason: string | null = null,
): IqamaVersion => ({
  versionId: id,
  effectiveFrom,
  createdAt: '2026-11-01T10:00:00.000Z',
  reason,
  rules,
  error: null,
});

export function makeConfig(patch: Partial<IqamaRulesConfig> = {}): IqamaRulesConfig {
  const v3 = version(3, '2026-11-13', SEED_RULES, 'Initial import');
  return {
    mode: 'db',
    cutover: '2026-11-13',
    currentRevision: 3,
    today: '2026-11-11',
    timezone: 'America/Vancouver',
    defaultEffectiveFrom: '2026-11-13',
    effective: null, // before the cutover
    latest: v3,
    upcoming: [v3],
    versions: [
      {
        id: 3,
        effectiveFrom: '2026-11-13',
        settings: JSON.stringify(SEED_RULES),
        createdBy: 'admin',
        createdAt: '2026-11-01T10:00:00.000Z',
        reason: 'Initial import',
      },
    ],
    ...patch,
  };
}

/** Test state the handlers read, reset before every test. */
export const state = {
  config: makeConfig(),
  previewCalls: [] as { settings: RuleSet; effectiveFrom: string | undefined }[],
  previewSeq: 0,
  previewConflicts: undefined as IqamaConflict[] | undefined,
  previewRevision: undefined as number | undefined,
  /** Optional gate: a promise a preview waits for (per effectiveFrom). */
  previewGate: undefined as
    | ((effectiveFrom: string | undefined) => Promise<void> | undefined)
    | undefined,
  putBodies: [] as Record<string, unknown>[],
  putResponses: [] as { status: number; body: unknown }[],
  getCount: 0,
  lastPreview: undefined as IqamaPreviewResponse | undefined,
  /** Optional change to each preview body before it is returned. */
  previewMutate: undefined as ((body: IqamaPreviewResponse) => void) | undefined,
};

/** Fake but deterministic: same rules + date + revision give the same hash. */
const fakeHash = (s: string) =>
  `hash-${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)}`;

export function previewBody(
  effectiveFrom: string,
  settings: string,
  seq: number,
): IqamaPreviewResponse {
  const prayer = (clamped: boolean) => ({
    azan: '06:00',
    current: { iqama: '06:05', clamped: false },
    proposed: { iqama: '06:20', clamped },
  });
  return {
    previewId: `tok-${seq}`,
    effectiveFrom,
    currentRevision: state.previewRevision ?? state.config.currentRevision,
    requestHash: fakeHash(settings + '|' + effectiveFrom),
    warnings: [],
    ...(state.previewConflicts ? { conflicts: state.previewConflicts } : {}),
    days: Array.from({ length: 14 }, (_, i) => ({
      date: `2026-11-${String(13 + i).padStart(2, '0')}`,
      day_of_week: 'Friday',
      prayers: Object.fromEntries(PRAYERS.map((p) => [p, prayer(i === 1)])) as never,
    })),
    summary: {
      from: effectiveFrom,
      to: '2027-11-12',
      totalDays: 365,
      daysChanged: 120,
      daysClamped: 7,
      daysClampedCurrent: 0,
      ...(state.previewConflicts ? { conflictDays: state.previewConflicts.length } : {}),
      firstChangedDates: [effectiveFrom],
      firstClampedDates: ['2026-11-14'],
      byPrayer: Object.fromEntries(
        PRAYERS.map((p) => [p, { daysChanged: 120, daysClamped: 7 }]),
      ) as never,
    },
  };
}

export const server = setupServer();

/** Register the standard handlers and lifecycle for a test file. */
export function setupIqamaServer() {
  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  beforeEach(() => {
    state.config = makeConfig();
    state.previewCalls = [];
    state.previewSeq = 0;
    state.previewConflicts = undefined;
    state.previewRevision = undefined;
    state.previewGate = undefined;
    state.putBodies = [];
    state.putResponses = [];
    state.getCount = 0;
    state.lastPreview = undefined;
    state.previewMutate = undefined;
    localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE);
    localStorage.setItem(CONFIG_KEYS.API_KEY, 'k');
    server.use(
      http.get(R, () => {
        state.getCount++;
        return HttpResponse.json(state.config);
      }),
      http.get(`${R}/catalog`, () => HttpResponse.json(ENGINE_CATALOG)),
      http.post(`${R}/preview`, async ({ request }) => {
        const b = (await request.json()) as { settings: string; effectiveFrom?: string };
        const seq = ++state.previewSeq;
        state.previewCalls.push({
          settings: JSON.parse(b.settings) as RuleSet,
          effectiveFrom: b.effectiveFrom,
        });
        await state.previewGate?.(b.effectiveFrom);
        const body = previewBody(b.effectiveFrom ?? '', b.settings, seq);
        state.previewMutate?.(body);
        state.lastPreview = body;
        return HttpResponse.json(body);
      }),
      http.put(`${R}/base`, async ({ request }) => {
        state.putBodies.push((await request.json()) as Record<string, unknown>);
        const next = state.putResponses.shift();
        return next
          ? HttpResponse.json(next.body as never, { status: next.status })
          : HttpResponse.json({ id: 4 });
      }),
      http.get(`${BASE}/api/v1/admin/overrides`, () => HttpResponse.json([])),
      http.get(`${BASE}/api/v1/schedule`, () => HttpResponse.json([])),
    );
  });
}
