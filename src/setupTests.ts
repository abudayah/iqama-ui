import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from './i18n';

// Ensure the DOM is cleared between tests. Without this, components rendered
// by one test can leak into the next, causing queryByText to match leftover
// nodes and making property-based tests (eid-card) flaky under full-suite runs.
afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});
