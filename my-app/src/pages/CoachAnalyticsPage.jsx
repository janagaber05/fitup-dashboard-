import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFitupAdmin } from '../components/FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import '../components/Ui.css';
import './AnalyticsPage.css';
import './CoachAnalyticsPage.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function matchesCoach(booking, coachIdKey, coachNameKey) {
  const bid = String(booking.coachId || '').trim().toUpperCase();
  if (coachIdKey && bid && bid === coachIdKey) return true;
  const nm = String(booking.coach || '').trim().toLowerCase();
  return coachNameKey && nm === coachNameKey;
}

const chartTooltipStyle = {
  background: '#12151c',
  border: '1px solid #232836',
  borderRadius: 8,
  fontSize: 12,
};

const PIE_COLORS = ['#f9684b', '#5eb3e8', '#2fd08d', '#8b93a7'];

export default function CoachAnalyticsPage() {
  const { coachSession, bookings, gymClasses, users, partnerGyms } = useFitupAdmin();

  const coachIdKey = String(coachSession?.coachId || '').trim().toUpperCase();
  const coachNameKey = String(coachSession?.coachName || '').trim().toLowerCase();

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const myBookings = useMemo(
    () => (bookings || []).filter((b) => matchesCoach(b, coachIdKey, coachNameKey)),
    [bookings, coachIdKey, coachNameKey]
  );

  const myClasses = useMemo(
    () =>
      (gymClasses || []).filter(
        (c) => String(c.coach || '').trim().toLowerCase() === coachNameKey
      ),
    [gymClasses, coachNameKey]
  );

  const myClients = useMemo(
    () => coachScopedClients(users, coachSession, partnerGyms),
    [users, coachSession, partnerGyms]
  );

  const weekdaySeries = useMemo(() => {
    const tally = Object.fromEntries(DAYS.map((d) => [d, 0]));
    myBookings.forEach((b) => {
      if (tally[b.day] !== undefined) tally[b.day] += 1;
    });
    return DAYS.map((d) => ({ day: d, sessions: tally[d] }));
  }, [myBookings]);

  const typeSeries = useMemo(() => {
    const tally = { Private: 0, Class: 0, EMS: 0, Other: 0 };
    myBookings.forEach((b) => {
      const t = String(b.type || '').toLowerCase();
      if (t === 'private') tally.Private += 1;
      else if (t === 'class') tally.Class += 1;
      else if (t === 'ems') tally.EMS += 1;
      else tally.Other += 1;
    });
    return [
      { name: 'Private', value: tally.Private },
      { name: 'Group class', value: tally.Class },
      { name: 'EMS', value: tally.EMS },
      { name: 'Other', value: tally.Other },
    ].filter((row) => row.value > 0);
  }, [myBookings]);

  const typePieData =
    typeSeries.length > 0 ? typeSeries : [{ name: 'No sessions yet', value: 1 }];

  const classFillSeries = useMemo(() => {
    return [...myClasses]
      .map((c) => ({
        name:
          String(c.name || 'Class').length > 16
            ? `${String(c.name).slice(0, 14)}…`
            : String(c.name || 'Class'),
        enrolled: Number(c.enrolled) || 0,
        capacity: Math.max(Number(c.capacity) || 0, Number(c.enrolled) || 0, 1),
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 8);
  }, [myClasses]);

  const clientMix = useMemo(() => {
    const need = myClients.filter((u) => u.profile?.programsNeedReview).length;
    const ok = myClients.length - need;
    if (myClients.length === 0) {
      return [{ name: 'No assigned clients', value: 1 }];
    }
    return [
      { name: 'Programs up to date', value: ok },
      { name: 'Needs program review', value: need },
    ].filter((r) => r.value > 0);
  }, [myClients]);

  const maxWeekday = Math.max(1, ...weekdaySeries.map((r) => r.sessions));
  const maxClassCap = Math.max(1, ...classFillSeries.map((r) => r.capacity));

  return (
    <div className="anPg anPg--dashboard">
      <header className="fu-pageHeader">
        <div>
          <h1>Analytics</h1>
          <p>
            Load and mix for your bookings, classes, and clients
            {branch?.brandName ? ` · ${branch.brandName}` : ''}.
          </p>
        </div>
      </header>

      <section className="anPg__chartGrid">
        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Sessions by weekday</h2>
          <p className="coachAn__chartHint">Recurring slots where you are the coach</p>
          <div className="anPg__chartBody">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekdaySeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                <XAxis dataKey="day" stroke="#8b93a7" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#8b93a7"
                  tick={{ fontSize: 10 }}
                  domain={[0, Math.ceil(maxWeekday * 1.15)]}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#f9684b"
                  strokeWidth={2}
                  dot={{ fill: '#fff', stroke: '#f9684b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Session types</h2>
          <p className="coachAn__chartHint">Share of your scheduled session rows</p>
          <div className="anPg__chartBody anPg__chartBody--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typePieData.map((_, i) => (
                    <Cell
                      key={String(i)}
                      fill={typeSeries.length === 0 ? '#2a2f3a' : PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="anPg__pieLegend coachAn__pieLegend">
              {typeSeries.length === 0 ? (
                <span className="anPg__pieLegendItem">Add bookings to see a breakdown.</span>
              ) : (
                typeSeries.map((row, i) => (
                  <span key={row.name} className="anPg__pieLegendItem">
                    <i
                      className="anPg__dot"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {row.name} · {row.value}
                  </span>
                ))
              )}
            </div>
          </div>
        </article>

        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Your classes · enrollment</h2>
          <p className="coachAn__chartHint">Listed classes on your profile</p>
          <div className="anPg__chartBody">
            {classFillSeries.length === 0 ? (
              <p className="coachAn__empty">No classes assigned to you in the catalog.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classFillSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b93a7" tick={{ fontSize: 9 }} interval={0} angle={-18} textAnchor="end" height={56} />
                  <YAxis
                    stroke="#8b93a7"
                    tick={{ fontSize: 10 }}
                    domain={[0, Math.ceil(maxClassCap * 1.1)]}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="enrolled" fill="#f9684b" radius={[6, 6, 0, 0]} name="Enrolled" />
                  <Bar dataKey="capacity" fill="#2a2f3a" radius={[6, 6, 0, 0]} name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Your clients</h2>
          <p className="coachAn__chartHint">Assigned clients at this branch</p>
          <div className="anPg__chartBody anPg__chartBody--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {clientMix.map((_, i) => (
                    <Cell key={String(i)} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="anPg__pieLegend coachAn__pieLegend">
              {myClients.length === 0 ? (
                <span className="anPg__pieLegendItem">No clients assigned to you yet.</span>
              ) : (
                clientMix.map((row, i) => (
                  <span key={row.name} className="anPg__pieLegendItem">
                    <i
                      className="anPg__dot"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {row.name} · {row.value}
                  </span>
                ))
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
