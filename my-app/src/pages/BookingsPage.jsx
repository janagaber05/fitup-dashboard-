import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './BookingsPage.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const seedBookings = [
  { id: 'b1', day: 'Mon', time: '09:00', title: 'Sarah Wilson', coach: 'John Smith', type: 'private' },
  {
    id: 'b2',
    day: 'Thu',
    time: '09:00',
    title: 'HIIT Training',
    coach: 'John Smith',
    type: 'class',
    classBooked: 18,
    classCapacity: 18,
    classEnrolled: [
      { id: 'M-1001', name: 'Nour Ali', payment: 'Card' },
      { id: 'M-1002', name: 'Adam Kareem', payment: 'Cash' },
    ],
  },
  { id: 'b3', day: 'Tue', time: '10:00', title: 'Tom Anderson', coach: 'Mike Johnson', type: 'ems' },
  {
    id: 'b4',
    day: 'Mon',
    time: '14:00',
    title: 'Yoga Class',
    coach: 'Emma Davis',
    type: 'class',
    classBooked: 12,
    classCapacity: 15,
    classEnrolled: [
      { id: 'M-1010', name: 'Maya Hassan', payment: 'Bank transfer' },
      { id: 'M-1011', name: 'Omar Fares', payment: 'Card' },
    ],
  },
  { id: 'b5', day: 'Wed', time: '15:00', title: 'Kevin Lee', coach: 'Lisa Brown', type: 'private' },
  { id: 'b6', day: 'Fri', time: '16:00', title: 'Maria Garcia', coach: 'Emma Davis', type: 'private' },
  // same slot, different coach (requested behavior)
  { id: 'b7', day: 'Mon', time: '09:00', title: 'EMS Session', coach: 'Lina Haddad', type: 'ems' },
  // 10 bookings in one slot (Tue 10:00) for overflow testing
  {
    id: 'b8',
    day: 'Tue',
    time: '10:00',
    title: 'HIIT Group A',
    coach: 'John Smith',
    type: 'class',
    classBooked: 14,
    classCapacity: 18,
  },
  {
    id: 'b9',
    day: 'Tue',
    time: '10:00',
    title: 'HIIT Group B',
    coach: 'Emma Davis',
    type: 'class',
    classBooked: 16,
    classCapacity: 18,
  },
  { id: 'b10', day: 'Tue', time: '10:00', title: 'Private: Adam Cole', coach: 'Lisa Brown', type: 'private' },
  { id: 'b11', day: 'Tue', time: '10:00', title: 'Private: Maya Lane', coach: 'Mike Johnson', type: 'private' },
  { id: 'b12', day: 'Tue', time: '10:00', title: 'EMS: Omar Saleh', coach: 'Tom Anderson', type: 'ems' },
  { id: 'b13', day: 'Tue', time: '10:00', title: 'EMS: Nora Aziz', coach: 'Tom Anderson', type: 'ems' },
  {
    id: 'b14',
    day: 'Tue',
    time: '10:00',
    title: 'Core Blast',
    coach: 'Sarah Wilson',
    type: 'class',
    classBooked: 10,
    classCapacity: 14,
  },
  {
    id: 'b15',
    day: 'Tue',
    time: '10:00',
    title: 'Strength Lab',
    coach: 'Kevin Lee',
    type: 'class',
    classBooked: 9,
    classCapacity: 12,
  },
  { id: 'b16', day: 'Tue', time: '10:00', title: 'Private: Lina Haddad', coach: 'John Smith', type: 'private' },
  { id: 'b17', day: 'Tue', time: '10:00', title: 'Mobility EMS', coach: 'Lina Haddad', type: 'ems' },
];

export default function BookingsPage() {
  const {
    users,
    gymClasses,
    bookings = seedBookings,
    setBookings,
    setGymClassEnrollment,
    syncCoachSessionsPerWeek,
  } = useFitupAdmin();
  const [coachIdSearch, setCoachIdSearch] = useState('');
  const [openNew, setOpenNew] = useState(false);
  const [openSlot, setOpenSlot] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    day: 'Mon',
    time: '09:00',
    coach: '',
    classBooked: 0,
    classCapacity: 20,
  });
  const [form, setForm] = useState({
    day: 'Mon',
    time: '09:00',
    title: '',
    coach: '',
    coachId: '',
    type: 'class',
    classBooked: 0,
    classCapacity: 20,
    classPrice: 0,
  });
  const [enrolledForm, setEnrolledForm] = useState({
    name: '',
    memberId: '',
    payment: '',
  });

  const coachOptions = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const p = u.profile || {};
      const id = String(p.coachId || '').trim();
      const name = String(p.coachName || '').trim();
      if (!id && !name) return;
      const key = (id || name).toLowerCase();
      if (!map.has(key)) map.set(key, { id, name });
    });
    return Array.from(map.values());
  }, [users]);

  const resolveCoachId = useCallback((booking) => {
    const direct = String(booking?.coachId || '').trim();
    if (direct) return direct;
    const byName = coachOptions.find(
      (c) => String(c.name || '').trim().toLowerCase() === String(booking?.coach || '').trim().toLowerCase()
    );
    return String(byName?.id || '');
  }, [coachOptions]);

  const visibleBookings = useMemo(() => {
    const key = String(coachIdSearch || '').trim().toLowerCase();
    if (!key) return bookings;
    return bookings.filter((b) => resolveCoachId(b).toLowerCase().includes(key));
  }, [bookings, coachIdSearch, resolveCoachId]);

  const byCell = useMemo(() => {
    const map = new Map();
    visibleBookings.forEach((b) => {
      const key = `${b.day}__${b.time}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [visibleBookings]);

  const addBooking = (e) => {
    e.preventDefault();
    const title = String(form.title || '').trim();
    const coach = String(form.coach || '').trim();
    if (!title || !coach) return;
    setBookings((prev) => [
      ...prev,
      {
        id: `b_${Date.now()}`,
        day: form.day,
        time: form.time,
        title,
        coach,
        coachId: String(form.coachId || '').trim(),
        type: form.type,
        classBooked: form.type === 'class' ? Number(form.classBooked) || 0 : undefined,
        classCapacity: form.type === 'class' ? Number(form.classCapacity) || 0 : undefined,
        classPrice: form.type === 'class' ? Number(form.classPrice) || 0 : undefined,
        classEnrolled: form.type === 'class' ? [] : undefined,
      },
    ]);
    setOpenNew(false);
    setForm((p) => ({
      ...p,
      title: '',
      coach: '',
      coachId: '',
      classBooked: 0,
      classCapacity: 20,
      classPrice: 0,
    }));
  };

  const badgeTypeLabel = (type) => {
    if (type === 'private') return 'Personal';
    if (type === 'ems') return 'EMS';
    return 'Class';
  };

  const getClassBooked = (session) => {
    if (!session) return 0;
    if (Array.isArray(session.classEnrolled)) return session.classEnrolled.length;
    return Number(session.classBooked) || 0;
  };

  const getClassPrice = (session) => {
    if (!session) return 0;
    const direct = Number(session.classPrice);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const key = String(session.title || '').trim().toLowerCase();
    const linked = gymClasses.find(
      (row) => String(row.name || '').trim().toLowerCase() === key
    );
    return Number(linked?.price) || 0;
  };

  const applyClassTemplateToForm = (className) => {
    const key = String(className || '').trim().toLowerCase();
    const found = gymClasses.find(
      (row) => String(row.name || '').trim().toLowerCase() === key
    );
    if (!found) return;
    const coachMatch = coachOptions.find(
      (c) => String(c.name || '').trim().toLowerCase() === String(found.coach || '').trim().toLowerCase()
    );
    setForm((p) => ({
      ...p,
      title: found.name,
      coach: found.coach || p.coach,
      coachId: coachMatch?.id || p.coachId,
      classCapacity: Number(found.capacity) || p.classCapacity,
      classBooked: Number(found.enrolled) || p.classBooked,
      classPrice: Number(found.price) || 0,
    }));
  };

  const startReschedule = () => {
    if (!selectedSession) return;
    setRescheduleForm({
      day: selectedSession.day,
      time: selectedSession.time,
      coach: selectedSession.coach,
      classBooked: getClassBooked(selectedSession),
      classCapacity: Number(selectedSession.classCapacity) || 20,
    });
    setOpenReschedule(true);
  };

  const saveReschedule = (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedSession.id
          ? {
              ...b,
              day: rescheduleForm.day,
              time: rescheduleForm.time,
              coach: String(rescheduleForm.coach || '').trim() || b.coach,
              classBooked:
                b.type === 'class'
                  ? Number(rescheduleForm.classBooked) || 0
                  : b.classBooked,
              classCapacity:
                b.type === 'class'
                  ? Number(rescheduleForm.classCapacity) || 0
                  : b.classCapacity,
            }
          : b
      )
    );
    setSelectedSession((p) =>
      p
        ? {
            ...p,
            day: rescheduleForm.day,
            time: rescheduleForm.time,
            coach: String(rescheduleForm.coach || '').trim() || p.coach,
            classBooked:
              p.type === 'class'
                ? Number(rescheduleForm.classBooked) || 0
                : p.classBooked,
            classCapacity:
              p.type === 'class'
                ? Number(rescheduleForm.classCapacity) || 0
                : p.classCapacity,
          }
        : null
    );
    if (selectedSession.type === 'class') {
      setGymClassEnrollment(
        selectedSession.title,
        Math.max(0, Number(rescheduleForm.classBooked) || 0)
      );
    }
    setOpenReschedule(false);
  };

  useEffect(() => {
    const counts = {};
    bookings.forEach((b) => {
      const idKey = resolveCoachId(b).toLowerCase();
      const nameKey = String(b.coach || '').trim().toLowerCase();
      if (idKey) counts[idKey] = (counts[idKey] || 0) + 1;
      if (nameKey) counts[nameKey] = (counts[nameKey] || 0) + 1;
    });
    syncCoachSessionsPerWeek(counts);
  }, [bookings, syncCoachSessionsPerWeek, resolveCoachId]);

  const addClassEnrolledMember = (e) => {
    e.preventDefault();
    if (!selectedSession || selectedSession.type !== 'class') return;
    const name = String(enrolledForm.name || '').trim();
    const memberId = String(enrolledForm.memberId || '').trim();
    const payment = String(enrolledForm.payment || '').trim();
    if (!name || !memberId || !payment) return;

    const nextMember = { id: memberId, name, payment };
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== selectedSession.id) return b;
        const current = Array.isArray(b.classEnrolled) ? b.classEnrolled : [];
        const nextEnrolled = [...current, nextMember];
        return { ...b, classEnrolled: nextEnrolled, classBooked: nextEnrolled.length };
      })
    );
    setSelectedSession((p) => {
      if (!p) return null;
      const current = Array.isArray(p.classEnrolled) ? p.classEnrolled : [];
      const nextEnrolled = [...current, nextMember];
      return { ...p, classEnrolled: nextEnrolled, classBooked: nextEnrolled.length };
    });
    setGymClassEnrollment(
      selectedSession.title,
      (Array.isArray(selectedSession.classEnrolled) ? selectedSession.classEnrolled.length : 0) + 1
    );
    setEnrolledForm({ name: '', memberId: '', payment: '' });
  };

  return (
    <div className="bookPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Bookings</h1>
          <p>Manage all training sessions and classes.</p>
        </div>
        <input
          className="fu-input"
          style={{ maxWidth: 240 }}
          placeholder="Search coach ID (e.g. FCO...)"
          value={coachIdSearch}
          onChange={(e) => setCoachIdSearch(e.target.value)}
        />
        <button type="button" className="fu-btn fu-btn--primary" onClick={() => setOpenNew(true)}>
          + New Booking
        </button>
      </header>

      <section className="fu-card bookPg__gridCard">
        <h2>Weekly Schedule</h2>
        <div className="bookPg__gridWrap">
          <div className="bookPg__grid">
            <div className="bookPg__timeHead" />
            {DAYS.map((d) => (
              <div key={`h_${d}`} className="bookPg__dayHead">
                {d}
              </div>
            ))}

            {TIMES.map((t) => (
              <>
                <div key={`t_${t}`} className="bookPg__timeCol">
                  {t}
                </div>
                {DAYS.map((d) => {
                  const slotKey = `${d}__${t}`;
                  const cell = byCell.get(slotKey) || [];
                  const preview = cell.slice(0, 3);
                  const remaining = Math.max(0, cell.length - preview.length);
                  return (
                    <div key={`${d}_${t}`} className="bookPg__cell">
                      {preview.map((row) => (
                        <article
                          key={row.id}
                          className={`bookPg__item bookPg__item--${row.type}`}
                          title={`${row.title} · ${row.coach} (${row.type})`}
                          onClick={() => setSelectedSession(row)}
                        >
                          <p>{row.title}</p>
                          <small>{row.coach}</small>
                        </article>
                      ))}
                      {remaining > 0 ? (
                        <button
                          type="button"
                          className="bookPg__more"
                          onClick={() => setOpenSlot({ day: d, time: t, key: slotKey })}
                        >
                          +{remaining} more
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={openNew}
        title="New Booking"
        onClose={() => setOpenNew(false)}
        footer={
          <button type="submit" form="bookPg-new-form" className="fu-btn fu-btn--primary">
            Save booking
          </button>
        }
      >
        <form id="bookPg-new-form" className="bookPg__form" onSubmit={addBooking}>
          <label className="fu-label">Booking type</label>
          <select
            className="fu-select"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="class">Class</option>
            <option value="ems">EMS</option>
            <option value="private">Private session</option>
          </select>
          <label className="fu-label">Day</label>
          <select
            className="fu-select"
            value={form.day}
            onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="fu-label">Time</label>
          <select
            className="fu-select"
            value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
          >
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="fu-label">Session / member</label>
          {form.type === 'class' ? (
            <select
              className="fu-select"
              value={form.title}
              onChange={(e) => applyClassTemplateToForm(e.target.value)}
              required
            >
              <option value="">Select class</option>
              {gymClasses.map((row) => (
                <option key={row.id} value={row.name}>
                  {row.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="fu-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="HIIT Training / Sarah Wilson"
              required
            />
          )}
          <label className="fu-label">Coach</label>
          <select
            className="fu-select"
            value={form.coachId}
            onChange={(e) => {
              const selectedId = e.target.value;
              const found = coachOptions.find((c) => c.id === selectedId);
              setForm((p) => ({
                ...p,
                coachId: selectedId,
                coach: found?.name || p.coach,
              }));
            }}
            required
          >
            <option value="">Select coach ID</option>
            {coachOptions.map((c) => (
              <option key={`${c.id}_${c.name}`} value={c.id}>
                {c.id} {c.name ? `- ${c.name}` : ''}
              </option>
            ))}
          </select>
          {form.type === 'class' ? (
            <>
              <label className="fu-label">Class capacity</label>
              <input
                className="fu-input"
                type="number"
                min="1"
                value={form.classCapacity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, classCapacity: Number(e.target.value) || 0 }))
                }
              />
              <label className="fu-label">People booked</label>
              <input
                className="fu-input"
                type="number"
                min="0"
                value={form.classBooked}
                onChange={(e) =>
                  setForm((p) => ({ ...p, classBooked: Number(e.target.value) || 0 }))
                }
              />
              <label className="fu-label">Class price</label>
              <input
                className="fu-input"
                type="number"
                min="0"
                value={form.classPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, classPrice: Number(e.target.value) || 0 }))
                }
              />
            </>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={!!openSlot}
        title={openSlot ? `Bookings · ${openSlot.day} ${openSlot.time}` : 'Slot bookings'}
        onClose={() => setOpenSlot(null)}
        footer={
          <button type="button" className="fu-btn" onClick={() => setOpenSlot(null)}>
            Close
          </button>
        }
      >
        <div className="bookPg__slotList">
          {((openSlot && byCell.get(openSlot.key)) || []).map((row, idx) => (
            <article key={row.id} className={`bookPg__slotItem bookPg__item--${row.type}`}>
              <p>
                #{idx + 1} {row.title}
              </p>
              <small>
                {row.type.toUpperCase()} · Coach: {row.coach}
              </small>
              <button
                type="button"
                className="fu-btn fu-btn--ghost bookPg__slotOpen"
                onClick={() => setSelectedSession(row)}
              >
                Open details
              </button>
            </article>
          ))}
          {!((openSlot && byCell.get(openSlot.key)) || []).length ? <p>No bookings.</p> : null}
        </div>
      </Modal>

      <Modal
        open={!!selectedSession}
        title="Session Details"
        onClose={() => {
          setSelectedSession(null);
          setEnrolledForm({ name: '', memberId: '', payment: '' });
        }}
        footer={
          <div className="bookPg__sessionActions">
            <button
              type="button"
              className="fu-btn fu-btn--ghost"
              onClick={startReschedule}
            >
              Reschedule
            </button>
            <button
              type="button"
              className="fu-btn"
              onClick={() => {
                if (!selectedSession) return;
                setBookings((prev) => prev.filter((b) => b.id !== selectedSession.id));
                setSelectedSession(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className="fu-btn fu-btn--primary">
              Message
            </button>
          </div>
        }
      >
        {selectedSession ? (
          <div className="bookPg__sessionBody">
            <p className="bookPg__sessionSub">Manage this booking session</p>
            <div className="bookPg__sessionRow">
              <span className="bookPg__sessionLabel">Member</span>
              <strong>{selectedSession.title}</strong>
            </div>
            <div className="bookPg__sessionRow">
              <span className="bookPg__sessionLabel">Coach</span>
              <strong>{selectedSession.coach}</strong>
            </div>
            <div className="bookPg__sessionRow">
              <span className="bookPg__sessionLabel">Time</span>
              <strong>
                {selectedSession.day} at {selectedSession.time}
              </strong>
            </div>
            <div className="bookPg__sessionRow">
              <span className="bookPg__sessionLabel">Session Type</span>
              <span className={`bookPg__pill bookPg__pill--${selectedSession.type}`}>
                {badgeTypeLabel(selectedSession.type)}
              </span>
            </div>
            {selectedSession.type === 'class' ? (
              <>
                <div className="bookPg__sessionRow">
                  <span className="bookPg__sessionLabel">People booked</span>
                  <strong>
                    {getClassBooked(selectedSession)} /{' '}
                    {Number(selectedSession.classCapacity) || 0}
                  </strong>
                </div>
                <div className="bookPg__sessionRow">
                  <span className="bookPg__sessionLabel">Booking status</span>
                  <span
                    className={`bookPg__classStatus ${
                      getClassBooked(selectedSession) >= (Number(selectedSession.classCapacity) || 0)
                        ? 'bookPg__classStatus--full'
                        : 'bookPg__classStatus--open'
                    }`}
                  >
                    {getClassBooked(selectedSession) >= (Number(selectedSession.classCapacity) || 0)
                      ? 'Fully booked'
                      : `${Math.max(
                          0,
                          (Number(selectedSession.classCapacity) || 0) -
                            getClassBooked(selectedSession)
                        )} spots free`}
                  </span>
                </div>
                <div className="bookPg__sessionRow">
                  <span className="bookPg__sessionLabel">Class price</span>
                  <strong>${getClassPrice(selectedSession)}</strong>
                </div>
                <div className="bookPg__sessionRow">
                  <span className="bookPg__sessionLabel">Enrolled people</span>
                  <form className="bookPg__enrollForm" onSubmit={addClassEnrolledMember}>
                    <input
                      className="fu-input"
                      placeholder="Member name"
                      value={enrolledForm.name}
                      onChange={(e) => setEnrolledForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      className="fu-input"
                      placeholder="Member ID"
                      value={enrolledForm.memberId}
                      onChange={(e) => setEnrolledForm((p) => ({ ...p, memberId: e.target.value }))}
                    />
                    <input
                      className="fu-input"
                      placeholder="How paid (cash/card/transfer)"
                      value={enrolledForm.payment}
                      onChange={(e) => setEnrolledForm((p) => ({ ...p, payment: e.target.value }))}
                    />
                    <button type="submit" className="fu-btn fu-btn--primary">
                      Add person
                    </button>
                  </form>
                  <div className="bookPg__enrolledList">
                    {(Array.isArray(selectedSession.classEnrolled) ? selectedSession.classEnrolled : []).map(
                      (person, idx) => (
                        <article key={`${person.id}_${idx}`} className="bookPg__enrolledItem">
                          <strong>{person.name}</strong>
                          <span>ID: {person.id}</span>
                          <span>Paid by: {person.payment}</span>
                        </article>
                      )
                    )}
                    {!((Array.isArray(selectedSession.classEnrolled) && selectedSession.classEnrolled.length) > 0) ? (
                      <p className="bookPg__empty">No enrolled members added yet.</p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={openReschedule}
        title="Reschedule Session"
        onClose={() => setOpenReschedule(false)}
        footer={
          <button
            type="submit"
            form="bookPg-reschedule-form"
            className="fu-btn fu-btn--primary"
          >
            Save reschedule
          </button>
        }
      >
        <form id="bookPg-reschedule-form" className="bookPg__form" onSubmit={saveReschedule}>
          <label className="fu-label">Day</label>
          <select
            className="fu-select"
            value={rescheduleForm.day}
            onChange={(e) => setRescheduleForm((p) => ({ ...p, day: e.target.value }))}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="fu-label">Time</label>
          <select
            className="fu-select"
            value={rescheduleForm.time}
            onChange={(e) => setRescheduleForm((p) => ({ ...p, time: e.target.value }))}
          >
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="fu-label">Coach</label>
          <input
            className="fu-input"
            value={rescheduleForm.coach}
            onChange={(e) => setRescheduleForm((p) => ({ ...p, coach: e.target.value }))}
            placeholder="Coach name"
          />
          {selectedSession?.type === 'class' ? (
            <>
              <label className="fu-label">Class capacity</label>
              <input
                className="fu-input"
                type="number"
                min="1"
                value={rescheduleForm.classCapacity}
                onChange={(e) =>
                  setRescheduleForm((p) => ({
                    ...p,
                    classCapacity: Number(e.target.value) || 0,
                  }))
                }
              />
              <label className="fu-label">People booked</label>
              <input
                className="fu-input"
                type="number"
                min="0"
                value={rescheduleForm.classBooked}
                onChange={(e) =>
                  setRescheduleForm((p) => ({
                    ...p,
                    classBooked: Number(e.target.value) || 0,
                  }))
                }
              />
            </>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
