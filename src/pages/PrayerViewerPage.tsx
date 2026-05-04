import { useState } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { useNextPrayer } from '../hooks/useNextPrayer';
import { useCountdown } from '../hooks/useCountdown';
import { OfflineBanner } from '../components/OfflineBanner';
import { DayTabBar } from '../components/DayTabBar';
import { PrayerTable } from '../components/PrayerTable';
import { NextPrayerBanner } from '../components/NextPrayerBanner';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0]!;
}

export function PrayerViewerPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();

  const { data: todaySchedule, loading: todayLoading, error: todayError, refetch: refetchToday } = useSchedule(today);
  const { data: tomorrowSchedule, loading: tomorrowLoading, error: tomorrowError, refetch: refetchTomorrow } = useSchedule(tomorrow);

  // Step 1: derive next prayer from the schedule (no tick yet — just initial derivation)
  // Step 2: run the countdown for that prayer — it ticks every 10s
  // Step 3: re-derive next prayer on each tick so it advances when a prayer passes
  const nextPrayerInitial = useNextPrayer(todaySchedule);
  const { countdown, tick } = useCountdown(todaySchedule, nextPrayerInitial);
  const nextPrayer = useNextPrayer(todaySchedule, tick);

  const activeSchedule = activeTab === 'today' ? todaySchedule : tomorrowSchedule;
  const isLoading = activeTab === 'today' ? todayLoading : tomorrowLoading;
  const error = activeTab === 'today' ? todayError : tomorrowError;
  const refetch = activeTab === 'today' ? refetchToday : refetchTomorrow;

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />
      <div className="max-w-lg mx-auto">
        {/* Next prayer banner (today only) */}
        {activeTab === 'today' && todaySchedule && (
          <div className="p-4">
            <NextPrayerBanner nextPrayer={nextPrayer} countdown={countdown} />
          </div>
        )}
        <DayTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-4">
          {isLoading && (
            <div className="animate-pulse space-y-3" aria-label="Loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          )}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-center" role="alert">
              <p className="text-red-700 text-sm mb-3">{error.message}</p>
              <button
                onClick={() => void refetch()}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm min-h-[44px]"
              >
                Retry
              </button>
            </div>
          )}
          {activeSchedule && !isLoading && (
            <PrayerTable
              schedule={activeSchedule}
              nextPrayer={nextPrayer}
              isToday={activeTab === 'today'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
