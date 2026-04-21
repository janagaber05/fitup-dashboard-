import { Fragment, useMemo, useState } from 'react';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './CoachSchedulePage.css';

function matchesCoach(booking, coachIdKey, coachNameKey) {
  const bid = String(booking.coachId || '').trim().toUpperCase();
  if (coachIdKey && bid && bid === coachIdKey) return true;
  const nm = String(booking.coach || '').trim().toLowerCase();
  return coachNameKey && nm === coachNameKey;
}

function normMemberName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildMemberIndexes(users) {
  const byFitup = new Map();
  const byName = new Map();
  (users || []).forEach((u) => {
    const fid = String(u.fitupUserId || '').trim().toUpperCase();
    if (fid) byFitup.set(fid, u);
    const nk = normMemberName(u.name);
    if (nk && !byName.has(nk)) byName.set(nk, u);
  });
  return { byFitup, byName };
}

/** Resolve CRM user from roster row or booking (memberUserId / title name). */
function resolveClient(booking, rosterMember, indexes) {
  const { byFitup, byName } = indexes;
  const idRaw = rosterMember
    ? String(rosterMember.id || '').trim().toUpperCase()
    : String(booking.memberUserId || booking.clientId || booking.memberId || '').trim().toUpperCase();
  if (idRaw && byFitup.has(idRaw)) return byFitup.get(idRaw);
  const nameKey = normMemberName(
    rosterMember?.name ||
      (booking.type === 'private' || booking.type === 'ems' ? booking.title : '')
  );
  if (nameKey && byName.has(nameKey)) return byName.get(nameKey);
  return null;
}

function ClientProfileCard({ user, sessionLabel }) {
  if (!user) {
    return (
      <div className="coachSch__clientCard coachSch__clientCard--missing">
        <p className="coachSch__clientMissingTitle">No member profile linked</p>
        {sessionLabel ? <p className="coachSch__mutedSmall">Session: {sessionLabel}</p> : null}
        <p className="coachSch__mutedSmall">
          Add a Member ID on the booking, or ensure the client name matches a member in the system.
        </p>
      </div>
    );
  }
  const p = user.profile || {};

  return (
    <article className="coachSch__clientCard">
      <header className="coachSch__clientCardHead">
        <div>
          <span className="coachSch__detailLabel">Client ID (FITUP)</span>
          <span className="coachSch__detailValue coachSch__mono">{user.fitupUserId || '—'}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">Account record</span>
          <span className="coachSch__detailValue coachSch__mono">{user.id}</span>
        </div>
      </header>
      <div className="coachSch__clientGrid">
        <div>
          <span className="coachSch__detailLabel">Name</span>
          <span className="coachSch__detailValue">{user.name}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">Email</span>
          <span className="coachSch__detailValue">{user.email || '—'}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">Phone</span>
          <span className="coachSch__detailValue">{p.phone || '—'}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">City</span>
          <span className="coachSch__detailValue">{p.city || '—'}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">Status</span>
          <span className="coachSch__detailValue">{user.status || '—'}</span>
        </div>
        <div>
          <span className="coachSch__detailLabel">Joined from</span>
          <span className="coachSch__detailValue">{p.joinedFrom || '—'}</span>
        </div>
      </div>
    </article>
  );
}

export default function CoachSchedulePage() {
  const { coachSession, bookings, partnerGyms, users } = useFitupAdmin();
  const [expandedId, setExpandedId] = useState(null);
  const coachIdKey = String(coachSession?.coachId || '').trim().toUpperCase();
  const coachNameKey = String(coachSession?.coachName || '').trim().toLowerCase();

  const memberIndexes = useMemo(() => buildMemberIndexes(users), [users]);

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const rows = useMemo(() => {
    const list = (bookings || []).filter((b) =>
      matchesCoach(b, coachIdKey, coachNameKey)
    );
    const order = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return [...list].sort((a, b) => {
      const da = order[a.day] || 99;
      const db = order[b.day] || 99;
      if (da !== db) return da - db;
      return String(a.time || '').localeCompare(String(b.time || ''));
    });
  }, [bookings, coachIdKey, coachNameKey]);

  const toggle = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="coachSch">
      <header className="fu-pageHeader">
        <div>
          <h1>My schedule</h1>
          <p>
            All bookings where you are listed as the coach ({rows.length} total).
            {branch?.brandName ? ` · ${branch.brandName}` : ''}
          </p>
        </div>
      </header>

      <div className="fu-card coachSch__card">
        <table className="coachSch__table">
          <thead>
            <tr>
              <th className="coachSch__thToggle" aria-hidden />
              <th>Day</th>
              <th>Time</th>
              <th>Session</th>
              <th>Type</th>
              <th>Fill</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const open = expandedId === b.id;
              const enrolled = Array.isArray(b.classEnrolled) ? b.classEnrolled : [];
              const slotClient =
                b.type === 'private' || b.type === 'ems'
                  ? resolveClient(b, null, memberIndexes)
                  : null;

              return (
                <Fragment key={b.id}>
                  <tr className={`coachSch__row ${open ? 'coachSch__row--open' : ''}`}>
                    <td className="coachSch__toggleCell">
                      <button
                        type="button"
                        className="coachSch__toggle"
                        onClick={() => toggle(b.id)}
                        aria-expanded={open}
                        aria-label={open ? 'Hide details' : 'Show details'}
                      >
                        <span className="coachSch__chevron" aria-hidden>
                          {open ? '▼' : '▶'}
                        </span>
                      </button>
                    </td>
                    <td>{b.day}</td>
                    <td>{b.time}</td>
                    <td className="coachSch__sessionTitle">{b.title}</td>
                    <td>
                      <span className="coachSch__type">{b.type}</span>
                    </td>
                    <td>
                      {b.type === 'class'
                        ? `${b.classBooked ?? enrolled.length ?? '—'}/${b.classCapacity ?? '—'}`
                        : slotClient?.fitupUserId ? (
                          <span className="coachSch__mono">{slotClient.fitupUserId}</span>
                        ) : (
                          '—'
                        )}
                    </td>
                  </tr>
                  {open ? (
                    <tr className="coachSch__detailRow">
                      <td colSpan="6">
                        <div className="coachSch__detail">
                          <div className="coachSch__detailGrid">
                            <div>
                              <span className="coachSch__detailLabel">Booking ID</span>
                              <span className="coachSch__detailValue">{b.id}</span>
                            </div>
                            <div>
                              <span className="coachSch__detailLabel">Coach ID</span>
                              <span className="coachSch__detailValue">{b.coachId || '—'}</span>
                            </div>
                            <div>
                              <span className="coachSch__detailLabel">Coach</span>
                              <span className="coachSch__detailValue">{b.coach || '—'}</span>
                            </div>
                            <div>
                              <span className="coachSch__detailLabel">Slot</span>
                              <span className="coachSch__detailValue">
                                {b.day} · {b.time}
                              </span>
                            </div>
                            {(b.type === 'private' || b.type === 'ems') &&
                            String(b.memberUserId || '').trim() ? (
                              <div>
                                <span className="coachSch__detailLabel">Member ID (on booking)</span>
                                <span className="coachSch__detailValue coachSch__mono">
                                  {String(b.memberUserId).trim().toUpperCase()}
                                </span>
                              </div>
                            ) : null}
                            {b.type === 'class' ? (
                              <>
                                <div>
                                  <span className="coachSch__detailLabel">Capacity</span>
                                  <span className="coachSch__detailValue">
                                    {b.classBooked ?? enrolled.length ?? 0} booked ·{' '}
                                    {b.classCapacity ?? '—'} max
                                  </span>
                                </div>
                              </>
                            ) : null}
                            {b.type === 'private' ? (
                              <div className="coachSch__detailSpan2">
                                <span className="coachSch__detailLabel">Client (session title)</span>
                                <span className="coachSch__detailValue">{b.title}</span>
                              </div>
                            ) : null}
                            {b.type === 'ems' ? (
                              <div className="coachSch__detailSpan2">
                                <span className="coachSch__detailLabel">Session</span>
                                <span className="coachSch__detailValue">{b.title}</span>
                              </div>
                            ) : null}
                            {String(b.coachBookingNote || '').trim() ? (
                              <div className="coachSch__detailSpan2">
                                <span className="coachSch__detailLabel">Coach note</span>
                                <span className="coachSch__detailValue">{b.coachBookingNote}</span>
                              </div>
                            ) : null}
                            {b.createdAt ? (
                              <div>
                                <span className="coachSch__detailLabel">Logged</span>
                                <span className="coachSch__detailValue">
                                  {new Date(b.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {b.type === 'private' ? (
                            <div className="coachSch__clientSection">
                              <h3 className="coachSch__rosterTitle">Client profile</h3>
                              <ClientProfileCard user={slotClient} sessionLabel={b.title} />
                            </div>
                          ) : null}

                          {b.type === 'class' && enrolled.length > 0 ? (
                            <div className="coachSch__roster">
                              <h3 className="coachSch__rosterTitle">Enrolled members</h3>
                              <table className="coachSch__rosterTable">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Client ID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {enrolled.map((m) => {
                                    const u = resolveClient(b, m, memberIndexes);
                                    return (
                                      <tr key={m.id || m.name}>
                                        <td>{m.name}</td>
                                        <td className="coachSch__mono">
                                          {u?.fitupUserId || String(m.id || '').trim() || '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : null}

                          {b.type === 'class' && enrolled.length === 0 ? (
                            <p className="coachSch__rosterEmpty">
                              No roster entries yet — counts may come from classBooked only.
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="coachSch__empty">
                  No bookings found for your coach ID or name.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
