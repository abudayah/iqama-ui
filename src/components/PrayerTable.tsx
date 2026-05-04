import { useRef, useState, useCallback } from 'react';
import type { DailySchedule, PrayerName } from '../types/index';
import { PrayerRow } from './PrayerRow';

interface PrayerTableProps {
  todaySchedule: DailySchedule;
  tomorrowSchedule: DailySchedule | null;
  nextPrayer: PrayerName | null;
  activeTab: 'today' | 'tomorrow';
  onTabChange: (tab: 'today' | 'tomorrow') => void;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatDisplayDate(dateStr: string, dayOfWeek: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dayOfWeek}, ${monthNames[month! - 1]} ${day}`;
}

function isPrayerPast(schedule: DailySchedule, prayer: PrayerName, now: Date): boolean {
  const [h, m] = schedule[prayer].azan.split(':').map(Number);
  const [y, mo, d] = schedule.date.split('-').map(Number);
  return new Date(y!, mo! - 1, d!, h!, m!, 0, 0) <= now;
}

function isSunrisePast(schedule: DailySchedule, now: Date): boolean {
  const [h, m] = schedule.sunrise.split(':').map(Number);
  const [y, mo, d] = schedule.date.split('-').map(Number);
  return new Date(y!, mo! - 1, d!, h!, m!, 0, 0) <= now;
}

/** Renders the prayer rows for a single day */
function DayRows({
  schedule,
  nextPrayer,
  isToday,
}: {
  schedule: DailySchedule;
  nextPrayer: PrayerName | null;
  isToday: boolean;
}) {
  const now = new Date();
  return (
    <div className="px-3 pb-4 space-y-1">
      <PrayerRow
        name="fajr"
        entry={schedule.fajr}
        isNext={isToday && nextPrayer === 'fajr'}
        isPast={isToday && isPrayerPast(schedule, 'fajr', now) && nextPrayer !== 'fajr'}
      />
      <PrayerRow
        name="sunrise"
        entry={{ azan: schedule.sunrise }}
        isNext={false}
        isPast={isToday && isSunrisePast(schedule, now)}
      />
      {PRAYERS.filter(p => p !== 'fajr').map(prayer => (
        <PrayerRow
          key={prayer}
          name={prayer}
          entry={schedule[prayer]}
          isNext={isToday && nextPrayer === prayer}
          isPast={isToday && isPrayerPast(schedule, prayer, now) && nextPrayer !== prayer}
        />
      ))}
    </div>
  );
}

export function PrayerTable({
  todaySchedule,
  tomorrowSchedule,
  nextPrayer,
  activeTab,
  onTabChange,
}: PrayerTableProps) {
  // Track live drag offset (px) for the follow-finger effect
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);

  const activeSchedule = activeTab === 'today' ? todaySchedule : (tomorrowSchedule ?? todaySchedule);

  // Base translate: today = 0%, tomorrow = -50% (each panel is 50% of the 200%-wide strip)
  const baseTranslate = activeTab === 'today' ? 0 : -50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX ?? null;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = (e.touches[0]?.clientX ?? startXRef.current) - startXRef.current;

    // Clamp: can't drag right on today, can't drag left on tomorrow (if no data)
    const canGoLeft = activeTab === 'today' && tomorrowSchedule !== null;
    const canGoRight = activeTab === 'tomorrow';
    if (!canGoLeft && dx < 0) return;
    if (!canGoRight && dx > 0) return;

    // Convert px drag to % of the container width (strip is 2× wide)
    // We'll store raw px and convert in the style using CSS calc
    setDragOffset(dx);
  }, [activeTab, tomorrowSchedule]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startXRef.current;
    const dx = endX - startXRef.current;
    startXRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    const THRESHOLD = 50;
    if (dx < -THRESHOLD && activeTab === 'today' && tomorrowSchedule) {
      onTabChange('tomorrow');
    } else if (dx > THRESHOLD && activeTab === 'tomorrow') {
      onTabChange('today');
    }
  }, [activeTab, tomorrowSchedule, onTabChange]);

  // The sliding strip: two panels side by side, each 100% wide, strip is 200% wide.
  // translateX moves the strip: 0% shows today, -50% shows tomorrow.
  // During drag we add the live offset via calc.
  const translateX = isDragging
    ? `calc(${baseTranslate}% + ${dragOffset}px)`
    : `${baseTranslate}%`;

  return (
    <div className="bg-white rounded-t-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
      {/* Header — always shows active day's date + tab toggle */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {formatDisplayDate(activeSchedule.date, activeSchedule.day_of_week)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{activeSchedule.hijri_date}</p>
        </div>
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => onTabChange('today')}
            className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors min-h-[32px] ${
              activeTab === 'today' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
            aria-pressed={activeTab === 'today'}
          >
            Today
          </button>
          <button
            onClick={() => onTabChange('tomorrow')}
            className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors min-h-[32px] ${
              activeTab === 'tomorrow' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
            aria-pressed={activeTab === 'tomorrow'}
            disabled={!tomorrowSchedule}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Sliding strip */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: '200%',
            transform: `translateX(${translateX})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          {/* Today panel */}
          <div style={{ width: '50%' }}>
            <DayRows
              schedule={todaySchedule}
              nextPrayer={nextPrayer}
              isToday={true}
            />
          </div>

          {/* Tomorrow panel */}
          <div style={{ width: '50%' }}>
            {tomorrowSchedule ? (
              <DayRows
                schedule={tomorrowSchedule}
                nextPrayer={null}
                isToday={false}
              />
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Loading tomorrow…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
