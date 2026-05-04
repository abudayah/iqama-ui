/**
 * Integration test for AdminAuthGate 401/403 handling with MSW.
 * Validates: Requirements 7.3
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuthGate, useAuthError } from './AdminAuthGate';
import { CONFIG_KEYS } from '../types/index';

const BASE_URL = 'https://api.example.com';

// A child component that calls the admin API and triggers auth error on 401
function AdminChild() {
  const triggerAuthError = useAuthError();

  const fetchData = async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/overrides`);
    if (res.status === 401 || res.status === 403) {
      triggerAuthError();
    }
  };

  return (
    <div>
      <p>Admin content</p>
      <button onClick={() => void fetchData()}>Fetch</button>
    </div>
  );
}

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AdminAuthGate — 401/403 handling', () => {
  beforeEach(() => {
    localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE_URL);
    localStorage.setItem(CONFIG_KEYS.API_KEY, 'valid-key');
  });

  it('renders children when API key is set', () => {
    renderWithRouter(
      <AdminAuthGate>
        <AdminChild />
      </AdminAuthGate>,
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders ApiKeyEntryScreen when API key is not set', () => {
    localStorage.removeItem(CONFIG_KEYS.API_KEY);

    renderWithRouter(
      <AdminAuthGate>
        <AdminChild />
      </AdminAuthGate>,
    );

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
  });

  it('clears the API key and renders ApiKeyEntryScreen when a 401 response triggers auth error', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    renderWithRouter(
      <AdminAuthGate>
        <AdminChild />
      </AdminAuthGate>,
    );

    // Initially shows admin content
    expect(screen.getByText('Admin content')).toBeInTheDocument();

    // Trigger a fetch that returns 401
    await user.click(screen.getByRole('button', { name: 'Fetch' }));

    // After 401, the gate should clear the key and show the login screen
    await waitFor(() => {
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    // Verify the key was cleared from localStorage
    expect(localStorage.getItem(CONFIG_KEYS.API_KEY)).toBe('');
  });

  it('clears the API key and renders ApiKeyEntryScreen when a 403 response triggers auth error', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      }),
    );

    renderWithRouter(
      <AdminAuthGate>
        <AdminChild />
      </AdminAuthGate>,
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fetch' }));

    await waitFor(() => {
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    expect(localStorage.getItem(CONFIG_KEYS.API_KEY)).toBe('');
  });
});
