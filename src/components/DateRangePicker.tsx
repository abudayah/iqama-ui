interface DateRangePickerProps {
  start: string;
  end: string;
  onRangeChange: (start: string, end: string) => void;
}

export function DateRangePicker({ start, end, onRangeChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-3 items-center p-4 bg-white border-b border-gray-200">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">From</label>
        <input
          type="date"
          value={start}
          onChange={(e) => onRangeChange(e.target.value, end)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px]"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">To</label>
        <input
          type="date"
          value={end}
          onChange={(e) => onRangeChange(start, e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px]"
        />
      </div>
    </div>
  );
}
