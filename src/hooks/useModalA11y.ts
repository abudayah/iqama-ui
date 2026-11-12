/**
 * Dialog behaviour for a portaled modal (render inside <div data-modal-root>
 * appended to document.body):
 *  - focus moves into the dialog on open and returns to the trigger on close
 *  - Tab and Shift+Tab stay inside the dialog
 *  - Escape calls onClose
 *  - everything else directly under <body> is made `inert` while open
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useModalA11y(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const root = node.closest('[data-modal-root]');
    const inerted: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === root || el.hasAttribute('inert')) continue;
      el.setAttribute('inert', '');
      inerted.push(el);
    }

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('inert'),
      );
    (focusables()[0] ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      inerted.forEach((el) => el.removeAttribute('inert'));
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return ref;
}
