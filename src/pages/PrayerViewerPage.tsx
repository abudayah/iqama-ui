import { useState, useRef, useCallback } from 'react';
import type { DailySchedule } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { PeekTarget } from '../components/HeroBanner';
import { useSchedule } from '../hooks/useSchedule';
import { usePrayerContext } from '../hooks/usePrayerContext';
import { useSimulator } from '../hooks/useSimulator';
import { useSightingStatus, shouldShowSightingCard } from '../hooks/useSightingStatus';
import { OfflineBanner } from '../components/OfflineBanner';
import { PrayerTable } from '../components/PrayerTable';
import { HeroBanner } from '../components/HeroBanner';
import { SimulatorBanner } from '../components/SimulatorBanner';
import { SightingCard } from '../components/SightingCard';
import { EidPrayerModal } from '../components/EidPrayerModal';
import { calculateEidDate } from '../logic/calculate-eid-date';
import { submitOverride } from '../services/hijri-calendar-service';
import { PublicFooter } from '../components/PublicFooter';

const PEEK_DURATION_MS = 4_000;

export function PrayerViewerPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

  /* ── Sighting state ── */
  const [eidModalOpen, setEidModalOpen] = useState(false);
  const [pendingLength, setPendingLength] = useState<29 | 30 | null>(null);
  const [sightingError, setSightingError] = useState<string | null>(null);
  const [sightingSuccess, setSightingSuccess] = useState(false);

  /* ── Peek state ── */
  const [peekedPrayer, setPeekedPrayer] = useState<PeekTarget | null>(null);
  const [peekedSchedule, setPeekedSchedule] = useState<DailySchedule | null>(null);
  const [peekedLabel, setPeekedLabel] = useState<string | null>(null);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPeek = useCallback(() => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    setPeekedPrayer(null);
    setPeekedSchedule(null);
    setPeekedLabel(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: 'today' | 'tomorrow') => {
      clearPeek();
      setActiveTab(tab);
    },
    [clearPeek],
  );

  const handlePeek = useCallback(
    (prayer: PeekTarget, schedule: DailySchedule, label?: string) => {
      if (peekedPrayer === prayer) {
        if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
        setPeekedPrayer(null);
        setPeekedSchedule(null);
        setPeekedLabel(null);
        return;
      }
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      setPeekedPrayer(prayer);
      setPeekedSchedule(schedule);
      setPeekedLabel(label ?? null);
      peekTimerRef.current = setTimeout(() => {
        setPeekedPrayer(null);
        setPeekedSchedule(null);
        setPeekedLabel(null);
      }, PEEK_DURATION_MS);
    },
    [peekedPrayer],
  );

  const { simNow, simDateStr, simTomorrowStr, isSimulating } = useSimulator();

  /* ── Sighting status ── */
  const { status: sightingStatus } = useSightingStatus();

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
  const { countdownMode, nextPrayer, nextSchedule, countdown, hijriDay, hijriMonth, tick } =
    usePrayerContext(todaySchedule, tomorrowSchedule, isSimulating ? simNow : undefined);

  const isLoading = todayLoading;
  const error = activeTab === 'today' ? todayError : tomorrowError;
  const refetch = activeTab === 'today' ? refetchToday : refetchTomorrow;

  /* nextPrayer is only "active" in the today table when the schedule matches */
  const todayNextPrayer: PrayerEvent | null =
    nextSchedule === todaySchedule ? (nextPrayer ?? null) : null;

  /* ── Moon-sighting decision handler ── */
  const onDecision = useCallback(
    async (length: 29 | 30) => {
      if (!sightingStatus) return;
      setSightingError(null);
      setSightingSuccess(false);

      if (sightingStatus.hijriMonth === 9 || sightingStatus.hijriMonth === 11) {
        setPendingLength(length);
        setEidModalOpen(true);
      } else {
        const hijriYear = new Date(sightingStatus.gregorianDate).getFullYear();
        try {
          await submitOverride({ hijriYear, hijriMonth: sightingStatus.hijriMonth, length });
          setSightingSuccess(true);
        } catch (err) {
          setSightingError(
            err instanceof Error ? err.message : 'Submission failed. Please try again.',
          );
        }
      }
    },
    [sightingStatus],
  );

  return (
    <div id="prayer-viewer-page" className="min-h-screen bg-gray-100 flex flex-col">
      <OfflineBanner />
      {isSimulating && <SimulatorBanner simDateStr={simDateStr} simNow={simNow} />}

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
        peekLabel={peekedLabel}
      />

      {/* Prayer list — overlaps the hero bottom edge */}
      <div
        id="prayer-list"
        className="flex-1 -mt-5 relative z-10 flex flex-col max-w-lg w-full mx-auto"
      >
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

        {/* Sighting card — shown on day 29, or day 30 without an override */}
        {sightingStatus !== null &&
          shouldShowSightingCard(sightingStatus.hijriDay, sightingStatus.hasOverride) && (
            <div className="px-4 pt-4">
              {sightingSuccess && (
                <div
                  className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm"
                  role="status"
                >
                  Moon-sighting decision saved successfully.
                </div>
              )}
              {sightingError && (
                <div
                  className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
                  role="alert"
                >
                  {sightingError}
                </div>
              )}
              <SightingCard
                hijriMonth={sightingStatus.hijriMonth}
                onDecision={(length) => void onDecision(length)}
              />
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

      {/* Eid prayer modal — opened when Imam selects a length for month 9 or 11 */}
      {eidModalOpen && sightingStatus !== null && pendingLength !== null && (
        <EidPrayerModal
          eidType={sightingStatus.hijriMonth === 9 ? 'EID_AL_FITR' : 'EID_AL_ADHA'}
          eidDate={calculateEidDate(
            new Date(),
            pendingLength === 29,
            sightingStatus.hijriMonth === 9 ? 'FITR' : 'ADHA',
          )}
          sunriseTime={todaySchedule?.sunrise ?? '06:00'}
          hijriYear={new Date(sightingStatus.gregorianDate).getFullYear()}
          hijriMonth={sightingStatus.hijriMonth}
          length={pendingLength}
          onSubmit={submitOverride}
          onClose={() => setEidModalOpen(false)}
        />
      )}

      <PublicFooter />
    </div>
  );
}
