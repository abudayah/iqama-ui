/**
 * Which version is being edited, which is in force, what is scheduled, and a
 * short history. Upcoming versions are always visible so a new save is never
 * made blind to them. No "who": the admin password is shared.
 */
import type { IqamaRulesConfig, IqamaVersion } from '../../types/iqama-rules';

const day = (iso: string) => iso.slice(0, 10);

type Line = Pick<IqamaVersion, 'versionId' | 'effectiveFrom' | 'createdAt' | 'reason'>;

function VersionLine({ v }: { v: Line }) {
  return (
    <li className="text-sm text-gray-700">
      <span className="font-medium">Version {v.versionId}</span> · from {v.effectiveFrom}
      <span className="block text-xs text-gray-500">
        Saved {day(v.createdAt)}
        {v.reason ? ` · ${v.reason}` : ''}
      </span>
    </li>
  );
}

export function VersionsPanel({ config }: { config: IqamaRulesConfig }) {
  const { latest, effective, upcoming, versions } = config;
  if (!latest) return null;
  const history = [...versions].sort((a, b) => b.id - a.id);
  return (
    <section
      data-testid="versions-panel"
      aria-label="Rule versions"
      className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-3"
    >
      <p className="text-sm text-gray-800" data-testid="editing-on-top-of">
        Editing on top of <span className="font-medium">version {latest.versionId}</span> (effective{' '}
        {latest.effectiveFrom}).
        {upcoming.length > 0 &&
          ' Prayers you do not edit keep the rules of the scheduled versions below.'}
      </p>

      {effective && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            In force today
          </h3>
          <ul className="mt-1">
            <VersionLine v={effective} />
          </ul>
        </div>
      )}

      {upcoming.length > 0 && (
        <div
          data-testid="upcoming-versions"
          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
        >
          <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Scheduled
          </h3>
          <ul className="mt-1 space-y-2">
            {upcoming.map((v) => (
              <VersionLine key={v.versionId} v={v} />
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <details>
          <summary className="text-sm text-blue-600 cursor-pointer min-h-[44px] flex items-center">
            Version history ({history.length})
          </summary>
          <ul className="mt-1 space-y-2 max-h-56 overflow-y-auto">
            {history.map((v) => (
              <VersionLine
                key={v.id}
                v={{
                  versionId: v.id,
                  effectiveFrom: v.effectiveFrom,
                  createdAt: v.createdAt,
                  reason: v.reason ?? null,
                }}
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
