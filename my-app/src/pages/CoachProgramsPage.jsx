import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import '../components/Ui.css';
import './CoachProgramsPage.css';

function formatProgramsDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function CoachProgramsPage() {
  const {
    users,
    updateUser,
    coachSession,
    partnerGyms,
    recordEmployeeActivity,
    authUser,
  } = useFitupAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listSearch, setListSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [trainingRoutine, setTrainingRoutine] = useState('');
  const [nutritionProgram, setNutritionProgram] = useState('');
  const [programsNeedReview, setProgramsNeedReview] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const branch = useMemo(
    () => partnerGyms.find((g) => g.id === coachSession?.partnerGymId) || null,
    [partnerGyms, coachSession?.partnerGymId]
  );

  const myClients = useMemo(
    () => coachScopedClients(users, coachSession, partnerGyms),
    [users, coachSession, partnerGyms]
  );

  const needReviewMembers = useMemo(
    () =>
      myClients.filter((u) => u.profile?.programsNeedReview),
    [myClients]
  );

  const sortedMembers = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    let list = [...myClients];
    if (q) {
      list = list.filter(
        (u) =>
          String(u.name || '').toLowerCase().includes(q) ||
          String(u.fitupUserId || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ar = a.profile?.programsNeedReview ? 0 : 1;
      const br = b.profile?.programsNeedReview ? 0 : 1;
      if (ar !== br) return ar - br;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return list;
  }, [myClients, listSearch]);

  const paramMember = searchParams.get('member') || '';

  useEffect(() => {
    if (paramMember && myClients.some((u) => u.id === paramMember)) {
      setSelectedId(paramMember);
    }
  }, [paramMember, myClients]);

  const selected = myClients.find((u) => u.id === selectedId) || null;

  useEffect(() => {
    if (!selected) {
      setTrainingRoutine('');
      setNutritionProgram('');
      setProgramsNeedReview(false);
      return;
    }
    const p = selected.profile || {};
    setTrainingRoutine(String(p.trainingRoutine || ''));
    setNutritionProgram(String(p.nutritionProgram || ''));
    setProgramsNeedReview(Boolean(p.programsNeedReview));
  }, [selected]);

  const selectMember = (id) => {
    setSelectedId(id);
    setSaveStatus('');
    const next = new URLSearchParams(searchParams);
    if (id) next.set('member', id);
    else next.delete('member');
    setSearchParams(next, { replace: true });
  };

  const save = () => {
    if (!selected) return;
    const profile = selected.profile || {};
    const now = new Date().toISOString();
    const coachName = String(coachSession?.coachName || authUser || 'Coach').trim();
    const hist = Array.isArray(profile.memberActionHistory) ? profile.memberActionHistory : [];
    updateUser(selected.id, {
      profile: {
        ...profile,
        trainingRoutine: String(trainingRoutine || '').trim(),
        nutritionProgram: String(nutritionProgram || '').trim(),
        programsUpdatedAt: now,
        programsUpdatedByCoachName: coachName,
        programsNeedReview: Boolean(programsNeedReview),
        memberActionHistory: [
          {
            id: `prog-${Date.now()}`,
            type: 'programs_updated',
            note: 'Training and/or nutrition program updated.',
            at: now,
          },
          ...hist,
        ].slice(0, 80),
      },
    });
    recordEmployeeActivity(
      'Updated member programs',
      `${selected.name} — training & nutrition plan.`,
      { employeeName: coachName }
    );
    setSaveStatus('Saved. The client profile is updated everywhere in the dashboard.');
    setTimeout(() => setSaveStatus(''), 5000);
  };

  return (
    <div className="coachPrg">
      <header className="fu-pageHeader">
        <div>
          <h1>Training & nutrition</h1>
          <p>
            Edit each of your clients’ training and nutrition notes. Changes save to their profile (Clients
            page, history, and admin member records).
            {branch?.brandName ? ` · ${branch.brandName}` : ''}
          </p>
        </div>
      </header>

      {needReviewMembers.length > 0 ? (
        <div className="coachPrg__alert fu-card" role="status">
          <div className="coachPrg__alertTitle">
            <span className="coachPrg__alertBadge">{needReviewMembers.length}</span>
            {needReviewMembers.length === 1
              ? 'client needs a program update or review'
              : 'clients need a program update or review'}
          </div>
          <ul className="coachPrg__alertList">
            {needReviewMembers.map((u) => (
              <li key={u.id}>
                <button type="button" className="coachPrg__alertLink" onClick={() => selectMember(u.id)}>
                  {u.name}
                  <span className="coachPrg__alertId">{u.fitupUserId || u.id}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="coachPrg__alertHint">
            Clear the flag after you update their plan, or leave it on to remind yourself to follow up.
          </p>
        </div>
      ) : (
        <div className="coachPrg__ok fu-card">
          No clients are flagged for program review. Use “Needs review” below if someone needs a follow-up.
        </div>
      )}

      <div className="coachPrg__layout">
        <aside className="fu-card coachPrg__sidebar">
          <input
            className="fu-input coachPrg__search"
            placeholder="Search clients…"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            aria-label="Search clients"
          />
          <ul className="coachPrg__memberList">
            {sortedMembers.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={`coachPrg__memberBtn ${u.id === selectedId ? 'coachPrg__memberBtn--active' : ''}`}
                  onClick={() => selectMember(u.id)}
                >
                  <span className="coachPrg__memberName">{u.name}</span>
                  <span className="coachPrg__memberMeta">
                    {u.fitupUserId || u.id}
                    {u.profile?.programsNeedReview ? (
                      <span className="coachPrg__pill">Review</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {sortedMembers.length === 0 ? (
            <p className="coachPrg__empty">No clients match your list or search.</p>
          ) : null}
        </aside>

        <section className="fu-card coachPrg__editor">
          {selected ? (
            <>
              <div className="coachPrg__editorHead">
                <div>
                  <h2>{selected.name}</h2>
                  <p className="coachPrg__editorSub">
                    Client ID {selected.fitupUserId || '—'} · Last saved{' '}
                    {formatProgramsDate(selected.profile?.programsUpdatedAt)}
                    {selected.profile?.programsUpdatedByCoachName
                      ? ` · by ${selected.profile.programsUpdatedByCoachName}`
                      : ''}
                  </p>
                </div>
                <Link className="fu-btn fu-btn--ghost" to={`/coach/clients`}>
                  Open Clients
                </Link>
              </div>

              <label className="fu-label" htmlFor="coach-prg-training">
                Training routine
              </label>
              <textarea
                id="coach-prg-training"
                className="fu-input coachPrg__textarea"
                rows={10}
                placeholder="Sessions per week, lifts, progression, mobility, cardio…"
                value={trainingRoutine}
                onChange={(e) => setTrainingRoutine(e.target.value)}
              />

              <label className="fu-label" htmlFor="coach-prg-nutrition">
                Nutrition program
              </label>
              <textarea
                id="coach-prg-nutrition"
                className="fu-input coachPrg__textarea"
                rows={8}
                placeholder="Calorie targets, protein, meal timing, hydration, restrictions…"
                value={nutritionProgram}
                onChange={(e) => setNutritionProgram(e.target.value)}
              />

              <label className="coachPrg__check">
                <input
                  type="checkbox"
                  checked={programsNeedReview}
                  onChange={(e) => setProgramsNeedReview(e.target.checked)}
                />
                <span>Flag client — plan needs review or follow-up (shows in the alert above)</span>
              </label>

              {saveStatus ? <p className="coachPrg__saved">{saveStatus}</p> : null}

              <div className="coachPrg__actions">
                <button type="button" className="fu-btn fu-btn--primary" onClick={save}>
                  Save to client profile
                </button>
              </div>
            </>
          ) : (
            <p className="coachPrg__placeholder">Select a client from the list to edit their programs.</p>
          )}
        </section>
      </div>
    </div>
  );
}
