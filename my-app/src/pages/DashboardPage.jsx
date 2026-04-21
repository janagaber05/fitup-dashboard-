import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import './DashboardPage.css';

function formatNum(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export default function DashboardPage() {
  const {
    kpi,
    analytics,
  } = useFitupAdmin();

  const bookingsSeries = analytics.trafficSeries.map((r, i) => ({
    day: `Mar ${i * 2 + 1}`,
    value: Math.max(25, Math.round((r.views || 0) / 22)),
  }));

  const activity = useMemo(
    () => [
      { type: 'join', title: 'New gym onboarded', meta: 'Profile setup started', when: '5 min ago' },
      { type: 'booking', title: 'Partnership request updated', meta: 'Status moved to review', when: '12 min ago' },
      { type: 'payment', title: 'Payment posted', meta: 'Monthly platform invoice paid', when: '22 min ago' },
      { type: 'class', title: 'Branch profile refreshed', meta: 'Downtown branch details updated', when: '35 min ago' },
      { type: 'cancel', title: 'Restriction added', meta: 'Awaiting compliance documents', when: '1 hour ago' },
      { type: 'join', title: 'New support note', meta: 'Gym manager follow-up created', when: '2 hours ago' },
    ],
    []
  );

  const [upcomingClasses, setUpcomingClasses] = useState([
    { id: 'c1', name: 'Onboarding pipeline', coach: 'Partnerships Team', time: 'Today', capacity: 15, booked: 12 },
    { id: 'c2', name: 'Contract approvals', coach: 'Legal Ops', time: 'Today', capacity: 18, booked: 18 },
    { id: 'c3', name: 'Gym profile checks', coach: 'Success Team', time: 'Today', capacity: 12, booked: 10 },
    { id: 'c4', name: 'Billing follow-ups', coach: 'Finance Team', time: 'Today', capacity: 20, booked: 15 },
  ]);
  const [editingClassId, setEditingClassId] = useState(null);
  const [classForm, setClassForm] = useState({
    name: '',
    coach: '',
    time: '',
    capacity: 0,
    booked: 0,
  });

  const todaySchedule = [
    { time: '08:00', title: 'Partnership approvals', coach: 'Partnerships Team' },
    { time: '09:00', title: 'Gym profile audits', coach: 'Success Team' },
    { time: '10:00', title: 'Payments reconciliation', coach: 'Finance Team' },
    { time: '11:00', title: 'Contract review queue', coach: 'Legal Ops' },
    { time: '14:00', title: 'Support escalation review', coach: 'Operations' },
  ];
  const editingClass = upcomingClasses.find((c) => c.id === editingClassId) || null;

  const statusForClass = (row) => {
    if ((row.booked || 0) >= (row.capacity || 0)) return 'Full';
    if ((row.booked || 0) / Math.max(row.capacity || 1, 1) >= 0.8) return 'Almost full';
    return 'Open';
  };

  const openEditClass = (row) => {
    setEditingClassId(row.id);
    setClassForm({
      name: row.name,
      coach: row.coach,
      time: row.time,
      capacity: row.capacity,
      booked: row.booked,
    });
  };

  const saveClass = (e) => {
    e.preventDefault();
    setUpcomingClasses((prev) =>
      prev.map((c) =>
        c.id === editingClassId
          ? {
              ...c,
              name: String(classForm.name || '').trim(),
              coach: String(classForm.coach || '').trim(),
              time: String(classForm.time || '').trim(),
              capacity: Number(classForm.capacity) || 0,
              booked: Number(classForm.booked) || 0,
            }
          : c
      )
    );
    setEditingClassId(null);
  };

  return (
    <div className="dash">
      <header className="fu-pageHeader">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Monitor FITUP platform performance and operational health.</p>
        </div>
      </header>

      <section className="dash__kpis">
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Partner gyms</p>
          <p className="fu-cardValue">{kpi.partnerGymsTotal}</p>
          <p className="dash__kpiSub dash__kpiSub--up">+12.5% vs yesterday</p>
        </article>
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Platform users</p>
          <p className="fu-cardValue">{formatNum(kpi.totalUsers)}</p>
          <p className="dash__kpiSub dash__kpiSub--up">+8.3% vs yesterday</p>
        </article>
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Website views</p>
          <p className="fu-cardValue">{formatNum(kpi.websiteViews)}</p>
          <p className="dash__kpiSub dash__kpiSub--up">+6.2% vs yesterday</p>
        </article>
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Pending partnerships</p>
          <p className="fu-cardValue">{kpi.partnershipPending}</p>
          <p className="dash__kpiSub dash__kpiSub--down">-2.4% vs yesterday</p>
        </article>
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Approved partnerships</p>
          <p className="fu-cardValue">{kpi.partnershipApproved}</p>
          <p className="dash__kpiSub dash__kpiSub--up">+1.8% vs yesterday</p>
        </article>
        <article className="fu-card dash__kpi">
          <p className="fu-cardTitle">Converted partnerships</p>
          <p className="fu-cardValue">{kpi.partnershipConverted}</p>
          <p className="dash__kpiSub dash__kpiSub--up">+21.0% vs yesterday</p>
        </article>
      </section>

      <section className="dash__layout">
        <div className="dash__mainCol">
          <article className="fu-card dash__chart">
            <div className="dash__cardHead">
              <h2>Platform traffic overview</h2>
              <div className="dash__tabs">
                <button type="button" className="dash__tab dash__tab--active">Daily</button>
                <button type="button" className="dash__tab">Weekly</button>
                <button type="button" className="dash__tab">Monthly</button>
              </div>
            </div>
            <div className="dash__chartInner">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingsSeries}>
                  <defs>
                    <linearGradient id="fuBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f9684b" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#f9684b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
                  <XAxis dataKey="day" stroke="#8b93a7" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8b93a7" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#12151c',
                      border: '1px solid #232836',
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ff7a5a"
                    fill="url(#fuBookings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="fu-card dash__tableCard">
            <h2>Priority queues</h2>
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Owner</th>
                  <th>Window</th>
                  <th>Done</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {upcomingClasses.map((row) => (
                  <tr key={`${row.name}-${row.time}`}>
                    <td>{row.name}</td>
                    <td>{row.coach}</td>
                    <td>{row.time}</td>
                    <td>
                      {row.booked}/{row.capacity}
                    </td>
                    <td>
                      <span
                        className={`dash__status dash__status--${statusForClass(row)
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {statusForClass(row)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fu-btn fu-btn--ghost dash__editBtn"
                        onClick={() => openEditClass(row)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>

        <div className="dash__sideCol">
          <article className="fu-card dash__feed">
            <h2>Activity Feed</h2>
            <ul className="dash__feedList">
              {activity.map((item, i) => (
                <li key={`${item.type}-${i}`} className="dash__feedItem">
                  <span className={`dash__dot dash__dot--${item.type}`} />
                  <div>
                    <p>{item.title}</p>
                    <small>{item.meta}</small>
                    <time>{item.when}</time>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="fu-card dash__schedule">
            <h2>Today timeline</h2>
            <ul className="dash__scheduleList">
              {todaySchedule.map((row) => (
                <li key={`${row.time}-${row.title}`} className="dash__scheduleItem">
                  <span className="dash__scheduleTime">{row.time}</span>
                  <div>
                    <p>{row.title}</p>
                    <small>Owner: {row.coach}</small>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <Modal
        open={!!editingClass}
        title="Edit Queue"
        onClose={() => setEditingClassId(null)}
        footer={
          <button type="submit" form="dash-edit-class-form" className="fu-btn fu-btn--primary">
            Save changes
          </button>
        }
      >
        <p className="dash__editHint">
          Make changes to this queue card here. Click save when you're done.
        </p>
        <form id="dash-edit-class-form" className="dash__editForm" onSubmit={saveClass}>
          <label className="fu-label">Name</label>
          <input
            className="fu-input"
            value={classForm.name}
            onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
          />
          <label className="fu-label">Owner</label>
          <input
            className="fu-input"
            value={classForm.coach}
            onChange={(e) => setClassForm((p) => ({ ...p, coach: e.target.value }))}
          />
          <label className="fu-label">Time</label>
          <input
            className="fu-input"
            value={classForm.time}
            onChange={(e) => setClassForm((p) => ({ ...p, time: e.target.value }))}
            placeholder="09:00 AM"
          />
          <label className="fu-label">Capacity</label>
          <input
            type="number"
            min="1"
            className="fu-input"
            value={classForm.capacity}
            onChange={(e) =>
              setClassForm((p) => ({ ...p, capacity: Number(e.target.value) || 0 }))
            }
          />
          <label className="fu-label">Booked</label>
          <input
            type="number"
            min="0"
            className="fu-input"
            value={classForm.booked}
            onChange={(e) =>
              setClassForm((p) => ({ ...p, booked: Number(e.target.value) || 0 }))
            }
          />
        </form>
      </Modal>
    </div>
  );
}
