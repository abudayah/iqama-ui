/**
 * SimulatorBanner
 *
 * Shown at the top of the page when URL simulator params are active.
 * Displays the simulated date and time, and provides a link to exit.
 */
interface SimulatorBannerProps {
  simDateStr: string;
  simNow: Date;
}

export function SimulatorBanner({ simDateStr, simNow }: SimulatorBannerProps) {
  const timeStr = simNow.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  function exitSimulator() {
    const url = new URL(window.location.href);
    url.searchParams.delete('sim_date');
    url.searchParams.delete('sim_time');
    window.location.href = url.toString();
  }

  return (
    <div
      role="status"
      aria-label="Simulator mode active"
      className="flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium"
      style={{ background: '#7c3aed', color: '#fff' }}
    >
      <span className="flex items-center gap-2">
        {/* Flask icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          width={14}
          height={14}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.5 2a.75.75 0 0 1 .75.75V7.5l3.536 5.304A3 3 0 0 1 10.25 18h-4.5a3 3 0 0 1-2.536-4.196L6.75 7.5V2.75A.75.75 0 0 1 7.5 2h1Zm1.25 5.5V2.75a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 .75.75V7.5l.47.705A4.002 4.002 0 0 0 14 10.5H6a4.002 4.002 0 0 0 1.28-2.295L8.5 7.5Z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Simulator active — {simDateStr} at {timeStr}
        </span>
      </span>
      <button
        onClick={exitSimulator}
        className="underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Exit simulator"
      >
        Exit
      </button>
    </div>
  );
}
