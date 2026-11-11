/** API client for the Iqama Rules admin endpoints. */
import { apiFetch } from '../api/api-client';
import type {
  IqamaCatalog,
  IqamaPreviewResponse,
  IqamaRuleVersion,
  IqamaRulesConfig,
  RuleSet,
} from '../types/iqama-rules';

const BASE = '/api/v1/admin/iqama-rules';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const fetchIqamaRules = () => apiFetch<IqamaRulesConfig>(BASE, { requiresAuth: true });

export const fetchIqamaCatalog = () =>
  apiFetch<IqamaCatalog>(`${BASE}/catalog`, { requiresAuth: true });

export const previewIqamaRules = (settings: RuleSet, effectiveFrom?: string) =>
  apiFetch<IqamaPreviewResponse>(`${BASE}/preview`, {
    method: 'POST',
    requiresAuth: true,
    headers: JSON_HEADERS,
    body: JSON.stringify({ settings: JSON.stringify(settings), effectiveFrom }),
  });

export const saveIqamaRules = (
  settings: RuleSet,
  effectiveFrom: string,
  previewId: string,
  expectedRevision: number,
) =>
  apiFetch<IqamaRuleVersion>(`${BASE}/base`, {
    method: 'PUT',
    requiresAuth: true,
    headers: JSON_HEADERS,
    body: JSON.stringify({
      settings: JSON.stringify(settings),
      effectiveFrom,
      previewId,
      expectedRevision,
    }),
  });
