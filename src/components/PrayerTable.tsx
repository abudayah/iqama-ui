import type { DailySchedule, PrayerName } from '../types/index';
import { PrayerRow } from './PrayerRow';

interface PrayerTableProps {
  schedule: DailySchedule;
  nextPrayer: PrayerName | null;
  isToday: boolean;
  activeTab: 'today' | 'tomorrow';
  onTabChange: (tab: 'today' | 'tomorrow') => void;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatDisplayDate(dateStr: string, dayOfWeek: string): string {
  // dateStr is YYYY-MM-DD, dayOfWeek is e.g. "Friday"
  const [, month, day] = dateStr.split('-').map(Number);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${dayOfWeek}, ${monthNames[month! - 1]} ${day}`;
}

/** Returns true if the prayer's azan time has already passed relative to now. */
function isPrayerPast(schedule: DailySchedule, prayer: PrayerName, now: Date): boolean {
  const [h, m] = schedule[prayer].azan.split(':').map(Number);
  const [y, mo, d] = schedule.date.split('-').map(Number);
  const azanDate = new Date(y!, mo! - 1, d!, h!, m!, 0, 0);
  return azanDate <= now;
}

export function PrayerTable({
  schedule,
  nextPrayer,
  isToday,
  activeTab,
  onTabChange,
}: PrayerTableProps) {
  const now = new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Date header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatDisplayDate(schedule.date, schedule.day_of_week)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{schedule.hijri_date}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onTabChange('today')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
              activeTab === 'today'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-transparent text-gray-500 border border-gray-200'
            }`}
            aria-pressed={activeTab === 'today'}
          >
            Today
          </button>
          <button
            onClick={() => onTabChange('tomorrow')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
              activeTab === 'tomorrow'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-transparent text-gray-500 border border-gray-200'
            }`}
            aria-pressed={activeTab === 'tomorrow'}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid px-4 py-2 border-b border-gray-100"
        style={{ gridTemplateColumns: '1fr 72px 72px 28px' }}
      >
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Prayer</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Azan</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Iqama</span>
        <span />
      </div>

      {/* Fajr */}
      <div className="border-t border-gray-100">
        <PrayerRow
          name="fajr"
          entry={schedule.fajr}
          isNext={isToday && nextPrayer === 'fajr'}
          isPast={isToday && isPrayerPast(schedule, 'fajr', now) && nextPrayer !== 'fajr'}
        />
      </div>

      {/* Sunrise */}
      <div className="border-t border-gray-100">
        <PrayerRow
          name="sunrise"
          entry={{ azan: schedule.sunrise }}
          isNext={false}
          isPast={isToday && (() => {
            const [h, m] = schedule.sunrise.split(':').map(Number);
            const [y, mo, d] = schedule.date.split('-').map(Number);
            return new Date(y!, mo! - 1, d!, h!, m!, 0, 0) <= now;
          })()}
        />
      </div>

      {/* Remaining prayers */}
      {PRAYERS.filter(p => p !== 'fajr').map(prayer => (
        <div key={prayer} className="border-t border-gray-100">
          <PrayerRow
            name={prayer}
            entry={schedule[prayer]}
            isNext={isToday && nextPrayer === prayer}
            isPast={isToday && isPrayerPast(schedule, prayer, now) && nextPrayer !== prayer}
          />
        </div>
      ))}


    </div>
  );
}
