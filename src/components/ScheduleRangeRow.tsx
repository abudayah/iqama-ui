import type { DailySchedule, Override, PrayerName } from '../types/index';
import { isActive } from '../logic/is-active';

interface ScheduleRangeRowProps {
  schedule: DailySchedule;
  overrides: Override[];
  onCellTap: (date: string, prayer: PrayerName) => void;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export function ScheduleRangeRow({ schedule, overrides, onCellTap }: ScheduleRangeRowProps) {
  const activeOverrides = overrides.filter(o => isActive(o, schedule.date));

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex items-center px-4 py-2 bg-gray-50">
        <span className="text-sm font-medium text-gray-800 flex-1">{schedule.date}</span>
        <span className="text-xs text-gray-500">{schedule.day_of_week}</span>
        {schedule.metadata.has_overrides && (
          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Overrides
          </span>
        )}
      </div>
      <div className="flex">
        {PRAYERS.map(prayer => {
          const override = activeOverrides.find(o => o.prayer === prayer);
          return (
            <button
              key={prayer}
              onClick={() => onCellTap(schedule.date, prayer)}
              className="flex-1 flex flex-col items-center py-3 px-1 min-h-[44px] hover:bg-blue-50 transition-colors"
              aria-label={`${PRAYER_LABELS[prayer]} on ${schedule.date}`}
            >
              <span className="text-xs text-gray-500">{PRAYER_LABELS[prayer]}</span>
              <span className="text-xs font-medium text-gray-800 mt-0.5">
                {schedule[prayer].iqama}
              </span>
              {override && (
                <span className="text-xs text-orange-600 mt-0.5">
                  {override.overrideType === 'FIXED' ? override.value : `${override.value}m`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
