import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { EidPrayerModal } from './EidPrayerModal';

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('EidPrayerModal', () => {
  it('submits stable English labels regardless of the UI language', async () => {
    await i18n.changeLanguage('ar');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <EidPrayerModal
        eidType="EID_AL_FITR"
        eidDate={new Date('2025-03-30T12:00:00')}
        sunriseTime="06:00"
        hijriYear={1446}
        hijriMonth={10}
        length={29}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /تأكيد|confirm/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0].eidConfig?.prayers).toEqual([
      { label: '1st Eid Prayer', time: expect.any(String) },
      { label: '2nd Eid Prayer', time: expect.any(String) },
    ]);
  });
});
