import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFitupAdmin } from './FitupAdminContext';
import './AdminLayout.css';

const gymNav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/classes', label: 'Classes', icon: 'classes' },
  { to: '/coaches', label: 'Coaches', icon: 'coach' },
  { to: '/users', label: 'Members', icon: 'member' },
  { to: '/revenue', label: 'Revenue', icon: 'dollar' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/partner-gyms', label: 'Branches', icon: 'building' },
  { to: '/equipment', label: 'Equipment', icon: 'equipment' },
  { to: '/facilities', label: 'Facilities', icon: 'spa' },
  { to: '/messages', label: 'Messages', icon: 'message' },
  { to: '/employees', label: 'Employees', icon: 'users' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const fitupNav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/content', label: 'Content', icon: 'file' },
  { to: '/coaches', label: 'Coaches', icon: 'coach' },
  { to: '/user-ids', label: 'User IDs', icon: 'id' },
  { to: '/partnerships', label: 'Partnerships', icon: 'handshake' },
  { to: '/partner-gyms', label: 'Gyms', icon: 'building' },
  { to: '/contracts', label: 'Contracts', icon: 'contract' },
  { to: '/messages', label: 'Messages', icon: 'message' },
  { to: '/revenue', label: 'Revenue', icon: 'dollar' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/employees', label: 'Employees', icon: 'users' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
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
    file: (
      <svg {...common}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="3" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a3 3 0 0 1 0 5.75" />
      </svg>
    ),
    coach: (
      <svg {...common}>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        <path d="M18 11l3 3-3 3" />
      </svg>
    ),
    id: (
      <svg {...common}>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <circle cx="8" cy="12" r="2" />
        <path d="M13 10h5M13 14h5" />
      </svg>
    ),
    handshake: (
      <svg {...common}>
        <path d="M9 11l3 3a2 2 0 0 0 3-3l-2-2" />
        <path d="M6 13l3 3a2 2 0 1 0 3-3" />
        <path d="M3 12l3 3" />
        <path d="M16 8l2-2 4 4-2 2" />
        <path d="M2 10l4-4 2 2" />
      </svg>
    ),
    building: (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 10h.01M12 10h.01M15 10h.01M9 14h.01M12 14h.01M15 14h.01" />
      </svg>
    ),
    contract: (
      <svg {...common}>
        <path d="M8 3h8l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M16 3v5h5" />
        <path d="M10 12h8M10 16h8" />
      </svg>
    ),
    message: (
      <svg {...common}>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
    member: (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    ),
    cube: (
      <svg {...common}>
        <path d="M12 2l9 5-9 5-9-5 9-5z" />
        <path d="M3 7v10l9 5 9-5V7" />
      </svg>
    ),
    dollar: (
      <svg {...common}>
        <path d="M12 2v20" />
        <path d="M16.5 6.5c0-1.9-2-3.5-4.5-3.5S7.5 4.6 7.5 6.5 9.5 10 12 10s4.5 1.6 4.5 3.5S14.5 17 12 17s-4.5-1.6-4.5-3.5" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
    equipment: (
      <svg {...common}>
        <path d="M14 7l3-3 3 3-3 3z" />
        <path d="M4 20l7-7" />
        <path d="M10 14l-2 2a2 2 0 0 1-3 0l-1-1a2 2 0 0 1 0-3l2-2" />
        <path d="M14 10l2 2" />
      </svg>
    ),
    spa: (
      <svg {...common}>
        <path d="M12 20c0-5 4-6 4-11-2 .5-4 2-4 5-1-3-3-4.5-6-5 0 5 4 6 6 11z" />
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

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, partnerGyms, authUser, authRole } = useFitupAdmin();
  const [selectedBranchId, setSelectedBranchId] = useState('');

  useEffect(() => {
    if (!partnerGyms.length) {
      setSelectedBranchId('');
      return;
    }
    setSelectedBranchId((prev) =>
      prev && partnerGyms.some((g) => g.id === prev) ? prev : partnerGyms[0].id
    );
  }, [partnerGyms]);

  const accountRoleLabel =
    authRole === 'fitup'
      ? 'FITUP Admin'
      : authRole === 'gym'
        ? 'Gym Demo'
        : authRole === 'admin'
          ? 'Admin'
          : 'Dashboard';

  const nav = useMemo(() => (authRole === 'gym' ? gymNav : fitupNav), [authRole]);
  const avatarInitials = useMemo(() => {
    const parts = String(authUser || 'Admin')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const out = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
    return out || 'A';
  }, [authUser]);

  useEffect(() => {
    if (!nav.some((n) => n.to === location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [nav, location.pathname, navigate]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`fu-shell ${collapsed ? 'fu-shell--collapsed' : ''} ${
        mobileNavOpen ? 'fu-shell--mobileOpen' : ''
      }`}
    >
      <aside className="fu-sidebar">
        <div className="fu-sidebar__brand">
          <span className="fu-sidebar__logo">{collapsed ? 'F' : 'FITUP'}</span>
          {!collapsed && (
            <div>
              <div className="fu-sidebar__title" />
            </div>
          )}
        </div>
        <nav className="fu-sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end
              className={({ isActive }) =>
                `fu-navlink ${isActive ? 'fu-navlink--active' : ''}`
              }
              title={item.label}
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="fu-navlink__icon">
                <NavIcon name={item.icon} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="fu-sidebar__footer">
          <div className="fu-sidebar__account">
            <div className="fu-sidebar__avatar">
              {avatarInitials}
            </div>
            {!collapsed && (
              <div>
                <div className="fu-sidebar__accountName">{authUser || 'Admin'}</div>
                <div className="fu-sidebar__accountRole">{accountRoleLabel}</div>
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
        <header className="fu-topbar">
          <button
            type="button"
            className="fu-topbar__burger"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label={mobileNavOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? '✕' : '☰'}
          </button>
          <div className="fu-topbar__search">
            <span className="fu-topbar__searchIcon">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dashboard…"
              aria-label="Global search"
            />
          </div>
          <div className="fu-topbar__meta">
            {partnerGyms.length > 0 ? (
              <label className="fu-topbar__branch">
                <span className="fu-topbar__branchLabel">Branch</span>
                <select
                  className="fu-select fu-topbar__branchSelect"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  aria-label="Active branch"
                >
                  {partnerGyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.brandName || g.legalName || g.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span className="fu-topbar__crumb">
              {location.pathname.replace('/', '') || 'dashboard'}
            </span>
          </div>
        </header>
        <main className="fu-page">
          <Outlet
            context={{
              globalSearch: search,
              selectedBranchId,
              setSelectedBranchId,
              partnerGyms,
            }}
          />
        </main>
      </div>
      {mobileNavOpen ? (
        <button
          type="button"
          className="fu-sidebar__overlay"
          aria-label="Close sidebar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
    </div>
  );
}
