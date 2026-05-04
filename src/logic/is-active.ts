import type { Override } from '../types/index';

/**
 * Returns true iff override.startDate <= today <= override.endDate.
 * All dates are YYYY-MM-DD strings compared lexicographically.
 */
export function isActive(override: Override, today: string): boolean {
  return override.startDate <= today && today <= override.endDate;
}
