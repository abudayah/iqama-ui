/**
 * IqamaTabLayout — the single "Iqama" admin tab.
 *
 * A segmented control switches between Overrides (/admin, the default) and
 * Rules (/admin/iqama). The Rules draft lives here so it survives the switch;
 * a dot on "Rules" shows that it holds unsaved changes.
 */
import { useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIqamaRulesDraft } from '../hooks/useIqamaRulesDraft';

const TABS = [
  { id: 'overrides', labelKey: 'admin.overrides', path: '/admin' },
  { id: 'rules', labelKey: 'admin.rules', path: '/admin/iqama' },
] as const;

export function IqamaTabLayout() {
  const { t } = useTranslation();
  const draft = useIqamaRulesDraft();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = pathname.startsWith('/admin/iqama') ? 1 : 0;

  const go = (i: number) => {
    navigate(TABS[i]!.path);
    refs.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go((active + 1) % TABS.length);
    else if (e.key === 'ArrowLeft') go((active + TABS.length - 1) % TABS.length);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(TABS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div className="px-4 pt-3 bg-gray-50">
        <div
          role="tablist"
          aria-label={t('admin.iqamaTabs')}
          className="flex bg-gray-200 rounded-xl p-1"
          onKeyDown={onKeyDown}
        >
          {TABS.map((tItem, i) => (
            <button
              key={tItem.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`iqama-tab-${tItem.id}`}
              aria-selected={active === i}
              aria-controls="iqama-tabpanel"
              tabIndex={active === i ? 0 : -1}
              onClick={() => go(i)}
              className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                active === i ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              {t(tItem.labelKey)}
              {tItem.id === 'rules' && draft.hasChanges && (
                <span
                  data-testid="rules-unsaved-dot"
                  role="img"
                  aria-label={t('admin.unsavedDot')}
                  className="inline-block h-2 w-2 rounded-full bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="iqama-tabpanel" aria-labelledby={`iqama-tab-${TABS[active]!.id}`}>
        <Outlet context={draft} />
      </div>
    </div>
  );
}
