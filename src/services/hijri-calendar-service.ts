import { apiFetch } from '../api/api-client';
import { EidPrayerRecord, HijriCalendarStatus, SubmitOverridePayload } from '../types';

export async function fetchHijriStatus(): Promise<HijriCalendarStatus> {
  return apiFetch<HijriCalendarStatus>('/api/v1/hijri-calendar/status', { requiresAuth: true });
}

export async function submitOverride(payload: SubmitOverridePayload): Promise<void> {
  return apiFetch<void>('/api/v1/hijri-calendar/override', {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteOverride(): Promise<void> {
  return apiFetch<void>('/api/v1/hijri-calendar/override', {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function fetchEidPrayers(date?: string, admin?: boolean): Promise<EidPrayerRecord[]> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (admin) params.set('admin', 'true');
  const query = params.toString();
  const path = query
    ? `/api/v1/hijri-calendar/eid-prayers?${query}`
    : '/api/v1/hijri-calendar/eid-prayers';
  return apiFetch<EidPrayerRecord[]>(path);
  // No requiresAuth — public endpoint
}

export async function fetchQiyamConfig(): Promise<{ hijri_year: number; start_time: string } | null> {
  return apiFetch<{ hijri_year: number; start_time: string } | null>(
    '/api/v1/hijri-calendar/qiyam-config',
  );
  // No requiresAuth — public endpoint
}

export async function saveQiyamConfig(startTime: string): Promise<void> {
  return apiFetch<void>('/api/v1/hijri-calendar/qiyam-config', {
    method: 'POST',
    requiresAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_time: startTime }),
  });
}
