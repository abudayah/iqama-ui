import { render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { SimulatorBanner } from './SimulatorBanner';

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('SimulatorBanner', () => {
  it('renders localized date/time values as text, not object placeholders', async () => {
    await i18n.changeLanguage('en');
    render(<SimulatorBanner simDateStr="2025-06-20" simNow={new Date('2025-06-20T05:45:00')} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Simulator active/);
    expect(screen.getByRole('status')).not.toHaveTextContent('[object Object]');
    expect(screen.getByRole('status')).toHaveTextContent(/Jun/);
    expect(screen.getByRole('status')).toHaveTextContent(/05:45/);
  });
});
