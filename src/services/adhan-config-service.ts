/**
 * adhan-config-service.ts
 *
 * API client functions for the Adhan Configuration admin endpoints.
 */

import { apiFetch } from '../api/api-client';
import type {
  AdhanConfigResponse,
  AdhanCatalogResponse,
  AdhanConfigVersion,
  AdhanConfigPeriod,
  AdhanConfigAuditEntry,
  AdhanSettings,
  PartialAdhanSettings,
  PreviewResponse,
} from '../types';

const BASE = '/api/v1/admin/adhan-config';

// ── GET ────────────────────────────────────────────────────────────────────────

export function fetchAdhanConfig(): Promise<AdhanConfigResponse> {
  return apiFetch<AdhanConfigResponse>(BASE, { requiresAuth: true });
}

export function fetchAdhanCatalog(): Promise<AdhanCatalogResponse> {
  return apiFetch<AdhanCatalogResponse>(`${BASE}/catalog`, { requiresAuth: true });
}

export function fetchAdhanHistory(
  page = 1,
  pageSize = 20,
): Promise<{ items: AdhanConfigAuditEntry[]; total: number; page: number; pageSize: number }> {
  return apiFetch(`${BASE}/history?page=${page}&pageSize=${pageSize}`, {
    requiresAuth: true,
  });
}

// ── Preview (required before any write) ───────────────────────────────────────

export function previewVersion(
  settings: AdhanSettings,
  effectiveFrom: string,
): Promise<PreviewResponse> {
  return apiFetch<PreviewResponse>(`${BASE}/preview`, {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: JSON.stringify(settings),
      type: 'version',
      effectiveFrom,
    }),
  });
}

export function previewPeriod(
  settings: PartialAdhanSettings,
  startDate: string,
  endDate: string,
): Promise<PreviewResponse> {
  return apiFetch<PreviewResponse>(`${BASE}/preview`, {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: JSON.stringify(settings),
      type: 'period',
      periodStartDate: startDate,
      periodEndDate: endDate,
    }),
  });
}

// ── Writes ─────────────────────────────────────────────────────────────────────

export function applyBaseVersion(
  settings: AdhanSettings,
  effectiveFrom: string,
  previewId: string,
  expectedRevision: number,
  reason?: string,
): Promise<AdhanConfigVersion> {
  return apiFetch<AdhanConfigVersion>(`${BASE}/base`, {
    method: 'PUT',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: JSON.stringify(settings),
      effectiveFrom,
      previewId,
      expectedRevision,
      reason,
    }),
  });
}

export function createPeriod(
  label: string,
  startDate: string,
  endDate: string,
  settings: PartialAdhanSettings,
  previewId: string,
  reason?: string,
): Promise<AdhanConfigPeriod> {
  return apiFetch<AdhanConfigPeriod>(`${BASE}/periods`, {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label,
      startDate,
      endDate,
      settings: JSON.stringify(settings),
      previewId,
      reason,
    }),
  });
}

export function updatePeriod(
  id: number,
  patch: {
    label?: string;
    startDate?: string;
    endDate?: string;
    settings?: PartialAdhanSettings;
  },
  previewId: string,
  reason?: string,
): Promise<AdhanConfigPeriod> {
  return apiFetch<AdhanConfigPeriod>(`${BASE}/periods/${id}`, {
    method: 'PUT',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...patch,
      settings: patch.settings ? JSON.stringify(patch.settings) : undefined,
      previewId,
      reason,
    }),
  });
}

export function deletePeriod(id: number, previewId: string): Promise<void> {
  return apiFetch<void>(`${BASE}/periods/${id}?previewId=${encodeURIComponent(previewId)}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export function revertHistory(id: number): Promise<AdhanConfigVersion> {
  return apiFetch<AdhanConfigVersion>(`${BASE}/history/${id}/revert`, {
    method: 'POST',
    requiresAuth: true,
  });
}
