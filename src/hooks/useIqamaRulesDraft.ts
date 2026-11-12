/** Local draft of pending Iqama rule changes (same pattern as useAdhanDraft). */
import { useReducer, useCallback } from 'react';
import type { PrayerName } from '../types/index';
import type { PrayerRule, RuleSet } from '../types/iqama-rules';
import { sameRule } from '../logic/iqama-rules';

export interface IqamaDraft {
  prayers: Partial<RuleSet>;
  /** The saved rule each edited prayer was edited from (to spot a clash after a reload). */
  bases: Partial<RuleSet>;
  /** '' = use the server's default (next Friday). */
  effectiveFrom: string;
}

const empty: IqamaDraft = { prayers: {}, bases: {}, effectiveFrom: '' };

type Action =
  | { type: 'SET_RULE'; prayer: PrayerName; rule: PrayerRule; base: PrayerRule }
  | { type: 'SET_EFFECTIVE_FROM'; date: string }
  | { type: 'DROP'; prayer: PrayerName }
  | { type: 'REBASE'; latest: RuleSet }
  | { type: 'RESET' };

export function iqamaDraftReducer(state: IqamaDraft, action: Action): IqamaDraft {
  switch (action.type) {
    case 'SET_RULE': {
      const prayers = { ...state.prayers };
      const bases = { ...state.bases };
      // Setting a rule back to the saved one drops it from the draft.
      if (sameRule(action.rule, action.base)) {
        delete prayers[action.prayer];
        delete bases[action.prayer];
      } else {
        prayers[action.prayer] = action.rule;
        bases[action.prayer] ??= action.base; // keep the version first edited from
      }
      return { ...state, prayers, bases };
    }
    case 'DROP': {
      const prayers = { ...state.prayers };
      const bases = { ...state.bases };
      delete prayers[action.prayer];
      delete bases[action.prayer];
      return { ...state, prayers, bases };
    }
    case 'REBASE': {
      // Keep every edit, now relative to the new newest version. An edit that
      // equals the new saved rule is no longer a change.
      const prayers = { ...state.prayers };
      const bases: Partial<RuleSet> = {};
      for (const p of Object.keys(prayers) as PrayerName[]) {
        if (sameRule(prayers[p]!, action.latest[p])) delete prayers[p];
        else bases[p] = action.latest[p];
      }
      return { ...state, prayers, bases };
    }
    case 'SET_EFFECTIVE_FROM':
      return { ...state, effectiveFrom: action.date };
    case 'RESET':
      return empty;
  }
}

/** Edited prayers whose saved rule changed since they were edited (another save touched them). */
export function overlappingPrayers(draft: IqamaDraft, latest: RuleSet): PrayerName[] {
  return (Object.keys(draft.prayers) as PrayerName[]).filter((p) => {
    const was = draft.bases[p];
    return (
      was !== undefined && !sameRule(was, latest[p]) && !sameRule(draft.prayers[p]!, latest[p])
    );
  });
}

export function useIqamaRulesDraft() {
  const [draft, dispatch] = useReducer(iqamaDraftReducer, empty);
  const setRule = useCallback(
    (prayer: PrayerName, rule: PrayerRule, base: PrayerRule) =>
      dispatch({ type: 'SET_RULE', prayer, rule, base }),
    [],
  );
  const setEffectiveFrom = useCallback(
    (date: string) => dispatch({ type: 'SET_EFFECTIVE_FROM', date }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const dropPrayer = useCallback((prayer: PrayerName) => dispatch({ type: 'DROP', prayer }), []);
  const rebase = useCallback((latest: RuleSet) => dispatch({ type: 'REBASE', latest }), []);
  const hasChanges = Object.keys(draft.prayers).length > 0;
  return { draft, hasChanges, setRule, setEffectiveFrom, reset, dropPrayer, rebase };
}
