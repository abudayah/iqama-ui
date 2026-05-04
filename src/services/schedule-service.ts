import { DailySchedule } from '../types/index';
import { apiFetch } from '../api/api-client';

export async function fetchScheduleForDate(date: string): Promise<DailySchedule> {
  return apiFetch<DailySchedule>(`/api/v1/schedule?date=${date}`);
}

export async function fetchScheduleForRange(start: string, end: string): Promise<DailySchedule[]> {
  return apiFetch<DailySchedule[]>(`/api/v1/schedule?start_date=${start}&end_date=${end}`);
}
