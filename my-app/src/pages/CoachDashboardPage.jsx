import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFitupAdmin } from '../components/FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import '../components/Ui.css';
import './CoachDashboardPage.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BOOKING_DAY_TO_JS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

function matchesCoach(booking, coachIdKey, coachNameKey) {
  const bid = String(booking.coachId || '').trim().toUpperCase();
  if (coachIdKey && bid && bid === coachIdKey) return true;
  const nm = String(booking.coach || '').trim().toLowerCase();
  return coachNameKey && nm === coachNameKey;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function bookingWeekdayJs(dayStr) {
  return BOOKING_DAY_TO_JS[dayStr] !== undefined ? BOOKING_DAY_TO_JS[dayStr] : null;
}

/** Each booking row = one recurring weekly slot; count calendar days in [start,end] that match that weekday. */
function countSessionsInRange(bookingList, rangeStart, rangeEnd) {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  let total = 0;
  for (const b of bookingList) {
    const wd = bookingWeekdayJs(b.day);
    if (wd === null) continue;
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getDay() === wd) total += 1;
      cur.setDate(cur.getDate() + 1);
    }
  }
  return total;
}

function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeekSunday(d) {
  const s = startOfWeekMonday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return e;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function addYears(d, n) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}

function periodBounds(period, anchor) {
  const a = startOfDay(anchor);
  if (period === 'day') {
    return { start: a, end: a, label: a.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) };
  }
  if (period === 'week') {
    const s = startOfWeekMonday(a);
    const e = endOfWeekSunday(a);
    return {
      start: s,
      end: e,
      label: `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }
  if (period === 'month') {
    const s = new Date(a.getFullYear(), a.getMonth(), 1);
    const e = new Date(a.getFullYear(), a.getMonth() + 1, 0);
    return {
      start: startOfDay(s),
      end: startOfDay(e),
      label: a.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    };
  }
  const s = new Date(a.getFullYear(), 0, 1);
  const e = new Date(a.getFullYear(), 11, 31);
  return {
    start: startOfDay(s),
    end: startOfDay(e),
    label: String(a.getFullYear()),
  };
}

function formatHourLabel(timeStr) {
  const t = String(timeStr || '').trim();
  if (!t) return '—';
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (!Number.isFinite(h)) return t;
  const d = new Date();
  d.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function CoachDashboardPage() {
  const { coachSession, bookings, gymClasses, users, partnerGyms } = useFitupAdmin();
  const [period, setPeriod] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());

  const coachIdKey = String(coachSession?.coachId || '').trim().toUpperCase();
  const coachNameKey = String(coachSession?.coachName || '').trim().toLowerCase();

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const myBookings = useMemo(
    () =>
      (bookings || []).filter((b) => matchesCoach(b, coachIdKey, coachNameKey)),
    [bookings, coachIdKey, coachNameKey]
  );

  const myClasses = useMemo(
    () =>
      (gymClasses || []).filter(
        (c) => String(c.coach || '').trim().toLowerCase() === coachNameKey
      ),
    [gymClasses, coachNameKey]
  );

  const assignedMembers = useMemo(
    () => coachScopedClients(users, coachSession, partnerGyms),
    [users, coachSession, partnerGyms]
  );

  const sampleProfile = assignedMembers[0]?.profile || {};
  const rating = Number(sampleProfile.coachRating) || null;
  const sessionsTarget = Number(sampleProfile.coachSessionsPerWeek) || 0;
  const specialty = String(sampleProfile.coachSpecialty || '').trim();

  const { start: rangeStart, end: rangeEnd, label: periodLabel } = useMemo(
    () => periodBounds(period, anchor),
    [period, anchor]
  );

  const sessionsInPeriod = useMemo(
    () => countSessionsInRange(myBookings, rangeStart, rangeEnd),
    [myBookings, rangeStart, rangeEnd]
  );

  const chartData = useMemo(() => {
    if (period === 'day') {
      const wd = anchor.getDay();
      const slots = myBookings.filter((b) => bookingWeekdayJs(b.day) === wd);
      const byTime = new Map();
      slots.forEach((b) => {
        const key = String(b.time || '—');
        byTime.set(key, (byTime.get(key) || 0) + 1);
      });
      return [...byTime.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, sessions]) => ({ label: formatHourLabel(time), sessions, _sort: time }));
    }
    if (period === 'week') {
      const tally = Object.fromEntries(DAYS.map((d) => [d, 0]));
      myBookings.forEach((b) => {
        if (tally[b.day] !== undefined) tally[b.day] += 1;
      });
      return DAYS.map((d) => ({ label: d, sessions: tally[d] }));
    }
    if (period === 'month') {
      const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
      const out = [];
      const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
      while (cur <= last) {
        const n = cur.getDate();
        const jsWd = cur.getDay();
        let sessions = 0;
        for (const b of myBookings) {
          if (bookingWeekdayJs(b.day) === jsWd) sessions += 1;
        }
        out.push({ label: String(n), sessions });
        cur.setDate(cur.getDate() + 1);
      }
      return out;
    }
    return MONTH_SHORT.map((name, monthIndex) => {
      const s = new Date(anchor.getFullYear(), monthIndex, 1);
      const e = new Date(anchor.getFullYear(), monthIndex + 1, 0);
      return {
        label: name,
        sessions: countSessionsInRange(myBookings, s, e),
      };
    });
  }, [period, myBookings, anchor, rangeStart, rangeEnd]);

  const chartTitle = useMemo(() => {
    if (period === 'day') return 'Sessions by time';
    if (period === 'week') return 'Sessions by weekday';
    if (period === 'month') return 'Sessions by calendar day';
    return 'Sessions by month';
  }, [period]);

  const chartSubtitle = useMemo(() => {
    if (period === 'day') return 'Recurring slots on this day of the week';
    if (period === 'week') return 'Recurring slots in a typical week';
    if (period === 'month') return 'Count per date (recurring weekly pattern)';
    return 'Total session occurrences per month';
  }, [period]);

  const upcoming = useMemo(() => {
    const dayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    if (period === 'day') {
      const wd = anchor.getDay();
      return [...myBookings]
        .filter((b) => bookingWeekdayJs(b.day) === wd)
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
        .slice(0, 12);
    }
    return [...myBookings]
      .sort((a, b) => {
        const da = dayOrder[a.day] || 99;
        const db = dayOrder[b.day] || 99;
        if (da !== db) return da - db;
        return String(a.time || '').localeCompare(String(b.time || ''));
      })
      .slice(0, 12);
  }, [myBookings, period, anchor]);

  const stepPrev = () => {
    if (period === 'day') setAnchor((d) => addDays(d, -1));
    else if (period === 'week') setAnchor((d) => addDays(d, -7));
    else if (period === 'month') setAnchor((d) => addMonths(d, -1));
    else setAnchor((d) => addYears(d, -1));
  };

  const stepNext = () => {
    if (period === 'day') setAnchor((d) => addDays(d, 1));
    else if (period === 'week') setAnchor((d) => addDays(d, 7));
    else if (period === 'month') setAnchor((d) => addMonths(d, 1));
    else setAnchor((d) => addYears(d, 1));
  };

  const goToday = () => setAnchor(new Date());

  const classSpots = useMemo(() => {
    return myClasses.slice(0, 5).map((c) => ({
      name: c.name,
      schedule: c.schedule,
      enrolled: c.enrolled,
      capacity: c.capacity,
      room: c.room,
    }));
  }, [myClasses]);

  const periodKpiSub =
    period === 'day'
      ? 'Session occurrences on this date'
      : period === 'week'
        ? 'Session occurrences this week'
        : period === 'month'
          ? 'Session occurrences this month'
          : 'Session occurrences this year';

  return (
    <div className="coachDash">
      <header className="fu-pageHeader coachDash__header">
        <div>
          <h1>Overview</h1>
          <p>
            Welcome back, {coachSession?.coachName || 'Coach'}. Here is your schedule load for{' '}
            {branch?.brandName || 'your branch'}.
          </p>
        </div>
      </header>

      <div className="coachDash__periodBar fu-card">
        <div className="coachDash__periodTabs" role="tablist" aria-label="Overview period">
          {[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'year', label: 'Year' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={period === t.id}
              className={`coachDash__periodTab ${period === t.id ? 'coachDash__periodTab--active' : ''}`}
              onClick={() => setPeriod(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="coachDash__periodNav">
          <button type="button" className="fu-btn fu-btn--ghost coachDash__navBtn" onClick={stepPrev} aria-label="Previous period">
            ‹
          </button>
          <div className="coachDash__periodLabel">
            <span className="coachDash__periodLabelMain">{periodLabel}</span>
            <button type="button" className="coachDash__todayLink" onClick={goToday}>
              Today
            </button>
          </div>
          <button type="button" className="fu-btn fu-btn--ghost coachDash__navBtn" onClick={stepNext} aria-label="Next period">
            ›
          </button>
        </div>
      </div>

      <section className="coachDash__profile fu-card">
        <div className="coachDash__profileMain">
          <h2>Your coach profile</h2>
          <p className="coachDash__muted">
            {specialty ? `${specialty} · ` : ''}
            {coachSession?.coachEmail || 'Work email on file'}
            {coachSession?.coachId ? ` · ID ${coachSession.coachId}` : ''}
          </p>
        </div>
        <div className="coachDash__profileStats">
          {rating != null && rating > 0 ? (
            <div>
              <span className="coachDash__statLabel">Rating</span>
              <span className="coachDash__statValue">{rating.toFixed(1)}</span>
            </div>
          ) : null}
          {sessionsTarget > 0 ? (
            <div>
              <span className="coachDash__statLabel">Sessions / week (target)</span>
              <span className="coachDash__statValue">{sessionsTarget}</span>
            </div>
          ) : null}
          <div>
            <span className="coachDash__statLabel">Sessions (selected range)</span>
            <span className="coachDash__statValue">{sessionsInPeriod}</span>
          </div>
        </div>
      </section>

      <section className="coachDash__kpis">
        <article className="fu-card coachDash__kpi">
          <p className="fu-cardTitle">Your bookings</p>
          <p className="fu-cardValue">{sessionsInPeriod}</p>
          <p className="coachDash__kpiSub">{periodKpiSub}</p>
          <p className="coachDash__kpiHint">{myBookings.length} recurring weekly slot{myBookings.length === 1 ? '' : 's'} total</p>
        </article>
        <article className="fu-card coachDash__kpi">
          <p className="fu-cardTitle">Your classes</p>
          <p className="fu-cardValue">{myClasses.length}</p>
          <p className="coachDash__kpiSub">On the timetable</p>
        </article>
        <article className="fu-card coachDash__kpi">
          <p className="fu-cardTitle">Your clients</p>
          <p className="fu-cardValue">{assignedMembers.length}</p>
          <p className="coachDash__kpiSub">Linked to you in member records</p>
        </article>
        <article className="fu-card coachDash__kpi">
          <p className="fu-cardTitle">Branch</p>
          <p className="coachDash__kpiBranch">{branch?.brandName || '—'}</p>
          <p className="coachDash__kpiSub">{branch?.branchAddress || 'Address on file'}</p>
        </article>
      </section>

      <div className="coachDash__grid">
        <article className="fu-card coachDash__chartCard">
          <h2>{chartTitle}</h2>
          <p className="coachDash__muted">{chartSubtitle}</p>
          <div className="coachDash__chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  bottom: period === 'month' ? 36 : 8,
                  left: period === 'month' ? 4 : 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
                <XAxis
                  dataKey="label"
                  stroke="#8b93a7"
                  tick={{ fontSize: period === 'month' ? 9 : 11 }}
                  interval={period === 'month' ? 'preserveStartEnd' : 0}
                  angle={period === 'month' ? -35 : 0}
                  textAnchor={period === 'month' ? 'end' : 'middle'}
                  height={period === 'month' ? 48 : 30}
                />
                <YAxis allowDecimals={false} stroke="#8b93a7" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#12151c',
                    border: '1px solid #232836',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="sessions" fill="#f9684b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="fu-card coachDash__listCard">
          <h2>{period === 'day' ? 'Sessions this day' : 'Your slots'}</h2>
          <ul className="coachDash__sessionList">
            {upcoming.map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.title}</strong>
                  <span className="coachDash__pill">{b.type}</span>
                </div>
                <div className="coachDash__sessionMeta">
                  {b.day} · {b.time}
                </div>
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="coachDash__empty">No sessions match your coach profile yet.</li>
            ) : null}
          </ul>
        </article>
      </div>

      <article className="fu-card coachDash__tableCard">
        <h2>Your classes (capacity)</h2>
        <table className="coachDash__table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Schedule</th>
              <th>Room</th>
              <th>Enrollment</th>
            </tr>
          </thead>
          <tbody>
            {classSpots.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.schedule}</td>
                <td>{row.room}</td>
                <td>
                  {row.enrolled}/{row.capacity}
                </td>
              </tr>
            ))}
            {classSpots.length === 0 ? (
              <tr>
                <td colSpan="4" className="coachDash__empty">
                  No classes assigned to you on the schedule.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>
    </div>
  );
}
