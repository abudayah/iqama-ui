import { useTranslation } from 'react-i18next';
import type { DailySchedule, Override, PrayerName } from '../types/index';
import { isActive } from '../logic/is-active';
import { formatTime12 } from '../i18n/format-time';
import { formatWeekdayName, getIntlLocale } from '../i18n/locale';

interface ScheduleRangeRowProps {
  schedule: DailySchedule;
  overrides: Override[];
}

// Prayers rendered before the sunrise column
const PRAYERS_BEFORE_SUNRISE: PrayerName[] = ['fajr'];
// Prayers rendered after the sunrise column
const PRAYERS_AFTER_SUNRISE: PrayerName[] = ['dhuhr', 'asr', 'maghrib', 'isha'];

/** Returns the difference in minutes between two HH:mm strings (b - a). */
function diffMinutes(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh! * 60 + bm! - (ah! * 60 + am!);
}

export function ScheduleRangeRow({ schedule, overrides }: ScheduleRangeRowProps) {
  // Subscribe to language changes so labels and 12-hour times re-format on toggle.
  const { t, i18n } = useTranslation();
  const activeOverrides = overrides.filter((o) => isActive(o, schedule.date));

  return (
    <div id={`schedule-range-row-${schedule.date}`} className="bg-white border-b border-gray-100">
      <div className="flex items-center px-4 py-2 bg-gray-50">
        <span className="text-sm font-medium text-gray-800 flex-1">
          <bdi dir="auto">
            {new Date(`${schedule.date}T12:00:00`).toLocaleDateString(
              getIntlLocale(i18n.language),
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              },
            )}
          </bdi>
        </span>
        {schedule.iqama_conflict && (
          <span
            data-testid="day-conflict-badge"
            className="text-[10px] bg-red-100 text-red-800 rounded-full px-1.5 me-2"
          >
            {t('schedule.conflict')}
          </span>
        )}
        <span className="text-xs text-gray-500">
          <bdi dir="auto">
            {formatWeekdayName(schedule.day_of_week, getIntlLocale(i18n.language))}
          </bdi>
        </span>
      </div>
      <div className="flex">
        {PRAYERS_BEFORE_SUNRISE.map((prayer) => {
          const override = activeOverrides.find((o) => o.prayer === prayer);
          const entry = schedule[prayer];
          const offsetMins = diffMinutes(entry.azan, entry.iqama);
          const offsetLabel = offsetMins > 0 ? `+${offsetMins}m` : `${offsetMins}m`;

          return (
            <div key={prayer} className="flex-1 flex flex-col items-center py-3 px-1">
              <span className="text-xs text-gray-400">{t(`prayers.${prayer}`)}</span>
              <span
                className={`text-xs mt-0.5 ${entry.azan_customized ? 'font-medium text-orange-500' : 'text-gray-500'}`}
                title={entry.azan_customized ? t('schedule.customizedAzan') : undefined}
              >
                <bdi dir="ltr">{formatTime12(entry.azan)}</bdi>
              </span>
              <span className="text-xs font-semibold text-gray-900 mt-0.5">
                <bdi dir="ltr">{formatTime12(entry.iqama)}</bdi>
              </span>
              {entry.iqama_conflict && (
                <span
                  data-testid={`conflict-badge-${prayer}`}
                  className="text-[10px] bg-red-100 text-red-800 rounded-full px-1.5 mt-0.5"
                >
                  {t('schedule.conflict')}
                </span>
              )}
              {override ? (
                <span className="text-xs font-medium text-orange-500 mt-0.5">
                  <bdi dir="ltr">
                    {override.overrideType === 'FIXED' ? offsetLabel : `${override.value}m`}
                  </bdi>
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-600 mt-0.5">
                  <bdi dir="ltr">{offsetLabel}</bdi>
                </span>
              )}
            </div>
          );
        })}

        {/* Sunrise column — shows time and gap from Fajr iqama */}
        <div className="flex-1 flex flex-col items-center py-3 px-1">
          <span className="text-xs text-gray-400">{t('prayers.sunrise')}</span>
          <span className="text-xs text-gray-500 mt-0.5">
            <bdi dir="ltr">{formatTime12(schedule.sunrise)}</bdi>
          </span>
          <span className="text-xs font-semibold text-gray-900 mt-0.5">—</span>
          <span className="text-xs font-medium text-gray-400 mt-0.5">
            {(() => {
              const gap = diffMinutes(schedule.fajr.iqama, schedule.sunrise);
              return <bdi dir="ltr">{gap > 0 ? `-${gap}m` : `${gap}m`}</bdi>;
            })()}
          </span>
        </div>

        {PRAYERS_AFTER_SUNRISE.map((prayer) => {
          const override = activeOverrides.find((o) => o.prayer === prayer);
          const entry = schedule[prayer];
          const offsetMins = diffMinutes(entry.azan, entry.iqama);
          const offsetLabel = offsetMins > 0 ? `+${offsetMins}m` : `${offsetMins}m`;

          return (
            <div key={prayer} className="flex-1 flex flex-col items-center py-3 px-1">
              <span className="text-xs text-gray-400">{t(`prayers.${prayer}`)}</span>
              <span
                className={`text-xs mt-0.5 ${entry.azan_customized ? 'font-medium text-orange-500' : 'text-gray-500'}`}
                title={entry.azan_customized ? t('schedule.customizedAzan') : undefined}
              >
                <bdi dir="ltr">{formatTime12(entry.azan)}</bdi>
              </span>
              <span className="text-xs font-semibold text-gray-900 mt-0.5">
                <bdi dir="ltr">{formatTime12(entry.iqama)}</bdi>
              </span>
              {entry.iqama_conflict && (
                <span
                  data-testid={`conflict-badge-${prayer}`}
                  className="text-[10px] bg-red-100 text-red-800 rounded-full px-1.5 mt-0.5"
                >
                  {t('schedule.conflict')}
                </span>
              )}
              {override ? (
                <span className="text-xs font-medium text-orange-500 mt-0.5">
                  <bdi dir="ltr">
                    {override.overrideType === 'FIXED' ? offsetLabel : `${override.value}m`}
                  </bdi>
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-600 mt-0.5">
                  <bdi dir="ltr">{offsetLabel}</bdi>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
