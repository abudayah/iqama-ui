// Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverrideFormModal } from './OverrideFormModal';
import type { Override } from '../types/index';

const noop = () => Promise.resolve();

// Helper: get the date inputs by their position (start = first, end = second)
function getDateInputs() {
  const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
  const startDateInput = dateInputs[0] as HTMLInputElement;
  const endDateInput = dateInputs[1] as HTMLInputElement;
  return { startDateInput, endDateInput };
}

// Helper: get the time input
function getTimeInput() {
  return document.querySelector<HTMLInputElement>('input[type="time"]')!;
}


describe('OverrideFormModal — FIXED validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error for an invalid FIXED time format when value is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<OverrideFormModal onSave={onSave} onClose={vi.fn()} />);

    // FIXED is the default; leave the time input empty
    // Fill in required dates so only value validation fires
    const { startDateInput, endDateInput } = getDateInputs();
    await user.type(startDateInput, '2025-01-10');
    await user.type(endDateInput, '2025-01-20');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText(/Enter a valid time/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('allows submission with a valid FIXED time format', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<OverrideFormModal onSave={onSave} onClose={onClose} />);

    // Fill in the time input
    const timeInput = getTimeInput();
    await user.clear(timeInput);
    await user.type(timeInput, '05:45');

    const { startDateInput, endDateInput } = getDateInputs();
    await user.type(startDateInput, '2025-01-10');
    await user.type(endDateInput, '2025-01-20');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideType: 'FIXED',
        startDate: '2025-01-10',
        endDate: '2025-01-20',
      }),
    );
  });
});

describe('OverrideFormModal — OFFSET slider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a range slider when OFFSET type is selected', async () => {
    const user = userEvent.setup();
    render(<OverrideFormModal onSave={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByDisplayValue('OFFSET'));

    const slider = screen.getByRole('slider', { name: /offset in minutes/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '-120');
    expect(slider).toHaveAttribute('max', '120');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('defaults to +15 min and submits the correct value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<OverrideFormModal onSave={onSave} onClose={onClose} />);

    await user.click(screen.getByDisplayValue('OFFSET'));

    const { startDateInput, endDateInput } = getDateInputs();
    await user.type(startDateInput, '2025-01-10');
    await user.type(endDateInput, '2025-01-20');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideType: 'OFFSET',
        value: '+15',
      }),
    );
  });
});

describe('OverrideFormModal — edit mode pre-population', () => {
  const initialOverride: Override = {
    id: 42,
    prayer: 'maghrib',
    overrideType: 'OFFSET',
    value: '+5',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
  };

  it('pre-fills prayer field with initial value', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    const prayerSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(prayerSelect.value).toBe('maghrib');
  });

  it('pre-fills override type with initial value', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    const offsetRadio = screen.getByDisplayValue('OFFSET') as HTMLInputElement;
    expect(offsetRadio.checked).toBe(true);
  });

  it('pre-fills value field with initial value', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    // For OFFSET type, value is shown via the slider and the badge label
    const slider = screen.getByRole('slider', { name: /offset in minutes/i }) as HTMLInputElement;
    expect(slider.value).toBe('5'); // +5 parsed to 5
    expect(screen.getByText('+5 min')).toBeInTheDocument();
  });

  it('pre-fills start date with initial value', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    const { startDateInput } = getDateInputs();
    expect(startDateInput.value).toBe('2025-03-01');
  });

  it('pre-fills end date with initial value', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    const { endDateInput } = getDateInputs();
    expect(endDateInput.value).toBe('2025-03-31');
  });

  it('shows "Edit Override" title in edit mode', () => {
    render(
      <OverrideFormModal
        initial={initialOverride}
        onSave={noop}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Edit Override')).toBeInTheDocument();
  });

  it('shows "New Override" title in create mode', () => {
    render(<OverrideFormModal onSave={noop} onClose={vi.fn()} />);

    expect(screen.getByText('New Override')).toBeInTheDocument();
  });
});

describe('OverrideFormModal — invalid inputs prevent submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error and does not call onSave when start date is missing', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<OverrideFormModal onSave={onSave} onClose={vi.fn()} />);

    // Fill in a valid time value
    const timeInput = getTimeInput();
    await user.clear(timeInput);
    await user.type(timeInput, '05:45');

    // Only fill end date, leave start date empty
    const { endDateInput } = getDateInputs();
    await user.type(endDateInput, '2025-01-20');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText(/Start date is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows error and does not call onSave when end date is missing', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<OverrideFormModal onSave={onSave} onClose={vi.fn()} />);

    const timeInput = getTimeInput();
    await user.clear(timeInput);
    await user.type(timeInput, '05:45');

    const { startDateInput } = getDateInputs();
    await user.type(startDateInput, '2025-01-10');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText(/End date is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows error when endDate is before startDate', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<OverrideFormModal onSave={onSave} onClose={vi.fn()} />);

    const timeInput = getTimeInput();
    await user.clear(timeInput);
    await user.type(timeInput, '05:45');

    const { startDateInput, endDateInput } = getDateInputs();
    await user.type(startDateInput, '2025-01-20');
    await user.type(endDateInput, '2025-01-10');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText(/End date must be on or after start date/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
