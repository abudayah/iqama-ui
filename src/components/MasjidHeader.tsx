const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Masjid+Al-Hidayah+2626+Kingsway+Ave+Port+Coquitlam+BC';

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3 4.5 8.5 4.5 8.5S12.5 9 12.5 6A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function MasjidHeader() {
  return (
    <header id="masjid-header" className="bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 flex items-center justify-between gap-3">
        {/* Logo — full header height */}
        <img
          src="/isbc-logo.png"
          alt="Masjid Al-Hidayah"
          className="h-14 w-auto object-contain py-1"
        />

        {/* Address + maps link */}
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-teal transition-colors shrink-0"
          aria-label="Open Masjid Al-Hidayah in Google Maps"
        >
          <MapPinIcon />
          <span className="hidden sm:inline">2626 Kingsway Ave, Port Coquitlam</span>
          <span className="sm:hidden">Directions</span>
        </a>
      </div>
    </header>
  );
}
