import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import {
  fetchIqamaCatalog,
  fetchIqamaRules,
  previewIqamaRules,
  saveIqamaRules,
} from './iqama-rules-service';
import { ApiError } from '../api/errors';
import { R, SEED_RULES, makeConfig, server, state, setupIqamaServer } from '../test/iqama-fixtures';

setupIqamaServer();

describe('iqama-rules-service (contract with the engine)', () => {
  it('reads the config and catalog shapes', async () => {
    const config = await fetchIqamaRules();
    expect(config.latest?.versionId).toBe(3);
    expect(config.latest?.rules).toEqual(SEED_RULES);
    expect(config.upcoming).toHaveLength(1);
    const catalog = await fetchIqamaCatalog();
    expect(catalog.modifiers.map((m) => m.name)).toEqual([
      'limits',
      'rounding',
      'weekdayAdjust',
      'weeklyLock',
    ]);
  });

  it('sends the admin key header and the RuleSet as a JSON string', async () => {
    let headers: Headers | undefined;
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${R}/preview`, async ({ request }) => {
        headers = request.headers;
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );
    await previewIqamaRules(SEED_RULES, '2026-11-13');
    expect(headers?.get('x-api-key')).toBe('k');
    expect(typeof body['settings']).toBe('string');
    expect(JSON.parse(body['settings'] as string)).toEqual(SEED_RULES);
    expect(body['effectiveFrom']).toBe('2026-11-13');
  });

  it('PUT carries settings, date, token, revision, and only the optional keys that are set', async () => {
    await saveIqamaRules(SEED_RULES, '2026-11-13', 'tok', 3);
    expect(Object.keys(state.putBodies[0]!).sort()).toEqual([
      'effectiveFrom',
      'expectedRevision',
      'previewId',
      'settings',
    ]);
    await saveIqamaRules(SEED_RULES, '2026-11-13', 'tok', 3, {
      reason: '  because  ',
      acknowledgeConflicts: true,
      requestHash: 'abc',
    });
    expect(state.putBodies[1]).toMatchObject({
      reason: 'because',
      acknowledgeConflicts: true,
      requestHash: 'abc',
    });
    await saveIqamaRules(SEED_RULES, '2026-11-13', 'tok', 3, {
      reason: '   ',
      acknowledgeConflicts: false,
    });
    expect(state.putBodies[2]).not.toHaveProperty('reason');
    expect(state.putBodies[2]).not.toHaveProperty('acknowledgeConflicts');
  });

  it('exposes the 422 code and the 400 field errors on ApiError', async () => {
    state.putResponses = [
      { status: 422, body: { code: 'IQAMA_PREVIEW_MISMATCH', message: 'differs' } },
      {
        status: 400,
        body: { message: 'bad', errors: [{ path: 'fajr.base.minutes', message: 'too big' }] },
      },
      { status: 409, body: { message: 'stale' } },
    ];
    const err = await saveIqamaRules(SEED_RULES, 'd', 't', 1).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, code: 'IQAMA_PREVIEW_MISMATCH', message: 'differs' });
    const err2 = await saveIqamaRules(SEED_RULES, 'd', 't', 1).catch((e: unknown) => e);
    expect(err2).toMatchObject({
      status: 400,
      errors: [{ path: 'fajr.base.minutes', message: 'too big' }],
    });
    const err3 = await saveIqamaRules(SEED_RULES, 'd', 't', 1).catch((e: unknown) => e);
    expect(err3).toMatchObject({ status: 409, message: 'stale' });
  });

  it('the config fixture matches the documented shape', () => {
    const c = makeConfig();
    expect(Object.keys(c).sort()).toEqual(
      [
        'cutover',
        'currentRevision',
        'defaultEffectiveFrom',
        'effective',
        'latest',
        'mode',
        'timezone',
        'today',
        'upcoming',
        'versions',
      ].sort(),
    );
    expect(Object.keys(c.latest!).sort()).toEqual(
      ['createdAt', 'effectiveFrom', 'error', 'reason', 'rules', 'versionId'].sort(),
    );
  });
});
