/**
 * useAdhanDraft.ts
 *
 * Manages the local draft of pending Adhan config changes.
 * Changes accumulate here until the user goes through the
 * Review & Save flow.
 */

import { useReducer, useCallback } from 'react';
import type { AdhanSettings, GeneralSettings, PrayerSettings, PrayerKey } from '../types';

// ─── Draft state ──────────────────────────────────────────────────────────────

export interface AdhanDraft {
  general: Partial<GeneralSettings>;
  prayers: Partial<Record<PrayerKey, PrayerSettings>>;
  /** ISO date the change should take effect */
  effectiveFrom: string;
  reason: string;
}

function todayString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1); // default: tomorrow
  return d.toISOString().split('T')[0]!;
}

function emptyDraft(): AdhanDraft {
  return {
    general: {},
    prayers: {},
    effectiveFrom: todayString(),
    reason: '',
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type DraftAction =
  | { type: 'SET_GENERAL'; payload: Partial<GeneralSettings> }
  | { type: 'SET_PRAYER'; prayer: PrayerKey; payload: PrayerSettings }
  | { type: 'SET_EFFECTIVE_FROM'; date: string }
  | { type: 'SET_REASON'; reason: string }
  | { type: 'RESET' };

function reducer(state: AdhanDraft, action: DraftAction): AdhanDraft {
  switch (action.type) {
    case 'SET_GENERAL':
      return { ...state, general: { ...state.general, ...action.payload } };
    case 'SET_PRAYER':
      return {
        ...state,
        prayers: {
          ...state.prayers,
          [action.prayer]: { ...(state.prayers[action.prayer] ?? {}), ...action.payload },
        },
      };
    case 'SET_EFFECTIVE_FROM':
      return { ...state, effectiveFrom: action.date };
    case 'SET_REASON':
      return { ...state, reason: action.reason };
    case 'RESET':
      return emptyDraft();
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAdhanDraft {
  draft: AdhanDraft;
  hasChanges: boolean;
  setGeneral: (patch: Partial<GeneralSettings>) => void;
  setPrayer: (prayer: PrayerKey, patch: PrayerSettings) => void;
  setEffectiveFrom: (date: string) => void;
  setReason: (reason: string) => void;
  reset: () => void;
  /** Merge draft on top of the current base settings to produce a full AdhanSettings */
  buildFullSettings: (base: AdhanSettings) => AdhanSettings;
}

export function useAdhanDraft(): UseAdhanDraft {
  const [draft, dispatch] = useReducer(reducer, emptyDraft());

  const setGeneral = useCallback((patch: Partial<GeneralSettings>) => {
    dispatch({ type: 'SET_GENERAL', payload: patch });
  }, []);

  const setPrayer = useCallback((prayer: PrayerKey, patch: PrayerSettings) => {
    dispatch({ type: 'SET_PRAYER', prayer, payload: patch });
  }, []);

  const setEffectiveFrom = useCallback((date: string) => {
    dispatch({ type: 'SET_EFFECTIVE_FROM', date });
  }, []);

  const setReason = useCallback((reason: string) => {
    dispatch({ type: 'SET_REASON', reason });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const hasChanges = Object.keys(draft.general).length > 0 || Object.keys(draft.prayers).length > 0;

  const buildFullSettings = useCallback(
    (base: AdhanSettings): AdhanSettings => ({
      general: { ...base.general, ...draft.general },
      prayers: mergeDeep(base.prayers, draft.prayers),
    }),
    [draft],
  );

  return {
    draft,
    hasChanges,
    setGeneral,
    setPrayer,
    setEffectiveFrom,
    setReason,
    reset,
    buildFullSettings,
  };
}

function mergeDeep(
  base: Partial<Record<PrayerKey, PrayerSettings>>,
  patch: Partial<Record<PrayerKey, PrayerSettings>>,
): Partial<Record<PrayerKey, PrayerSettings>> {
  const result = { ...base };
  for (const [k, v] of Object.entries(patch) as [PrayerKey, PrayerSettings][]) {
    result[k] = { ...(result[k] ?? {}), ...v };
  }
  return result;
}
