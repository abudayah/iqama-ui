/** Local draft of pending Iqama rule changes (same pattern as useAdhanDraft). */
import { useReducer, useCallback } from 'react';
import type { PrayerName } from '../types/index';
import type { PrayerRule, RuleSet } from '../types/iqama-rules';
import { sameRule } from '../logic/iqama-rules';

export interface IqamaDraft {
  prayers: Partial<RuleSet>;
  /** '' = use the server's default (next Friday). */
  effectiveFrom: string;
}

const empty: IqamaDraft = { prayers: {}, effectiveFrom: '' };

type Action =
  | { type: 'SET_RULE'; prayer: PrayerName; rule: PrayerRule; base: PrayerRule }
  | { type: 'SET_EFFECTIVE_FROM'; date: string }
  | { type: 'RESET' };

export function iqamaDraftReducer(state: IqamaDraft, action: Action): IqamaDraft {
  switch (action.type) {
    case 'SET_RULE': {
      const prayers = { ...state.prayers };
      // Setting a rule back to the saved one drops it from the draft.
      if (sameRule(action.rule, action.base)) delete prayers[action.prayer];
      else prayers[action.prayer] = action.rule;
      return { ...state, prayers };
    }
    case 'SET_EFFECTIVE_FROM':
      return { ...state, effectiveFrom: action.date };
    case 'RESET':
      return empty;
  }
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
  const hasChanges = Object.keys(draft.prayers).length > 0;
  return { draft, hasChanges, setRule, setEffectiveFrom, reset };
}
