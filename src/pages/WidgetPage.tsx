import { useSchedule } from '../hooks/useSchedule';
import { usePrayerContext } from '../hooks/usePrayerContext';
import { useSimulator } from '../hooks/useSimulator';
import { HeroBanner } from '../components/HeroBanner';
import { WidgetPrayerTable } from '../components/WidgetPrayerTable';

export function WidgetPage() {
  const { simNow, simDateStr, simTomorrowStr, isSimulating } = useSimulator();

  const { data: todaySchedule, loading: todayLoading, error: todayError } = useSchedule(simDateStr);

  const { data: tomorrowSchedule } = useSchedule(simTomorrowStr);

  const { nextPrayer, countdown, countdownMode, hijriDay, hijriMonth, tick } = usePrayerContext(
    todaySchedule ?? null,
    tomorrowSchedule ?? null,
    isSimulating ? simNow : undefined,
  );

  return (
    <main id="widget-root" style={{ overflowX: 'hidden' }} className="w-full mx-auto">
      <div id="widget-hero">
        <HeroBanner
          nextPrayer={nextPrayer}
          countdown={countdown}
          schedule={todaySchedule ?? null}
          todaySchedule={todaySchedule ?? null}
          countdownMode={countdownMode}
          hijriDay={hijriDay}
          hijriMonth={hijriMonth}
          tick={tick}
          simulatedNow={isSimulating ? simNow : undefined}
        />
      </div>

      {/* Carved card — pulls up over the hero with rounded top corners */}
      <div className="relative z-10 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
        {/* Loading skeleton */}
        {todayLoading && (
          <div id="widget-loading" className="px-6 pt-6 pb-4">
            <div className="animate-pulse space-y-4" aria-label="Loading">
              <div className="h-6 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-200 rounded w-28" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Error state — non-interactive, no retry button */}
        {todayError && !todayLoading && (
          <div id="widget-error" className="px-6 pt-6">
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
              role="alert"
            >
              <p className="text-red-700 text-sm">
                {todayError.message ?? 'Prayer times could not be loaded.'}
              </p>
            </div>
          </div>
        )}

        {/* Prayer table — rendered once today's data is ready */}
        {todaySchedule && !todayLoading && (
          <div id="widget-prayer-table">
            <WidgetPrayerTable
              todaySchedule={todaySchedule}
              tomorrowSchedule={tomorrowSchedule ?? null}
              nextPrayer={nextPrayer}
              countdownMode={countdownMode}
              tick={tick}
            />
          </div>
        )}

        {/* Widget footer */}
        <footer
          id="widget-footer"
          aria-label="Widget footer"
          style={{ borderTop: '1px solid #f0f0f0' }}
          className="px-4 py-2.5 text-center"
        >
          <p style={{ fontSize: '11px', color: '#999', letterSpacing: '0.02em' }}>
            Get prayer times on your mobile: <span style={{ color: '#666' }}>iqama.theisbc.ca</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
