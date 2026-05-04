# Iqama UI

A React-based display app for the Iqama Engine. Shows live prayer times, countdown to the next prayer, and a dynamic sky scene that reflects the time of day.

## Features

- Live countdown to the next Azan and Iqama
- Dynamic sky scene (dawn, day, dusk, night) driven by the current prayer
- Moon phase visualization based on the Hijri calendar date
- Today / Tomorrow prayer schedule table
- **URL-based simulator** for testing any date and time without touching the system clock

## Getting Started

### Prerequisites

- Node.js 18+
- A running [Iqama Engine](../iqama-engine/README.md) instance

### Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your-admin-api-key
```

3. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
npm run build
```

---

## Simulator

The simulator lets you preview any date and time without changing your system clock or touching the backend. It works by passing URL params that override what the app treats as "now".

### URL Params

| Param | Format | Description |
|---|---|---|
| `sim_date` | `YYYY-MM-DD` | Simulate a different date |
| `sim_time` | `HH:mm` | Simulate a specific time of day |

Both params are optional and independent — use one or both together.

### How It Works

- `sim_date` changes which date is fetched from the backend. The backend computes the correct prayer times **and Hijri date** for that day, so everything is accurate.
- `sim_time` shifts the clock used for "next prayer" and countdown logic. The countdown display freezes at that moment (it doesn't tick forward).
- When either param is active, a purple **Simulator** banner appears at the top of the page with an **Exit** button that removes the params.

### Examples

Simulate a winter day (early Asr, long Isha delay):
```
/?sim_date=2025-01-15
```

Simulate pre-Fajr time (DAWN sky, Fajr countdown):
```
/?sim_time=04:30
```

Simulate Maghrib window (DUSK sky):
```
/?sim_time=19:45
```

Simulate a specific date and time together:
```
/?sim_date=2025-06-15&sim_time=20:00
```

Simulate a Friday in Ramadan:
```
/?sim_date=2025-03-07&sim_time=03:45
```

### What Gets Simulated

| Thing | Simulated? | Notes |
|---|---|---|
| Prayer times | ✅ | Backend fetches real times for `sim_date` |
| Hijri date & moon phase | ✅ | Derived from `sim_date` by the backend |
| Day of week | ✅ | Comes from the backend response |
| Sky phase (dawn/day/dusk/night) | ✅ | Driven by which prayer is next at `sim_time` |
| Countdown display | ✅ | Frozen at `sim_time` |
| System clock | ❌ | Never touched |

### Implementation

The simulator is implemented entirely in the frontend:

- `src/hooks/useSimulator.ts` — reads and validates the URL params, returns a `simNow` Date and the effective date strings
- `src/hooks/usePrayerContext.ts` — accepts an optional `simulatedNow` param; when provided, all time comparisons use it instead of `new Date()`
- `src/pages/PrayerViewerPage.tsx` — passes `simDateStr` / `simTomorrowStr` to `useSchedule` and `simNow` to `usePrayerContext`
- `src/components/SimulatorBanner.tsx` — the purple banner shown when simulation is active

---

## Project Structure

```
iqama-ui/
├── src/
│   ├── api/                # API client and error types
│   ├── components/         # UI components
│   │   ├── HeroBanner.tsx      # Sky scene, countdown, moon phase
│   │   ├── PrayerTable.tsx     # Today/tomorrow schedule table
│   │   ├── SimulatorBanner.tsx # Simulator mode indicator
│   │   └── ...
│   ├── hooks/              # React hooks
│   │   ├── usePrayerContext.ts # Core time/prayer state
│   │   ├── useSchedule.ts      # Schedule data fetching
│   │   ├── useSimulator.ts     # URL param simulator
│   │   └── ...
│   ├── logic/              # Pure functions (no React)
│   │   ├── derive-next-prayer.ts
│   │   └── derive-countdown.ts
│   ├── pages/
│   │   ├── PrayerViewerPage.tsx
│   │   └── AdminPage.tsx
│   ├── services/           # API service functions
│   ├── store/              # Config store
│   └── types/              # Shared TypeScript types
└── ...
```

## License

UNLICENSED — Private project
