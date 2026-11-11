/**
 * IqamaRulesPage.tsx — /admin/iqama
 *
 * One card per prayer; tap opens a bottom sheet. Edits accumulate in a draft;
 * Review & save scans the next 365 days before anything is written.
 */
import { useEffect, useMemo, useState } from 'react';
import { useIqamaRules } from '../hooks/useIqamaRules';
import { useIqamaRulesDraft } from '../hooks/useIqamaRulesDraft';
import { previewIqamaRules, saveIqamaRules } from '../services/iqama-rules-service';
import { ApiError } from '../api/errors';
import { DEFAULT_RULE, changedPrayers } from '../logic/iqama-rules';
import { PRAYER_NAMES } from '../types/iqama-rules';
import type { PrayerName } from '../types/index';
import type { IqamaPreviewResponse, PrayerRule, RuleSet } from '../types/iqama-rules';
import { RuleCard } from '../components/iqama-rules/RuleCard';
import { RuleSheet } from '../components/iqama-rules/RuleSheet';
import { GuardrailsNote } from '../components/iqama-rules/GuardrailsNote';
import { RuleReviewDialog } from '../components/iqama-rules/RuleReviewDialog';

export function IqamaRulesPage() {
  const { config, catalog, loading, error, refresh } = useIqamaRules();
  const { draft, hasChanges, setRule, setEffectiveFrom, reset } = useIqamaRulesDraft();

  const [sheetPrayer, setSheetPrayer] = useState<PrayerName | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [preview, setPreview] = useState<IqamaPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scan, setScan] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Saved rules; a prayer with no stored rule (legacy mode) starts from a default.
  const base: RuleSet = useMemo(
    () =>
      Object.fromEntries(
        PRAYER_NAMES.map((p) => [p, config?.effective?.[p] ?? DEFAULT_RULE]),
      ) as RuleSet,
    [config],
  );
  const proposed: RuleSet = useMemo(() => ({ ...base, ...draft.prayers }), [base, draft.prayers]);
  const effectiveFrom = draft.effectiveFrom || config?.defaultEffectiveFrom || '';
  const changed = useMemo(() => changedPrayers(base, draft.prayers), [base, draft.prayers]);
  const needsFriday = changed.filter(
    (p) => catalog?.prayers.find((c) => c.name === p)?.fridayStartRequired,
  );

  // Re-scan whenever the review is open and the date or rules change.
  const proposedKey = JSON.stringify(proposed);
  useEffect(() => {
    if (!reviewOpen || !effectiveFrom) return;
    let cancelled = false;
    setPreview(null);
    setReviewError(null);
    setPreviewLoading(true);
    previewIqamaRules(JSON.parse(proposedKey) as RuleSet, effectiveFrom)
      .then((r) => !cancelled && setPreview(r))
      .catch((e: Error) => !cancelled && setReviewError(e.message))
      .finally(() => !cancelled && setPreviewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reviewOpen, proposedKey, effectiveFrom, scan]);

  const handleConfirm = async () => {
    if (!preview || !config) return;
    setSaving(true);
    setReviewError(null);
    try {
      await saveIqamaRules(proposed, effectiveFrom, preview.previewId, config.currentRevision);
      reset();
      setReviewOpen(false);
      setSuccessMsg('Rules saved. The public schedule has been updated.');
      setTimeout(() => setSuccessMsg(null), 4000);
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setStale(true); // someone else saved first: must reload before retrying
        setReviewError(e.message);
      } else if (e instanceof ApiError && e.status === 422) {
        setScan((n) => n + 1); // preview token rejected: scan again for a fresh one
      } else {
        setReviewError(e instanceof Error ? e.message : 'Failed to save');
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
                setStale(false);
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
        {config.mode !== 'db' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            {config.mode === 'legacy'
              ? 'Rules mode is "legacy": saved rules are stored but the public schedule still uses the built-in times.'
              : 'Rules mode is "shadow": saved rules are compared in the background but not shown publicly.'}
          </div>
        )}

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Iqama rules</h3>
        <div className="space-y-2">
          {PRAYER_NAMES.map((p) => (
            <RuleCard
              key={p}
              prayer={p}
              rule={proposed[p]}
              edited={p in draft.prayers}
              onClick={() => setSheetPrayer(p)}
            />
          ))}
        </div>

        <GuardrailsNote catalog={catalog} />
      </div>

      <RuleSheet
        prayer={sheetPrayer}
        initialRule={sheetPrayer ? proposed[sheetPrayer] : DEFAULT_RULE}
        catalog={catalog}
        effectiveFrom={effectiveFrom}
        buildSettings={(p: PrayerName, rule: PrayerRule) => ({ ...proposed, [p]: rule })}
        onApply={(p, rule) => setRule(p, rule, base[p])}
        onClose={() => setSheetPrayer(null)}
      />

      {reviewOpen && (
        <RuleReviewDialog
          today={config.today}
          effectiveFrom={effectiveFrom}
          onEffectiveFromChange={setEffectiveFrom}
          changed={changed}
          needsFriday={needsFriday}
          preview={preview}
          loading={previewLoading}
          error={reviewError}
          saving={saving}
          onConfirm={() => void handleConfirm()}
          onClose={() => {
            setReviewOpen(false);
            if (stale) {
              reset();
              refresh();
            }
          }}
        />
      )}
    </div>
  );
}
