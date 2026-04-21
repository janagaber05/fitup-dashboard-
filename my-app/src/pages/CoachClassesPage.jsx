import { useMemo } from 'react';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './CoachClassesPage.css';

export default function CoachClassesPage() {
  const { coachSession, gymClasses } = useFitupAdmin();
  const coachNameKey = String(coachSession?.coachName || '').trim().toLowerCase();

  const rows = useMemo(
    () =>
      (gymClasses || []).filter(
        (c) => String(c.coach || '').trim().toLowerCase() === coachNameKey
      ),
    [gymClasses, coachNameKey]
  );

  return (
    <div className="coachCls">
      <header className="fu-pageHeader">
        <div>
          <h1>My classes</h1>
          <p>Group classes and recurring sessions where you are the listed coach.</p>
        </div>
      </header>

      <div className="coachCls__grid">
        {rows.map((c) => (
          <article key={c.id} className="fu-card coachCls__card">
            <h2>{c.name}</h2>
            <p className="coachCls__desc">{c.description}</p>
            <ul className="coachCls__meta">
              <li>
                <span>Schedule</span> {c.schedule}
              </li>
              <li>
                <span>Room</span> {c.room}
              </li>
              <li>
                <span>Duration</span> {c.duration}
              </li>
              <li>
                <span>Enrollment</span> {c.enrolled}/{c.capacity}
              </li>
            </ul>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="fu-card coachCls__empty">No classes are assigned to you yet.</p>
        ) : null}
      </div>
    </div>
  );
}
