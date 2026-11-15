import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSightingStatus } from '../hooks/useSightingStatus';
import { useEidPrayers } from '../hooks/useEidPrayers';
import { useQiyamConfig } from '../hooks/useQiyamConfig';
import { EidPrayerModal } from '../components/EidPrayerModal';
import { submitOverride, deleteOverride } from '../services/hijri-calendar-service';
import { calculateEidDate } from '../logic/calculate-eid-date';
import i18n from '../i18n';
import type { EidType, EidPrayerRecord, SubmitOverridePayload } from '../types/index';
import { getIntlLocale } from '../i18n/locale';
import { formatTime12 } from '../i18n/format-time';

// ── Constants ──────────────────────────────────────────────────────────────

const HIJRI_MONTH_KEYS = [
  'hijriMonths.muharram',
  'hijriMonths.safar',
  'hijriMonths.rabiAlAwwal',
  'hijriMonths.rabiAlThani',
  'hijriMonths.jumadaAlAwwal',
  'hijriMonths.jumadaAlThani',
  'hijriMonths.rajab',
  'hijriMonths.shaban',
  'hijriMonths.ramadan',
  'hijriMonths.shawwal',
  'hijriMonths.dhulQidah',
  'hijriMonths.dhulHijjah',
] as const;

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
 *
 * Gregorian dates follow the currently active UI locale.
 */
export function computeConsequenceText(
  hijriMonth: number,
  length: 29 | 30,
  referenceDate: Date,
): string {
  if (hijriMonth === 9) {
    const eidDate = calculateEidDate(referenceDate, length === 29, 'FITR');
    const formatted = eidDate.toLocaleDateString(getIntlLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return i18n.t('ramadan.eidFitrWillFall', { date: formatted });
  }
  if (hijriMonth === 11) {
    const eidDate = calculateEidDate(referenceDate, length === 29, 'ADHA');
    const formatted = eidDate.toLocaleDateString(getIntlLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return i18n.t('ramadan.eidAdhaWillFall', { date: formatted });
  }
  return i18n.t('ramadan.monthWillBeDays', { count: length });
}

// ── Component ──────────────────────────────────────────────────────────────

export function RamadanEidPage() {
  const { t, i18n } = useTranslation();

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
    ? `${t(HIJRI_MONTH_KEYS[(status.hijriMonth ?? 1) - 1] ?? 'hijriMonths.muharram')} ${status.hijriDay}, ${status.hijriYear}`
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
        setSightingError(err instanceof Error ? err.message : t('ramadan.saveFailed'));
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
      setSightingError(err instanceof Error ? err.message : t('ramadan.saveFailed'));
    } finally {
      setSightingSaving(false);
    }
  }, [status, pendingChoice, refetchStatus, t]);

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
          {t('ramadan.moonSighting')}
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
                <p className="text-sm text-gray-500">{t('ramadan.currentHijriMonth')}</p>
                <p className="text-base font-semibold text-gray-800" data-testid="hijri-date">
                  <bdi dir="ltr">{hijriDateDisplay}</bdi>
                </p>
              </div>

              {/* 3-tile selector */}
              {!confirmationOpen && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    {t('ramadan.monthLength')}
                  </p>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="group"
                    aria-label={t('ramadan.monthLength')}
                  >
                    {[
                      {
                        value: 'astronomical' as const,
                        label: t('ramadan.astronomical'),
                        sub: t('ramadan.astronomicalSub'),
                      },
                      {
                        value: 29 as const,
                        label: t('ramadan.days29'),
                        sub: t('ramadan.days29Sub'),
                      },
                      {
                        value: 30 as const,
                        label: t('ramadan.days30'),
                        sub: t('ramadan.days30Sub'),
                      },
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
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => void handleConfirm()}
                      disabled={sightingSaving}
                      className="flex-1 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {sightingSaving ? t('common.saving') : t('eidModal.confirm')}
                    </button>
                  </div>
                </div>
              )}

              {/* Astronomical revert confirmation */}
              {confirmationOpen && pendingChoice === 'astronomical' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <p className="text-sm text-gray-700 font-medium">{t('ramadan.resetPrompt')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelConfirmation}
                      disabled={sightingSaving}
                      className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 hover:bg-white disabled:opacity-50 min-h-[44px]"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => void handleConfirm()}
                      disabled={sightingSaving}
                      className="flex-1 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-3 py-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {sightingSaving ? t('common.saving') : t('eidModal.confirm')}
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
                  {t('ramadan.savedSuccess')}
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
          {t('ramadan.eidPrayerTimes')}
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
                        {eidType === 'EID_AL_FITR'
                          ? t('ramadan.eidFitrName')
                          : t('ramadan.eidAdhaName')}
                      </p>

                      {hasOverrideRecord && record ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            <bdi dir="ltr">
                              {new Date(record.date + 'T12:00:00').toLocaleDateString(
                                getIntlLocale(i18n.language),
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                },
                              )}
                            </bdi>
                          </p>
                          {record.prayers.map((prayer) => (
                            <p key={prayer.label} className="text-xs text-gray-700">
                              <span className="font-medium">{prayer.label}:</span>{' '}
                              <bdi dir="ltr">{formatTime12(prayer.time)}</bdi>
                            </p>
                          ))}
                        </div>
                      ) : isAstronomical ? (
                        <p className="text-xs text-gray-400 italic">
                          {t('ramadan.prayerTimesAfterOverride')}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">{t('ramadan.noPrayerTimes')}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditEid(eidType)}
                      className="shrink-0 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 active:bg-blue-100 min-h-[44px]"
                      data-testid={`edit-eid-button-${eidType}`}
                    >
                      {t('ramadan.editTimes')}
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
          {t('ramadan.qiyamTitle')}
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
                  {t('ramadan.qiyamStartTime')}
                </label>
                <input
                  id="qiyam-time-input"
                  type="time"
                  step={300}
                  value={qiyamTime}
                  onChange={(e) => setQiyamTime(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm min-h-[44px]"
                  data-testid="qiyam-time-input"
                  aria-label={t('ramadan.qiyamStartAria')}
                />
              </div>

              <p className="text-xs text-gray-500 font-medium">{t('ramadan.qiyamActiveNights')}</p>

              <p className="text-xs text-gray-400">{t('ramadan.qiyamNote')}</p>

              {qiyamSaveSuccess && (
                <div
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm"
                  role="status"
                  data-testid="qiyam-save-success"
                >
                  {t('ramadan.qiyamSaved')}
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
                {qiyamSaving ? t('common.saving') : t('ramadan.saveQiyam')}
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
