import { useEffect, useMemo, useRef, useState } from 'react';

export interface WeekOption {
  /** YYYY-MM-DD of the Friday that starts the week */
  start: string;
  /** YYYY-MM-DD of the Thursday that ends the week */
  end: string;
  /** Human-readable label, e.g. "Fri May 9 – Thu May 15, 2025" */
  label: string;
}

/** Format a Date as YYYY-MM-DD in local time. */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Short weekday + month-day label, e.g. "Fri May 9". */
function shortLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generate all Friday→Thursday weeks that overlap with the given year range.
 * Weeks are ordered chronologically (earliest first).
 */
function generateWeeks(fromYear: number, toYear: number): WeekOption[] {
  const weeks: WeekOption[] = [];

  // Start from the first Friday on or before Jan 1 of fromYear
  const jan1 = new Date(fromYear, 0, 1);
  // getDay(): 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const dayOfWeek = jan1.getDay();
  // Days to subtract to reach the previous (or same) Friday
  const daysBack = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2;
  const cursor = new Date(jan1);
  cursor.setDate(jan1.getDate() - daysBack);

  const endBoundary = new Date(toYear, 11, 31); // Dec 31 of toYear

  while (cursor <= endBoundary) {
    const friday = new Date(cursor);
    const thursday = new Date(cursor);
    thursday.setDate(thursday.getDate() + 6);

    const yearLabel =
      friday.getFullYear() !== thursday.getFullYear()
        ? `, ${thursday.getFullYear()}`
        : `, ${friday.getFullYear()}`;

    weeks.push({
      start: toYMD(friday),
      end: toYMD(thursday),
      label: `${shortLabel(friday)} – ${shortLabel(thursday)}${yearLabel}`,
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

/**
 * Find the Friday→Thursday week that contains today.
 * Returns the index into the weeks array, or 0 if not found.
 */
function currentWeekIndex(weeks: WeekOption[]): number {
  const today = toYMD(new Date());
  const idx = weeks.findIndex((w) => w.start <= today && today <= w.end);
  return idx >= 0 ? idx : 0;
}

interface WeekSelectProps {
  start: string;
  end: string;
  onWeekChange: (start: string, end: string) => void;
}

export function WeekSelect({ start, onWeekChange }: WeekSelectProps) {
  const currentYear = new Date().getFullYear();
  // Show current year + next year so the full upcoming calendar is available
  const weeks = useMemo(() => generateWeeks(currentYear, currentYear + 1), [currentYear]);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  // Scroll the selected item into view whenever the dropdown opens
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  const filtered = search.trim()
    ? weeks.filter((w) => w.label.toLowerCase().includes(search.trim().toLowerCase()))
    : weeks;

  const selected = weeks.find((w) => w.start === start);
  const defaultIdx = currentWeekIndex(weeks);
  const displayLabel = selected?.label ?? weeks[defaultIdx]?.label ?? 'Select week';

  function choose(week: WeekOption) {
    onWeekChange(week.start, week.end);
    setSearch('');
    setOpen(false);
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Close only when focus leaves the entire container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      setSearch('');
    }
  }

  return (
    <div ref={containerRef} className="relative w-full" onBlur={handleBlur}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px] bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-gray-800">{displayLabel}</span>
        <svg
          className={`ml-2 h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search week…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Options list */}
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No weeks found</li>
            )}
            {filtered.map((week) => {
              const isSelected = week.start === start;
              const isCurrent = week.start === weeks[defaultIdx]?.start;
              return (
                <li
                  key={week.start}
                  ref={isSelected ? selectedRef : null}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    // Prevent the container's onBlur from firing before onClick
                    e.preventDefault();
                    choose(week);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2
                    ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800 hover:bg-gray-50'}`}
                >
                  <span>{week.label}</span>
                  {isCurrent && !isSelected && (
                    <span className="text-xs text-gray-400 flex-shrink-0">current</span>
                  )}
                  {isSelected && (
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
