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
import '../components/Ui.css';
import './AnalyticsPage.css';

const bookingsTrend = [
  { day: 'Mar 1', bookings: 42 },
  { day: 'Mar 3', bookings: 48 },
  { day: 'Mar 5', bookings: 55 },
  { day: 'Mar 7', bookings: 52 },
  { day: 'Mar 9', bookings: 61 },
  { day: 'Mar 11', bookings: 58 },
  { day: 'Mar 13', bookings: 67 },
  { day: 'Mar 15', bookings: 72 },
  { day: 'Mar 17', bookings: 78 },
  { day: 'Mar 18', bookings: 85 },
];

const retentionData = [
  { name: 'Retained', value: 75 },
  { name: 'Churned', value: 25 },
];

const classPopularity = [
  { name: 'Yoga', count: 120 },
  { name: 'HIIT', count: 165 },
  { name: 'Pilates', count: 98 },
  { name: 'Spinning', count: 195 },
  { name: 'CrossFit', count: 142 },
];

const peakHours = [
  { hour: '6 AM', people: 18 },
  { hour: '9 AM', people: 42 },
  { hour: '12 PM', people: 38 },
  { hour: '3 PM', people: 28 },
  { hour: '6 PM', people: 58 },
  { hour: '8 PM', people: 35 },
];

const chartTooltipStyle = {
  background: '#12151c',
  border: '1px solid #232836',
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  return (
    <div className="anPg anPg--dashboard">
      <header className="fu-pageHeader">
        <div>
          <h1>Analytics</h1>
          <p>Deep insights into FITUP platform growth and operations.</p>
        </div>
      </header>

      <section className="anPg__chartGrid">
        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Platform Traffic Trend</h2>
          <div className="anPg__chartBody">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                <XAxis dataKey="day" stroke="#8b93a7" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8b93a7" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="bookings"
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
          <h2 className="anPg__chartTitle">Partner Retention</h2>
          <div className="anPg__chartBody anPg__chartBody--pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={retentionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#f9684b" />
                  <Cell fill="#2a2f3a" />
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={chartTooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="anPg__pieLegend">
              <span className="anPg__pieLegendItem">
                <i className="anPg__dot anPg__dot--retained" /> Retained 75%
              </span>
              <span className="anPg__pieLegendItem">
                <i className="anPg__dot anPg__dot--churned" /> Churned 25%
              </span>
            </div>
          </div>
        </article>

        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Top Platform Services</h2>
          <div className="anPg__chartBody">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPopularity} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                <XAxis dataKey="name" stroke="#8b93a7" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8b93a7" tick={{ fontSize: 10 }} domain={[0, 200]} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="#f9684b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="fu-card anPg__chartCard">
          <h2 className="anPg__chartTitle">Support Load by Hour</h2>
          <div className="anPg__chartBody">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232836" vertical={false} />
                <XAxis dataKey="hour" stroke="#8b93a7" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8b93a7" tick={{ fontSize: 10 }} domain={[0, 60]} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="people" fill="#5eb3e8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
