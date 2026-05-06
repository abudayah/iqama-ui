import { useState, useCallback, useEffect } from 'react';
import { useSightingStatus } from '../hooks/useSightingStatus';
import { useEidPrayers } from '../hooks/useEidPrayers';
import { useQiyamConfig } from '../hooks/useQiyamConfig';
import { EidPrayerModal } from '../components/EidPrayerModal';
import { submitOverride, deleteOverride } from '../services/hijri-calendar-service';
import { calculateEidDate } from '../logic/calculate-eid-date';
import type { EidType, EidPrayerRecord, SubmitOverridePayload } from '../types/index';

// ── Constants ──────────────────────────────────────────────────────────────

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhul Qi'dah",
  'Dhul Hijjah',
] as const;

const EID_TYPE_LABELS: Record<EidType, string> = {
  EID_AL_FITR: 'Eid al-Fitr',
  EID_AL_ADHA: 'Eid al-Adha',
};

const EID_TYPES: EidType[] = ['EID_AL_FITR', 'EID_AL_ADHA'];

// ── Types ──────────────────────────────────────────────────────────────────

type MonthLength = 'astronomical' | 29 | 30;

// ── Exported helper ────────────────────────────────────────────────────────

/**
 * Returns the consequence text shown in the ConfirmationSheet.
 *
 * - Month 9 (Ramadan): "Eid al-Fitr will fall on <date>"
 * - Month 11 (Dhul Qi'dah): "Eid al-Adha will fall on <date>"
 * - All other months: "Month will be <length> days"
 */
export function computeConsequenceText(
  hijriMonth: number,
  length: 29 | 30,
  referenceDate: Date,
): string {
  if (hijriMonth === 9) {
    const eidDate = calculateEidDate(referenceDate, length === 29, 'FITR');
    const formatted = eidDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `Eid al-Fitr will fall on ${formatted}`;
  }
  if (hijriMonth === 11) {
    const eidDate = calculateEidDate(referenceDate, length === 29, 'ADHA');
    const formatted = eidDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `Eid al-Adha will fall on ${formatted}`;
  }
  return `Month will be ${length} days`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RamadanEidPage() {
  // ── Hooks ──
  const {
    status,
    loading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useSightingStatus();
  const {
    records,
    loading: recordsLoading,
    error: recordsError,
    refetch,
  } = useEidPrayers(undefined, true);
  const {
    config: qiyamConfig,
    loading: qiyamLoading,
    error: qiyamError,
    save: saveQiyam,
    saving: qiyamSaving,
    saveError: qiyamSaveError,
    saveSuccess: qiyamSaveSuccess,
  } = useQiyamConfig();

  // ── State ──
  const [eidModalOpen, setEidModalOpen] = useState(false);
  const [editingEidType, setEditingEidType] = useState<EidType | null>(null);
  const [pendingChoice, setPendingChoice] = useState<MonthLength | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [sightingError, setSightingError] = useState<string | null>(null);
  const [sightingSuccess, setSightingSuccess] = useState(false);
  const [sightingSaving, setSightingSaving] = useState(false);
  const [qiyamTime, setQiyamTime] = useState('');

  // Pre-populate qiyam time input when config loads
  useEffect(() => {
    if (qiyamConfig?.start_time) {
      setQiyamTime(qiyamConfig.start_time);
    }
  }, [qiyamConfig]);

  // ── Derived values ──

  const currentMonthLength: MonthLength = status?.overrideLength ?? 'astronomical';

  const hijriDateDisplay = status
    ? `${HIJRI_MONTHS[(status.hijriMonth ?? 1) - 1]} ${status.hijriDay}, ${status.hijriYear}`
    : null;

  // ── Moon Sighting tile handler ──

  const handleTileSelect = useCallback(
    (choice: MonthLength) => {
      if (!status || choice === currentMonthLength) return;
      setSightingError(null);
      setSightingSuccess(false);
      if (choice === 'astronomical') {
        // Reverting to astronomical — confirm before deleting override
        setPendingChoice(choice);
        setConfirmationOpen(true);
      } else {
        setPendingChoice(choice);
        setConfirmationOpen(true);
      }
    },
    [status, currentMonthLength],
  );

  const handleCancelConfirmation = useCallback(() => {
    setConfirmationOpen(false);
    setPendingChoice(null);
    setSightingError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!status || pendingChoice === null) return;

    if (pendingChoice === 'astronomical') {
      // Delete override — revert to astronomical
      setSightingSaving(true);
      setSightingError(null);
      try {
        await deleteOverride();
        setConfirmationOpen(false);
        setPendingChoice(null);
        setSightingSuccess(true);
        refetchStatus();
      } catch (err) {
        setSightingError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      } finally {
        setSightingSaving(false);
      }
      return;
    }

    const length: 29 | 30 = pendingChoice;
    const isEidMonth = status.hijriMonth === 9 || status.hijriMonth === 11;

    if (isEidMonth) {
      // Open EidPrayerModal — POST is dispatched from within the modal
      const eidType: EidType = status.hijriMonth === 9 ? 'EID_AL_FITR' : 'EID_AL_ADHA';
      setEditingEidType(eidType);
      setConfirmationOpen(false);
      setEidModalOpen(true);
      return;
    }

    // Non-Eid month: dispatch POST directly
    setSightingSaving(true);
    setSightingError(null);
    try {
      const payload: SubmitOverridePayload = {
        hijriYear: status.hijriYear,
        hijriMonth: status.hijriMonth,
        length,
      };
      await submitOverride(payload);
      setConfirmationOpen(false);
      setPendingChoice(null);
      setSightingSuccess(true);
      refetchStatus();
    } catch (err) {
      setSightingError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSightingSaving(false);
    }
  }, [status, pendingChoice, refetchStatus]);

  // ── Eid Prayer Times handlers ──

  const handleEditEid = useCallback((eidType: EidType) => {
    setEditingEidType(eidType);
    setEidModalOpen(true);
  }, []);

  const handleModalSubmit = useCallback(
    async (payload: SubmitOverridePayload) => {
      await submitOverride(payload);
      refetch();
    },
    [refetch],
  );

  const handleModalClose = useCallback(() => {
    setEidModalOpen(false);
    setEditingEidType(null);
  }, []);

  // ── Qiyam save handler ──

  const handleSaveQiyam = useCallback(() => {
    void saveQiyam(qiyamTime);
  }, [saveQiyam, qiyamTime]);

  // ── Render ──

  return (
    <div id="ramadan-eid-page" className="p-4 space-y-8">
      {/* ══════════════════════════════════════════════════════════════════
          Section 1: Moon Sighting — SightingCard (always visible)
      ══════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="moon-sighting-heading">
        <h2 id="moon-sighting-heading" className="text-base font-semibold text-gray-800 mb-3">
          Moon Sighting
        </h2>

        {/* SightingCard is always rendered regardless of loading/error state */}
        <div
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-4"
          data-testid="sighting-card"
        >
          {/* Loading skeleton */}
          {statusLoading && (
            <div className="animate-pulse space-y-2" data-testid="status-skeleton">
              <div className="h-5 bg-gray-200 rounded w-48" />
              <div className="h-10 bg-gray-200 rounded-xl mt-3" />
            </div>
          )}

          {/* Error state */}
          {statusError && !statusLoading && (
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
              role="alert"
              data-testid="status-error"
            >
              {statusError.message}
            </div>
          )}

          {/* Loaded state */}
          {status && !statusLoading && (
            <>
              {/* Date */}
              <div>
                <p className="text-sm text-gray-500">Current Hijri month</p>
                <p className="text-base font-semibold text-gray-800" data-testid="hijri-date">
                  {hijriDateDisplay}
                </p>
              </div>

              {/* 3-tile selector */}
              {!confirmationOpen && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Month length</p>
                  <div className="grid grid-cols-3 gap-2" role="group" aria-label="Month length">
                    {[
                      { value: 'astronomical' as const, label: 'Astronomical', sub: 'default' },
                      { value: 29 as const, label: '29 Days', sub: 'moon sighted' },
                      { value: 30 as const, label: '30 Days', sub: 'complete' },
                    ].map(({ value, label, sub }) => {
                      const isActive = currentMonthLength === value;
                      const isPending = pendingChoice === value;
                      return (
                        <button
                          key={String(value)}
                          onClick={() => handleTileSelect(value)}
                          disabled={sightingSaving}
                          aria-pressed={isActive}
                          className={[
                            'flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition-colors min-h-[64px] disabled:opacity-50',
                            isActive
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : isPending
                                ? 'border-amber-400 bg-amber-50 text-amber-800'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
                          ].join(' ')}
                          data-testid={`month-length-tile-${String(value)}`}
                        >
                          <span className="text-sm font-semibold leading-tight">{label}</span>
                          <span
                            className={`text-xs mt-0.5 ${isActive ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-gray-400'}`}
                          >
                            {sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ConfirmationSheet */}
              {confirmationOpen && pendingChoice !== null && pendingChoice !== 'astronomical' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm text-amber-800 font-medium">
                    {computeConsequenceText(
                      status.hijriMonth,
                      pendingChoice,
                      new Date(status.gregorianDate + 'T12:00:00'),
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelConfirmation}
                      disabled={sightingSaving}
                      className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-white disabled:opacity-50 min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleConfirm()}
                      disabled={sightingSaving}
                      className="flex-1 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {sightingSaving ? 'Saving…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}

              {/* Astronomical revert confirmation */}
              {confirmationOpen && pendingChoice === 'astronomical' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <p className="text-sm text-gray-700 font-medium">
                    Reset to astronomical calendar?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelConfirmation}
                      disabled={sightingSaving}
                      className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-white disabled:opacity-50 min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleConfirm()}
                      disabled={sightingSaving}
                      className="flex-1 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-3 py-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {sightingSaving ? 'Saving…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}

              {/* Success state */}
              {sightingSuccess && (
                <div
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm"
                  role="status"
                  data-testid="sighting-success"
                >
                  Moon sighting saved successfully.
                </div>
              )}

              {/* Error state */}
              {sightingError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
                  role="alert"
                  data-testid="sighting-error"
                >
                  {sightingError}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 2: Eid Prayer Times
      ══════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="eid-prayer-times-heading">
        <h2 id="eid-prayer-times-heading" className="text-base font-semibold text-gray-800 mb-3">
          Eid Prayer Times
        </h2>

        {recordsLoading && (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        )}

        {recordsError && !recordsLoading && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
            role="alert"
          >
            {recordsError.message}
          </div>
        )}

        {!recordsLoading && !recordsError && (
          <div className="space-y-3">
            {EID_TYPES.map((eidType) => {
              const record: EidPrayerRecord | undefined = records.find((r) => r.type === eidType);
              const hasOverrideRecord = record?.source === 'override';
              const isAstronomical = record?.source === 'astronomical';

              return (
                <div
                  key={eidType}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                  data-testid={`eid-card-${eidType}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        {EID_TYPE_LABELS[eidType]}
                      </p>

                      {hasOverrideRecord && record ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            {new Date(record.date + 'T12:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {record.prayers.map((prayer) => (
                            <p key={prayer.label} className="text-xs text-gray-700">
                              <span className="font-medium">{prayer.label}:</span> {prayer.time}
                            </p>
                          ))}
                        </div>
                      ) : isAstronomical ? (
                        <p className="text-xs text-gray-400 italic">
                          Prayer times will be set once the moon-sighting override is submitted
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No prayer times saved yet</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditEid(eidType)}
                      className="shrink-0 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 active:bg-blue-100 min-h-[44px]"
                      data-testid={`edit-eid-button-${eidType}`}
                    >
                      Edit times
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 3: Qiyam al-Layl
      ══════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="qiyam-heading">
        <h2 id="qiyam-heading" className="text-base font-semibold text-gray-800 mb-3">
          Qiyam al-Layl
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {qiyamLoading && <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />}

          {qiyamError && !qiyamLoading && (
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
              role="alert"
            >
              {qiyamError.message}
            </div>
          )}

          {!qiyamLoading && (
            <>
              <div>
                <label
                  htmlFor="qiyam-time-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Qiyam Start Time
                </label>
                <input
                  id="qiyam-time-input"
                  type="time"
                  step={300}
                  value={qiyamTime}
                  onChange={(e) => setQiyamTime(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px]"
                  data-testid="qiyam-time-input"
                  aria-label="Qiyam start time"
                />
              </div>

              <p className="text-xs text-gray-500 font-medium">Active nights: 20th–29th Ramadan</p>

              <p className="text-xs text-gray-400">
                Shown in the app as &apos;Qiyam&apos; with start time only. Applies to all 10 nights
                — adjust each year when Ramadan begins.
              </p>

              {qiyamSaveSuccess && (
                <div
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm"
                  role="status"
                  data-testid="qiyam-save-success"
                >
                  Qiyam time saved successfully.
                </div>
              )}

              {qiyamSaveError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
                  role="alert"
                  data-testid="qiyam-save-error"
                >
                  {qiyamSaveError}
                </div>
              )}

              <button
                onClick={handleSaveQiyam}
                disabled={qiyamSaving || !qiyamTime}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                data-testid="save-qiyam-button"
              >
                {qiyamSaving ? 'Saving...' : 'Save Qiyam time'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          EidPrayerModal
      ══════════════════════════════════════════════════════════════════ */}
      {eidModalOpen && editingEidType !== null && (
        <EidPrayerModal
          eidType={editingEidType}
          eidDate={(() => {
            const existing = records.find((r) => r.type === editingEidType);
            if (existing) return new Date(existing.date + 'T12:00:00');
            return calculateEidDate(
              status ? new Date(status.gregorianDate + 'T12:00:00') : new Date(),
              pendingChoice === 29,
              editingEidType === 'EID_AL_FITR' ? 'FITR' : 'ADHA',
            );
          })()}
          sunriseTime="06:00"
          hijriYear={status?.hijriYear ?? new Date().getFullYear()}
          hijriMonth={editingEidType === 'EID_AL_FITR' ? 9 : 11}
          length={typeof pendingChoice === 'number' ? pendingChoice : 29}
          onSubmit={handleModalSubmit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
