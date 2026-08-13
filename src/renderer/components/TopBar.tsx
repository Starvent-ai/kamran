import { DateTimeWidget } from "@/components/DateTimeWidget";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useUsers } from "@/modules/security/useUsers";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

/**
 * A quiet echo of the elliptical ring that swoops around the star in the
 * Starvent mark. Used exactly once per page, under the title, as the
 * signature element — not repeated as decoration elsewhere.
 */
function OrbitAccent(): JSX.Element {
  return (
    <svg className="topbar__orbit" viewBox="0 0 72 10" fill="none" aria-hidden="true">
      <path
        d="M2 6.5C14 -1 58 -1 70 6.5"
        stroke="url(#orbit-gradient)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="orbit-gradient" x1="0" y1="0" x2="72" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8a5e10" stopOpacity="0" />
          <stop offset="0.5" stopColor="#e3bf5c" />
          <stop offset="1" stopColor="#a8b0ba" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TopBar({ title, subtitle }: TopBarProps): JSX.Element {
  const { currentUser, logout } = useUsers();

  return (
    <header className="topbar">
      <div className="topbar__title-group">
        <h1 className="topbar__title">{title}</h1>
        {subtitle ? <p className="topbar__subtitle">{subtitle}</p> : null}
        <OrbitAccent />
      </div>
      <div className="topbar__search-slot">
        <GlobalSearch />
      </div>
      <div className="topbar__meta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <DateTimeWidget />
        {currentUser ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "var(--sv-text-600)" }}>{currentUser.fullName}</span>
            <button type="button" className="btn-secondary" onClick={logout}>
              خروج
            </button>
          </span>
        ) : null}
      </div>
    </header>
  );
}
