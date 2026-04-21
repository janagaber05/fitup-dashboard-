import '../components/Ui.css';
import './AnalyticsPage.css';

export default function ArTrainingPage() {
  const kpis = [
    { label: 'Total AR Sessions', value: '520', sub: '+24.6% this month', tone: 'up', icon: '◈' },
    { label: 'Active Programs', value: '12', sub: 'AR training programs', tone: '', icon: '▷' },
    { label: 'Avg Session Rating', value: '4.8', sub: 'Out of 5.0', tone: '', icon: '★' },
  ];

  const recentSessions = [
    { id: 'ar-1', title: 'Boxing Fundamentals', member: 'Tom Anderson', duration: '30 min', date: '2026-03-18', progress: 75 },
    { id: 'ar-2', title: 'Yoga Flow VR', member: 'Alex Turner', duration: '45 min', date: '2026-03-18', progress: 100 },
    { id: 'ar-3', title: 'HIIT Circuit', member: 'Sarah Wilson', duration: '25 min', date: '2026-03-17', progress: 50 },
    { id: 'ar-4', title: 'Meditation Journey', member: 'Kevin Lee', duration: '20 min', date: '2026-03-17', progress: 100 },
  ];

  const programs = [
    { id: 'p1', name: 'Boxing Fundamentals', rating: 4.8, level: 'Beginner', sessions: 156 },
    { id: 'p2', name: 'Yoga Flow VR', rating: 4.9, level: 'All Levels', sessions: 142 },
    { id: 'p3', name: 'HIIT Circuit', rating: 4.7, level: 'Advanced', sessions: 98 },
    { id: 'p4', name: 'Meditation Journey', rating: 4.9, level: 'Beginner', sessions: 124 },
  ];

  return (
    <div className="anPg">
      <header className="fu-pageHeader">
        <div>
          <h1>AR Training</h1>
          <p>Virtual reality and augmented reality sessions</p>
        </div>
        <button type="button" className="fu-btn fu-btn--primary anPg__newBtn">
          New AR Session
        </button>
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
        <h2>Recent AR Sessions</h2>
        <div className="anPg__sessionList">
          {recentSessions.map((s) => (
            <article key={s.id} className="anPg__sessionItem">
              <div className="anPg__sessionHead">
                <div className="anPg__sessionBadge">◈</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.member} - {s.duration}</p>
                </div>
                <time>{s.date}</time>
              </div>
              <div className="anPg__progressRow">
                <div className="anPg__progressTrack">
                  <span style={{ width: `${s.progress}%` }} />
                </div>
                <strong>{s.progress}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fu-card anPg__programs">
        <h2>AR Programs</h2>
        <div className="anPg__programGrid">
          {programs.map((p) => (
            <article key={p.id} className="anPg__programCard">
              <h3>{p.name}</h3>
              <p className="anPg__programMeta">★ {p.rating}</p>
              <div className="anPg__programFoot">
                <span className="anPg__level">{p.level}</span>
                <span>{p.sessions} sessions</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
