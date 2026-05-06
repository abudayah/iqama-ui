/**
 * Tests for RamadanEidPage — tasks 13.7, 13.8, 13.9, 13.10
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { RamadanEidPage, computeConsequenceText } from './RamadanEidPage';

// ── Mock all hooks and services ────────────────────────────────────────────

vi.mock('../hooks/useSightingStatus', () => ({
  useSightingStatus: vi.fn(),
}));

vi.mock('../hooks/useEidPrayers', () => ({
  useEidPrayers: vi.fn(),
}));

vi.mock('../hooks/useQiyamConfig', () => ({
  useQiyamConfig: vi.fn(),
}));

vi.mock('../services/hijri-calendar-service', () => ({
  submitOverride: vi.fn(),
}));

// ── Import mocked modules ──────────────────────────────────────────────────

import { useSightingStatus } from '../hooks/useSightingStatus';
import { useEidPrayers } from '../hooks/useEidPrayers';
import { useQiyamConfig } from '../hooks/useQiyamConfig';
import { submitOverride } from '../services/hijri-calendar-service';

const mockUseSightingStatus = vi.mocked(useSightingStatus);
const mockUseEidPrayers = vi.mocked(useEidPrayers);
const mockUseQiyamConfig = vi.mocked(useQiyamConfig);
const mockSubmitOverride = vi.mocked(submitOverride);

// ── Default mock return values ─────────────────────────────────────────────

function makeDefaultStatus(
  overrides: Partial<{
    hijriMonth: number;
    hijriDay: number;
    hasOverride: boolean;
    gregorianDate: string;
  }> = {},
) {
  return {
    gregorianDate: '2025-03-29',
    hijriYear: 1446,
    hijriMonth: overrides.hijriMonth ?? 9,
    hijriDay: overrides.hijriDay ?? 29,
    hasOverride: overrides.hasOverride ?? false,
    overrideLength: null as 29 | 30 | null,
    ...overrides,
  };
}

function setupDefaultMocks(statusOverrides: Parameters<typeof makeDefaultStatus>[0] = {}) {
  mockUseSightingStatus.mockReturnValue({
    status: makeDefaultStatus(statusOverrides),
    loading: false,
    error: null,
    refetch: vi.fn(),
  });

  mockUseEidPrayers.mockReturnValue({
    records: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  });

  mockUseQiyamConfig.mockReturnValue({
    config: null,
    loading: false,
    error: null,
    save: vi.fn(),
    saving: false,
    saveError: null,
    saveSuccess: false,
  });

  mockSubmitOverride.mockResolvedValue(undefined);
}

// ── Unit Tests (Task 13.7) ─────────────────────────────────────────────────

describe('RamadanEidPage — unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ── Action Card always renders ──

  it('always renders the SightingCard (Action Card)', () => {
    render(<RamadanEidPage />);
    expect(screen.getByTestId('sighting-card')).toBeInTheDocument();
  });

  it('renders SightingCard even when status is loading', () => {
    mockUseSightingStatus.mockReturnValue({
      status: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('sighting-card')).toBeInTheDocument();
  });

  it('renders SightingCard even when status has an error', () => {
    mockUseSightingStatus.mockReturnValue({
      status: null,
      loading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('sighting-card')).toBeInTheDocument();
  });

  // ── ConfirmationSheet opens on button tap WITHOUT dispatching POST ──

  it('opens ConfirmationSheet when a decision button is tapped, without dispatching POST', () => {
    render(<RamadanEidPage />);

    // Tap the 29-day tile
    fireEvent.click(screen.getByTestId('month-length-tile-29'));

    // ConfirmationSheet should be open
    expect(screen.getByText(/Eid al-Fitr will fall on/i)).toBeInTheDocument();

    // POST should NOT have been dispatched
    expect(mockSubmitOverride).not.toHaveBeenCalled();
  });

  it('opens ConfirmationSheet when "No" button is tapped, without dispatching POST', () => {
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-30'));

    expect(screen.getByText(/Eid al-Fitr will fall on/i)).toBeInTheDocument();
    expect(mockSubmitOverride).not.toHaveBeenCalled();
  });

  it('closes ConfirmationSheet when Cancel is tapped', () => {
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    expect(screen.getByText(/Eid al-Fitr will fall on/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Eid al-Fitr will fall on/i)).not.toBeInTheDocument();
    expect(mockSubmitOverride).not.toHaveBeenCalled();
  });

  // ── EidPrayerModal opens for months 9 and 11 ──

  it('opens EidPrayerModal (not dispatching POST) when Confirm is tapped for month 9', async () => {
    setupDefaultMocks({ hijriMonth: 9 });
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByText(/Confirm Eid al-Fitr Prayers/i)).toBeInTheDocument();
    });
    expect(mockSubmitOverride).not.toHaveBeenCalled();
  });

  it('opens EidPrayerModal (not dispatching POST) when Confirm is tapped for month 11', async () => {
    setupDefaultMocks({ hijriMonth: 11 });
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByText(/Confirm Eid al-Adha Prayers/i)).toBeInTheDocument();
    });
    expect(mockSubmitOverride).not.toHaveBeenCalled();
  });

  // ── POST dispatched directly for non-Eid months ──

  it('dispatches POST directly when Confirm is tapped for a non-Eid month (month 1)', async () => {
    setupDefaultMocks({ hijriMonth: 1 });
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockSubmitOverride).toHaveBeenCalledTimes(1);
    });

    // EidPrayerModal should NOT be open
    expect(screen.queryByText(/Confirm Eid/i)).not.toBeInTheDocument();
  });

  it('dispatches POST directly for month 5 (non-Eid)', async () => {
    setupDefaultMocks({ hijriMonth: 5 });
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-30'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockSubmitOverride).toHaveBeenCalledWith(
        expect.objectContaining({ hijriMonth: 5, length: 30 }),
      );
    });
    expect(screen.queryByText(/Confirm Eid/i)).not.toBeInTheDocument();
  });

  // ── Success state after POST ──

  it('shows success message after successful POST for non-Eid month', async () => {
    setupDefaultMocks({ hijriMonth: 3 });
    mockSubmitOverride.mockResolvedValue(undefined);
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('sighting-success')).toBeInTheDocument();
    });
  });

  // ── Error state after POST ──

  it('shows error message when POST fails for non-Eid month', async () => {
    setupDefaultMocks({ hijriMonth: 3 });
    mockSubmitOverride.mockRejectedValue(new Error('Server error'));
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('month-length-tile-29'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('sighting-error')).toBeInTheDocument();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  // ── Status card badges ──

  it('shows no badge by default (astronomical is the default state)', () => {
    setupDefaultMocks({ hasOverride: false });
    render(<RamadanEidPage />);
    expect(screen.queryByTestId('confirmed-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-badge')).not.toBeInTheDocument();
  });

  it('shows skeleton loading state when status is loading', () => {
    mockUseSightingStatus.mockReturnValue({
      status: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('status-skeleton')).toBeInTheDocument();
  });

  it('shows error state when status fetch fails', () => {
    mockUseSightingStatus.mockReturnValue({
      status: null,
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('status-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  // ── Eid Prayer Times section ──

  it('shows "No prayer times saved yet" when no records exist', () => {
    render(<RamadanEidPage />);
    const messages = screen.getAllByText(/No prayer times saved yet/i);
    expect(messages).toHaveLength(2); // one for each Eid type
  });

  it('shows "Prayer times will be set once the moon-sighting override is submitted" for astronomical source', () => {
    mockUseEidPrayers.mockReturnValue({
      records: [
        {
          type: 'EID_AL_FITR',
          date: '2025-03-30',
          prayers: [],
          source: 'astronomical',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(
      screen.getByText(/Prayer times will be set once the moon-sighting override is submitted/i),
    ).toBeInTheDocument();
  });

  it('shows prayer times when source is override', () => {
    mockUseEidPrayers.mockReturnValue({
      records: [
        {
          type: 'EID_AL_FITR',
          date: '2025-03-30',
          prayers: [
            { label: '1st Eid Prayer', time: '07:30' },
            { label: '2nd Eid Prayer', time: '09:00' },
          ],
          source: 'override',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RamadanEidPage />);
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('opens EidPrayerModal when "Edit times" button is clicked', () => {
    render(<RamadanEidPage />);
    const editButtons = screen.getAllByTestId(/edit-eid-button/);
    fireEvent.click(editButtons[0]!);
    expect(screen.getByText(/Confirm Eid/i)).toBeInTheDocument();
  });

  // ── Qiyam section ──

  it('pre-populates the Qiyam time input from fetched config', () => {
    mockUseQiyamConfig.mockReturnValue({
      config: { hijri_year: 1447, start_time: '23:30' },
      loading: false,
      error: null,
      save: vi.fn(),
      saving: false,
      saveError: null,
      saveSuccess: false,
    });
    render(<RamadanEidPage />);
    const input = screen.getByTestId('qiyam-time-input') as HTMLInputElement;
    expect(input.value).toBe('23:30');
  });

  it('shows empty time input when no Qiyam config exists', () => {
    render(<RamadanEidPage />);
    const input = screen.getByTestId('qiyam-time-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('dispatches POST when "Save Qiyam time" button is clicked', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    mockUseQiyamConfig.mockReturnValue({
      config: { hijri_year: 1447, start_time: '23:30' },
      loading: false,
      error: null,
      save: mockSave,
      saving: false,
      saveError: null,
      saveSuccess: false,
    });
    render(<RamadanEidPage />);

    fireEvent.click(screen.getByTestId('save-qiyam-button'));

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('23:30');
    });
  });

  it('shows success message after Qiyam save succeeds', () => {
    mockUseQiyamConfig.mockReturnValue({
      config: { hijri_year: 1447, start_time: '23:30' },
      loading: false,
      error: null,
      save: vi.fn(),
      saving: false,
      saveError: null,
      saveSuccess: true,
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('qiyam-save-success')).toBeInTheDocument();
  });

  it('shows error message when Qiyam save fails', () => {
    mockUseQiyamConfig.mockReturnValue({
      config: null,
      loading: false,
      error: null,
      save: vi.fn(),
      saving: false,
      saveError: 'Failed to save',
      saveSuccess: false,
    });
    render(<RamadanEidPage />);
    expect(screen.getByTestId('qiyam-save-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
  });

  it('displays "Active nights: 20th–29th Ramadan" label', () => {
    render(<RamadanEidPage />);
    expect(screen.getByText(/Active nights: 20th–29th Ramadan/i)).toBeInTheDocument();
  });

  it('displays the Qiyam note text', () => {
    render(<RamadanEidPage />);
    expect(
      screen.getByText(/Shown in the app as.*Qiyam.*with start time only/i),
    ).toBeInTheDocument();
  });
});

// ── computeConsequenceText unit tests ──────────────────────────────────────

describe('computeConsequenceText', () => {
  const referenceDate = new Date('2025-03-29');

  it('returns Eid al-Fitr date for month 9', () => {
    const text = computeConsequenceText(9, 29, referenceDate);
    expect(text).toMatch(/Eid al-Fitr will fall on/i);
  });

  it('returns Eid al-Adha date for month 11', () => {
    const text = computeConsequenceText(11, 29, referenceDate);
    expect(text).toMatch(/Eid al-Adha will fall on/i);
  });

  it('returns month length for month 1', () => {
    const text = computeConsequenceText(1, 29, referenceDate);
    expect(text).toMatch(/29/);
    expect(text).not.toMatch(/Eid/i);
  });

  it('returns month length for month 12', () => {
    const text = computeConsequenceText(12, 30, referenceDate);
    expect(text).toMatch(/30/);
    expect(text).not.toMatch(/Eid/i);
  });
});

// ── Property 5: Action Card always visible for any Hijri day (Task 13.8) ──

describe('Property 5: Action Card always visible for any Hijri day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEidPrayers.mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseQiyamConfig.mockReturnValue({
      config: null,
      loading: false,
      error: null,
      save: vi.fn(),
      saving: false,
      saveError: null,
      saveSuccess: false,
    });
    mockSubmitOverride.mockResolvedValue(undefined);
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * For any Hijri day (1–30), render RamadanEidPage with that day in status,
   * assert Action Card is present — run 100 iterations.
   */
  it('renders Action Card for any Hijri day value (1–30)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        mockUseSightingStatus.mockReturnValue({
          status: {
            gregorianDate: '2025-03-29',
            hijriYear: 1446,
            hijriMonth: 9,
            hijriDay,
            hasOverride: false,
            overrideLength: null,
          },
          loading: false,
          error: null,
          refetch: vi.fn(),
        });

        const { unmount } = render(<RamadanEidPage />);
        const card = screen.getByTestId('sighting-card');
        const result = card !== null && card !== undefined;
        unmount();
        return result;
      }),
      { numRuns: 100 },
    );
  });

  it('renders Action Card even when status is null (loading state)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (hijriDay) => {
        // Suppress unused variable warning — hijriDay drives the property
        void hijriDay;
        mockUseSightingStatus.mockReturnValue({
          status: null,
          loading: true,
          error: null,
          refetch: vi.fn(),
        });

        const { unmount } = render(<RamadanEidPage />);
        const card = screen.getByTestId('sighting-card');
        const result = card !== null && card !== undefined;
        unmount();
        return result;
      }),
      { numRuns: 10 },
    );
  });
});

// ── Property 6: ConfirmationSheet consequence text (Task 13.9) ─────────────

describe('Property 6: ConfirmationSheet consequence text is correct for all months', () => {
  /**
   * **Validates: Requirements 4.1**
   *
   * For any Hijri month (1–12) and length (29 or 30), the consequence text
   * computed by computeConsequenceText should:
   * - For months 9 and 11: contain an Eid date string
   * - For all other months: contain the length (29 or 30)
   */
  it('shows Eid date for months 9/11 and month length for other months', () => {
    const referenceDate = new Date('2025-03-29');

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.constantFrom(29 as const, 30 as const),
        (hijriMonth, length) => {
          const text = computeConsequenceText(hijriMonth, length, referenceDate);

          if (hijriMonth === 9) {
            // Must contain Eid al-Fitr date
            return text.includes('Eid al-Fitr will fall on');
          }
          if (hijriMonth === 11) {
            // Must contain Eid al-Adha date
            return text.includes('Eid al-Adha will fall on');
          }
          // Must contain the length value
          return text.includes(String(length)) && !text.includes('Eid');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('consequence text for months 9/11 contains a year (Gregorian date)', () => {
    const referenceDate = new Date('2025-03-29');

    fc.assert(
      fc.property(
        fc.constantFrom(9 as const, 11 as const),
        fc.constantFrom(29 as const, 30 as const),
        (hijriMonth, length) => {
          const text = computeConsequenceText(hijriMonth, length, referenceDate);
          // Should contain a 4-digit year
          return /\d{4}/.test(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('consequence text for non-Eid months does not mention Eid', () => {
    const referenceDate = new Date('2025-03-29');

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }).filter((m) => m !== 9 && m !== 11),
        fc.constantFrom(29 as const, 30 as const),
        (hijriMonth, length) => {
          const text = computeConsequenceText(hijriMonth, length, referenceDate);
          return !text.includes('Eid') && text.includes(String(length));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 7: Non-Eid months dispatch POST directly (Task 13.10) ─────────

describe('Property 7: Non-Eid months dispatch POST directly on confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEidPrayers.mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseQiyamConfig.mockReturnValue({
      config: null,
      loading: false,
      error: null,
      save: vi.fn(),
      saving: false,
      saveError: null,
      saveSuccess: false,
    });
    mockSubmitOverride.mockResolvedValue(undefined);
  });

  /**
   * **Validates: Requirements 4.5**
   *
   * For any Hijri month not in {9, 11}, tapping "Confirm" on the
   * ConfirmationSheet SHALL dispatch the POST request directly without
   * opening EidPrayerModal — run 100 iterations.
   */
  it('dispatches POST and does not open EidPrayerModal for non-Eid months', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 12 }).filter((m) => m !== 9 && m !== 11),
        fc.constantFrom(29 as const, 30 as const),
        async (hijriMonth, length) => {
          vi.clearAllMocks();
          mockSubmitOverride.mockResolvedValue(undefined);
          mockUseEidPrayers.mockReturnValue({
            records: [],
            loading: false,
            error: null,
            refetch: vi.fn(),
          });
          mockUseQiyamConfig.mockReturnValue({
            config: null,
            loading: false,
            error: null,
            save: vi.fn(),
            saving: false,
            saveError: null,
            saveSuccess: false,
          });

          mockUseSightingStatus.mockReturnValue({
            status: {
              gregorianDate: '2025-03-29',
              hijriYear: 1446,
              hijriMonth,
              hijriDay: 29,
              hasOverride: false,
              overrideLength: null,
            },
            loading: false,
            error: null,
            refetch: vi.fn(),
          });

          const { unmount } = render(<RamadanEidPage />);

          // Tap the appropriate tile based on length
          const tileTestId = length === 29 ? 'month-length-tile-29' : 'month-length-tile-30';
          fireEvent.click(screen.getByTestId(tileTestId));

          // Tap Confirm on the ConfirmationSheet
          fireEvent.click(screen.getByText('Confirm'));

          // Wait for POST to be dispatched
          await waitFor(() => {
            expect(mockSubmitOverride).toHaveBeenCalledTimes(1);
          });

          // EidPrayerModal should NOT be open
          const eidModal = screen.queryByText(/Confirm Eid/i);
          const postDispatched = mockSubmitOverride.mock.calls.length === 1;
          const modalNotOpen = eidModal === null;

          unmount();
          return postDispatched && modalNotOpen;
        },
      ),
      { numRuns: 100 },
    );
  });
});
