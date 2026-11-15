import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type IslamicEvent = string | null;

interface IslamicEventBannerProps {
  hijriMonth: number;
  hijriDay: number;
}

/* ─── Event logic ────────────────────────────────────────────────────────────── */
/** Returns the i18n key of the greeting, or null when no event applies. */
function getIslamicEventKey(hijriMonth: number, hijriDay: number): IslamicEvent {
  // 1. Muharram
  if (hijriMonth === 1) {
    if (hijriDay === 1) return 'events.newYear';
    if (hijriDay === 10) return 'events.ashura';
  }
  // 7. Rajab — Isra' and Mi'raj
  if (hijriMonth === 7 && hijriDay === 27) return 'events.isra';
  // 9. Ramadan
  if (hijriMonth === 9) {
    return 'events.ramadan';
  }
  // 10. Shawwal
  if (hijriMonth === 10 && hijriDay >= 1 && hijriDay <= 3) {
    return 'events.eidFitr';
  }
  // 12. Dhu al-Hijjah
  if (hijriMonth === 12) {
    if (hijriDay >= 1 && hijriDay <= 8) return 'events.hajj';
    if (hijriDay === 9) return 'events.arafah';
    if (hijriDay >= 10 && hijriDay <= 13) return 'events.eidAdha';
  }
  return null;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export const IslamicEventBanner: FC<IslamicEventBannerProps> = ({ hijriMonth, hijriDay }) => {
  // Subscribe to language changes so the greeting re-renders on toggle.
  const { t } = useTranslation();
  const key = getIslamicEventKey(hijriMonth, hijriDay);

  if (!key) return null;

  const greeting = t(key);

  return (
    <div
      id="islamic-events"
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
