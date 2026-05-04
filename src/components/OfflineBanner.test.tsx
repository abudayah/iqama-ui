// Validates: Requirements 6.5

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

vi.mock('../hooks/useOnlineStatus');

import { useOnlineStatus } from '../hooks/useOnlineStatus';

const mockUseOnlineStatus = vi.mocked(useOnlineStatus);

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the banner when useOnlineStatus returns false (offline)', () => {
    mockUseOnlineStatus.mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render the banner when useOnlineStatus returns true (online)', () => {
    mockUseOnlineStatus.mockReturnValue(true);

    render(<OfflineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
