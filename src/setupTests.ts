import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en';

// Components call useTranslation(); give vitest a synchronous English instance
// so tests keep asserting the English strings.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
});

// Ensure the DOM is cleared between tests. Without this, components rendered
// by one test can leak into the next, causing queryByText to match leftover
// nodes and making property-based tests (eid-card) flaky under full-suite runs.
afterEach(() => {
  cleanup();
});
