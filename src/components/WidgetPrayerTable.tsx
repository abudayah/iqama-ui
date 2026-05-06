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
  'eid-1': { en: '1st Eid', ar: 'عيد ١' },
  'eid-2': { en: '2nd Eid', ar: 'عيد ٢' },
  qiyam: { en: 'Qiyam', ar: 'قيام' },
};

// On Fridays, Dhuhr is replaced by the Jumuah (Friday) prayer
const FRIDAY_DHUHR_LABEL = { en: 'Friday', ar: 'الجمعة' };

// ─── Column descriptor ────────────────────────────────────────────────────────

interface ColDef {
  key: string; // unique key for React + IDs
  labels: { en: string; ar: string };
  azan: string; // time to show in Azan row
  iqama: string | null; // time to show in Iqama row (null = dash)
  eventKey: string; // matches PrayerEvent for highlight logic
}

// ─── Build column list from schedule ─────────────────────────────────────────

function buildColumns(schedule: DailySchedule, isFriday: boolean): ColDef[] {
  const cols: ColDef[] = [
    {
      key: 'fajr',
      labels: BILINGUAL_LABELS['fajr']!,
      azan: schedule.fajr.azan,
      iqama: schedule.fajr.iqama,
      eventKey: 'fajr',
    },
    {
      key: 'sunrise',
      labels: BILINGUAL_LABELS['sunrise']!,
      azan: schedule.sunrise,
      iqama: null,
      eventKey: 'sunrise',
    },
  ];

  // Eid prayers inserted after sunrise when present
  if (schedule.eid_prayer_1) {
    cols.push({
      key: 'eid-1',
      labels: BILINGUAL_LABELS['eid-1']!,
      azan: schedule.eid_prayer_1,
      iqama: null,
      eventKey: 'eid-prayer-1',
    });
  }
  if (schedule.eid_prayer_2) {
    cols.push({
      key: 'eid-2',
      labels: BILINGUAL_LABELS['eid-2']!,
      azan: schedule.eid_prayer_2,
      iqama: null,
      eventKey: 'eid-prayer-2',
    });
  }

  cols.push(
    {
      key: 'dhuhr',
      labels: isFriday ? FRIDAY_DHUHR_LABEL : BILINGUAL_LABELS['dhuhr']!,
      azan: schedule.dhuhr.azan,
      iqama: schedule.dhuhr.iqama,
      eventKey: 'dhuhr',
    },
    {
      key: 'asr',
      labels: BILINGUAL_LABELS['asr']!,
      azan: schedule.asr.azan,
      iqama: schedule.asr.iqama,
      eventKey: 'asr',
    },
    {
      key: 'maghrib',
      labels: BILINGUAL_LABELS['maghrib']!,
      azan: schedule.maghrib.azan,
      iqama: schedule.maghrib.iqama,
      eventKey: 'maghrib',
    },
    {
      key: 'isha',
      labels: BILINGUAL_LABELS['isha']!,
      azan: schedule.isha.azan,
      iqama: schedule.isha.iqama,
      eventKey: 'isha',
    },
  );

  // Qiyam appended after Isha when present
  if (schedule.qiyam_time) {
    cols.push({
      key: 'qiyam',
      labels: BILINGUAL_LABELS['qiyam']!,
      azan: schedule.qiyam_time,
      iqama: null,
      eventKey: 'qiyam',
    });
  }

  return cols;
}

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

  const isFriday = schedule.day_of_week === 'Friday';
  const columns = buildColumns(schedule, isFriday);
  const sectionId = isToday ? 'widget-today' : 'widget-tomorrow';

  return (
    <section id={sectionId} className="flex flex-col min-h-0 flex-1">
      {/* Section header — two columns: label left, dates right */}
      <div
        id={`${sectionId}-header`}
        className="px-4 pt-3 pb-2 flex items-baseline justify-between gap-4"
      >
        <h2 className="text-base font-bold text-gray-900 shrink-0">
          <span>{label}</span>
          {' / '}
          <span lang="ar">{labelAr}</span>
        </h2>
        <p className="text-xs text-gray-500 text-right">
          {schedule.hijri_date}
          {' · '}
          {formatWidgetDate(schedule.date, schedule.day_of_week)}
        </p>
      </div>

      {/* Horizontal prayer table — prayers as columns, Azan/Iqama as rows */}
      <div className="overflow-x-auto flex-1">
        <table id={`${sectionId}-table`} className="w-full h-full border-collapse min-w-[520px]">
          <thead>
            <tr id={`${sectionId}-col-headers`}>
              {/* Row-label header cell (top-left corner) */}
              <th
                className="px-3 py-2 text-left text-sm font-semibold text-gray-400 uppercase w-24 min-w-[6rem]"
                scope="col"
              />
              {columns.map((col) => {
                return (
                  <th
                    key={col.key}
                    id={`${sectionId}-col-${col.key}`}
                    scope="col"
                    className={[
                      'px-2 py-3 text-center text-base font-semibold uppercase transition-colors duration-300',
                      colHeader(col.eventKey),
                    ].join(' ')}
                  >
                    <span className="block">{col.labels.en}</span>
                    <span className="block font-normal text-xs mt-0.5 opacity-75" lang="ar">
                      {col.labels.ar}
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
                className="px-3 py-4 text-left text-base font-semibold text-teal-600 uppercase whitespace-nowrap"
              >
                <span className="block">Azan</span>
                <span className="block font-normal text-xs mt-0.5 opacity-80" lang="ar">
                  أذان
                </span>
              </th>
              {columns.map((col) => (
                <td
                  key={col.key}
                  id={`${sectionId}-azan-${col.key}`}
                  className={[
                    'px-2 py-4 text-center tabular-nums text-xl transition-colors duration-300',
                    colCell(col.eventKey),
                  ].join(' ')}
                >
                  {col.azan}
                </td>
              ))}
            </tr>

            {/* Iqama row */}
            <tr id={`${sectionId}-row-iqama`} className="border-t border-gray-100">
              <th
                id={`${sectionId}-row-iqama-label`}
                scope="row"
                className="px-3 py-4 text-left text-base font-semibold text-teal-600 uppercase whitespace-nowrap"
              >
                <span className="block">Iqama</span>
                <span className="block font-normal text-xs mt-0.5 opacity-80" lang="ar">
                  إقامة
                </span>
              </th>
              {columns.map((col) => (
                <td
                  key={col.key}
                  id={`${sectionId}-iqama-${col.key}`}
                  className={[
                    'px-2 py-4 text-center tabular-nums text-xl transition-colors duration-300',
                    colCell(col.eventKey),
                  ].join(' ')}
                >
                  {col.iqama ?? <span className="opacity-30">—</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
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
    <div id="widget-schedule" className="flex flex-col flex-1 min-h-0">
      {/* Today section — takes half the available space */}
      <div className="flex-1 min-h-0 flex flex-col">
        <DaySection
          label="Today"
          labelAr="اليوم"
          schedule={todaySchedule}
          nextPrayer={nextPrayer}
          countdownMode={countdownMode}
          isToday={true}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 shrink-0" />

      {/* Tomorrow section — takes the other half */}
      <div className="flex-1 min-h-0 flex flex-col">
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
    </div>
  );
}
