import { useState } from 'react';
import { useScheduleRange } from '../hooks/useScheduleRange';
import { useOverrides } from '../hooks/useOverrides';
import { DateRangePicker } from '../components/DateRangePicker';
import { ScheduleRangeTable } from '../components/ScheduleRangeTable';
import { OverrideFormModal } from '../components/OverrideFormModal';
import type { PrayerName, OverridePayload } from '../types/index';

function getDefaultRange(): { start: string; end: string } {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  return {
    start: today.toISOString().split('T')[0]!,
    end: end.toISOString().split('T')[0]!,
  };
}

export function ScheduleRangePage() {
  const defaultRange = getDefaultRange();
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const [prefillPrayer, setPrefillPrayer] = useState<PrayerName | null>(null);

  const { data: schedules, loading, error } = useScheduleRange(start, end);
  const { overrides, create } = useOverrides();

  const handleRangeChange = (newStart: string, newEnd: string) => {
    setStart(newStart);
    setEnd(newEnd);
  };

  const handleCellTap = (date: string, prayer: PrayerName) => {
    setPrefillDate(date);
    setPrefillPrayer(prayer);
  };

  const handleSave = async (payload: OverridePayload) => {
    await create(payload);
    setPrefillDate(null);
    setPrefillPrayer(null);
  };

  return (
    <div>
      <DateRangePicker start={start} end={end} onRangeChange={handleRangeChange} />
      <div className="p-4">
        <ScheduleRangeTable
          schedules={schedules}
          overrides={overrides}
          loading={loading}
          error={error}
          onCellTap={handleCellTap}
        />
      </div>
      {prefillDate && prefillPrayer && (
        <OverrideFormModal
          initial={{
            id: 0,
            prayer: prefillPrayer,
            overrideType: 'FIXED',
            value: '',
            startDate: prefillDate,
            endDate: prefillDate,
          }}
          onSave={handleSave}
          onClose={() => { setPrefillDate(null); setPrefillPrayer(null); }}
        />
      )}
    </div>
  );
}
