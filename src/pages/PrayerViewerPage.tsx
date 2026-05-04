import { useState } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { usePrayerContext } from '../hooks/usePrayerContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { PrayerTable } from '../components/PrayerTable';
import { HeroBanner } from '../components/HeroBanner';

function getLocalDateString(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PrayerViewerPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

  const {
    data: todaySchedule,
    loading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useSchedule(getLocalDateString(0));

  const {
    data: tomorrowSchedule,
    error: tomorrowError,
    refetch: refetchTomorrow,
  } = useSchedule(getLocalDateString(1));

  /* Single source of truth for all time-aware state */
  const {
    timeOfDay,
    countdownMode,
    nextPrayer,
    nextSchedule,
    countdown,
    hijriDay,
    tick,
  } = usePrayerContext(todaySchedule, tomorrowSchedule);

  const isLoading = todayLoading;
  const error     = activeTab === 'today' ? todayError : tomorrowError;
  const refetch   = activeTab === 'today' ? refetchToday : refetchTomorrow;

  /* nextPrayer is only "active" in the today table when the schedule matches */
  const todayNextPrayer =
    nextSchedule === todaySchedule ? (nextPrayer ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <OfflineBanner />

      <HeroBanner
        nextPrayer={nextPrayer}
        countdown={countdown}
        schedule={nextSchedule ?? todaySchedule ?? null}
        timeOfDay={timeOfDay}
        countdownMode={countdownMode}
        hijriDay={hijriDay}
      />

      {/* Prayer list — overlaps the hero bottom edge */}
      <div className="flex-1 -mt-4 relative z-10 flex flex-col max-w-lg w-full mx-auto">

        {/* Loading skeleton */}
        {isLoading && (
          <div className="bg-white rounded-t-3xl px-6 pt-6 pb-4">
            <div className="animate-pulse space-y-4" aria-label="Loading">
              <div className="h-6 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-200 rounded w-28" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-white rounded-t-3xl px-6 pt-6">
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
              role="alert"
            >
              <p className="text-red-700 text-sm mb-3">{error.message}</p>
              <button
                onClick={() => void refetch()}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm min-h-[44px]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Prayer table — rendered once today's data is ready */}
        {todaySchedule && !isLoading && (
          <PrayerTable
            todaySchedule={todaySchedule}
            tomorrowSchedule={tomorrowSchedule ?? null}
            nextPrayer={todayNextPrayer}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            /* pass tick so DayRows re-evaluates isPast every second */
            tick={tick}
          />
        )}
      </div>
    </div>
  );
}
