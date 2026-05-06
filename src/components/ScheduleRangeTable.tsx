import type { DailySchedule, Override } from '../types/index';
import { ScheduleRangeRow } from './ScheduleRangeRow';

interface ScheduleRangeTableProps {
  schedules: DailySchedule[] | null;
  overrides: Override[];
  loading: boolean;
  error: Error | null;
}

export function ScheduleRangeTable({
  schedules,
  overrides,
  loading,
  error,
}: ScheduleRangeTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 text-sm" role="alert">
        {error.message}
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return <div className="p-4 text-center text-gray-500 text-sm">No schedule data available.</div>;
  }

  return (
    <div id="schedule-range-table" className="bg-white rounded-lg shadow overflow-hidden">
      {schedules.map((schedule) => (
        <ScheduleRangeRow key={schedule.date} schedule={schedule} overrides={overrides} />
      ))}
    </div>
  );
}
