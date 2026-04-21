import '../components/Ui.css';
import './AnalyticsPage.css';

export default function RevenuePage() {
  const kpis = [
    { label: 'MRR (platform)', value: '$24,900', sub: '+15.2%  vs last month', tone: 'up', icon: '$' },
    { label: 'Quarterly billings', value: '$74,200', sub: '+12.8%  vs last quarter', tone: 'up', icon: '▭' },
    { label: 'Collections rate', value: '96.4%', sub: '+2.1%  vs last month', tone: 'up', icon: '◌' },
  ];

  const trend = [
    { month: 'Sep', amount: 12000 },
    { month: 'Oct', amount: 14800 },
    { month: 'Nov', amount: 14200 },
    { month: 'Dec', amount: 17600 },
    { month: 'Jan', amount: 19200 },
    { month: 'Feb', amount: 20500 },
    { month: 'Mar', amount: 22800 },
  ];

  const tx = [
    { id: 't1', member: 'FitZone Downtown', memberId: 'GYM-20260401-A7K2Q', service: 'Platform monthly invoice', amount: '$6,400', date: '2026-03-18', status: 'completed' },
    { id: 't2', member: 'FitZone North', memberId: 'GYM-20260405-03M1X', service: 'Platform monthly invoice', amount: '$2,850', date: '2026-03-18', status: 'completed' },
    { id: 't3', member: 'FitZone Westside', memberId: 'GYM-20260403-Z9P4L', service: 'Platform monthly invoice', amount: '$950', date: '2026-03-17', status: 'pending' },
    { id: 't4', member: 'Pulse Arena', memberId: 'GYM-20260322-U4C8R', service: 'Onboarding fee', amount: '$1,200', date: '2026-03-17', status: 'completed' },
    { id: 't5', member: 'CoreNation', memberId: 'GYM-20260317-H6T4J', service: 'Contract renewal', amount: '$3,100', date: '2026-03-16', status: 'pending' },
    { id: 't6', member: 'Urban Motion', memberId: 'GYM-20260312-P3K1V', service: 'Expansion branch fee', amount: '$2,200', date: '2026-03-16', status: 'completed' },
    { id: 't7', member: 'Studio One', memberId: 'GYM-20260305-B9N7D', service: 'Platform monthly invoice', amount: '$1,480', date: '2026-03-15', status: 'completed' },
  ];

  return (
    <div className="anPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Revenue</h1>
          <p>Track FITUP platform revenue and billing collections.</p>
        </div>
      </header>

      <section className="anPg__metrics">
        {kpis.map((k) => (
          <article key={k.label} className="fu-card anPg__kpi">
            <div className="anPg__kpiHead">
              <p className="fu-cardTitle">{k.label}</p>
              <span className="anPg__kpiIcon">{k.icon}</span>
            </div>
            <p className="fu-cardValue">{k.value}</p>
            <p className={`anPg__kpiSub ${k.tone === 'up' ? 'anPg__kpiSub--up' : ''}`}>{k.sub}</p>
          </article>
        ))}
      </section>

      <section className="fu-card anPg__recent">
        <h2>Platform Revenue Trend</h2>
        <div className="anPg__bars">
          {trend.map((r) => (
            <div key={r.month} className="anPg__barCol">
              <div className="anPg__barWrap">
                <span className="anPg__bar" style={{ height: `${Math.max(20, Math.round((r.amount / 24000) * 100))}%` }} />
              </div>
              <small>{r.month}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="fu-card anPg__programs">
        <h2>Recent Gym Transactions</h2>
        <div className="fu-tableWrap">
          <table className="fu-table anPg__table">
            <thead>
              <tr>
                <th>Gym</th>
                <th>Charge type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((row) => (
                <tr key={row.id}>
                    <td>
                      <strong>{row.member}</strong>
                      <div className="anPg__memberId">{row.memberId}</div>
                    </td>
                  <td>{row.service}</td>
                  <td>{row.amount}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className={`anPg__status anPg__status--${row.status}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
