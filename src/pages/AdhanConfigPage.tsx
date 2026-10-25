/**
 * AdhanConfigPage.tsx
 *
 * Adhan Configuration admin tab.
 *
 * Sections:
 *   - Overview: prayer cards + general settings summary
 *   - Periods: seasonal profiles
 *   - History: audit trail
 *
 * Changes accumulate in a local draft. A sticky bar appears when there are
 * unsaved changes. The Review & Save flow runs preview → confirm → apply.
 */

import { useState, useMemo } from 'react';
import type {
  PrayerKey,
  AdhanSettings,
  GeneralSettings,
  AdhanConfigPeriod,
  PartialAdhanSettings,
} from '../types';
import { useAdhanConfig } from '../hooks/useAdhanConfig';
import { useAdhanDraft } from '../hooks/useAdhanDraft';
import { previewVersion, applyBaseVersion } from '../services/adhan-config-service';
import type { PreviewResponse } from '../types';

import { PrayerCard } from '../components/adhan-config/PrayerCard';
import { GeneralSettingsDrawer } from '../components/adhan-config/GeneralSettingsDrawer';
import { PrayerOffsetDrawer } from '../components/adhan-config/PrayerOffsetDrawer';
import { ReviewDialog } from '../components/adhan-config/ReviewDialog';
import { PeriodsSection } from '../components/adhan-config/PeriodsSection';
import { HistorySection } from '../components/adhan-config/HistorySection';
import {
  METHOD_LABELS,
  HIGH_LAT_LABELS,
  MADHAB_LABELS,
} from '../components/adhan-config/method-labels';

const ALL_PRAYERS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// ─── Derive the "base" AdhanSettings from the stored base version ──────────────
// IMPORTANT: must NOT use config.effective (which already has periods merged in).
// Using the resolved result would bake seasonal offsets into the permanent base.

function configToSettings(
  config: ReturnType<typeof useAdhanConfig>['config'],
): AdhanSettings | null {
  if (!config?.effective) return null;
  const baseVersion = config.versions.find((v) => v.id === config.effective!.baseVersionId);
  if (!baseVersion) return null;
  try {
    return JSON.parse(baseVersion.settings) as AdhanSettings;
  } catch {
    return null;
  }
}

// ─── Which periods are active today ───────────────────────────────────────────

function activePeriodsToday(periods: AdhanConfigPeriod[], today: string): AdhanConfigPeriod[] {
  return periods.filter((p) => p.startDate <= today && p.endDate >= today && !p.deletedAt);
}

function periodLabelsForPrayer(activePeriods: AdhanConfigPeriod[], prayer: PrayerKey): string[] {
  return activePeriods
    .filter((p) => {
      try {
        const s = JSON.parse(p.settings) as PartialAdhanSettings;
        return s.prayers?.[prayer] !== undefined;
      } catch {
        return false;
      }
    })
    .map((p) => p.label);
}

// ─── Page component ────────────────────────────────────────────────────────────

type ActiveTab = 'overview' | 'periods' | 'history';

export function AdhanConfigPage() {
  const { config, catalog, loading, error, refresh } = useAdhanConfig();
  const draft = useAdhanDraft(config?.today);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [generalDrawerOpen, setGeneralDrawerOpen] = useState(false);
  const [prayerDrawerPrayer, setPrayerDrawerPrayer] = useState<PrayerKey | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const baseSettings = useMemo(() => configToSettings(config), [config]);
  const todayActivePeriods = useMemo(
    () =>
      activePeriodsToday(
        config?.periods ?? [],
        config?.today ?? new Date().toISOString().split('T')[0]!,
      ),
    [config?.periods, config?.today],
  );

  // Compute proposed full settings (base merged with draft)
  const proposedSettings: AdhanSettings | null = useMemo(() => {
    if (!baseSettings) return null;
    return draft.buildFullSettings(baseSettings);
  }, [baseSettings, draft]);

  const openReview = async () => {
    if (!proposedSettings) return;
    setReviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const result = await previewVersion(proposedSettings, draft.draft.effectiveFrom);
      setPreview(result);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async (reason: string) => {
    if (!proposedSettings || !preview) return;
    setSaving(true);
    try {
      await applyBaseVersion(
        proposedSettings,
        draft.draft.effectiveFrom,
        preview.previewId,
        config?.currentRevision ?? 0,
        reason || undefined,
      );
      draft.reset();
      setReviewOpen(false);
      setSuccessMsg('Settings saved. The public schedule has been updated.');
      setTimeout(() => setSuccessMsg(null), 4000);
      refresh();
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 space-y-4" aria-busy="true" aria-label="Loading Adhan configuration">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!config || !catalog) return null;

  const effective = config.effective;
  const currentGeneral = effective?.general ?? {
    method: 'NorthAmerica' as const,
    madhab: 'shafi' as const,
    highLatitudeRule: 'TwilightAngle' as const,
    polarCircleResolution: 'Unresolved' as const,
    rounding: 'Nearest' as const,
  };

  const prayerDrawerCurrentOffset =
    prayerDrawerPrayer != null
      ? (draft.draft.prayers[prayerDrawerPrayer]?.offsetMinutes ??
        baseSettings?.prayers[prayerDrawerPrayer]?.offsetMinutes ??
        0)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-tabs */}
      <nav className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {(['overview', 'periods', 'history'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium text-center min-h-[44px] capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Success toast */}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800"
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Unsaved-changes sticky bar */}
      {draft.hasChanges && (
        <div
          role="status"
          className="sticky top-[49px] z-10 mx-4 mt-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-between text-sm shadow-lg"
        >
          <span>Unsaved changes</span>
          <div className="flex gap-3">
            <button
              onClick={draft.reset}
              className="text-blue-200 hover:text-white underline min-h-[44px] px-2"
            >
              Discard
            </button>
            <button
              onClick={openReview}
              className="bg-white text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 min-h-[44px]"
            >
              Review &amp; save
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* ── Overview tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Periods coverage warning */}
            {config.periodsWarning && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
              >
                ⚠️ {config.periodsWarning}
              </div>
            )}
            {/* Config version banner */}
            {config.currentRevision > 0 &&
              (() => {
                const currentVersion = config.versions.find(
                  (v) => v.id === config.effective?.baseVersionId,
                );
                return (
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                    <span className="mt-0.5 text-blue-400 shrink-0" aria-hidden="true">
                      ℹ️
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium">Config v{config.currentRevision}</span>
                      {currentVersion?.createdAt && (
                        <span className="text-blue-600">
                          {' '}
                          · Last updated{' '}
                          {new Date(currentVersion.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {todayActivePeriods.length > 0 && (
                        <span className="ml-2 text-purple-600">
                          + {todayActivePeriods.map((p) => p.label).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Prayer cards */}
            {effective ? (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Prayer Azan offsets
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_PRAYERS.map((prayer) => (
                    <PrayerCard
                      key={prayer}
                      prayer={prayer}
                      effective={effective}
                      activePeriodLabels={periodLabelsForPrayer(todayActivePeriods, prayer)}
                      draftOffset={draft.draft.prayers[prayer]?.offsetMinutes}
                      onClick={() => setPrayerDrawerPrayer(prayer)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                No configuration found. Please run the seed migration.
              </div>
            )}

            {/* General settings */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-800">General settings</h3>
                <button
                  onClick={() => setGeneralDrawerOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1.5 min-h-[44px]"
                >
                  Edit
                </button>
              </div>
              <dl className="text-sm text-gray-600 space-y-1">
                <div className="flex gap-2">
                  <dt className="text-gray-400 w-28 shrink-0">Timezone</dt>
                  <dd className="font-medium">
                    {config.timezone ?? 'America/Vancouver'}{' '}
                    <span className="text-gray-400 font-normal">(read-only)</span>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-400 w-28 shrink-0">Method</dt>
                  <dd className="font-medium">{METHOD_LABELS[currentGeneral.method]}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-400 w-28 shrink-0">Madhab</dt>
                  <dd>{MADHAB_LABELS[currentGeneral.madhab]}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-400 w-28 shrink-0">High latitude</dt>
                  <dd>
                    {HIGH_LAT_LABELS[currentGeneral.highLatitudeRule]}
                    {currentGeneral.highLatitudeRule === config.recommendedHighLatitudeRule && (
                      <span className="ml-1 text-xs text-green-600">(recommended)</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}

        {/* ── Periods tab ──────────────────────────────────────────────── */}
        {activeTab === 'periods' && <PeriodsSection periods={config.periods} onRefresh={refresh} />}

        {/* ── History tab ──────────────────────────────────────────────── */}
        {activeTab === 'history' && <HistorySection onRefresh={refresh} />}
      </div>

      {/* Drawers */}
      <GeneralSettingsDrawer
        isOpen={generalDrawerOpen}
        onClose={() => setGeneralDrawerOpen(false)}
        current={currentGeneral as GeneralSettings}
        currentAngles={{
          fajrAngle:
            draft.draft.prayers['fajr']?.fajrAngle ?? baseSettings?.prayers['fajr']?.fajrAngle,
          ishaAngle:
            draft.draft.prayers['isha']?.ishaAngle ?? baseSettings?.prayers['isha']?.ishaAngle,
        }}
        catalog={catalog}
        onApply={(patch, customAngles) => {
          draft.setGeneral(patch);
          if (customAngles) {
            draft.setPrayer('fajr', {
              ...draft.draft.prayers['fajr'],
              fajrAngle: customAngles.fajrAngle,
            });
            draft.setPrayer('isha', {
              ...draft.draft.prayers['isha'],
              ishaAngle: customAngles.ishaAngle,
            });
          }
          setGeneralDrawerOpen(false);
        }}
      />

      <PrayerOffsetDrawer
        isOpen={prayerDrawerPrayer !== null}
        onClose={() => setPrayerDrawerPrayer(null)}
        prayer={prayerDrawerPrayer}
        currentOffset={prayerDrawerCurrentOffset}
        onApply={(prayer, patch) => {
          draft.setPrayer(prayer, patch);
          setPrayerDrawerPrayer(null);
        }}
      />

      {/* Review dialog */}
      {proposedSettings && (
        <ReviewDialog
          isOpen={reviewOpen}
          onClose={() => {
            if (!saving) setReviewOpen(false);
          }}
          onConfirm={handleConfirm}
          currentSettings={baseSettings}
          proposedSettings={proposedSettings}
          effectiveFrom={draft.draft.effectiveFrom}
          preview={preview}
          previewLoading={previewLoading}
          previewError={previewError}
        />
      )}
    </div>
  );
}
