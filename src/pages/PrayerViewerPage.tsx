import { useState } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { useNextPrayer } from '../hooks/useNextPrayer';
import { useCountdown } from '../hooks/useCountdown';
import { OfflineBanner } from '../components/OfflineBanner';
import { PrayerTable } from '../components/PrayerTable';
import { NextPrayerBanner } from '../components/NextPrayerBanner';
import { MasjidHeader } from '../components/MasjidHeader';

/** Returns today's date as YYYY-MM-DD in the browser's local timezone. */
function getLocalDateString(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayDate(): string {
  return getLocalDateString(0);
}

function getTomorrowDate(): string {
  return getLocalDateString(1);
}

export function PrayerViewerPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();

  const { data: todaySchedule, loading: todayLoading, error: todayError, refetch: refetchToday } = useSchedule(today);
  const { data: tomorrowSchedule, loading: tomorrowLoading, error: tomorrowError, refetch: refetchTomorrow } = useSchedule(tomorrow);

  // Derive next prayer (with tomorrow fallback) and countdown
  const nextPrayerInitial = useNextPrayer(todaySchedule, tomorrowSchedule);
  const { countdown, tick } = useCountdown(nextPrayerInitial);
  const nextPrayerResult = useNextPrayer(todaySchedule, tomorrowSchedule, tick);

  const activeSchedule = activeTab === 'today' ? todaySchedule : tomorrowSchedule;
  const isLoading = activeTab === 'today' ? todayLoading : tomorrowLoading;
  const error = activeTab === 'today' ? todayError : tomorrowError;
  const refetch = activeTab === 'today' ? refetchToday : refetchTomorrow;

  return (
    <div className="min-h-screen bg-gray-50">
      <MasjidHeader />
      <OfflineBanner />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Next prayer hero — always visible when today's schedule is loaded */}
        {todaySchedule && (
          <NextPrayerBanner
            nextPrayer={nextPrayerResult?.prayer ?? null}
            countdown={countdown}
            schedule={nextPrayerResult?.schedule ?? todaySchedule}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="animate-pulse space-y-3" aria-label="Loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center" role="alert">
            <p className="text-red-700 text-sm mb-3">{error.message}</p>
            <button
              onClick={() => void refetch()}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Prayer table with integrated tab bar */}
        {activeSchedule && !isLoading && (
          <PrayerTable
            schedule={activeSchedule}
            nextPrayer={activeTab === 'today' ? (nextPrayerResult?.schedule === todaySchedule ? nextPrayerResult.prayer : null) : null}
            isToday={activeTab === 'today'}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Show table shell with tabs even while tomorrow is loading */}
        {!activeSchedule && !isLoading && !error && tomorrowSchedule && activeTab === 'tomorrow' && (
          <PrayerTable
            schedule={tomorrowSchedule}
            nextPrayer={null}
            isToday={false}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>
    </div>
  );
}
