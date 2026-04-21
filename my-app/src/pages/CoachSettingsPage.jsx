import { useEffect, useMemo, useState } from 'react';
import { Toggle } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './SettingsPage.css';
import './CoachSettingsPage.css';

const DEFAULT_NOTIFY = {
  emailDigest: true,
  newBookingAlerts: true,
  clientMessageAlerts: true,
};

const DEFAULT_LOCALE = {
  language: 'English',
  timezone: 'Asia/Dubai',
};

export default function CoachSettingsPage() {
  const { settings, updateSettings, coachSession, partnerGyms } = useFitupAdmin();

  const coachId = String(coachSession?.coachId || '').trim();

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const prefRow = useMemo(() => {
    const map = settings.coachPreferencesByCoachId || {};
    return map[coachId] || {};
  }, [settings.coachPreferencesByCoachId, coachId]);

  const notify = useMemo(
    () => ({ ...DEFAULT_NOTIFY, ...prefRow.notify }),
    [prefRow.notify]
  );

  const [locale, setLocale] = useState(() => ({
    ...DEFAULT_LOCALE,
    ...prefRow.locale,
  }));
  const [localeMsg, setLocaleMsg] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    const row = (settings.coachPreferencesByCoachId || {})[coachId] || {};
    setLocale({ ...DEFAULT_LOCALE, ...row.locale });
  }, [coachId, settings.coachPreferencesByCoachId]);

  const patchCoachPrefs = (partial) => {
    const map = { ...(settings.coachPreferencesByCoachId || {}) };
    map[coachId] = { ...map[coachId], ...partial };
    updateSettings({ coachPreferencesByCoachId: map });
  };

  const setNotifyField = (key, value) => {
    patchCoachPrefs({
      notify: { ...notify, [key]: value },
    });
  };

  const saveLocale = (e) => {
    e.preventDefault();
    patchCoachPrefs({ locale: { ...locale } });
    setLocaleMsg('Regional preferences saved.');
    setTimeout(() => setLocaleMsg(''), 2200);
  };

  const savePassword = (e) => {
    e.preventDefault();
    setPwMsg('');
    const accounts = Array.isArray(settings.demoAccounts) ? [...settings.demoAccounts] : [];
    const idx = accounts.findIndex(
      (d) =>
        d.role === 'coach' &&
        String(d.coachId || '').trim().toUpperCase() === coachId.toUpperCase()
    );
    if (idx < 0) {
      setPwMsg('Password change is only available for demo coach sign-in.');
      return;
    }
    const demo = accounts[idx];
    if (pw.current !== String(demo.password || '')) {
      setPwMsg('Current password is incorrect.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg('New passwords do not match.');
      return;
    }
    if (pw.next.length < 6) {
      setPwMsg('Use at least 6 characters (demo only).');
      return;
    }
    accounts[idx] = { ...demo, password: pw.next };
    updateSettings({ demoAccounts: accounts });
    setPwMsg('Password updated. Use it next time you sign in.');
    setPw({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="setPg coachSetPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Settings</h1>
          <p>
            Your workspace preferences and account security
            {branch?.brandName ? ` · ${branch.brandName}` : ''}
          </p>
        </div>
      </header>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Account</h2>
          <p>Coach profile on file (managed by your gym admin)</p>
        </div>
        <dl className="coachSet__dl">
          <div>
            <dt>Name</dt>
            <dd>{coachSession?.coachName || '—'}</dd>
          </div>
          <div>
            <dt>Coach ID</dt>
            <dd className="coachSet__mono">{coachSession?.coachId || '—'}</dd>
          </div>
          <div>
            <dt>Work email</dt>
            <dd>{coachSession?.coachEmail || '—'}</dd>
          </div>
          <div>
            <dt>Branch</dt>
            <dd>{branch?.brandName || branch?.legalName || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Notifications</h2>
          <p>What you want to hear about in this dashboard (demo toggles)</p>
        </div>
        <div className="setPg__notifyList">
          <div className="setPg__notifyRow">
            <div>
              <h3>Email digest</h3>
              <p>Periodic summary of your week</p>
            </div>
            <Toggle
              checked={notify.emailDigest}
              onChange={(v) => setNotifyField('emailDigest', v)}
            />
          </div>
          <div className="setPg__notifyRow">
            <div>
              <h3>Booking alerts</h3>
              <p>When new sessions mention you</p>
            </div>
            <Toggle
              checked={notify.newBookingAlerts}
              onChange={(v) => setNotifyField('newBookingAlerts', v)}
            />
          </div>
          <div className="setPg__notifyRow">
            <div>
              <h3>Client messages</h3>
              <p>New threads and replies from your clients</p>
            </div>
            <Toggle
              checked={notify.clientMessageAlerts}
              onChange={(v) => setNotifyField('clientMessageAlerts', v)}
            />
          </div>
        </div>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Regional preferences</h2>
          <p>Language and time zone for dates and times in the coach workspace</p>
        </div>
        <form className="setPg__form setPg__form--three" onSubmit={saveLocale}>
          <label className="fu-label">Language</label>
          <label className="fu-label">Timezone</label>
          <span className="coachSet__formSpacer" aria-hidden />
          <select
            className="fu-select"
            value={locale.language}
            onChange={(e) => setLocale((prev) => ({ ...prev, language: e.target.value }))}
          >
            <option>English</option>
            <option>Arabic</option>
            <option>French</option>
          </select>
          <select
            className="fu-select"
            value={locale.timezone}
            onChange={(e) => setLocale((prev) => ({ ...prev, timezone: e.target.value }))}
          >
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
          </select>
          <span className="coachSet__formSpacer" aria-hidden />
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Save regional settings
          </button>
          {localeMsg ? <p className="setPg__msg">{localeMsg}</p> : null}
        </form>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Security</h2>
          <p>Change the password for your demo coach login</p>
        </div>
        <form className="setPg__form" onSubmit={savePassword}>
          <label className="fu-label">Current password</label>
          <input
            type="password"
            className="fu-input"
            autoComplete="current-password"
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
          />
          <label className="fu-label">New password</label>
          <input
            type="password"
            className="fu-input"
            autoComplete="new-password"
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
          />
          <label className="fu-label">Confirm new password</label>
          <input
            type="password"
            className="fu-input"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
          />
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Update password
          </button>
          {pwMsg ? <p className="setPg__msg">{pwMsg}</p> : null}
        </form>
      </section>
    </div>
  );
}
