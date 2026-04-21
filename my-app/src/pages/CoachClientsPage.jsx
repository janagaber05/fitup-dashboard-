import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import '../components/Ui.css';
import './CoachClientsPage.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function normMemberName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function bookingInvolvesMember(booking, fitupId, nameNorm) {
  const fid = String(fitupId || '').trim().toUpperCase();
  if (!fid && !nameNorm) return false;
  if (booking.type === 'private' || booking.type === 'ems') {
    const mid = String(booking.memberUserId || '').trim().toUpperCase();
    if (fid && mid && mid === fid) return true;
    if (nameNorm && normMemberName(booking.title) === nameNorm) return true;
    return false;
  }
  const en = Array.isArray(booking.classEnrolled) ? booking.classEnrolled : [];
  return en.some((m) => String(m.id || '').trim().toUpperCase() === fid);
}

function matchesCoachBooking(booking, coachIdKey, coachNameKey) {
  const bid = String(booking.coachId || '').trim().toUpperCase();
  if (coachIdKey && bid && bid === coachIdKey) return true;
  const nm = String(booking.coach || '').trim().toLowerCase();
  return coachNameKey && nm === coachNameKey;
}

function parseMs(iso) {
  const t = Date.parse(String(iso || ''));
  return Number.isFinite(t) ? t : 0;
}

function formatWhen(ms, fallbackLabel) {
  if (!ms) return fallbackLabel || '—';
  try {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return fallbackLabel || '—';
  }
}

function buildHistoryTimeline({
  client,
  bookings,
  facilityBookingRequests,
  messages,
  coachSession,
  partnerGyms,
}) {
  const fitupId = String(client.fitupUserId || '').trim().toUpperCase();
  const nameNorm = normMemberName(client.name);
  const coachIdKey = String(coachSession?.coachId || '').trim().toUpperCase();
  const coachNameKey = String(coachSession?.coachName || '').trim().toLowerCase();
  const branchId = String(coachSession?.partnerGymId || '').trim();

  const items = [];

  (bookings || []).forEach((b) => {
    if (!bookingInvolvesMember(b, fitupId, nameNorm)) return;
    const withYou = matchesCoachBooking(b, coachIdKey, coachNameKey);
    const whenMs = parseMs(b.createdAt);
    const slotBit = `${b.day} · ${b.time} · ${b.type}`;
    const coachBit = withYou ? '' : ` · Coach: ${b.coach || '—'}`;
    const noteBit = String(b.coachBookingNote || '').trim()
      ? ` · Note: ${String(b.coachBookingNote).trim()}`
      : '';
    items.push({
      id: `bk-${b.id}`,
      kind: 'session',
      sortMs: whenMs,
      title: withYou ? `Session · ${b.title}` : `Session · ${b.title} (other coach)`,
      detail: `${slotBit}${coachBit}${noteBit}`,
      badge: withYou ? 'With you' : 'Branch',
    });
  });

  (facilityBookingRequests || []).forEach((r) => {
    const mid = String(r.memberUserId || '').trim().toUpperCase();
    if (!fitupId || mid !== fitupId) return;
    if (branchId && String(r.branchId || '').trim() !== branchId) return;
    const slot = String(r.requestedSlot || '').trim();
    items.push({
      id: `fbr-${r.id}`,
      kind: 'facility',
      sortMs: parseMs(r.createdAt),
      title: 'Facility booking request',
      detail: `${r.status || '—'}${slot ? ` · ${slot}` : ''}${r.note ? ` · ${r.note}` : ''}`,
      badge: 'Facility',
    });
  });

  const internalId = String(client.id || '').trim();
  (messages || []).forEach((m) => {
    if (String(m.userId || '').trim() !== internalId) return;
    items.push({
      id: `msg-${m.id}`,
      kind: 'message',
      sortMs: parseMs(m.createdAt),
      title: 'Message to gym',
      detail: String(m.message || '').slice(0, 220) + (String(m.message || '').length > 220 ? '…' : ''),
      badge: 'Message',
    });
  });

  const p = client.profile || {};
  (Array.isArray(p.memberActionHistory) ? p.memberActionHistory : []).forEach((h) => {
    const t = String(h.type || 'update').replace(/_/g, ' ');
    const isProg = String(h.type || '') === 'programs_updated';
    items.push({
      id: `act-${h.id || Math.random()}`,
      kind: isProg ? 'session' : 'account',
      sortMs: parseMs(h.at),
      title: isProg ? `Programs · ${t}` : `Account · ${t}`,
      detail: String(h.note || '').trim() || '—',
      badge: isProg ? 'Programs' : 'Account',
    });
  });

  (Array.isArray(p.memberComplaints) ? p.memberComplaints : []).forEach((c, i) => {
    items.push({
      id: `cmp-${c.id || i}`,
      kind: 'account',
      sortMs: parseMs(c.at || c.createdAt),
      title: `Complaint (${String(c.status || 'open')})`,
      detail: String(c.text || c.note || '').trim() || '—',
      badge: 'Note',
    });
  });

  (Array.isArray(p.memberHistory) ? p.memberHistory : []).forEach((h, i) => {
    const gymBit = [h.gymName, h.gymId].filter(Boolean).join(' · ');
    const noteBit = String(h.note || '').trim();
    items.push({
      id: `mh-${h.id || i}`,
      kind: 'account',
      sortMs: parseMs(h.at || h.date),
      title: String(h.type || h.title || 'Member history'),
      detail: [gymBit, noteBit].filter(Boolean).join(' · ') || '—',
      badge: 'History',
    });
  });

  items.sort((a, b) => {
    if (b.sortMs !== a.sortMs) return b.sortMs - a.sortMs;
    return String(a.id).localeCompare(String(b.id));
  });

  return items;
}

export default function CoachClientsPage() {
  const {
    coachSession,
    users,
    bookings,
    facilityBookingRequests,
    messages,
    partnerGyms,
    setBookings,
    syncCoachSessionsPerWeek,
  } = useFitupAdmin();
  const [query, setQuery] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [bookForm, setBookForm] = useState({
    day: 'Mon',
    time: '09:00',
    sessionType: 'private',
    note: '',
  });
  const [bookSuccess, setBookSuccess] = useState(null);
  const [bookError, setBookError] = useState(null);

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const myClients = useMemo(
    () => coachScopedClients(users, coachSession, partnerGyms),
    [users, coachSession, partnerGyms]
  );

  const client = useMemo(() => {
    const q = String(submittedId || '').trim().toUpperCase();
    if (!q) return null;
    return myClients.find((m) => String(m.fitupUserId || '').trim().toUpperCase() === q) || null;
  }, [myClients, submittedId]);

  const submittedNorm = String(submittedId || '').trim();
  const notFound = submittedNorm !== '' && !client;

  const timeline = useMemo(() => {
    if (!client) return [];
    return buildHistoryTimeline({
      client,
      bookings,
      facilityBookingRequests,
      messages,
      coachSession,
      partnerGyms,
    });
  }, [client, bookings, facilityBookingRequests, messages, coachSession, partnerGyms]);

  useEffect(() => {
    const counts = {};
    (bookings || []).forEach((b) => {
      const idKey = String(b.coachId || '').trim().toLowerCase();
      const nameKey = String(b.coach || '').trim().toLowerCase();
      if (idKey) counts[idKey] = (counts[idKey] || 0) + 1;
      if (nameKey) counts[nameKey] = (counts[nameKey] || 0) + 1;
    });
    syncCoachSessionsPerWeek(counts);
  }, [bookings, syncCoachSessionsPerWeek]);

  const submitLookup = (e) => {
    e?.preventDefault?.();
    setBookSuccess(null);
    setBookError(null);
    setSubmittedId(String(query || '').trim().toUpperCase());
  };

  const pickMember = (fitupUserId) => {
    const id = String(fitupUserId || '').trim().toUpperCase();
    setQuery(id);
    setSubmittedId(id);
    setBookSuccess(null);
    setBookError(null);
  };

  const submitBookSession = (e) => {
    e.preventDefault();
    setBookSuccess(null);
    setBookError(null);
    if (!client) return;
    const coachName = String(coachSession?.coachName || '').trim();
    const coachId = String(coachSession?.coachId || '').trim();
    if (!coachName || !coachId) {
      setBookError('Your coach session is missing. Sign in again.');
      return;
    }
    const fitup = String(client.fitupUserId || '').trim().toUpperCase();
    if (!fitup) {
      setBookError('This member has no Client ID.');
      return;
    }
    const type = bookForm.sessionType === 'ems' ? 'ems' : 'private';
    const title =
      type === 'ems' ? `EMS: ${client.name}` : String(client.name || '').trim() || 'Private session';
    const note = String(bookForm.note || '').trim();
    const createdAt = new Date().toISOString();
    const id = `b-coach-${Date.now()}`;
    const row = {
      id,
      day: bookForm.day,
      time: bookForm.time,
      title,
      coach: coachName,
      coachId,
      type,
      memberUserId: fitup,
      createdAt,
      bookedByCoach: true,
      ...(note ? { coachBookingNote: note } : {}),
    };
    setBookings((prev) => [...(prev || []), row]);
    setBookSuccess(`Session booked for ${client.name} — ${bookForm.day} ${bookForm.time} (${type}). It appears in My schedule and the gym Bookings page.`);
    setBookForm((p) => ({ ...p, note: '' }));
  };

  const p = client?.profile || {};

  return (
    <div className="coachCli">
      <header className="fu-pageHeader">
        <div>
          <h1>Clients</h1>
          <p>
            Look up a client by Client ID (FITUP). Only members assigned to you at{' '}
            {branch?.brandName || 'this branch'} appear here.
          </p>
        </div>
      </header>

      <section className="fu-card coachCli__searchCard">
        <form className="coachCli__form" onSubmit={submitLookup}>
          <label className="fu-label" htmlFor="coach-client-id">
            Client ID
          </label>
          <div className="coachCli__fieldRow">
            <input
              id="coach-client-id"
              className="fu-input coachCli__input"
              placeholder="e.g. FTU-0008"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="fu-btn fu-btn--primary">
              Look up
            </button>
          </div>
          {notFound ? (
            <p className="coachCli__warn">
              No client with that Client ID is assigned to you at this branch. Check the ID or confirm
              assignment on their profile.
            </p>
          ) : null}
        </form>

        {myClients.length > 0 ? (
          <div className="coachCli__quick">
            <span className="coachCli__quickLabel">Quick pick</span>
            <div className="coachCli__chips">
              {myClients.slice(0, 12).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`coachCli__chip ${submittedId === String(m.fitupUserId || '').toUpperCase() ? 'coachCli__chip--active' : ''}`}
                  onClick={() => pickMember(m.fitupUserId)}
                >
                  <span className="coachCli__chipId">{m.fitupUserId}</span>
                  <span className="coachCli__chipName">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {client ? (
        <>
          <section className="coachCli__grid">
            <article className="fu-card coachCli__profile">
              <h2>Profile</h2>
              <div className="coachCli__profileHead">
                <div>
                  <span className="coachCli__metaLabel">Client ID</span>
                  <span className="coachCli__metaValue coachCli__mono">{client.fitupUserId}</span>
                </div>
                <div>
                  <span className="coachCli__metaLabel">Record</span>
                  <span className="coachCli__metaValue coachCli__mono">{client.id}</span>
                </div>
              </div>
              <dl className="coachCli__dl">
                <div>
                  <dt>Name</dt>
                  <dd>{client.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{client.email || '—'}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{p.phone || '—'}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{p.city || '—'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{client.status || '—'}</dd>
                </div>
                <div>
                  <dt>Assigned coach</dt>
                  <dd>{p.coachName || '—'}</dd>
                </div>
                <div>
                  <dt>Joined from</dt>
                  <dd>{p.joinedFrom || '—'}</dd>
                </div>
                <div>
                  <dt>Member since</dt>
                  <dd>{client.createdAt ? formatWhen(parseMs(client.createdAt), client.createdAt) : '—'}</dd>
                </div>
                <div>
                  <dt>Last site visit</dt>
                  <dd>
                    {client.lastSiteVisitAt
                      ? formatWhen(parseMs(client.lastSiteVisitAt), client.lastSiteVisitAt)
                      : '—'}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="fu-card coachCli__coachNote">
              <h2>Your link</h2>
              <p className="coachCli__muted">
                You are signed in as <strong>{coachSession?.coachName}</strong> ({coachSession?.coachId}
                ). Session rows tagged <span className="coachCli__tag coachCli__tag--you">With you</span>{' '}
                are bookings where you are the listed coach.
              </p>
            </article>
          </section>

          <section className="fu-card coachCli__programs">
            <div className="coachCli__programsHead">
              <h2>Training & nutrition</h2>
              {p.programsNeedReview ? (
                <span className="coachCli__programsFlag">Needs review</span>
              ) : null}
            </div>
            <p className="coachCli__muted coachCli__programsHint">
              Same data as the <strong>Training & nutrition</strong> page — updates sync automatically.
            </p>
            <dl className="coachCli__programsDl">
              <div>
                <dt>Training routine</dt>
                <dd>
                  {String(p.trainingRoutine || '').trim()
                    ? String(p.trainingRoutine).trim().slice(0, 280) +
                      (String(p.trainingRoutine).length > 280 ? '…' : '')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Nutrition program</dt>
                <dd>
                  {String(p.nutritionProgram || '').trim()
                    ? String(p.nutritionProgram).trim().slice(0, 280) +
                      (String(p.nutritionProgram).length > 280 ? '…' : '')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Programs last updated</dt>
                <dd>
                  {p.programsUpdatedAt
                    ? formatWhen(parseMs(p.programsUpdatedAt), p.programsUpdatedAt)
                    : '—'}
                  {p.programsUpdatedByCoachName ? ` · ${p.programsUpdatedByCoachName}` : ''}
                </dd>
              </div>
            </dl>
            <Link
              className="fu-btn fu-btn--primary coachCli__programsLink"
              to={`/coach/programs?member=${encodeURIComponent(client.id)}`}
            >
              Edit training & nutrition
            </Link>
          </section>

          <section className="fu-card coachCli__book">
            <h2>Book a session</h2>
            <p className="coachCli__muted coachCli__bookSub">
              Adds a <strong>private</strong> or <strong>EMS</strong> slot with you as coach. It is saved to the
              same schedule used on <strong>My schedule</strong> and the admin <strong>Bookings</strong> page.
            </p>
            {bookSuccess ? <p className="coachCli__bookOk">{bookSuccess}</p> : null}
            {bookError ? <p className="coachCli__bookErr">{bookError}</p> : null}
            <form className="coachCli__bookForm" onSubmit={submitBookSession}>
              <div className="coachCli__bookRow">
                <div className="coachCli__bookField">
                  <label className="fu-label" htmlFor="coach-cli-day">
                    Day
                  </label>
                  <select
                    id="coach-cli-day"
                    className="fu-input"
                    value={bookForm.day}
                    onChange={(e) => setBookForm((p) => ({ ...p, day: e.target.value }))}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="coachCli__bookField">
                  <label className="fu-label" htmlFor="coach-cli-time">
                    Time
                  </label>
                  <select
                    id="coach-cli-time"
                    className="fu-input"
                    value={bookForm.time}
                    onChange={(e) => setBookForm((p) => ({ ...p, time: e.target.value }))}
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="coachCli__bookField">
                  <label className="fu-label" htmlFor="coach-cli-type">
                    Session type
                  </label>
                  <select
                    id="coach-cli-type"
                    className="fu-input"
                    value={bookForm.sessionType}
                    onChange={(e) => setBookForm((p) => ({ ...p, sessionType: e.target.value }))}
                  >
                    <option value="private">Private (1:1)</option>
                    <option value="ems">EMS</option>
                  </select>
                </div>
              </div>
              <label className="fu-label" htmlFor="coach-cli-note">
                Note (optional)
              </label>
              <input
                id="coach-cli-note"
                className="fu-input coachCli__bookNote"
                placeholder="e.g. Focus on mobility, first session"
                value={bookForm.note}
                onChange={(e) => setBookForm((p) => ({ ...p, note: e.target.value }))}
              />
              <div className="coachCli__bookActions">
                <button type="submit" className="fu-btn fu-btn--primary">
                  Add to bookings
                </button>
              </div>
            </form>
          </section>

          <section className="fu-card coachCli__history">
            <h2>History & activity</h2>
            <p className="coachCli__muted coachCli__historySub">
              Pulled from branch bookings, facility requests, messages, and the member record.
            </p>
            {timeline.length === 0 ? (
              <p className="coachCli__empty">No history entries yet for this client.</p>
            ) : (
              <ul className="coachCli__timeline">
                {timeline.map((ev) => (
                  <li key={ev.id} className="coachCli__timelineItem">
                    <div className="coachCli__timelineHead">
                      <span className={`coachCli__tag coachCli__tag--${ev.kind}`}>{ev.badge}</span>
                      <time className="coachCli__time">
                        {formatWhen(ev.sortMs, ev.sortMs ? null : 'Recurring / no date')}
                      </time>
                    </div>
                    <p className="coachCli__timelineTitle">{ev.title}</p>
                    <p className="coachCli__timelineDetail">{ev.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
