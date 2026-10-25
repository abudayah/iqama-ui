/**
 * useAdhanDraft.ts
 *
 * Manages the local draft of pending Adhan config changes.
 * Changes accumulate here until the user goes through the
 * Review & Save flow.
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { AdhanSettings, GeneralSettings, PrayerSettings, PrayerKey } from '../types';

// ─── Draft state ──────────────────────────────────────────────────────────────

export interface AdhanDraft {
  general: Partial<GeneralSettings>;
  prayers: Partial<Record<PrayerKey, PrayerSettings>>;
  /** ISO date the change should take effect */
  effectiveFrom: string;
}

function emptyDraft(serverToday?: string): AdhanDraft {
  const base = serverToday ?? new Date().toLocaleDateString('sv-SE');
  return {
    general: {},
    prayers: {},
    effectiveFrom: base, // immediate: take effect today
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type DraftAction =
  | { type: 'SET_GENERAL'; payload: Partial<GeneralSettings> }
  | { type: 'SET_PRAYER'; prayer: PrayerKey; payload: PrayerSettings }
  | { type: 'SET_EFFECTIVE_FROM'; date: string }
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
  reset: () => void;
  /** Merge draft on top of the current base settings to produce a full AdhanSettings */
  buildFullSettings: (base: AdhanSettings) => AdhanSettings;
}

export function useAdhanDraft(serverToday?: string): UseAdhanDraft {
  const [draft, dispatch] = useReducer(reducer, emptyDraft(serverToday));

  // When serverToday arrives (async), update effectiveFrom so we use the
  // server's authoritative today date rather than the client's local clock.
  const prevToday = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (serverToday && serverToday !== prevToday.current) {
      prevToday.current = serverToday;
      dispatch({ type: 'SET_EFFECTIVE_FROM', date: serverToday });
    }
  }, [serverToday]);

  const setGeneral = useCallback((patch: Partial<GeneralSettings>) => {
    dispatch({ type: 'SET_GENERAL', payload: patch });
  }, []);

  const setPrayer = useCallback((prayer: PrayerKey, patch: PrayerSettings) => {
    dispatch({ type: 'SET_PRAYER', prayer, payload: patch });
  }, []);

  const setEffectiveFrom = useCallback((date: string) => {
    dispatch({ type: 'SET_EFFECTIVE_FROM', date });
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
    const merged = { ...(result[k] ?? {}), ...v };
    // Remove the entry entirely if it holds only zero/undefined values
    const hasNonZero = Object.values(merged).some((val) => val !== undefined && val !== 0);
    if (hasNonZero) {
      result[k] = merged;
    } else {
      delete result[k];
    }
  }
  return result;
}
