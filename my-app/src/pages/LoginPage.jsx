import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDemoById, isAuthenticated, authRole, settings } = useFitupAdmin();
  const [form, setForm] = useState({ gymId: '', email: settings.email || '', password: '' });
  const [error, setError] = useState('');
  const gymDemoEmail = String(
    (settings.demoAccounts || []).find((d) => d.role === 'gym')?.email || ''
  ).toLowerCase();
  const requiresGymId = String(form.email || '').trim().toLowerCase() === gymDemoEmail;
  const postAuthPath = authRole === 'coach' ? '/coach/dashboard' : '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={postAuthPath} replace />;
  }

  const submit = (e) => {
    e.preventDefault();
    const em = String(form.email || '').trim().toLowerCase();
    const pw = String(form.password || '');
    const gid = String(form.gymId || '').trim().toLowerCase();
    let matchedDemo = Array.isArray(settings.demoAccounts)
      ? settings.demoAccounts.find(
          (d) =>
            em === String(d.email || '').trim().toLowerCase() &&
            pw === String(d.password || '')
        )
      : null;
    if (
      matchedDemo?.role === 'gym' &&
      gid !== String(matchedDemo.gymId || '').trim().toLowerCase()
    ) {
      matchedDemo = null;
    }
    const ok = login(form.email, form.password, form.gymId);
    if (!ok) {
      setError(requiresGymId ? 'Invalid gym ID, email, or password.' : 'Invalid email or password.');
      return;
    }
    const from = location.state?.from?.pathname;
    const fromStr = from ? String(from) : '';
    const isCoach = matchedDemo?.role === 'coach';
    const target = isCoach
      ? fromStr.startsWith('/coach')
        ? fromStr
        : '/coach/dashboard'
      : fromStr && !fromStr.startsWith('/coach')
        ? fromStr
        : '/dashboard';
    navigate(target, { replace: true });
  };

  const completeLoginRedirect = (role) => {
    const from = location.state?.from?.pathname;
    const fromStr = from ? String(from) : '';
    const isCoach = role === 'coach';
    const target = isCoach
      ? fromStr.startsWith('/coach')
        ? fromStr
        : '/coach/dashboard'
      : fromStr && !fromStr.startsWith('/coach')
        ? fromStr
        : '/dashboard';
    navigate(target, { replace: true });
  };

  const applyDemoAccount = (demo) => {
    const gymId = demo.role === 'gym' ? demo.gymId || '' : '';
    const nextForm = {
      gymId,
      email: demo.email || '',
      password: demo.password || '',
    };
    setForm(nextForm);
    const ok = loginDemoById(demo.id);
    if (!ok) {
      setError(
        demo.role === 'gym'
          ? 'Invalid gym ID, email, or password.'
          : 'Invalid email or password.'
      );
      return;
    }
    setError('');
    completeLoginRedirect(demo.role);
  };

  return (
    <div className="loginPg">
      <div className="loginPg__shell">
        <section className="loginPg__brand">
          <div className="loginPg__logo">F</div>
          <h1>FITUP Admin</h1>
          <p>Manage partner gyms, contracts, members, coaches, and platform operations.</p>
          <ul className="loginPg__bullets">
            <li>Secure admin access</li>
            <li>Contract and partnership workflows</li>
            <li>Member and coach moderation tools</li>
          </ul>
        </section>

        <form className="loginPg__card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="loginPg__sub">Use your admin credentials to continue.</p>
          {Array.isArray(settings.demoAccounts) && settings.demoAccounts.length ? (
            <div className="loginPg__demoWrap">
              <p className="loginPg__demoTitle">Demo accounts</p>
              <div className="loginPg__demoGrid">
                {settings.demoAccounts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="fu-btn fu-btn--ghost loginPg__demoBtn"
                    onClick={() => applyDemoAccount(d)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {requiresGymId ? (
            <>
              <label className="fu-label">Gym ID</label>
              <input
                className="fu-input"
                value={form.gymId}
                onChange={(e) => setForm((p) => ({ ...p, gymId: e.target.value }))}
                placeholder="Enter gym ID"
                required
              />
            </>
          ) : null}
          <label className="fu-label">Email</label>
          <input
            className="fu-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <label className="fu-label">Password</label>
          <input
            className="fu-input"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          {error ? <p className="loginPg__error">{error}</p> : null}
          <button type="submit" className="fu-btn fu-btn--primary loginPg__btn">
            Login to dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
