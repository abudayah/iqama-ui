import i18n from './index';

/** Engine catalog labels are contract data; translate known labels without changing the API values. */
const LABEL_KEYS: Record<string, string> = {
  Limits: 'limits',
  'At least this many minutes after Azan': 'minAfterAzan',
  'At most this many minutes before sunrise': 'latestBeforeSunrise',
  'Iqama at least this many minutes before sunrise': 'iqamaBeforeSunrise',
  Direction: 'direction',
  'Round up': 'roundUp',
  'Round down': 'roundDown',
  'Round to nearest': 'roundNearest',
  'To a multiple of (minutes)': 'multipleMinutes',
  'Weekday adjustment': 'weekdayAdjustment',
  'Minutes added on that weekday, e.g. FRI -5. Leave a weekday empty for no change.':
    'weekdayAdjustmentNote',
  SUN: 'weekdaySun',
  MON: 'weekdayMon',
  TUE: 'weekdayTue',
  WED: 'weekdayWed',
  THU: 'weekdayThu',
  FRI: 'weekdayFri',
  SAT: 'weekdaySat',
  'Hold for the Friday to Thursday week': 'weeklyLock',
  'Minutes after Azan': 'offsetMinutes',
  'Fixed clock time': 'fixedClockTime',
  Time: 'time',
  'Gap that scales with Azan time': 'scaledGap',
  'Azan times must be strictly increasing; the gap is held flat before the first and after the last point.':
    'scaledGapNote',
  Points: 'points',
  'When Azan is at': 'whenAzanAt',
  'Gap after Azan (minutes)': 'gapAfterAzan',
  'Seasonal fixed times': 'seasonalFixedTimes',
  'Repeats every year; the last segment wraps over New Year. Start dates must be unique.':
    'seasonalNote',
  Segments: 'segments',
  'Starts on': 'startsOn',
  'A calendar date': 'calendarDate',
  'The first Friday of a month': 'firstFriday',
  'Month (1 = January)': 'monthNumber',
  'Day of month': 'dayOfMonth',
  'Must exist in the chosen month (February allows 29).': 'validDayInMonth',
  'Iqama time': 'iqamaTime',
  '5 minutes': 'minutes5',
  '10 minutes': 'minutes10',
  '15 minutes': 'minutes15',
  '30 minutes': 'minutes30',
  '60 minutes': 'minutes60',
};

export function translateRuleCatalog(label: string, language: string): string {
  const key = LABEL_KEYS[label];
  return key ? i18n.t(`ruleEditor.catalog.${key}`, { lng: language }) : label;
}
