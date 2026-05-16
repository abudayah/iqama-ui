import React from 'react';
import type { DailySchedule } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { CountdownMode } from '../hooks/usePrayerContext';
import { formatWidgetDate } from '../logic/format-widget-date';

// Helper to format time from 24hr to 12hr AM/PM
const formatTime12Hr = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const date = new Date(2000, 0, 1, parseInt(hours!), parseInt(minutes!));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

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
    if (nextPrayerKey === prayerKey && isActive) return 'bg-slate-100'; // bg handled via inline style
    if (nextPrayerKey === prayerKey && isNext) return 'bg-slate-100'; // bg handled via inline style
    return 'bg-slate-100 text-gray-500';
  };

  const colCell = (prayerKey: string) => {
    if (nextPrayerKey === prayerKey && isActive) return 'font-bold';
    if (nextPrayerKey === prayerKey && isNext) return 'font-semibold';
    return '';
  };

  const isPastCol = (azanTime: string, prayerKey: string): boolean => {
    if (!isToday || nextPrayerKey === prayerKey) return false;
    const now = new Date();
    const [y, mo, d] = schedule.date.split('-').map(Number);
    const [h, m] = azanTime.split(':').map(Number);
    return new Date(y!, mo! - 1, d!, h!, m!, 0, 0) <= now;
  };

  const colBg = (prayerKey: string): React.CSSProperties => {
    if (nextPrayerKey === prayerKey && isActive)
      return {
        backgroundColor: 'rgba(248, 180, 0, 0.2)',
        borderLeft: '1px solid #ffdd93ff',
        borderRight: '1px solid #ffdd93ff',
      };
    if (nextPrayerKey === prayerKey && isNext)
      return {
        backgroundColor: 'rgba(248, 180, 0, 0.1)',
        borderLeft: '1px solid #ffe7b3',
        borderRight: '1px solid #ffe7b3',
      };
    return {};
  };

  const isFriday = schedule.day_of_week === 'Friday';
  const columns = buildColumns(schedule, isFriday);
  const sectionId = isToday ? 'widget-today' : 'widget-tomorrow';

  return (
    <section id={sectionId} className="flex flex-col min-h-0 flex-1">
      {/* Section header — two columns: label left, dates right */}
      <div
        id={`${sectionId}-header`}
        className="px-4 pt-2 pb-1 flex items-baseline justify-between gap-4"
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
      <div className="flex-1">
        <table id={`${sectionId}-table`} className="w-full h-full border-collapse min-w-[520px]">
          <thead>
            <tr id={`${sectionId}-col-headers`} className="bg-slate-100">
              {/* Row-label header cell (top-left corner) */}
              <th
                className="px-3 py-2 text-left text-sm font-semibold text-gray-400 uppercase w-24 min-w-[6rem] bg-slate-100"
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
                      isPastCol(col.azan, col.eventKey) ? 'opacity-40' : '',
                    ].join(' ')}
                    style={colBg(col.eventKey)}
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
                className="px-3 py-2 text-right text-sm font-bold uppercase whitespace-nowrap"
                style={{ color: '#205072' }}
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
                    'px-2 py-2 text-center tabular-nums text-xl transition-colors duration-300',
                    colCell(col.eventKey),
                    isPastCol(col.azan, col.eventKey) ? 'opacity-40' : '',
                  ].join(' ')}
                  style={{ color: '#205072', ...colBg(col.eventKey) }}
                >
                  {formatTime12Hr(col.azan)}
                </td>
              ))}
            </tr>

            {/* Iqama row */}
            <tr id={`${sectionId}-row-iqama`} className="border-t border-gray-100">
              <th
                id={`${sectionId}-row-iqama-label`}
                scope="row"
                className="px-3 py-2 text-right text-sm font-bold uppercase whitespace-nowrap"
                style={{ color: '#329D9C' }}
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
                    'px-2 py-2 text-center tabular-nums text-xl transition-colors duration-300',
                    colCell(col.eventKey),
                    isPastCol(col.azan, col.eventKey) ? 'opacity-40' : '',
                  ].join(' ')}
                  style={{ color: '#329D9C', ...colBg(col.eventKey) }}
                >
                  {col.iqama ? formatTime12Hr(col.iqama) : <span className="opacity-30">—</span>}
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
