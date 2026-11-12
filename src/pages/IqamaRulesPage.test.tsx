import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IqamaRulesPage } from './IqamaRulesPage';
import { OverrideRow } from '../components/OverrideRow';
import type { RuleSet } from '../types/iqama-rules';
import { SEED_RULES, makeConfig, state, setupIqamaServer, version } from '../test/iqama-fixtures';

setupIqamaServer();

const minutesInput = () => screen.getByLabelText(/^Minutes after Azan/);
const saveButton = () => screen.getByRole('button', { name: 'Save rules' });
const understand = () => screen.getByLabelText(/I understand this changes/);
const last = <T,>(a: T[]) => a[a.length - 1]!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Open a prayer's sheet, set its minutes, add it to the draft. */
async function editMinutes(prayer: string, minutes: string) {
  fireEvent.click(await screen.findByTestId(`rule-card-${prayer}`));
  fireEvent.change(await screen.findByLabelText(/^Minutes after Azan/), {
    target: { value: minutes },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add to changes' }));
}

async function openReview() {
  fireEvent.click(await screen.findByRole('button', { name: /review & save/i }));
  await screen.findByTestId('year-scan');
}

/** Page with a Maghrib edit, review open and the first scan done. */
async function reviewMaghribEdit() {
  render(<IqamaRulesPage />);
  await editMinutes('maghrib', '10');
  await openReview();
}

describe('cards and baseline', () => {
  it('renders one card per catalog prayer with a plain-English sentence', async () => {
    render(<IqamaRulesPage />);
    expect(await screen.findByTestId('rule-card-maghrib')).toHaveTextContent(
      'Azan + 5 min, rounded up to the next 5',
    );
    expect(screen.getAllByTestId(/^rule-card-/)).toHaveLength(5);
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('shows which version is being edited, what is scheduled, and the history with reasons', async () => {
    render(<IqamaRulesPage />);
    expect(await screen.findByTestId('editing-on-top-of')).toHaveTextContent(
      'Editing on top of version 3 (effective 2026-11-13)',
    );
    expect(within(screen.getByTestId('upcoming-versions')).getByText(/Version 3/)).toBeVisible();
    const panel = screen.getByTestId('versions-panel');
    expect(panel).toHaveTextContent('Initial import');
    expect(panel).not.toHaveTextContent(/admin/i); // no "who": the password is shared
  });

  it('builds the proposal from the newest version, so a scheduled change is not reverted', async () => {
    // Asr is already changed in version 4 (scheduled); version 3 is in force today.
    const v4Rules: RuleSet = { ...SEED_RULES, asr: { base: { type: 'OFFSET', minutes: 20 } } };
    const v3 = version(3, '2026-11-13', SEED_RULES, 'Initial import');
    const v4 = version(4, '2027-01-01', v4Rules, 'Winter asr');
    state.config = makeConfig({
      currentRevision: 4,
      effective: v3,
      latest: v4,
      upcoming: [v4],
    });
    render(<IqamaRulesPage />);
    expect(await screen.findByTestId('rule-card-asr')).toHaveTextContent('Azan + 20 min');
    expect(screen.getByTestId('editing-on-top-of')).toHaveTextContent(
      'version 4 (effective 2027-01-01)',
    );
    expect(screen.getByTestId('upcoming-versions')).toHaveTextContent('Winter asr');

    await editMinutes('maghrib', '10');
    await openReview();
    // The preview and the save carry version 4's Asr, not version 3's.
    expect(last(state.previewCalls).settings.asr).toEqual(v4Rules.asr);
    expect(last(state.previewCalls).settings.maghrib.base).toEqual({
      type: 'OFFSET',
      minutes: 10,
    });
    // The date cannot be earlier than the newest version.
    expect(last(state.previewCalls).effectiveFrom).toBe('2027-01-01');
    expect(screen.getByLabelText('Effective from')).toHaveAttribute('min', '2027-01-01');

    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(1));
    const saved = JSON.parse(state.putBodies[0]!['settings'] as string) as RuleSet;
    expect(saved.asr).toEqual(v4Rules.asr);
    expect(state.putBodies[0]).toMatchObject({ expectedRevision: 4, effectiveFrom: '2027-01-01' });
  });

  it('shows a clear message when there is nothing saved yet', async () => {
    state.config = makeConfig({ latest: null, effective: null, upcoming: [], versions: [] });
    render(<IqamaRulesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No rules are saved');
    expect(screen.queryByTestId('rule-card-fajr')).toBeNull();
  });

  it('refuses to edit when the newest version is stored invalid', async () => {
    state.config = makeConfig({
      latest: {
        ...version(3, '2026-11-13'),
        rules: null,
        error: 'fajr.base.minutes: out of range',
      },
    });
    render(<IqamaRulesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('stored but invalid');
    expect(screen.queryByTestId('rule-card-fajr')).toBeNull();
  });
});

describe('edit sheet', () => {
  it('shows a 7-day strip with Adjusted badges from /preview', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    const strip = await screen.findByTestId('preview-strip');
    expect(within(strip).getAllByRole('listitem')).toHaveLength(7);
    expect(within(strip).getAllByTestId('clamp-badge')).toHaveLength(1);
    expect(within(strip).getByText(/Adjusted/)).toBeInTheDocument();
  });

  it('shows an error beside a cleared required field and blocks preview and Add', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    await screen.findByTestId('preview-strip');
    const calls = state.previewCalls.length;
    fireEvent.change(minutesInput(), { target: { value: '' } });
    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(minutesInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    await sleep(600);
    expect(state.previewCalls.length).toBe(calls);
  });

  it('does not truncate decimals and enforces the catalog range', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    fireEvent.change(minutesInput(), { target: { value: '5.5' } });
    expect(await screen.findByText('Enter a whole number')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    fireEvent.change(minutesInput(), { target: { value: '200' } });
    expect(await screen.findByText('Must be 120 or less')).toBeInTheDocument();
  });

  it('removes a cleared optional field instead of sending NaN or 0', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-fajr'));
    fireEvent.change(await screen.findByLabelText(/^At least this many minutes after Azan/), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to changes' }));
    const card = await screen.findByTestId('rule-card-fajr');
    expect(card).not.toHaveTextContent('min after Azan');
    expect(card).toHaveTextContent('Edited');
    expect(card).toHaveTextContent('at least 60 min before sunrise'); // the other limit stays
  });

  it('blocks an invalid Seasonal rule (empty time) from preview and save', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-asr'));
    await screen.findByTestId('preview-strip');
    const calls = state.previewCalls.length;
    fireEvent.change(screen.getAllByLabelText('Iqama time')[0]!, { target: { value: '' } });
    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    await sleep(600);
    expect(state.previewCalls.length).toBe(calls);
  });

  it('blocks an invalid Scaled-gap rule (empty Azan time) from preview and save', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-isha'));
    await screen.findByTestId('preview-strip');
    const calls = state.previewCalls.length;
    fireEvent.change(screen.getAllByLabelText('When Azan is at')[0]!, { target: { value: '' } });
    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    await sleep(600);
    expect(state.previewCalls.length).toBe(calls);
  });

  it('invents no defaults: a new rule type starts empty and must be filled in', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    fireEvent.change(screen.getByLabelText('Rule type'), { target: { value: 'FIXED_TIME' } });
    expect(screen.getByLabelText('Time')).toHaveValue('');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '20:15' } });
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeEnabled();
  });

  it('uses only catalog defaults for a modifier (rounding step 5, direction empty)', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-dhuhr'));
    fireEvent.click(screen.getByLabelText('Rounding'));
    expect(screen.getByLabelText('To a multiple of (minutes)')).toHaveValue('5');
    expect(screen.getByLabelText('Direction')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'CEIL' } });
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeEnabled();
  });

  it('asks for at least one value when an optional group is switched on empty', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    fireEvent.click(screen.getByLabelText('Weekday adjustment'));
    expect(await screen.findByText('Set at least one value, or turn it off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to changes' })).toBeDisabled();
  });

  it('only offers the Fajr sunrise limit to Fajr', async () => {
    render(<IqamaRulesPage />);
    fireEvent.click(await screen.findByTestId('rule-card-maghrib'));
    fireEvent.click(screen.getByLabelText('Limits'));
    expect(screen.getByLabelText(/^At least this many minutes after Azan/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/before sunrise/)).toBeNull();
  });
});

describe('review and save', () => {
  it('shows the year scan and saves with token, revision, hash and the trimmed reason', async () => {
    await reviewMaghribEdit();
    const scan = screen.getByTestId('year-scan');
    expect(scan).toHaveTextContent('120');
    expect(scan).toHaveTextContent('2026-11-14');
    const box = screen.getByLabelText(/Reason for change/);
    expect(box).toHaveAttribute('maxlength', '500');
    fireEvent.change(box, { target: { value: '  Summer schedule  ' } });
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(1));
    expect(state.putBodies[0]).toMatchObject({
      previewId: 'tok-1',
      expectedRevision: 3,
      effectiveFrom: '2026-11-13',
      reason: 'Summer schedule',
      requestHash: state.lastPreview!.requestHash,
    });
    expect(state.putBodies[0]).not.toHaveProperty('acknowledgeConflicts');
    expect(JSON.parse(state.putBodies[0]!['settings'] as string).maghrib.base.minutes).toBe(10);
  });

  it('omits an empty reason', async () => {
    await reviewMaghribEdit();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(1));
    expect(state.putBodies[0]).not.toHaveProperty('reason');
  });

  it('blocks a non-Friday date for a Friday-start prayer', async () => {
    render(<IqamaRulesPage />);
    await editMinutes('fajr', '80');
    await openReview();
    fireEvent.change(screen.getByLabelText('Effective from'), { target: { value: '2026-11-14' } });
    expect(await screen.findByText(/Fajr can only change on a Friday/)).toBeInTheDocument();
    await screen.findByTestId('year-scan');
    fireEvent.click(understand());
    expect(saveButton()).toBeDisabled();
  });

  it('allows any day when only Maghrib changed', async () => {
    await reviewMaghribEdit();
    fireEvent.change(screen.getByLabelText('Effective from'), { target: { value: '2026-11-14' } });
    await waitFor(() => expect(last(state.previewCalls).effectiveFrom).toBe('2026-11-14'));
    await screen.findByTestId('year-scan');
    fireEvent.click(understand());
    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(screen.queryByText(/can only change on a Friday/)).toBeNull();
  });

  it('forgets the confirmation when the date changes after it was given', async () => {
    await reviewMaghribEdit();
    fireEvent.click(understand());
    expect(saveButton()).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Effective from'), { target: { value: '2026-11-20' } });
    // Immediately: the old preview is gone, so nothing can be saved or confirmed.
    expect(saveButton()).toBeDisabled();
    expect(understand()).not.toBeChecked();
    await waitFor(() => expect(last(state.previewCalls).effectiveFrom).toBe('2026-11-20'));
    await screen.findByTestId('year-scan');
    expect(understand()).not.toBeChecked();
    expect(saveButton()).toBeDisabled();
  });

  it('ignores a late answer for an older request', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    state.previewGate = (d) => (d === '2026-11-13' ? gate : undefined);
    render(<IqamaRulesPage />);
    await editMinutes('maghrib', '10');
    fireEvent.click(await screen.findByRole('button', { name: /review & save/i }));
    await waitFor(() => expect(state.previewCalls).toHaveLength(1)); // first review scan, held by the gate
    // Change the date while the first review scan is still waiting.
    fireEvent.change(await screen.findByLabelText('Effective from'), {
      target: { value: '2026-11-20' },
    });
    const scan = await screen.findByTestId('year-scan');
    expect(scan).toHaveTextContent('2026-11-20');
    release();
    await sleep(50);
    expect(screen.getByTestId('year-scan')).toHaveTextContent('2026-11-20');
    expect(screen.getByTestId('year-scan')).not.toHaveTextContent('2026-11-13');
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(1));
    expect(state.putBodies[0]).toMatchObject({ effectiveFrom: '2026-11-20' });
    // The late answer (tok-1) was ignored; the save uses the preview for the current date.
    expect(state.putBodies[0]!['previewId']).toBe('tok-2');
  });

  it('on 422 drops the preview, shows the reason, scans again and needs a new confirmation', async () => {
    state.putResponses = [
      {
        status: 422,
        body: { code: 'IQAMA_PREVIEW_INVALID', message: 'The preview expired. Preview again.' },
      },
    ];
    await reviewMaghribEdit();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    expect(await screen.findByText(/The preview expired/)).toBeInTheDocument();
    await waitFor(() => expect(state.previewCalls.length).toBeGreaterThanOrEqual(2));
    await screen.findByTestId('year-scan');
    expect(understand()).not.toBeChecked();
    expect(saveButton()).toBeDisabled();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(2));
    expect(state.putBodies[1]!['previewId']).not.toBe(state.putBodies[0]!['previewId']);
    expect(await screen.findByText(/Saved and published/)).toBeInTheDocument();
  });

  it('blocks publishing when the preview was made for another revision', async () => {
    state.previewRevision = 9;
    await reviewMaghribEdit();
    fireEvent.click(understand());
    expect(await screen.findByText(/rules changed on the engine/i)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    const before = state.getCount;
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest rules' }));
    await waitFor(() => expect(state.getCount).toBeGreaterThan(before));
    // The edits survive the reload.
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
  });

  it('treats 409 as stale: shows the server message and blocks another save', async () => {
    state.putResponses = [
      { status: 409, body: { message: 'Rules changed since you opened this page' } },
    ];
    await reviewMaghribEdit();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    expect(await screen.findByText(/Rules changed since you opened this page/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reload latest rules' })).toBeInTheDocument();
  });

  it('shows field errors from a 400 response', async () => {
    state.putResponses = [
      {
        status: 400,
        body: {
          message: 'Invalid rules',
          errors: [{ path: 'fajr.effectiveFrom', message: 'Must be a Friday' }],
        },
      },
    ];
    await reviewMaghribEdit();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    expect(await screen.findByText(/fajr.effectiveFrom: Must be a Friday/)).toBeInTheDocument();
  });

  it('lists Fajr conflicts, needs an acknowledgement, and sends acknowledgeConflicts', async () => {
    state.previewConflicts = [
      {
        date: '2027-06-20',
        prayer: 'fajr',
        azan: '03:40',
        sunrise: '05:05',
        iqama: '04:30',
        brokenLimit: 'sunrise-60',
        wonBy: 'min-gap',
      },
    ];
    await reviewMaghribEdit();
    const box = screen.getByTestId('fajr-conflicts');
    expect(box).toHaveTextContent('2027-06-20');
    expect(box).toHaveTextContent('sunrise 05:05');
    fireEvent.click(understand());
    expect(saveButton()).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Fajr will be less than 60 min before sunrise/));
    expect(saveButton()).toBeEnabled();
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(1));
    expect(state.putBodies[0]).toMatchObject({ acknowledgeConflicts: true });
  });

  it('forgets the Fajr acknowledgement when a new preview arrives', async () => {
    state.previewConflicts = [
      { date: '2027-06-20', prayer: 'fajr', azan: '03:40', sunrise: '05:05', iqama: '04:30' },
    ];
    await reviewMaghribEdit();
    const ack = () => screen.getByLabelText(/Fajr will be less than/);
    fireEvent.click(ack());
    fireEvent.click(understand());
    expect(saveButton()).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Effective from'), { target: { value: '2026-11-20' } });
    await waitFor(() => expect(last(state.previewCalls).effectiveFrom).toBe('2026-11-20'));
    await screen.findByTestId('year-scan');
    expect(ack()).not.toBeChecked();
    expect(understand()).not.toBeChecked();
    expect(saveButton()).toBeDisabled();
  });

  it('shows no conflict box when the preview has none', async () => {
    await reviewMaghribEdit();
    expect(screen.queryByTestId('fajr-conflicts')).toBeNull();
  });

  it.each([
    ['db', /Saved and published.*from 2026-11-13/],
    ['shadow', /Saved\. The engine is still comparing in the background/],
    ['legacy', /Saved\. The public schedule still uses the built-in rules/],
  ] as const)('says what the save did in %s mode', async (mode, text) => {
    state.config = makeConfig({ mode });
    await reviewMaghribEdit();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    expect(await screen.findByText(text)).toBeInTheDocument();
  });
});

describe('reload keeps the draft', () => {
  const offset = (minutes: number) => ({ base: { type: 'OFFSET' as const, minutes } });
  /** The engine's newest version after another admin saved. */
  const newerConfig = (patch: Partial<RuleSet>, effectiveFrom = '2026-11-20') => {
    const latest = version(4, effectiveFrom, { ...SEED_RULES, ...patch }, 'Other admin');
    return makeConfig({ currentRevision: 4, latest, upcoming: [latest] });
  };

  /** Edit Maghrib to 10, hit a stale 409 on save, then press "Reload latest rules". */
  async function staleThenReload(next: ReturnType<typeof newerConfig>, date?: string) {
    state.putResponses = [{ status: 409, body: { message: 'Rules changed since you opened' } }];
    render(<IqamaRulesPage />);
    await editMinutes('maghrib', '10');
    await openReview();
    if (date) {
      fireEvent.change(screen.getByLabelText('Effective from'), { target: { value: date } });
      await screen.findByTestId('year-scan');
    }
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await screen.findByRole('button', { name: 'Reload latest rules' });
    state.config = next;
    const before = state.getCount;
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest rules' }));
    await waitFor(() => expect(state.getCount).toBeGreaterThan(before));
    await screen.findByTestId('rule-card-maghrib');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }

  it('keeps the edit, closes the review, and needs a fresh preview and confirmation', async () => {
    await staleThenReload(newerConfig({}));
    expect(screen.getByTestId('rule-card-maghrib')).toHaveTextContent('Azan + 10 min');
    expect(screen.getByTestId('rule-card-maghrib')).toHaveTextContent('Edited');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByTestId('editing-on-top-of')).toHaveTextContent('version 4');
    const scans = state.previewCalls.length;
    await openReview();
    expect(state.previewCalls.length).toBeGreaterThan(scans);
    expect(understand()).not.toBeChecked();
    expect(saveButton()).toBeDisabled();
    fireEvent.click(understand());
    fireEvent.click(saveButton());
    await waitFor(() => expect(state.putBodies).toHaveLength(2));
    expect(state.putBodies[1]).toMatchObject({ expectedRevision: 4 });
    expect(state.putBodies[1]!['previewId']).not.toBe(state.putBodies[0]!['previewId']);
  });

  it('merges a save that touched another prayer, without a notice', async () => {
    const dhuhr = { base: { type: 'FIXED_TIME' as const, time: '13:50' } };
    await staleThenReload(newerConfig({ dhuhr }));
    expect(screen.queryByTestId('reload-notice')).toBeNull();
    expect(screen.getByTestId('rule-card-dhuhr')).toHaveTextContent('Fixed at 13:50');
    await openReview();
    const sent = state.previewCalls[state.previewCalls.length - 1]!.settings;
    expect(sent.dhuhr).toEqual(dhuhr);
    expect(sent.maghrib.base).toEqual({ type: 'OFFSET', minutes: 10 });
  });

  it('names a prayer that was also changed, keeps the edit, and can drop it', async () => {
    await staleThenReload(newerConfig({ maghrib: { ...SEED_RULES.maghrib, ...offset(7) } }));
    const notice = screen.getByTestId('reload-notice');
    expect(notice).toHaveTextContent(
      'Maghrib was changed by another save: your version is kept, review it.',
    );
    expect(screen.getByTestId('rule-card-maghrib')).toHaveTextContent('Azan + 10 min');
    fireEvent.click(screen.getByRole('button', { name: /Use the saved version instead/ }));
    expect(screen.queryByTestId('reload-notice')).toBeNull();
    expect(screen.getByTestId('rule-card-maghrib')).toHaveTextContent('Azan + 7 min');
    expect(screen.getByTestId('rule-card-maghrib')).not.toHaveTextContent('Edited');
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('drops an edit that now equals the saved rule, quietly', async () => {
    await staleThenReload(newerConfig({ maghrib: { ...SEED_RULES.maghrib, ...offset(10) } }));
    expect(screen.queryByText('Unsaved changes')).toBeNull();
    expect(screen.queryByTestId('reload-notice')).toBeNull();
  });

  it('moves the chosen date when the new newest version starts later, and says so', async () => {
    await staleThenReload(newerConfig({}, '2026-12-04'), '2026-11-20');
    expect(screen.getByTestId('reload-notice')).toHaveTextContent(
      'The effective date moved to 2026-12-04',
    );
    await openReview();
    expect(screen.getByLabelText('Effective from')).toHaveValue('2026-12-04');
  });

  it('keeps the chosen date when it is still allowed', async () => {
    await staleThenReload(newerConfig({}, '2026-11-20'), '2026-11-27');
    expect(screen.queryByTestId('reload-notice')).toBeNull();
    await openReview();
    expect(screen.getByLabelText('Effective from')).toHaveValue('2026-11-27');
  });
});

describe('Always applied', () => {
  it('lists the fixed rules from the catalog, read-only', async () => {
    render(<IqamaRulesPage />);
    const note = await screen.findByTestId('guardrails-note');
    expect(note).toHaveTextContent('Always applied');
    expect(note).toHaveTextContent(
      'never earlier than 3 min after Azan (all prayers, overrides too)',
    );
    expect(note).toHaveTextContent('Fajr iqama is normally at least 60 min before sunrise');
    expect(note).toHaveTextContent('the minimum wins, the day is flagged as a conflict');
    expect(note).toHaveTextContent('acknowledge it before saving');
    expect(note).toHaveTextContent('Every iqama lands on a 5-minute mark (e.g. 9:04 becomes 9:05)');
    expect(note).toHaveTextContent('Fajr, Dhuhr, Asr, Isha must start on a Friday');
    expect(note).toHaveTextContent('Maghrib can start any day');
    expect(note).not.toHaveTextContent(/moved later/);
    expect(within(note).getAllByRole('listitem')).toHaveLength(5);
    expect(note.querySelector('ol')).toHaveClass('list-decimal');
    expect(within(note).queryAllByRole('button')).toHaveLength(0);
    expect(within(note).queryAllByRole('textbox')).toHaveLength(0);
  });
});

describe('dialog accessibility', () => {
  it('rule sheet: focus moves in, is trapped, background is inert, Escape closes and returns focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<IqamaRulesPage />);
    const card = await screen.findByTestId('rule-card-maghrib');
    card.focus();
    await user.click(card);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName(/Maghrib/);
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(container).toHaveAttribute('inert');

    // Tab from the last control wraps to the first; Shift+Tab goes back.
    const add = screen.getByRole('button', { name: 'Add to changes' });
    add.focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(add).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(container).not.toHaveAttribute('inert');
    expect(card).toHaveFocus();
  });

  it('review dialog: focus moves in, Escape closes and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    const { container } = render(<IqamaRulesPage />);
    await editMinutes('maghrib', '10');
    const trigger = await screen.findByRole('button', { name: /review & save/i });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Review changes');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(container).toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

describe('mode notices', () => {
  it.each([
    ['legacy', /"legacy".*built-in rules/],
    ['shadow', /"shadow".*public schedule is unchanged/],
  ] as const)('explains %s mode', async (mode, text) => {
    state.config = makeConfig({ mode });
    render(<IqamaRulesPage />);
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('says when the rules start to apply (db mode before the cutover)', async () => {
    render(<IqamaRulesPage />);
    expect(await screen.findByText(/uses these rules from 2026-11-13/)).toBeInTheDocument();
  });
});

describe('OverrideRow clamp warning', () => {
  const o = {
    id: 1,
    prayer: 'fajr' as const,
    overrideType: 'FIXED' as const,
    value: '06:00',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
  };
  it('shows the warning only when clamped', () => {
    const { rerender } = render(
      <OverrideRow override={o} today="2026-11-11" onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.queryByTestId('override-clamp-warning-1')).toBeNull();
    rerender(
      <OverrideRow override={o} today="2026-11-11" onEdit={() => {}} onDelete={() => {}} clamped />,
    );
    expect(screen.getByTestId('override-clamp-warning-1')).toBeInTheDocument();
  });
});
