import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DailySchedule } from '../types/index';
import type { PrayerEvent } from '../logic/derive-next-prayer';
import type { CountdownMode } from '../hooks/usePrayerContext';
import { formatWidgetDate } from '../logic/format-widget-date';
import { formatHijriDate } from '../i18n/format-hijri-date';
import { getIntlLocale } from '../i18n/locale';
import { formatTime12 } from '../i18n/format-time';

// Helper to format time from 24hr to 12hr AM/PM
const formatTime12Hr = (time24: string): string => formatTime12(time24);

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface WidgetPrayerTableProps {
  todaySchedule: DailySchedule;
  tomorrowSchedule: DailySchedule | null;
  nextPrayer: PrayerEvent | null;
  /** The schedule the next prayer belongs to — used to route highlight to correct section */
  nextSchedule: DailySchedule | null;
  countdownMode: CountdownMode;
  tick: number;
}

interface DaySectionProps {
  labelKey: 'prayerTable.today' | 'prayerTable.tomorrow';
  schedule: DailySchedule;
  nextPrayer: PrayerEvent | null;
  countdownMode: CountdownMode;
  isToday: boolean;
  /** True when the next prayer belongs to this section — enables highlight + past-dimming */
  isNextSection: boolean;
}

// ─── Column descriptor ────────────────────────────────────────────────────────

interface ColDef {
  key: string; // unique key for React + IDs
  label: string;
  azan: string; // time to show in Azan row
  iqama: string | null; // time to show in Iqama row (null = dash)
  eventKey: string; // matches PrayerEvent for highlight logic
}

// ─── Build column list from schedule ─────────────────────────────────────────

function buildColumns(
  schedule: DailySchedule,
  isFriday: boolean,
  t: (key: string) => string,
): ColDef[] {
  const cols: ColDef[] = [
    {
      key: 'fajr',
      label: t('prayers.fajr'),
      azan: schedule.fajr.azan,
      iqama: schedule.fajr.iqama,
      eventKey: 'fajr',
    },
    {
      key: 'sunrise',
      label: t('prayers.sunrise'),
      azan: schedule.sunrise,
      iqama: null,
      eventKey: 'sunrise',
    },
  ];

  // Eid prayers inserted after sunrise when present
  if (schedule.eid_prayer_1) {
    cols.push({
      key: 'eid-1',
      label: t('prayers.eid1'),
      azan: schedule.eid_prayer_1,
      iqama: null,
      eventKey: 'eid-prayer-1',
    });
  }
  if (schedule.eid_prayer_2) {
    cols.push({
      key: 'eid-2',
      label: t('prayers.eid2'),
      azan: schedule.eid_prayer_2,
      iqama: null,
      eventKey: 'eid-prayer-2',
    });
  }

  cols.push(
    {
      key: 'dhuhr',
      label: t(isFriday ? 'prayers.friday' : 'prayers.dhuhr'),
      azan: schedule.dhuhr.azan,
      iqama: schedule.dhuhr.iqama,
      eventKey: 'dhuhr',
    },
    {
      key: 'asr',
      label: t('prayers.asr'),
      azan: schedule.asr.azan,
      iqama: schedule.asr.iqama,
      eventKey: 'asr',
    },
    {
      key: 'maghrib',
      label: t('prayers.maghrib'),
      azan: schedule.maghrib.azan,
      iqama: schedule.maghrib.iqama,
      eventKey: 'maghrib',
    },
    {
      key: 'isha',
      label: t('prayers.isha'),
      azan: schedule.isha.azan,
      iqama: schedule.isha.iqama,
      eventKey: 'isha',
    },
  );

  // Qiyam appended after Isha when present
  if (schedule.qiyam_time) {
    cols.push({
      key: 'qiyam',
      label: t('prayers.qiyam'),
      azan: schedule.qiyam_time,
      iqama: null,
      eventKey: 'qiyam',
    });
  }

  return cols;
}

// ─── Special-prayer colour helpers ───────────────────────────────────────────

const EID_COLOR = '#92610a'; // dark yellow
const QIYAM_COLOR = '#5b21b6'; // dark purple

function isEidKey(key: string) {
  return key === 'eid-1' || key === 'eid-2';
}

function isQiyamKey(key: string) {
  return key === 'qiyam';
}

/** Returns an override text colour for Eid / Qiyam columns, or null for normal columns */
function specialColor(key: string): string | null {
  if (isEidKey(key)) return EID_COLOR;
  if (isQiyamKey(key)) return QIYAM_COLOR;
  return null;
}

// ─── DaySection ──────────────────────────────────────────────────────────────

function DaySection({
  labelKey,
  schedule,
  nextPrayer,
  countdownMode,
  isToday,
  isNextSection,
}: DaySectionProps) {
  const { t, i18n } = useTranslation();
  // Highlight logic uses isNextSection (not isToday) so tomorrow's Fajr gets highlighted
  // when today's prayers are exhausted.
  const nextPrayerKey = isNextSection && nextPrayer !== null ? (nextPrayer as string) : null;
  const isActive = isNextSection && countdownMode === 'to_iqama';
  const isNext = isNextSection && countdownMode === 'to_azan';

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
  const columns = buildColumns(schedule, isFriday, t);
  const sectionId = isToday ? 'widget-today' : 'widget-tomorrow';

  return (
    <section id={sectionId} className="flex flex-col min-h-0 flex-1">
      {/* Section header — two columns: label left, dates right */}
      <div
        id={`${sectionId}-header`}
        className="px-4 pt-2 pb-1 flex items-baseline justify-between gap-4"
      >
        <h2 className="text-base font-bold text-gray-900 shrink-0">{t(labelKey)}</h2>
        <p className="text-xs text-gray-500 text-end" dir="auto">
          {formatHijriDate(schedule.hijri_date, i18n.language)}
          {' · '}
          {formatWidgetDate(schedule.date, getIntlLocale(i18n.language))}
        </p>
      </div>

      {/* Horizontal prayer table — prayers as columns, Azan/Iqama as rows */}
      <div className="flex-1 overflow-hidden">
        <table id={`${sectionId}-table`} className="w-full h-full border-collapse table-fixed">
          <thead>
            <tr id={`${sectionId}-col-headers`} className="bg-slate-100">
              {/* Row-label header cell (top-left corner) */}
              <th
                className="px-3 py-2 text-start text-sm font-semibold text-gray-400 uppercase w-24 min-w-[6rem] bg-slate-100"
                scope="col"
              />
              {columns.map((col) => {
                const sc = specialColor(col.key);
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
                    style={{ ...colBg(col.eventKey), ...(sc ? { color: sc } : {}) }}
                  >
                    <span className="block">{col.label}</span>
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
                className="px-3 py-2 text-end text-sm font-bold uppercase whitespace-nowrap"
                style={{ color: '#205072' }}
              >
                <span className="block">{t('widget.azan')}</span>
              </th>
              {columns.map((col) => {
                const sc = specialColor(col.key);
                return (
                  <td
                    key={col.key}
                    id={`${sectionId}-azan-${col.key}`}
                    className={[
                      'px-2 py-2 text-center tabular-nums text-2xl transition-colors duration-300',
                      colCell(col.eventKey),
                      isPastCol(col.azan, col.eventKey) ? 'opacity-40' : '',
                    ].join(' ')}
                    style={{ color: sc ?? '#205072', ...colBg(col.eventKey) }}
                  >
                    {formatTime12Hr(col.azan)}
                  </td>
                );
              })}
            </tr>

            {/* Iqama row */}
            <tr id={`${sectionId}-row-iqama`} className="border-t border-gray-100">
              <th
                id={`${sectionId}-row-iqama-label`}
                scope="row"
                className="px-3 py-2 text-end text-sm font-bold uppercase whitespace-nowrap"
                style={{ color: '#329D9C' }}
              >
                <span className="block">{t('widget.iqama')}</span>
              </th>
              {columns.map((col) => {
                const sc = specialColor(col.key);
                return (
                  <td
                    key={col.key}
                    id={`${sectionId}-iqama-${col.key}`}
                    className={[
                      'px-2 py-2 text-center tabular-nums text-2xl transition-colors duration-300',
                      colCell(col.eventKey),
                      isPastCol(col.azan, col.eventKey) ? 'opacity-40' : '',
                    ].join(' ')}
                    style={{ color: sc ?? '#329D9C', ...colBg(col.eventKey) }}
                  >
                    {col.iqama ? formatTime12Hr(col.iqama) : <span className="opacity-30">—</span>}
                  </td>
                );
              })}
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
  nextSchedule,
  countdownMode,
  tick: _tick,
}: WidgetPrayerTableProps) {
  const { t, i18n } = useTranslation();
  const nextIsToday = nextSchedule === todaySchedule;
  const nextIsTomorrow = nextSchedule === tomorrowSchedule && tomorrowSchedule !== null;

  return (
    <div id="widget-schedule" className="flex flex-col flex-1 min-h-0">
      {/* Today section — takes half the available space */}
      <div className="flex-1 min-h-0 flex flex-col">
        <DaySection
          labelKey="prayerTable.today"
          schedule={todaySchedule}
          nextPrayer={nextIsToday ? nextPrayer : null}
          countdownMode={countdownMode}
          isToday={true}
          isNextSection={nextIsToday}
        />
      </div>

      <div className="px-3 py-1 text-end">
        <a
          href={(() => {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', i18n.language === 'ar' ? 'en' : 'ar');
            return url.toString();
          })()}
          aria-label={t('widgetLang.switchAria')}
          className="inline-flex min-h-[44px] items-center text-xs text-gray-500 underline"
        >
          {t('widgetLang.switch')}
        </a>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 shrink-0" />

      {/* Tomorrow section — takes the other half */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tomorrowSchedule !== null ? (
          <DaySection
            labelKey="prayerTable.tomorrow"
            schedule={tomorrowSchedule}
            nextPrayer={nextIsTomorrow ? nextPrayer : null}
            countdownMode={nextIsTomorrow ? countdownMode : 'done'}
            isToday={false}
            isNextSection={nextIsTomorrow}
          />
        ) : (
          <div className="px-4 py-6 text-center text-gray-400 text-sm animate-pulse">
            {t('prayerTable.loadingTomorrow')}
          </div>
        )}
      </div>
    </div>
  );
}
