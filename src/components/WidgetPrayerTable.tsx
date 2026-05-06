import type { DailySchedule } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { CountdownMode } from '../hooks/usePrayerContext';
import { formatWidgetDate } from '../logic/format-widget-date';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface WidgetPrayerTableProps {
  todaySchedule: DailySchedule;
  tomorrowSchedule: DailySchedule | null;
  nextPrayer: PrayerEvent | null;
  countdownMode: CountdownMode;
  tick: number;
}

interface DaySectionProps {
  label: 'Today' | 'Tomorrow';
  labelAr: 'اليوم' | 'الغد';
  schedule: DailySchedule;
  nextPrayer: PrayerEvent | null;
  countdownMode: CountdownMode;
  isToday: boolean;
}

// ─── Bilingual label map ──────────────────────────────────────────────────────

const BILINGUAL_LABELS: Record<string, { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'فجر' },
  sunrise: { en: 'Sunrise', ar: 'شروق' },
  dhuhr: { en: 'Dhuhr', ar: 'ظهر' },
  asr: { en: 'Asr', ar: 'عصر' },
  maghrib: { en: 'Maghrib', ar: 'مغرب' },
  isha: { en: 'Isha', ar: 'عشاء' },
};

// On Fridays, Dhuhr is replaced by the Jumuah (Friday) prayer
const FRIDAY_DHUHR_LABEL = { en: 'Friday', ar: 'الجمعة' };

const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

// ─── DaySection ──────────────────────────────────────────────────────────────

function DaySection({
  label,
  labelAr,
  schedule,
  nextPrayer,
  countdownMode,
  isToday,
}: DaySectionProps) {
  // Two highlight states for the active column:
  //   "next"   — counting down to this prayer's azan (upcoming)
  //   "active" — between azan and iqama (prayer has called, iqama pending)
  const nextPrayerKey = isToday && nextPrayer !== null ? (nextPrayer as string) : null;
  const isActive = isToday && countdownMode === 'to_iqama';
  const isNext = isToday && countdownMode === 'to_azan';

  // Column style helpers
  const colHeader = (prayerKey: string) => {
    if (nextPrayerKey === prayerKey && isActive) return 'bg-teal-600 text-white';
    if (nextPrayerKey === prayerKey && isNext) return 'bg-teal-50 text-teal-700';
    return 'text-gray-500';
  };

  const colCell = (prayerKey: string) => {
    if (nextPrayerKey === prayerKey && isActive) return 'bg-teal-600 text-white font-bold';
    if (nextPrayerKey === prayerKey && isNext) return 'bg-teal-50 text-teal-800 font-semibold';
    return 'text-gray-800';
  };

  const sectionId = isToday ? 'widget-today' : 'widget-tomorrow';

  return (
    <section id={sectionId} className="">
      {/* Section header — two columns: label left, dates right */}
      <div
        id={`${sectionId}-header`}
        className="px-4 pt-5 pb-3 flex items-baseline justify-between gap-4"
      >
        <h2 className="text-xl font-bold text-gray-900 shrink-0">
          <span>{label}</span>
          {' / '}
          <span lang="ar">{labelAr}</span>
        </h2>
        <p className="text-sm text-gray-500 text-right">
          {schedule.hijri_date}
          {' · '}
          {formatWidgetDate(schedule.date, schedule.day_of_week)}
        </p>
      </div>

      {/* Horizontal prayer table — prayers as columns, Azan/Iqama as rows */}
      <div className="overflow-x-auto">
        <table id={`${sectionId}-table`} className="w-full border-collapse min-w-[520px]">
          <thead>
            <tr id={`${sectionId}-col-headers`}>
              {/* Row-label header cell (top-left corner) */}
              <th
                className="px-3 py-2 text-left text-sm font-semibold text-gray-400 uppercase w-24 min-w-[6rem]"
                scope="col"
              />
              {PRAYER_ORDER.map((prayerKey) => {
                const labels =
                  prayerKey === 'dhuhr' && schedule.day_of_week === 'Friday'
                    ? FRIDAY_DHUHR_LABEL
                    : BILINGUAL_LABELS[prayerKey]!;
                return (
                  <th
                    key={prayerKey}
                    id={`${sectionId}-col-${prayerKey}`}
                    scope="col"
                    className={[
                      'px-2 py-3 text-center text-sm font-semibold uppercase transition-colors duration-300',
                      colHeader(prayerKey),
                    ].join(' ')}
                  >
                    <span className="block">{labels.en}</span>
                    <span className="block font-normal text-xs mt-0.5 opacity-75" lang="ar">
                      {labels.ar}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Azan row */}
            <tr id={`${sectionId}-row-azan`} className="border-t border-gray-100">
              <th
                id={`${sectionId}-row-azan-label`}
                scope="row"
                className="px-3 py-4 text-left text-sm font-semibold text-teal-600 uppercase whitespace-nowrap"
              >
                <span className="block">Azan</span>
                <span className="block font-normal text-xs mt-0.5 opacity-80" lang="ar">
                  أذان
                </span>
              </th>
              {PRAYER_ORDER.map((prayerKey) => {
                const isSunrise = prayerKey === 'sunrise';
                const azanTime = isSunrise
                  ? schedule.sunrise
                  : (schedule[prayerKey as keyof DailySchedule] as { azan: string }).azan;

                return (
                  <td
                    key={prayerKey}
                    id={`${sectionId}-azan-${prayerKey}`}
                    className={[
                      'px-2 py-4 text-center tabular-nums text-base transition-colors duration-300',
                      colCell(prayerKey),
                    ].join(' ')}
                  >
                    {azanTime}
                  </td>
                );
              })}
            </tr>

            {/* Iqama row */}
            <tr id={`${sectionId}-row-iqama`} className="border-t border-gray-100">
              <th
                id={`${sectionId}-row-iqama-label`}
                scope="row"
                className="px-3 py-4 text-left text-sm font-semibold text-teal-600 uppercase whitespace-nowrap"
              >
                <span className="block">Iqama</span>
                <span className="block font-normal text-xs mt-0.5 opacity-80" lang="ar">
                  إقامة
                </span>
              </th>
              {PRAYER_ORDER.map((prayerKey) => {
                const isSunrise = prayerKey === 'sunrise';
                const iqamaTime = isSunrise
                  ? null
                  : (schedule[prayerKey as keyof DailySchedule] as { iqama: string }).iqama;

                return (
                  <td
                    key={prayerKey}
                    id={`${sectionId}-iqama-${prayerKey}`}
                    className={[
                      'px-2 py-4 text-center tabular-nums text-base transition-colors duration-300',
                      colCell(prayerKey),
                    ].join(' ')}
                  >
                    {iqamaTime ?? <span className="opacity-30">—</span>}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Next Jumuah notice — shown only in the Tomorrow section when tomorrow is Friday */}
      {!isToday && schedule.day_of_week === 'Friday' && (
        <p className="px-4 py-3 text-sm text-gray-600 italic">Next Jumuah Prayers</p>
      )}
    </section>
  );
}

// ─── WidgetPrayerTable ────────────────────────────────────────────────────────

export function WidgetPrayerTable({
  todaySchedule,
  tomorrowSchedule,
  nextPrayer,
  countdownMode,
  tick: _tick,
}: WidgetPrayerTableProps) {
  return (
    <div id="widget-schedule" className="divide-y divide-gray-100">
      {/* Today section — always rendered when this component mounts */}
      <DaySection
        label="Today"
        labelAr="اليوم"
        schedule={todaySchedule}
        nextPrayer={nextPrayer}
        countdownMode={countdownMode}
        isToday={true}
      />

      {/* Tomorrow section — or loading placeholder */}
      {tomorrowSchedule !== null ? (
        <DaySection
          label="Tomorrow"
          labelAr="الغد"
          schedule={tomorrowSchedule}
          nextPrayer={null}
          countdownMode="done"
          isToday={false}
        />
      ) : (
        <div className="px-4 py-6 text-center text-gray-400 text-sm animate-pulse">
          Loading tomorrow…
        </div>
      )}
    </div>
  );
}
