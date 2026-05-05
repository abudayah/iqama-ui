import { useState, useCallback } from 'react';
import { useSightingStatus } from '../hooks/useSightingStatus';
import { useEidPrayers } from '../hooks/useEidPrayers';
import { SightingCard } from '../components/SightingCard';
import { EidPrayerModal } from '../components/EidPrayerModal';
import { submitOverride } from '../services/hijri-calendar-service';
import { calculateEidDate } from '../logic/calculate-eid-date';
import type { EidType, EidPrayerRecord } from '../types/index';

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

export function EidMoonSightingPage() {
  const { status, loading: statusLoading, error: statusError } = useSightingStatus();
  const { records, loading: recordsLoading, error: recordsError, refetch } = useEidPrayers();

  /* ── Modal state ── */
  const [eidModalOpen, setEidModalOpen] = useState(false);
  const [pendingLength, setPendingLength] = useState<29 | 30 | null>(null);
  const [editingEidType, setEditingEidType] = useState<EidType | null>(null);

  /* ── Sighting feedback state ── */
  const [sightingError, setSightingError] = useState<string | null>(null);
  const [sightingSuccess, setSightingSuccess] = useState(false);

  /* ── Moon-sighting decision handler (same logic as PrayerViewerPage) ── */
  const onDecision = useCallback(async (length: 29 | 30) => {
    if (!status) return;
    setSightingError(null);
    setSightingSuccess(false);

    if (status.hijriMonth === 9 || status.hijriMonth === 11) {
      setPendingLength(length);
      setEditingEidType(null);
      setEidModalOpen(true);
    } else {
      const hijriYear = new Date(status.gregorianDate).getFullYear();
      try {
        await submitOverride({ hijriYear, hijriMonth: status.hijriMonth, length });
        setSightingSuccess(true);
      } catch (err) {
        setSightingError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      }
    }
  }, [status]);

  /* ── Edit button handler ── */
  const handleEdit = useCallback((eidType: EidType) => {
    if (!status) return;
    setEditingEidType(eidType);
    setPendingLength(null);
    setEidModalOpen(true);
  }, [status]);

  /* ── Modal submit handler ── */
  const handleModalSubmit = useCallback(async (payload: Parameters<typeof submitOverride>[0]) => {
    await submitOverride(payload);
    refetch();
  }, [refetch]);

  /* ── Derive modal props ── */
  const getModalEidType = (): EidType => {
    if (editingEidType) return editingEidType;
    if (status?.hijriMonth === 9) return 'EID_AL_FITR';
    return 'EID_AL_ADHA';
  };

  const getModalEidDate = (): Date => {
    const modalEidType = getModalEidType();
    if (editingEidType) {
      const existingRecord = records.find((r) => r.type === editingEidType);
      if (existingRecord) {
        return new Date(existingRecord.date + 'T12:00:00');
      }
      // No record — use calculateEidDate with a default length of 29
      return calculateEidDate(new Date(), true, modalEidType === 'EID_AL_FITR' ? 'FITR' : 'ADHA');
    }
    // Sighting flow
    return calculateEidDate(
      new Date(),
      pendingLength === 29,
      modalEidType === 'EID_AL_FITR' ? 'FITR' : 'ADHA',
    );
  };

  const getModalLength = (): 29 | 30 => {
    if (editingEidType) {
      const existingRecord = records.find((r) => r.type === editingEidType);
      if (existingRecord) {
        // Derive length from the record's date vs astronomical month start — default to 29
        return 29;
      }
      return 29;
    }
    return pendingLength ?? 29;
  };

  const getModalHijriYear = (): number => {
    if (!status) return new Date().getFullYear();
    return new Date(status.gregorianDate).getFullYear();
  };

  const getModalHijriMonth = (): number => {
    if (!status) return 1;
    if (editingEidType) {
      return editingEidType === 'EID_AL_FITR' ? 9 : 11;
    }
    return status.hijriMonth;
  };

  /* ── Hijri date display ── */
  const hijriDateDisplay = status
    ? `${HIJRI_MONTHS[status.hijriMonth - 1]} ${status.hijriDay}, ${new Date(status.gregorianDate).getFullYear()}`
    : null;

  return (
    <div className="p-4">
      {/* ── Section 1: Status display ── */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-800 mb-3">Eid &amp; Moon Sighting</h1>

        {statusLoading && (
          <div className="animate-pulse space-y-2">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-5 bg-gray-200 rounded w-32" />
          </div>
        )}

        {statusError && !statusLoading && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
            role="alert"
          >
            {statusError.message}
          </div>
        )}

        {status && !statusLoading && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Today (Hijri):</span>{' '}
              <span data-testid="hijri-date">{hijriDateDisplay}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Override status:</span>
              {status.hasOverride ? (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                  data-testid="override-badge"
                >
                  Override submitted
                </span>
              ) : (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                  data-testid="override-badge"
                >
                  No override yet
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Saved Eid records ── */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Saved Eid Records</h2>

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

              return (
                <div
                  key={eidType}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                  data-testid={`eid-record-card-${eidType}`}
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
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No prayer times saved yet
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEdit(eidType)}
                      disabled={!status}
                      className="shrink-0 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 active:bg-blue-100 disabled:opacity-40 min-h-[44px]"
                      data-testid={`edit-button-${eidType}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 3: Moon sighting submission ── */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Moon Sighting</h2>

        {sightingSuccess && (
          <div
            className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm"
            role="status"
          >
            Moon-sighting decision saved successfully.
          </div>
        )}

        {sightingError && (
          <div
            className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
            role="alert"
          >
            {sightingError}
          </div>
        )}

        {status && (
          <SightingCard
            hijriMonth={status.hijriMonth}
            onDecision={(length) => void onDecision(length)}
          />
        )}
      </div>

      {/* ── EidPrayerModal ── */}
      {eidModalOpen && status !== null && (
        <EidPrayerModal
          eidType={getModalEidType()}
          eidDate={getModalEidDate()}
          sunriseTime="06:00"
          hijriYear={getModalHijriYear()}
          hijriMonth={getModalHijriMonth()}
          length={getModalLength()}
          onSubmit={handleModalSubmit}
          onClose={() => {
            setEidModalOpen(false);
            setPendingLength(null);
            setEditingEidType(null);
          }}
        />
      )}
    </div>
  );
}
