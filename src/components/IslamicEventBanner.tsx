import type { FC } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type IslamicEvent = string | null;

interface IslamicEventBannerProps {
  hijriMonth: number;
  hijriDay: number;
}

/* ─── Event logic ────────────────────────────────────────────────────────────── */
function getIslamicEventGreeting(hijriMonth: number, hijriDay: number): IslamicEvent {
  // 1. Muharram
  if (hijriMonth === 1) {
    if (hijriDay === 1) return '✨ Hijri New Year';
    if (hijriDay === 10) return '🤲 Day of Ashura';
  }
  // 9. Ramadan
  if (hijriMonth === 9) {
    return '🌙 Ramadan Mubarak';
  }
  // 10. Shawwal
  if (hijriMonth === 10 && hijriDay >= 1 && hijriDay <= 3) {
    return '🌙 Eid al-Fitr Mubarak';
  }
  // 12. Dhu al-Hijjah
  if (hijriMonth === 12) {
    if (hijriDay >= 8 && hijriDay <= 13) {
      if (hijriDay === 9) return '🤲 Day of Arafah';
      if (hijriDay >= 10 && hijriDay <= 13) return '🐑 Eid al-Adha Mubarak';
      return '🕋 Hajj Season';
    }
  }
  return null;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export const IslamicEventBanner: FC<IslamicEventBannerProps> = ({ hijriMonth, hijriDay }) => {
  const greeting = getIslamicEventGreeting(hijriMonth, hijriDay);

  if (!greeting) return null;

  return (
    <div
      className={[
        // Positioning — centered horizontally, bottom of hero
        'absolute bottom-8 left-1/2 -translate-x-1/2',
        // Stacking — must clear the z-10 prayer table below
        'z-20',
        // Typography
        'text-base font-semibold text-white whitespace-nowrap',
      ].join(' ')}
      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
      role="status"
      aria-label={greeting}
    >
      {greeting}
    </div>
  );
};
