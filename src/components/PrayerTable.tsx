import { useRef, useState, useCallback } from 'react';
import type { DailySchedule, PrayerName } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { CountdownMode } from '../hooks/usePrayerContext';
import type { PeekTarget } from './HeroBanner';
import { PrayerRow } from './PrayerRow';

interface PrayerTableProps {
  todaySchedule: DailySchedule;
  tomorrowSchedule: DailySchedule | null;
  nextPrayer: PrayerEvent | null;
  activeTab: 'today' | 'tomorrow';
  onTabChange: (tab: 'today' | 'tomorrow') => void;
  /** Increments every second — forces isPast recalculation */
  tick?: number;
  /**
   * Current countdown phase from usePrayerContext.
   * When 'to_iqama', the nextPrayer row shows the "now" badge.
   */
  countdownMode?: CountdownMode;
  /** Called when a future prayer row is tapped */
  onPeekPrayer?:
    | ((prayer: PeekTarget, schedule: DailySchedule, label?: string) => void)
    | undefined;
  /** Currently peeked prayer — used to highlight the row */
  peekedPrayer?: PeekTarget | null | undefined;
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatDisplayDate(dateStr: string, dayOfWeek: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
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
  countdownMode,
  onPeekPrayer,
  peekedPrayer,
}: {
  schedule: DailySchedule;
  nextPrayer: PrayerEvent | null;
  isToday: boolean;
  countdownMode: CountdownMode;
  onPeekPrayer?:
    | ((prayer: PeekTarget, schedule: DailySchedule, label?: string) => void)
    | undefined;
  peekedPrayer?: PeekTarget | null | undefined;
}) {
  const now = new Date();
  const activePrayer: PrayerName | null =
    isToday &&
    countdownMode === 'to_iqama' &&
    nextPrayer !== null &&
    nextPrayer !== 'sunrise' &&
    nextPrayer !== 'eid-prayer-1' &&
    nextPrayer !== 'eid-prayer-2'
      ? (nextPrayer as PrayerName)
      : null;

  const canPeekPrayer = (prayer: PrayerName) =>
    !!onPeekPrayer && !isPrayerPast(schedule, prayer, now) && activePrayer !== prayer;

  const canPeekSunrise = () => !!onPeekPrayer && !isSunrisePast(schedule, now);

  return (
    <div className="px-3 pb-4 space-y-1">
      {/* Fajr */}
      <PrayerRow
        name="fajr"
        entry={schedule.fajr}
        isNext={isToday && nextPrayer === 'fajr'}
        isActive={activePrayer === 'fajr'}
        isPast={isToday && isPrayerPast(schedule, 'fajr', now) && nextPrayer !== 'fajr'}
        isPeeked={peekedPrayer === 'fajr'}
        onTap={canPeekPrayer('fajr') ? () => onPeekPrayer!('fajr', schedule) : undefined}
      />

      {/* Sunrise — treated like a prayer: highlights when next, dims when past */}
      <PrayerRow
        name="sunrise"
        entry={{ azan: schedule.sunrise }}
        isNext={isToday && nextPrayer === 'sunrise'}
        isActive={false}
        isPast={isToday && isSunrisePast(schedule, now) && nextPrayer !== 'sunrise'}
        isPeeked={peekedPrayer === 'sunrise'}
        onTap={canPeekSunrise() ? () => onPeekPrayer!('sunrise', schedule) : undefined}
      />

      {/* Eid prayer rows — injected by backend when date is an Eid day */}
      {schedule.eid_prayer_1 && (
        <PrayerRow
          name="fajr"
          label="1st Eid Prayer"
          entry={{ azan: schedule.eid_prayer_1, iqama: '' }}
          isNext={isToday && nextPrayer === 'eid-prayer-1'}
          isActive={false}
          isPast={false}
          isPeeked={peekedPrayer === 'eid-prayer-1'}
          onTap={
            onPeekPrayer
              ? () =>
                  onPeekPrayer(
                    'eid-prayer-1',
                    { ...schedule, sunrise: schedule.eid_prayer_1! },
                    '1st Prayer',
                  )
              : undefined
          }
        />
      )}
      {schedule.eid_prayer_2 && (
        <PrayerRow
          name="fajr"
          label="2nd Eid Prayer"
          entry={{ azan: schedule.eid_prayer_2, iqama: '' }}
          isNext={isToday && nextPrayer === 'eid-prayer-2'}
          isActive={false}
          isPast={false}
          isPeeked={peekedPrayer === 'eid-prayer-2'}
          onTap={
            onPeekPrayer
              ? () =>
                  onPeekPrayer(
                    'eid-prayer-2',
                    { ...schedule, sunrise: schedule.eid_prayer_2! },
                    '2nd Prayer',
                  )
              : undefined
          }
        />
      )}

      {/* Remaining prayers */}
      {PRAYERS.filter((p) => p !== 'fajr').map((prayer) => (
        <PrayerRow
          key={prayer}
          name={prayer}
          entry={schedule[prayer]}
          isNext={isToday && nextPrayer === prayer}
          isActive={activePrayer === prayer}
          isPast={isToday && isPrayerPast(schedule, prayer, now) && nextPrayer !== prayer}
          isPeeked={peekedPrayer === prayer}
          onTap={canPeekPrayer(prayer) ? () => onPeekPrayer!(prayer, schedule) : undefined}
        />
      ))}

      {/* Qiyam al-Layl row — injected by backend on Hijri days 20–29 of Ramadan */}
      {schedule.qiyam_time && (
        <PrayerRow
          name="isha"
          label="Qiyam"
          entry={{ azan: schedule.qiyam_time, iqama: '' }}
          isNext={false}
          isActive={false}
          isPast={false}
          isPeeked={false}
        />
      )}
    </div>
  );
}

export function PrayerTable({
  todaySchedule,
  tomorrowSchedule,
  nextPrayer,
  activeTab,
  onTabChange,
  tick: _tick = 0,
  countdownMode = 'done',
  onPeekPrayer,
  peekedPrayer,
}: PrayerTableProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);

  const activeSchedule =
    activeTab === 'today' ? todaySchedule : (tomorrowSchedule ?? todaySchedule);

  /* Base translate: today = 0%, tomorrow = -50% (strip is 200% wide) */
  const baseTranslate = activeTab === 'today' ? 0 : -50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX ?? null;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startXRef.current === null) return;
      const dx = (e.touches[0]?.clientX ?? startXRef.current) - startXRef.current;

      const canGoLeft = activeTab === 'today' && tomorrowSchedule !== null;
      const canGoRight = activeTab === 'tomorrow';
      if (!canGoLeft && dx < 0) return;
      if (!canGoRight && dx > 0) return;

      setDragOffset(dx);
    },
    [activeTab, tomorrowSchedule],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [activeTab, tomorrowSchedule, onTabChange],
  );

  const translateX = isDragging ? `calc(${baseTranslate}% + ${dragOffset}px)` : `${baseTranslate}%`;

  return (
    <div
      id="prayer-table"
      className="bg-white rounded-t-3xl shadow-sm overflow-hidden flex-1 flex flex-col"
    >
      {/* Header — date + Today/Tomorrow toggle */}
      <div
        id="prayer-table-header"
        className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0"
      >
        <div>
          <h3 className="text-l font-bold text-gray-900">{activeSchedule.hijri_date}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatDisplayDate(activeSchedule.date, activeSchedule.day_of_week)}
          </p>
        </div>

        {/* Tab toggle */}
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

      {/* Swipeable strip — two panels side by side, strip is 200% wide */}
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
              countdownMode={countdownMode}
              onPeekPrayer={onPeekPrayer}
              peekedPrayer={peekedPrayer}
            />
          </div>

          {/* Tomorrow panel */}
          <div style={{ width: '50%' }}>
            {tomorrowSchedule ? (
              <DayRows
                schedule={tomorrowSchedule}
                nextPrayer={null}
                isToday={false}
                countdownMode="done"
                onPeekPrayer={onPeekPrayer}
                peekedPrayer={peekedPrayer}
              />
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading tomorrow…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
