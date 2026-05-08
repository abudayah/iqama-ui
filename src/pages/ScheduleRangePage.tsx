import { useState } from 'react';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useOverrides } from '../hooks/useOverrides';
import { WeekSelect } from '../components/WeekSelect';
import { ScheduleRangeTable } from '../components/ScheduleRangeTable';

/** Return the Friday→Thursday week that contains today. */
function getCurrentWeek(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun … 5=Fri … 6=Sat
  // Days since last Friday: Fri=0, Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
  const daysSinceFriday = (dayOfWeek + 2) % 7;

  const friday = new Date(today);
  friday.setDate(today.getDate() - daysSinceFriday);

  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { start: fmt(friday), end: fmt(thursday) };
}

export function ScheduleRangePage() {
  const defaultWeek = getCurrentWeek();
  const [start, setStart] = useState(defaultWeek.start);
  const [end, setEnd] = useState(defaultWeek.end);

  const { data: schedules, loading, error } = useScheduleRange(start, end);
  const { overrides } = useOverrides();

  function handleWeekChange(newStart: string, newEnd: string) {
    setStart(newStart);
    setEnd(newEnd);
  }

  return (
    <div id="schedule-range-page">
      <div className="p-4 bg-white border-b border-gray-200">
        <label className="block text-xs text-gray-500 mb-1">Week</label>
        <WeekSelect start={start} end={end} onWeekChange={handleWeekChange} />
      </div>
      <div id="schedule-range-content" className="p-4">
        <ScheduleRangeTable
          schedules={schedules}
          overrides={overrides}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
