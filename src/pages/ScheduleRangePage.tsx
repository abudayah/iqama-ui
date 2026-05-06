import { useState } from 'react';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useOverrides } from '../hooks/useOverrides';
import { DateRangePicker } from '../components/DateRangePicker';
import { ScheduleRangeTable } from '../components/ScheduleRangeTable';

function getDefaultRange(): { start: string; end: string } {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { start: fmt(today), end: fmt(end) };
}

export function ScheduleRangePage() {
  const defaultRange = getDefaultRange();
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);

  const { data: schedules, loading, error } = useScheduleRange(start, end);
  const { overrides } = useOverrides();

  const handleRangeChange = (newStart: string, newEnd: string) => {
    setStart(newStart);
    setEnd(newEnd);
  };

  return (
    <div id="schedule-range-page">
      <DateRangePicker start={start} end={end} onRangeChange={handleRangeChange} />
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
