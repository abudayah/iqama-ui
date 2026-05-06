interface DayTabBarProps {
  activeTab: 'today' | 'tomorrow';
  onTabChange: (tab: 'today' | 'tomorrow') => void;
}

export function DayTabBar({ activeTab, onTabChange }: DayTabBarProps) {
  // Support swipe gesture via touchstart/touchend
  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0]?.clientX ?? 0;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
    if (Math.abs(dx) > 50) {
      onTabChange(dx < 0 ? 'tomorrow' : 'today');
    }
  };

  return (
    <div
      className="flex border-b border-gray-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {(['today', 'tomorrow'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-3 text-sm font-medium capitalize min-h-[44px] ${
            activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
          aria-selected={activeTab === tab}
          role="tab"
        >
          {tab === 'today' ? 'Today' : 'Tomorrow'}
        </button>
      ))}
    </div>
  );
}
