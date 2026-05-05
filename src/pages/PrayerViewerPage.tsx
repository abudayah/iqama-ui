import { useState, useRef, useCallback } from 'react';
import type { DailySchedule } from '../types/index';
import type { PeekTarget } from '../components/HeroBanner';
import { useSchedule } from '../hooks/useSchedule';
import { usePrayerContext } from '../hooks/usePrayerContext';
import { useSimulator } from '../hooks/useSimulator';
import { OfflineBanner } from '../components/OfflineBanner';
import { PrayerTable } from '../components/PrayerTable';
import { HeroBanner } from '../components/HeroBanner';
import { SimulatorBanner } from '../components/SimulatorBanner';

const PEEK_DURATION_MS = 4_000;

export function PrayerViewerPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

  /* ── Peek state ── */
  const [peekedPrayer,   setPeekedPrayer]   = useState<PeekTarget | null>(null);
  const [peekedSchedule, setPeekedSchedule] = useState<DailySchedule | null>(null);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPeek = useCallback(() => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    setPeekedPrayer(null);
    setPeekedSchedule(null);
  }, []);

  const handleTabChange = useCallback((tab: 'today' | 'tomorrow') => {
    clearPeek();
    setActiveTab(tab);
  }, [clearPeek]);

  const handlePeek = useCallback((prayer: PeekTarget, schedule: DailySchedule) => {
    if (peekedPrayer === prayer) {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      setPeekedPrayer(null);
      setPeekedSchedule(null);
      return;
    }
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    setPeekedPrayer(prayer);
    setPeekedSchedule(schedule);
    peekTimerRef.current = setTimeout(() => {
      setPeekedPrayer(null);
      setPeekedSchedule(null);
    }, PEEK_DURATION_MS);
  }, [peekedPrayer]);

  const { simNow, simDateStr, simTomorrowStr, isSimulating } = useSimulator();

  const {
    data: todaySchedule,
    loading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useSchedule(simDateStr);

  const {
    data: tomorrowSchedule,
    error: tomorrowError,
    refetch: refetchTomorrow,
  } = useSchedule(simTomorrowStr);

  /* Single source of truth for all time-aware state */
  const {
    countdownMode,
    nextPrayer,
    nextSchedule,
    countdown,
    hijriDay,
    hijriMonth,
    tick,
  } = usePrayerContext(todaySchedule, tomorrowSchedule, isSimulating ? simNow : undefined);

  const isLoading = todayLoading;
  const error     = activeTab === 'today' ? todayError : tomorrowError;
  const refetch   = activeTab === 'today' ? refetchToday : refetchTomorrow;

  /* nextPrayer is only "active" in the today table when the schedule matches */
  const todayNextPrayer =
    nextSchedule === todaySchedule ? (nextPrayer ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <OfflineBanner />
      {isSimulating && (
        <SimulatorBanner simDateStr={simDateStr} simNow={simNow} />
      )}

      <HeroBanner
        nextPrayer={nextPrayer}
        countdown={countdown}
        schedule={nextSchedule ?? todaySchedule ?? null}
        todaySchedule={todaySchedule ?? null}
        countdownMode={countdownMode}
        hijriDay={hijriDay}
        hijriMonth={hijriMonth}
        tick={tick}
        simulatedNow={isSimulating ? simNow : undefined}
        peekPrayer={peekedPrayer}
        peekSchedule={peekedSchedule}
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
            onTabChange={handleTabChange}
            countdownMode={countdownMode}
            tick={tick}
            onPeekPrayer={handlePeek}
            peekedPrayer={peekedPrayer}
          />
        )}
      </div>
    </div>
  );
}
