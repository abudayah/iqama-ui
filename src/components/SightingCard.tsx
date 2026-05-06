const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhul Qi'dah",
  'Dhul Hijjah',
] as const;

interface SightingCardProps {
  hijriMonth: number; // 1–12, current month
  onDecision: (length: 29 | 30) => void;
}

export function SightingCard({ hijriMonth, onDecision }: SightingCardProps) {
  const currentMonthName = HIJRI_MONTHS[hijriMonth - 1];
  const nextMonthName = HIJRI_MONTHS[hijriMonth % 12];

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm"
      data-testid="sighting-card"
    >
      {/* Decorative accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="p-5">
        {/* Moon icon + heading */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" aria-hidden="true">
            🌙
          </span>
          <h2 className="text-base font-semibold text-gray-800">Moon Sighting</h2>
        </div>

        {/* Prompt */}
        <p className="text-sm text-gray-700 mb-5">
          Today is the 29th of <span className="font-medium">{currentMonthName}</span>. Has the moon
          for <span className="font-medium">{nextMonthName}</span> been sighted?
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onDecision(29)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors min-h-[44px]"
          >
            Yes, Month ends today (29 Days)
          </button>
          <button
            onClick={() => onDecision(30)}
            className="flex-1 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg py-3 px-4 text-sm font-medium transition-colors min-h-[44px]"
          >
            No, Complete 30 days
          </button>
        </div>
      </div>
    </div>
  );
}
