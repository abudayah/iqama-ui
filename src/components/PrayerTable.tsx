import type { DailySchedule, PrayerName } from '../types/index';
import { PrayerRow } from './PrayerRow';

interface PrayerTableProps {
  schedule: DailySchedule;
  nextPrayer: PrayerName | null;
  isToday: boolean;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function PrayerTable({ schedule, nextPrayer, isToday }: PrayerTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">{schedule.date}</p>
            <p className="text-xs text-gray-500">{schedule.hijri_date}</p>
            <p className="text-xs text-gray-500">{schedule.day_of_week}</p>
          </div>
          {schedule.metadata.has_overrides && (
            <span
              data-testid="override-indicator"
              className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full"
            >
              Overrides active
            </span>
          )}
        </div>
      </div>
      {/* Column headers */}
      <div className="flex px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        <span className="flex-1">Prayer</span>
        <span className="w-16 text-center">Azan</span>
        <span className="w-16 text-center">Iqama</span>
      </div>
      {/* Fajr */}
      <PrayerRow
        name="fajr"
        entry={schedule.fajr}
        isNext={isToday && nextPrayer === 'fajr'}
      />
      {/* Sunrise — always after Fajr */}
      <PrayerRow
        name="sunrise"
        entry={{ azan: schedule.sunrise }}
        isNext={false}
      />
      {/* Remaining prayers */}
      {PRAYERS.filter(p => p !== 'fajr').map(prayer => (
        <PrayerRow
          key={prayer}
          name={prayer}
          entry={schedule[prayer]}
          isNext={isToday && nextPrayer === prayer}
        />
      ))}
    </div>
  );
}
