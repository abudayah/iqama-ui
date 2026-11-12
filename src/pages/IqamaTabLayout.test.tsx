import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { IqamaTabLayout } from './IqamaTabLayout';
import { IqamaRulesPage } from './IqamaRulesPage';
import { setupIqamaServer } from '../test/iqama-fixtures';

setupIqamaServer();

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
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    fireEvent.change(await screen.findByLabelText(/^Minutes after Azan/), {
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
    expect(screen.getByTestId('rule-card-maghrib')).toHaveTextContent('Azan + 15 min');
  });

  it('has no dot without changes', () => {
    renderAt('/admin');
    expect(screen.queryByTestId('rules-unsaved-dot')).toBeNull();
  });
});
