import { useInstallPrompt } from '../hooks/useInstallPrompt';

const DIRECTIONS_URL = 'https://maps.app.goo.gl/UFtWUajt1Q4Xib3B8';

function DirectionsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function PublicFooter() {
  const { canInstall, triggerInstall } = useInstallPrompt();

  return (
    <footer
      id="public-footer"
      className="mt-auto fixed bottom-0 left-0 right-0 md:relative z-50"
      aria-label="Site footer"
      style={{ background: '#ffffff', borderTop: '1px solid #f0f0f0' }}
    >
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <span style={{ fontSize: '11px', color: '#999', letterSpacing: '0.02em' }}>
          Masjid Al-Hidayah
        </span>

        <div className="flex items-center gap-2.5">
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get directions to Masjid Al-Hidayah"
            className="flex items-center gap-1 transition-colors hover:text-gray-600"
            style={{
              fontSize: '11px',
              color: '#888',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            <DirectionsIcon />
            <span>Directions</span>
          </a>

          {canInstall && (
            <>
              <span style={{ width: 1, height: 10, background: '#ddd', display: 'inline-block' }} />
              <button
                onClick={() => void triggerInstall()}
                aria-label="Install this app on your device"
                className="flex items-center gap-1 transition-colors hover:text-gray-600 cursor-pointer"
                style={{
                  fontSize: '11px',
                  color: '#888',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                <DownloadIcon />
                <span>Install</span>
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
