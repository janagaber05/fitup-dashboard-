import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useFitupAdmin } from './FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import './AdminLayout.css';
import './CoachLayout.css';

const nav = [
  { to: '/coach/dashboard', label: 'Overview', icon: 'dashboard' },
  { to: '/coach/schedule', label: 'My schedule', icon: 'calendar' },
  { to: '/coach/classes', label: 'My classes', icon: 'classes' },
  { to: '/coach/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/coach/programs', label: 'Programs', icon: 'programs' },
  { to: '/coach/clients', label: 'Clients', icon: 'clients' },
  { to: '/coach/messages', label: 'Messages', icon: 'messages' },
  { to: '/coach/settings', label: 'Settings', icon: 'settings' },
];

function NavIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  const icons = {
    dashboard: (
      <svg {...common}>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" />
      </svg>
    ),
    classes: (
      <svg {...common}>
        <path d="M7 7l4-4 3 3-4 4zM13 13l4-4 3 3-4 4z" />
        <path d="M3 13l6 6M15 3l6 6" />
      </svg>
    ),
    clients: (
      <svg {...common}>
        <circle cx="9" cy="7" r="3.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20v-1.2a4 4 0 014-3.8h4a4 4 0 014 3.8V20M14 20v-1a3 3 0 013-3h1" />
      </svg>
    ),
    messages: (
      <svg {...common}>
        <path d="M4 6h16v10H8l-4 3V6z" />
        <path d="M8 10h8M8 13h5" />
      </svg>
    ),
    programs: (
      <svg {...common}>
        <path d="M4 8h3v8H4zM17 8h3v8h-3zM7 10h10M7 14h7" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
    settings: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 20.4a1.7 1.7 0 0 0-1 .98 1.7 1.7 0 0 1-3.28 0 1.7 1.7 0 0 0-1-.98 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.98-1 1.7 1.7 0 0 1 0-3.28 1.7 1.7 0 0 0 .98-1A1.7 1.7 0 0 0 3.26 7.8l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 3.6a1.7 1.7 0 0 0 1-.98 1.7 1.7 0 0 1 3.28 0 1.7 1.7 0 0 0 1 .98 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.4 9c.23.4.58.7.98.84a1.7 1.7 0 0 1 0 3.28 1.7 1.7 0 0 0-.98.88z" />
      </svg>
    ),
  };
  return icons[name] || icons.dashboard;
}

export default function CoachLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, authUser, coachSession, partnerGyms, users } = useFitupAdmin();
  const branch =
    partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null;

  const programsReviewCount = useMemo(() => {
    return coachScopedClients(users, coachSession, partnerGyms).filter(
      (u) => u.profile?.programsNeedReview
    ).length;
  }, [users, coachSession, partnerGyms]);

  return (
    <div className={`fu-shell coachShell ${collapsed ? 'fu-shell--collapsed' : ''}`}>
      <aside className="fu-sidebar coachShell__sidebar">
        <div className="fu-sidebar__brand">
          <span className="fu-sidebar__logo">{collapsed ? 'F' : 'FITUP'}</span>
        </div>
        <div className="coachShell__badge">Coach</div>
        <nav className="fu-sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/coach/dashboard'}
              className={({ isActive }) =>
                `fu-navlink ${isActive ? 'fu-navlink--active' : ''}`
              }
            >
              <span className="fu-navlink__icon">
                <NavIcon name={item.icon} />
              </span>
              {!collapsed && (
                <span className="coachShell__navLabel">
                  {item.label}
                  {item.to === '/coach/programs' && programsReviewCount > 0 ? (
                    <span className="coachShell__navBadge" title="Your clients flagged for program review">
                      {programsReviewCount > 9 ? '9+' : programsReviewCount}
                    </span>
                  ) : null}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="fu-sidebar__footer">
          <div className="fu-sidebar__account">
            <div className="fu-sidebar__avatar coachShell__avatar">
              {String(authUser || 'C')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <div className="fu-sidebar__accountName">{authUser || 'Coach'}</div>
                <div className="fu-sidebar__accountRole">
                  {branch?.brandName || branch?.legalName || 'Your gym'}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="fu-sidebar__logout"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            <span className="fu-sidebar__logoutIcon">↪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
        <button
          type="button"
          className="fu-sidebar__collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      <div className="fu-main">
        <header className="fu-topbar coachShell__topbar">
          <div className="coachShell__topTitle">
            <h1 className="coachShell__topHeading">Coach workspace</h1>
            <p className="coachShell__topSub">
              {branch?.brandName || 'Branch'} · sessions and classes tied to your profile
            </p>
          </div>
        </header>
        <main className="fu-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
