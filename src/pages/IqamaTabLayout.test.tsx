import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AdminNav } from '../components/AdminNav';
import { IqamaTabLayout } from './IqamaTabLayout';
import { IqamaRulesPage } from './IqamaRulesPage';
import { CONFIG_KEYS } from '../types/index';

const BASE = 'https://api.example.com';
const R = `${BASE}/api/v1/admin/iqama-rules`;
const rule = { base: { type: 'OFFSET', minutes: 5 } };
const config = {
  mode: 'db',
  currentRevision: 1,
  versions: [],
  effective: { fajr: rule, dhuhr: rule, asr: rule, maghrib: rule, isha: rule },
  today: '2026-11-11',
  timezone: 'America/Vancouver',
  defaultEffectiveFrom: '2026-11-13',
};
const catalog = {
  prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((name) => ({
    name,
    weeklyLockAllowed: true,
    fridayStartRequired: name !== 'maghrib',
    sunriseLimitAllowed: name === 'fajr',
  })),
  baseTypes: [
    {
      type: 'OFFSET',
      label: 'Minutes after Azan',
      fields: [{ name: 'minutes', kind: 'int', min: -120, max: 120 }],
    },
  ],
  modifiers: {
    limits: { minAfterAzan: { min: 0, max: 120 }, latestBeforeSunrise: { min: 0, max: 240 } },
    rounding: { modes: ['CEIL'], steps: [1, 5] },
    weekdayAdjust: { weekdays: ['FRI'], min: -60, max: 60 },
  },
  guardrails: { minGapAfterAzanMinutes: 5, fajrEndsBeforeSunriseMinutes: 10 },
};

const server = setupServer();
beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
beforeEach(() => {
  localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE);
  localStorage.setItem(CONFIG_KEYS.API_KEY, 'k');
  server.use(
    http.get(R, () => HttpResponse.json(config)),
    http.get(`${R}/catalog`, () => HttpResponse.json(catalog)),
    http.post(`${R}/preview`, () => new HttpResponse(null, { status: 500 })),
    http.get(`${BASE}/api/v1/admin/overrides`, () => HttpResponse.json([])),
    http.get(`${BASE}/api/v1/schedule`, () => HttpResponse.json([])),
  );
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminNav />
      <Routes>
        <Route path="/admin" element={<Outlet />}>
          <Route element={<IqamaTabLayout />}>
            <Route index element={<p>overrides-view</p>} />
            <Route path="iqama" element={<IqamaRulesPage />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Nav', () => {
  it('has 4 tabs and no separate "Iqama Rules" item', () => {
    renderAt('/admin');
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Iqama',
      'Weekly View',
      'Ramadan & Eid',
      'Adhan',
    ]);
  });

  it.each(['/admin', '/admin/iqama'])('highlights "Iqama" on %s', (path) => {
    renderAt(path);
    expect(screen.getByText('Iqama', { selector: 'a' })).toHaveClass('border-blue-600');
  });
});

describe('Iqama tab segmented control', () => {
  it('defaults to Overrides at /admin', () => {
    renderAt('/admin');
    expect(screen.getByRole('tab', { name: 'Overrides' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Rules' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('overrides-view')).toBeInTheDocument();
  });

  it('shows Rules at /admin/iqama', async () => {
    renderAt('/admin/iqama');
    expect(screen.getByRole('tab', { name: 'Rules' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByTestId('rule-card-fajr')).toBeInTheDocument();
  });

  it('switches by click and by arrow keys', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await user.click(screen.getByRole('tab', { name: 'Rules' }));
    expect(await screen.findByTestId('rule-card-fajr')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rules' })).toHaveAttribute('aria-selected', 'true');
    screen.getByRole('tab', { name: 'Rules' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('overrides-view')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overrides' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(await screen.findByTestId('rule-card-fajr')).toBeInTheDocument();
  });

  it('keeps the unsaved Rules draft when switching to Overrides and back', async () => {
    const user = userEvent.setup();
    renderAt('/admin/iqama');
    fireEvent.click(await screen.findByTestId('rule-card-isha'));
    fireEvent.change(await screen.findByLabelText(/minutes/i, { selector: '#base-minutes' }), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to changes' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByTestId('rules-unsaved-dot')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Overrides' }));
    expect(screen.getByText('overrides-view')).toBeInTheDocument();
    expect(screen.getByTestId('rules-unsaved-dot')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^Rules/ }));
    await waitFor(() => expect(screen.getByText('Unsaved changes')).toBeInTheDocument());
    expect(screen.getByTestId('rule-card-isha')).toHaveTextContent('Azan + 15 min');
  });

  it('has no dot without changes', () => {
    renderAt('/admin');
    expect(screen.queryByTestId('rules-unsaved-dot')).toBeNull();
  });
});
