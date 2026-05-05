/**
 * Unit tests for AdminNav component.
 * Validates: Requirements 10.1, 10.2
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminNav } from './AdminNav';

describe('AdminNav', () => {
  it('renders "Ramadan & Eid" as the third tab label', () => {
    render(
      <MemoryRouter>
        <AdminNav />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ramadan & Eid')).toBeInTheDocument();
  });

  it('applies active styling to "Ramadan & Eid" link when route is /admin/eid', () => {
    render(
      <MemoryRouter initialEntries={['/admin/eid']}>
        <AdminNav />
      </MemoryRouter>,
    );

    const link = screen.getByText('Ramadan & Eid');
    expect(link).toHaveClass('border-b-2');
    expect(link).toHaveClass('border-blue-600');
    expect(link).toHaveClass('text-blue-600');
  });
});
