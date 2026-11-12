/**
 * IqamaRulesPage.tsx — /admin/iqama
 *
 * One card per prayer; tap opens a bottom sheet. Edits accumulate in a draft;
 * Review & save scans the next 365 days before anything is written.
 *
 * Every proposal is built from `config.latest` (the NEWEST saved version), never
 * from today's effective rules, so a scheduled change to another prayer is
 * never reverted by accident.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useIqamaRules } from '../hooks/useIqamaRules';
import { overlappingPrayers, useIqamaRulesDraft } from '../hooks/useIqamaRulesDraft';
import { previewIqamaRules, saveIqamaRules } from '../services/iqama-rules-service';
import { ApiError } from '../api/errors';
import { canonicalJson, changedPrayers, prayerLabel, savedMessage } from '../logic/iqama-rules';
import type { PrayerName } from '../types/index';
import type { IqamaPreviewResponse, PrayerRule, RuleSet } from '../types/iqama-rules';
import { RuleCard } from '../components/iqama-rules/RuleCard';
import { RuleSheet } from '../components/iqama-rules/RuleSheet';
import { GuardrailsNote } from '../components/iqama-rules/GuardrailsNote';
import { VersionsPanel } from '../components/iqama-rules/VersionsPanel';
import { RuleReviewDialog } from '../components/iqama-rules/RuleReviewDialog';

const later = (a: string, b: string) => (a > b ? a : b);

export function IqamaRulesPage() {
  const { config, catalog, loading, error, refresh } = useIqamaRules();
  // Inside the Iqama tab the draft is owned by IqamaTabLayout so it survives a
  // switch to Overrides; standalone (tests) the page keeps its own.
  const shared = useOutletContext<ReturnType<typeof useIqamaRulesDraft> | null>();
  const own = useIqamaRulesDraft();
  const { draft, hasChanges, setRule, setEffectiveFrom, reset, dropPrayer, rebase } = shared ?? own;

  const [sheetPrayer, setSheetPrayer] = useState<PrayerName | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  // A preview is stored with the key of the request it answered; it is only
  // used while that key is still the current one.
  const [previewState, setPreviewState] = useState<{
    key: string;
    data: IqamaPreviewResponse;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ path: string; message: string }[]>([]);
  const [staleFlag, setStaleFlag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scan, setScan] = useState(0);
  const keepSaveError = useRef(false);
  // After "Reload latest rules": waiting for the new config so the edits can be re-applied.
  const [reloading, setReloading] = useState(false);
  const [notices, setNotices] = useState<{ overlaps: PrayerName[]; dateMoved: string | null }>({
    overlaps: [],
    dateMoved: null,
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const latest = config?.latest ?? null;
  const baseline: RuleSet | null = latest?.rules ?? null;
  const proposed: RuleSet | null = useMemo(
    () => (baseline ? { ...baseline, ...draft.prayers } : null),
    [baseline, draft.prayers],
  );
  // The engine rejects a date before today or before the newest version.
  const minDate = config ? later(config.today, latest?.effectiveFrom ?? config.today) : '';
  const effectiveFrom =
    draft.effectiveFrom || (config ? later(config.defaultEffectiveFrom, minDate) : '');
  const changed = useMemo(
    () => (baseline ? changedPrayers(baseline, draft.prayers) : []),
    [baseline, draft.prayers],
  );
  const needsFriday = changed.filter(
    (p) => catalog?.prayers.find((c) => c.name === p)?.fridayStartRequired,
  );

  // One key for everything a preview depends on.
  const requestKey =
    proposed && effectiveFrom && config
      ? canonicalJson([proposed, effectiveFrom, config.currentRevision])
      : '';
  const activePreview = previewState?.key === requestKey ? previewState.data : null;
  const revisionMismatch =
    !!activePreview && !!config && activePreview.currentRevision !== config.currentRevision;
  const stale = staleFlag || revisionMismatch;

  // Scan whenever the review is open and the rules, date or revision change.
  // `cancelled` makes a late answer for an older request harmless.
  useEffect(() => {
    if (!reviewOpen || !requestKey) return;
    let cancelled = false;
    const [rules, date] = JSON.parse(requestKey) as [RuleSet, string, number];
    setPreviewState(null);
    setPreviewError(null);
    setFieldErrors([]);
    if (!keepSaveError.current) setSaveError(null);
    keepSaveError.current = false;
    setPreviewLoading(true);
    previewIqamaRules(rules, date)
      .then((data) => {
        if (!cancelled) setPreviewState({ key: requestKey, data });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setPreviewError(e.message);
        if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewOpen, requestKey, scan]);

  const closeReview = () => setReviewOpen(false);

  // Reload keeps the user's edits. Closing the review drops the preview and both
  // confirmations; a fresh preview is needed when it is opened again.
  const reloadLatest = () => {
    setStaleFlag(false);
    setReviewOpen(false);
    setPreviewState(null);
    setReloading(true);
    refresh();
  };

  // When the new config has arrived, re-apply the edits on top of the new newest version.
  useEffect(() => {
    if (!reloading || loading) return;
    const rules = config?.latest?.rules;
    if (error || !config || !rules) {
      setReloading(false);
      return;
    }
    const overlaps = overlappingPrayers(draft, rules);
    const min = later(config.today, config.latest!.effectiveFrom);
    let dateMoved: string | null = null;
    if (draft.effectiveFrom && draft.effectiveFrom < min) {
      dateMoved = later(config.defaultEffectiveFrom, min);
      setEffectiveFrom('');
    }
    rebase(rules);
    setNotices({ overlaps, dateMoved });
    setReloading(false);
  }, [reloading, loading, error, config, draft, rebase, setEffectiveFrom]);

  const handleConfirm = async (extra: {
    reason: string;
    acknowledgeConflicts: boolean;
    requestHash: string;
  }) => {
    if (!activePreview || !config || !proposed || stale) return;
    setSaving(true);
    setSaveError(null);
    setFieldErrors([]);
    try {
      await saveIqamaRules(
        proposed,
        effectiveFrom,
        activePreview.previewId,
        config.currentRevision,
        extra,
      );
      reset();
      setReviewOpen(false);
      setSuccessMsg(savedMessage(config.mode, effectiveFrom));
      setTimeout(() => setSuccessMsg(null), 6000);
      refresh();
    } catch (e) {
      const api = e instanceof ApiError ? e : null;
      if (api && (api.status === 409 || api.code === 'IQAMA_REVISION_STALE')) {
        setStaleFlag(true); // someone else saved first
        setSaveError(api.message);
      } else if (api?.status === 422) {
        // The preview token is no longer usable: drop it and scan again.
        keepSaveError.current = true;
        setPreviewState(null);
        setSaveError(api.message);
        setScan((n) => n + 1);
      } else {
        setSaveError(e instanceof Error ? e.message : 'Failed to save');
        if (api?.errors) setFieldErrors(api.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4" aria-busy="true" aria-label="Loading Iqama rules">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-red-600 underline min-h-[44px]">
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!config || !catalog) return null;

  const modeNote =
    config.mode === 'legacy'
      ? 'Rules mode is "legacy": saved rules are stored, but the public schedule still uses the built-in rules.'
      : config.mode === 'shadow'
        ? 'Rules mode is "shadow": the engine compares saved rules in the background; the public schedule is unchanged.'
        : config.today < config.cutover
          ? `The public schedule uses these rules from ${config.cutover}; earlier dates keep the built-in rules.`
          : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {successMsg && (
        <div
          role="status"
          className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800"
        >
          ✓ {successMsg}
        </div>
      )}

      {hasChanges && (
        <div
          role="status"
          className="sticky top-0 z-10 mx-4 mt-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-between text-sm shadow-lg"
        >
          <span>Unsaved changes</span>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="text-blue-200 hover:text-white underline min-h-[44px] px-2"
            >
              Discard
            </button>
            <button
              onClick={() => {
                setStaleFlag(false);
                setReviewOpen(true);
              }}
              className="bg-white text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 min-h-[44px]"
            >
              Review &amp; save
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {modeNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            {modeNote}
          </div>
        )}

        {!latest && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800"
          >
            No rules are saved on the engine yet, so there is nothing to edit. Seed the engine
            first.
          </div>
        )}
        {latest && !baseline && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700"
          >
            Version {latest.versionId} is stored but invalid ({latest.error}). Editing is off until
            it is fixed on the engine.
          </div>
        )}

        {baseline && proposed && (
          <>
            {(notices.overlaps.length > 0 || notices.dateMoved) && (
              <div
                data-testid="reload-notice"
                role="status"
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-sm text-amber-900"
              >
                {notices.overlaps.map((p) => (
                  <div key={p} className="flex items-center justify-between gap-3">
                    <span>
                      {prayerLabel(p)} was changed by another save: your version is kept, review it.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        dropPrayer(p);
                        setNotices((n) => ({ ...n, overlaps: n.overlaps.filter((x) => x !== p) }));
                      }}
                      aria-label={`Use the saved version instead for ${prayerLabel(p)}`}
                      className="shrink-0 text-sm border border-amber-400 rounded-lg px-3 min-h-[44px] bg-white"
                    >
                      Use the saved version instead
                    </button>
                  </div>
                ))}
                {notices.dateMoved && (
                  <p>
                    The effective date moved to {notices.dateMoved}, because the newest version
                    starts later than the date you chose.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setNotices({ overlaps: [], dateMoved: null })}
                  className="text-sm text-amber-800 underline min-h-[44px]"
                >
                  Dismiss
                </button>
              </div>
            )}
            <VersionsPanel config={config} />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Iqama rules
            </h3>
            <div className="space-y-2">
              {catalog.prayers.map(({ name }) => (
                <RuleCard
                  key={name}
                  prayer={name}
                  rule={proposed[name]}
                  edited={name in draft.prayers}
                  onClick={() => setSheetPrayer(name)}
                />
              ))}
            </div>
          </>
        )}

        <GuardrailsNote catalog={catalog} />
      </div>

      {proposed && (
        <RuleSheet
          prayer={sheetPrayer}
          initialRule={sheetPrayer ? proposed[sheetPrayer] : proposed[catalog.prayers[0]!.name]}
          catalog={catalog}
          effectiveFrom={effectiveFrom}
          buildSettings={(p: PrayerName, rule: PrayerRule) => ({ ...proposed, [p]: rule })}
          onApply={(p, rule) => baseline && setRule(p, rule, baseline[p])}
          onClose={() => setSheetPrayer(null)}
        />
      )}

      {reviewOpen && latest && (
        <RuleReviewDialog
          minDate={minDate}
          effectiveFrom={effectiveFrom}
          onEffectiveFromChange={setEffectiveFrom}
          baseNote={`Building on version ${latest.versionId} (effective ${latest.effectiveFrom}).`}
          changed={changed}
          needsFriday={needsFriday}
          preview={activePreview}
          loading={previewLoading}
          error={previewError ?? saveError}
          fieldErrors={fieldErrors}
          stale={stale}
          onReload={reloadLatest}
          saving={saving}
          onConfirm={(extra) => void handleConfirm(extra)}
          fajrMinBeforeSunrise={catalog.guardrails.fajrEndsBeforeSunriseMinutes}
          onClose={closeReview}
        />
      )}
    </div>
  );
}
