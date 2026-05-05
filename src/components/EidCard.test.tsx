import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EidCard } from './EidCard';
import type { EidPrayerRecord } from '../types';

const baseRecord: EidPrayerRecord = {
  type: 'EID_AL_FITR',
  date: '2025-03-30',
  prayers: [
    { label: '1st Prayer', time: '07:00' },
    { label: '2nd Prayer', time: '08:30' },
  ],
  source: 'astronomical',
};

describe('EidCard', () => {
  it('renders Eid al-Fitr type name', () => {
    render(<EidCard record={baseRecord} />);
    expect(screen.getByText('Eid al-Fitr')).toBeInTheDocument();
  });

  it('renders Eid al-Adha type name', () => {
    const record: EidPrayerRecord = { ...baseRecord, type: 'EID_AL_ADHA' };
    render(<EidCard record={record} />);
    expect(screen.getByText('Eid al-Adha')).toBeInTheDocument();
  });

  it('renders the formatted Gregorian date', () => {
    render(<EidCard record={baseRecord} />);
    // 2025-03-30 is a Sunday
    expect(screen.getByText('Sunday, March 30, 2025')).toBeInTheDocument();
  });

  it('renders all prayer labels and times', () => {
    render(<EidCard record={baseRecord} />);
    expect(screen.getByText('1st Prayer')).toBeInTheDocument();
    expect(screen.getByText('07:00')).toBeInTheDocument();
    expect(screen.getByText('2nd Prayer')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
  });

  it('shows preliminary notice when source is astronomical', () => {
    render(<EidCard record={{ ...baseRecord, source: 'astronomical' }} />);
    expect(screen.getByTestId('preliminary-notice')).toBeInTheDocument();
    expect(
      screen.getByText('Preliminary times — subject to moon-sighting confirmation'),
    ).toBeInTheDocument();
  });

  it('does not show preliminary notice when source is override', () => {
    render(<EidCard record={{ ...baseRecord, source: 'override' }} />);
    expect(screen.queryByTestId('preliminary-notice')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Preliminary times — subject to moon-sighting confirmation'),
    ).not.toBeInTheDocument();
  });

  it('renders a concrete EID_AL_ADHA override record correctly', () => {
    const record: EidPrayerRecord = {
      type: 'EID_AL_ADHA',
      date: '2025-06-06',
      prayers: [
        { label: '1st Prayer', time: '06:45' },
        { label: '2nd Prayer', time: '08:15' },
      ],
      source: 'override',
    };
    render(<EidCard record={record} />);
    expect(screen.getByText('Eid al-Adha')).toBeInTheDocument();
    expect(screen.getByText('Friday, June 6, 2025')).toBeInTheDocument();
    expect(screen.getByText('06:45')).toBeInTheDocument();
    expect(screen.getByText('08:15')).toBeInTheDocument();
    expect(screen.queryByTestId('preliminary-notice')).not.toBeInTheDocument();
  });
});
