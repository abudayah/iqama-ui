import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { IqamaRulesPage } from './IqamaRulesPage';
import { OverrideRow } from '../components/OverrideRow';
import { CONFIG_KEYS } from '../types/index';
import type { PrayerRule } from '../types/iqama-rules';

const BASE = 'https://api.example.com';
const R = `${BASE}/api/v1/admin/iqama-rules`;

const rule: PrayerRule = {
  base: { type: 'OFFSET', minutes: 5 },
  rounding: { mode: 'CEIL', step: 5 },
};
const config = {
  mode: 'db',
  currentRevision: 3,
  versions: [],
  effective: { fajr: rule, dhuhr: rule, asr: rule, maghrib: rule, isha: rule },
  today: '2026-11-11',
  timezone: 'America/Vancouver',
  defaultEffectiveFrom: '2026-11-13',
};
const catalog = {
  prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((name) => ({
    name,
    weeklyLockAllowed: name !== 'maghrib',
    fridayStartRequired: name !== 'maghrib',
    sunriseLimitAllowed: name === 'fajr',
  })),
  baseTypes: [
    {
      type: 'OFFSET',
      label: 'Minutes after Azan',
      fields: [{ name: 'minutes', kind: 'int', min: -120, max: 120 }],
    },
    { type: 'FIXED_TIME', label: 'Fixed clock time', fields: [{ name: 'time', kind: 'time' }] },
  ],
  modifiers: {
    limits: { minAfterAzan: { min: 0, max: 120 }, latestBeforeSunrise: { min: 0, max: 240 } },
    rounding: { modes: ['CEIL', 'FLOOR', 'NEAREST'], steps: [1, 5, 10, 15, 30, 60] },
    weekdayAdjust: {
      weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      min: -60,
      max: 60,
    },
  },
  guardrails: { minGapAfterAzanMinutes: 5, fajrEndsBeforeSunriseMinutes: 10, iqamaStepMinutes: 5 },
};
const prayerDay = { azan: '06:00', current: { iqama: '06:05', clamped: false } };
const previewBody = {
  previewId: 'tok-1',
  currentRevision: 3,
  effectiveFrom: '2026-11-13',
  warnings: [],
  days: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-11-${13 + i}`,
    day_of_week: 'Friday',
    prayers: Object.fromEntries(
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => [
        p,
        { ...prayerDay, proposed: { iqama: '06:20', clamped: i === 1 } },
      ]),
    ),
  })),
  summary: {
    from: '2026-11-13',
    to: '2027-11-12',
    totalDays: 365,
    daysChanged: 120,
    daysClamped: 7,
    daysClampedCurrent: 0,
    firstChangedDates: ['2026-11-13'],
    firstClampedDates: ['2026-11-14'],
    byPrayer: Object.fromEntries(
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => [
        p,
        { daysChanged: 120, daysClamped: 7 },
      ]),
    ),
  },
};

let previewDates: (string | undefined)[] = [];
let putBody: Record<string, unknown> | null = null;
let putStatus = 200;
const server = setupServer();
beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
beforeEach(() => {
  previewDates = [];
  putBody = null;
  putStatus = 200;
  localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE);
  localStorage.setItem(CONFIG_KEYS.API_KEY, 'k');
  server.use(
    http.get(R, () => HttpResponse.json(config)),
    http.get(`${R}/catalog`, () => HttpResponse.json(catalog)),
    http.post(`${R}/preview`, async ({ request }) => {
      const b = (await request.json()) as { effectiveFrom?: string };
      previewDates.push(b.effectiveFrom);
      return HttpResponse.json({ ...previewBody, effectiveFrom: b.effectiveFrom });
    }),
    http.put(`${R}/base`, async ({ request }) => {
      putBody = (await request.json()) as Record<string, unknown>;
      return putStatus === 200
        ? HttpResponse.json({ id: 4 })
        : HttpResponse.json(
            { message: 'Rules changed since you opened this page' },
            { status: putStatus },
          );
    }),
  );
});

async function editPrayerMinutes(prayer: string, minutes: string) {
  fireEvent.click(await screen.findByTestId(`rule-card-${prayer}`));
  const input = await screen.findByLabelText(/minutes/i, { selector: '#base-minutes' });
  fireEvent.change(input, { target: { value: minutes } });
  fireEvent.click(screen.getByRole('button', { name: 'Add to changes' }));
}

describe('IqamaRulesPage', () => {
  it('renders one card per prayer with a plain-English sentence', async () => {
    render(<IqamaRulesPage />);
    const card = await screen.findByTestId('rule-card-fajr');
    expect(card).toHaveTextContent('Azan + 5 min, rounded up to the next 5');
    expect(screen.getAllByTestId(/^rule-card-/)).toHaveLength(5);
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('lists the fixed guardrails from the catalog, read-only', async () => {
    render(<IqamaRulesPage />);
    const note = await screen.findByTestId('guardrails-note');
    expect(note).toHaveTextContent('Always applied');
    expect(note).toHaveTextContent('at least 5 min after Azan');
    expect(note).toHaveTextContent('Fajr iqama is at least 10 min before sunrise');
    expect(note).toHaveTextContent('Fajr, Dhuhr, Asr, Isha must start on a Friday');
    expect(note).toHaveTextContent('Maghrib can start any day');
    expect(within(note).getAllByRole('listitem')).toHaveLength(5);
    expect(note).toHaveTextContent('Every iqama is on a 5-minute mark (e.g. 9:04 becomes 9:05)');
    expect(note.querySelector('ol')).toHaveClass('list-decimal');
    expect(within(note).queryAllByRole('button')).toHaveLength(0);
    expect(within(note).queryAllByRole('textbox')).toHaveLength(0);
  });

  it('hides the 5-minute item when the catalog has no step (older engine)', async () => {
    const { iqamaStepMinutes: _s, ...guardrails } = catalog.guardrails;
    void _s;
    server.use(http.get(`${R}/catalog`, () => HttpResponse.json({ ...catalog, guardrails })));
    render(<IqamaRulesPage />);
    const note = await screen.findByTestId('guardrails-note');
    expect(within(note).getAllByRole('listitem')).toHaveLength(4);
    expect(note).not.toHaveTextContent('minute mark');
  });

  it('only offers rounding steps that are multiples of the iqama step', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    const select = await screen.findByLabelText('Rounding step');
    const options = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['to 5 min', 'to 10 min', 'to 15 min', 'to 30 min', 'to 60 min']);
  });

  it('shows a 7-day strip with clamp badges from /preview', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-isha'));
    const strip = await screen.findByTestId('preview-strip');
    expect(within(strip).getAllByRole('listitem')).toHaveLength(7);
    expect(within(strip).getAllByTestId('clamp-badge')).toHaveLength(1);
    expect(previewDates[0]).toBe('2026-11-13');
  });

  it('review shows the year scan and saves with token and revision', async () => {
    render(<IqamaRulesPage />);
    await editPrayerMinutes('isha', '15');
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    const scan = await screen.findByTestId('year-scan');
    expect(scan).toHaveTextContent('120');
    expect(scan).toHaveTextContent('2026-11-14');
    fireEvent.click(screen.getByLabelText(/I understand/));
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));
    await waitFor(() => expect(putBody).not.toBeNull());
    expect(putBody).toMatchObject({
      previewId: 'tok-1',
      expectedRevision: 3,
      effectiveFrom: '2026-11-13',
    });
    expect(JSON.parse(putBody!.settings as string).isha.base.minutes).toBe(15);
    expect(await screen.findByText(/Rules saved/)).toBeInTheDocument();
  });

  it('blocks a non-Friday date for a locked prayer but allows Maghrib', async () => {
    render(<IqamaRulesPage />);
    await editPrayerMinutes('fajr', '15');
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.change(await screen.findByLabelText('Effective from'), {
      target: { value: '2026-11-14' },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Fajr can only change on a Friday');
    fireEvent.click(screen.getByLabelText(/I understand/));
    expect(screen.getByRole('button', { name: 'Save rules' })).toBeDisabled();
  });

  it('allows any day when only Maghrib changed', async () => {
    render(<IqamaRulesPage />);
    await editPrayerMinutes('maghrib', '3');
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.change(await screen.findByLabelText('Effective from'), {
      target: { value: '2026-11-14' },
    });
    await screen.findByTestId('year-scan');
    fireEvent.click(screen.getByLabelText(/I understand/));
    expect(screen.queryByText(/can only change on a Friday/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Save rules' })).toBeEnabled();
  });

  it('shows the server message on a stale-revision 409', async () => {
    putStatus = 409;
    render(<IqamaRulesPage />);
    await editPrayerMinutes('isha', '15');
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    await screen.findByTestId('year-scan');
    fireEvent.click(screen.getByLabelText(/I understand/));
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Rules changed since you opened');
  });
});

describe('OverrideRow clamp warning', () => {
  const o = {
    id: 1,
    prayer: 'fajr' as const,
    overrideType: 'FIXED' as const,
    value: '06:00',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
  };
  it('shows the warning only when clamped', () => {
    const { rerender } = render(
      <OverrideRow override={o} today="2026-11-11" onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.queryByTestId('override-clamp-warning-1')).toBeNull();
    rerender(
      <OverrideRow override={o} today="2026-11-11" onEdit={() => {}} onDelete={() => {}} clamped />,
    );
    expect(screen.getByTestId('override-clamp-warning-1')).toBeInTheDocument();
  });
});
