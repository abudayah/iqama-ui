import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleRangeRow } from './ScheduleRangeRow';
import type { DailySchedule } from '../types/index';

const entry = (azan: string, iqama: string) => ({ azan, iqama });
const day: DailySchedule = {
  date: '2027-06-20',
  hijri_date: '',
  day_of_week: 'Sunday',
  is_dst: true,
  fajr: entry('03:40', '04:30'),
  sunrise: '05:05',
  dhuhr: entry('13:10', '13:45'),
  asr: entry('17:30', '17:45'),
  maghrib: entry('21:10', '21:20'),
  isha: entry('22:50', '23:00'),
  metadata: { calculation_method: 'NorthAmerica', has_overrides: false },
};

describe('ScheduleRangeRow — iqama_conflict badge', () => {
  it('shows no badge when the field is absent', () => {
    render(<ScheduleRangeRow schedule={day} overrides={[]} />);
    expect(screen.queryByText('Conflict')).toBeNull();
  });
  it('shows a badge on the prayer and on the day when flagged', () => {
    render(
      <ScheduleRangeRow
        schedule={{ ...day, iqama_conflict: true, fajr: { ...day.fajr, iqama_conflict: true } }}
        overrides={[]}
      />,
    );
    expect(screen.getByTestId('conflict-badge-fajr')).toBeInTheDocument();
    expect(screen.getByTestId('day-conflict-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('conflict-badge-isha')).toBeNull();
  });
});
