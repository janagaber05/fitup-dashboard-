import { useState } from 'react';
import { Toggle } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './SettingsPage.css';

export default function SettingsPage() {
  const { settings, updateSettings } = useFitupAdmin();
  const gymProfile = settings.gymProfile || {
    gymName: 'FitZone Gym',
    email: 'contact@fitzone.com',
    phone: '+1 234 567 8900',
    address: '123 Fitness Street, Downtown',
  };
  const workingHours = settings.workingHours || {
    weekdayStart: '06:00',
    weekdayEnd: '22:00',
    weekendStart: '08:00',
    weekendEnd: '20:00',
  };
  const notifications = settings.dashboardNotifications || {
    emailNotifications: true,
    bookingAlerts: true,
    paymentConfirmations: true,
    memberUpdates: false,
  };
  const localeSettings = settings.localeSettings || {
    language: 'English',
    timezone: 'America/New_York',
    currency: 'USD',
  };
  const messagingSettings = settings.messagingSettings || {
    defaultReplyChannel: 'chat',
    showResponderName: true,
    emailSignature: 'Best regards,\nFITUP Support Team',
  };

  const [profile, setProfile] = useState(gymProfile);
  const [hours, setHours] = useState(workingHours);
  const [locale, setLocale] = useState(localeSettings);
  const [messaging, setMessaging] = useState(messagingSettings);
  const [profileMsg, setProfileMsg] = useState('');
  const [hoursMsg, setHoursMsg] = useState('');
  const [localeMsg, setLocaleMsg] = useState('');
  const [messagingMsg, setMessagingMsg] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  const saveProfile = (e) => {
    e.preventDefault();
    updateSettings({ gymProfile: profile });
    setProfileMsg('Gym profile updated.');
    setTimeout(() => setProfileMsg(''), 2200);
  };

  const saveHours = (e) => {
    e.preventDefault();
    updateSettings({ workingHours: hours });
    setHoursMsg('Working hours updated.');
    setTimeout(() => setHoursMsg(''), 2200);
  };

  const saveLocale = (e) => {
    e.preventDefault();
    updateSettings({ localeSettings: locale });
    setLocaleMsg('Regional settings updated.');
    setTimeout(() => setLocaleMsg(''), 2200);
  };

  const saveMessaging = (e) => {
    e.preventDefault();
    updateSettings({ messagingSettings: messaging });
    setMessagingMsg('Messaging defaults updated.');
    setTimeout(() => setMessagingMsg(''), 2200);
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (pw.current !== String(settings.adminPassword || '')) {
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
    updateSettings({ adminPassword: pw.next, passwordHint: '••••••••' });
    setPwMsg('Password changed.');
    setPw({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="setPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Settings</h1>
          <p>Manage your gym preferences and account</p>
        </div>
      </header>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Gym Profile</h2>
          <p>Update your gym information</p>
        </div>
        <form className="setPg__form" onSubmit={saveProfile}>
          <label className="fu-label">Gym Name</label>
          <input
            className="fu-input"
            value={profile.gymName}
            onChange={(e) => setProfile((prev) => ({ ...prev, gymName: e.target.value }))}
          />
          <label className="fu-label">Email</label>
          <input
            type="email"
            className="fu-input"
            value={profile.email}
            onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
          />
          <label className="fu-label">Phone</label>
          <input
            className="fu-input"
            value={profile.phone}
            onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <label className="fu-label">Address</label>
          <input
            className="fu-input"
            value={profile.address}
            onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
          />
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Save Changes
          </button>
          {profileMsg ? <p className="setPg__msg">{profileMsg}</p> : null}
        </form>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Working Hours</h2>
          <p>Set your gym operating hours</p>
        </div>
        <form className="setPg__hoursGrid" onSubmit={saveHours}>
          <label className="fu-label">Weekdays</label>
          <input
            type="time"
            className="fu-input"
            value={hours.weekdayStart}
            onChange={(e) => setHours((prev) => ({ ...prev, weekdayStart: e.target.value }))}
          />
          <input
            type="time"
            className="fu-input"
            value={hours.weekdayEnd}
            onChange={(e) => setHours((prev) => ({ ...prev, weekdayEnd: e.target.value }))}
          />

          <label className="fu-label">Weekends</label>
          <input
            type="time"
            className="fu-input"
            value={hours.weekendStart}
            onChange={(e) => setHours((prev) => ({ ...prev, weekendStart: e.target.value }))}
          />
          <input
            type="time"
            className="fu-input"
            value={hours.weekendEnd}
            onChange={(e) => setHours((prev) => ({ ...prev, weekendEnd: e.target.value }))}
          />
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Update Hours
          </button>
          {hoursMsg ? <p className="setPg__msg">{hoursMsg}</p> : null}
        </form>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Notifications</h2>
          <p>Manage your notification preferences</p>
        </div>
        <div className="setPg__notifyList">
          <div className="setPg__notifyRow">
            <div>
              <h3>Email Notifications</h3>
              <p>Receive notifications via email</p>
            </div>
            <Toggle
              checked={notifications.emailNotifications}
              onChange={(v) =>
                updateSettings({
                  dashboardNotifications: { ...notifications, emailNotifications: v },
                })
              }
            />
          </div>
          <div className="setPg__notifyRow">
            <div>
              <h3>Booking Alerts</h3>
              <p>Get notified about new bookings</p>
            </div>
            <Toggle
              checked={notifications.bookingAlerts}
              onChange={(v) =>
                updateSettings({
                  dashboardNotifications: { ...notifications, bookingAlerts: v },
                })
              }
            />
          </div>
          <div className="setPg__notifyRow">
            <div>
              <h3>Payment Confirmations</h3>
              <p>Receive payment notifications</p>
            </div>
            <Toggle
              checked={notifications.paymentConfirmations}
              onChange={(v) =>
                updateSettings({
                  dashboardNotifications: { ...notifications, paymentConfirmations: v },
                })
              }
            />
          </div>
          <div className="setPg__notifyRow">
            <div>
              <h3>Member Updates</h3>
              <p>Updates about member activity</p>
            </div>
            <Toggle
              checked={notifications.memberUpdates}
              onChange={(v) =>
                updateSettings({
                  dashboardNotifications: { ...notifications, memberUpdates: v },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Regional Preferences</h2>
          <p>Set language, timezone, and currency format</p>
        </div>
        <form className="setPg__form setPg__form--three" onSubmit={saveLocale}>
          <label className="fu-label">Language</label>
          <label className="fu-label">Timezone</label>
          <label className="fu-label">Currency</label>

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
          <select
            className="fu-select"
            value={locale.currency}
            onChange={(e) => setLocale((prev) => ({ ...prev, currency: e.target.value }))}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AED">AED</option>
          </select>
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Save Regional Settings
          </button>
          {localeMsg ? <p className="setPg__msg">{localeMsg}</p> : null}
        </form>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Messaging Defaults</h2>
          <p>Control how your dashboard replies are sent</p>
        </div>
        <form className="setPg__form" onSubmit={saveMessaging}>
          <label className="fu-label">Default Reply Mode</label>
          <select
            className="fu-select"
            value={messaging.defaultReplyChannel}
            onChange={(e) =>
              setMessaging((prev) => ({ ...prev, defaultReplyChannel: e.target.value }))
            }
          >
            <option value="chat">Reply in chat</option>
            <option value="email">Reply on email</option>
          </select>

          <div className="setPg__toggleLine">
            <span className="fu-label">Show responder name in thread</span>
            <Toggle
              checked={messaging.showResponderName}
              onChange={(v) => setMessaging((prev) => ({ ...prev, showResponderName: v }))}
            />
          </div>

          <label className="fu-label">Email Signature</label>
          <textarea
            className="fu-textarea"
            rows={3}
            value={messaging.emailSignature}
            onChange={(e) => setMessaging((prev) => ({ ...prev, emailSignature: e.target.value }))}
          />

          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Save Messaging Defaults
          </button>
          {messagingMsg ? <p className="setPg__msg">{messagingMsg}</p> : null}
        </form>
      </section>

      <section className="fu-card setPg__card">
        <div className="setPg__head">
          <h2>Security</h2>
          <p>Manage your account security</p>
        </div>
        <form className="setPg__form" onSubmit={savePassword}>
          <label className="fu-label">Current Password</label>
          <input
            type="password"
            className="fu-input"
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
          />
          <label className="fu-label">New Password</label>
          <input
            type="password"
            className="fu-input"
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
          />
          <label className="fu-label">Confirm Password</label>
          <input
            type="password"
            className="fu-input"
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
          />
          <button type="submit" className="fu-btn fu-btn--primary setPg__saveBtn">
            Change Password
          </button>
          {pwMsg ? <p className="setPg__msg">{pwMsg}</p> : null}
        </form>
      </section>
    </div>
  );
}
