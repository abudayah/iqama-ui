import { Override, OverridePayload } from '../types/index';
import { apiFetch } from '../api/api-client';

export async function fetchOverrides(): Promise<Override[]> {
  return apiFetch<Override[]>('/api/v1/admin/overrides', { requiresAuth: true });
}

export async function createOverride(payload: OverridePayload): Promise<Override> {
  return apiFetch<Override>('/api/v1/admin/overrides', {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateOverride(
  id: number,
  payload: Partial<OverridePayload>,
): Promise<Override> {
  return apiFetch<Override>(`/api/v1/admin/overrides/${id}`, {
    method: 'PATCH',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteOverride(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/overrides/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}
