import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationSheet } from './ConfirmationSheet';

describe('ConfirmationSheet', () => {
  it('renders the consequence text', () => {
    render(
      <ConfirmationSheet
        consequenceText="This action cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onConfirm when the Confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationSheet
        consequenceText="Are you sure?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationSheet
        consequenceText="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the backdrop is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationSheet
        consequenceText="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByTestId('confirmation-backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
