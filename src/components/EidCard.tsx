import type { EidPrayerRecord } from '../types';

interface EidCardProps {
  record: EidPrayerRecord;
}

function formatEidTypeName(type: EidPrayerRecord['type']): string {
  return type === 'EID_AL_FITR' ? 'Eid al-Fitr' : 'Eid al-Adha';
}

/**
 * Parses a YYYY-MM-DD string and formats it as a human-readable date
 * (e.g., "Friday, June 27, 2025") without timezone shift.
 */
function formatGregorianDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10) - 1; // months are 0-indexed in Date
  const day = parseInt(dayStr!, 10);
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function EidCard({ record }: EidCardProps) {
  const typeName = formatEidTypeName(record.type);
  const formattedDate = formatGregorianDate(record.date);
  const isAstronomical = record.source === 'astronomical';

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
      data-testid="eid-card"
    >
      {/* Decorative accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="p-5">
        {/* Star/crescent icon + heading */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">
            ⭐
          </span>
          <h2 className="text-base font-semibold text-gray-800">{typeName}</h2>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-4 ml-9">{formattedDate}</p>

        {/* Prayer times */}
        <div className="space-y-2 mb-4">
          {record.prayers.map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
            >
              <span className="text-sm font-medium text-gray-700">{entry.label}</span>
              <span className="text-sm font-semibold text-emerald-700">{entry.time}</span>
            </div>
          ))}
        </div>

        {/* Preliminary notice — only shown for astronomical source */}
        {isAstronomical && (
          <div
            className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
            role="note"
            data-testid="preliminary-notice"
          >
            <span className="text-amber-500 mt-0.5" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-xs text-amber-800">
              Preliminary times — subject to moon-sighting confirmation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
