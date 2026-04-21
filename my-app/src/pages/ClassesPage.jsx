import { useMemo, useState } from 'react';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './ClassesPage.css';

const emptyForm = {
  name: '',
  description: '',
  coach: '',
  room: '',
  schedule: '',
  duration: '',
  enrolled: 0,
  capacity: 10,
  price: 0,
};

export default function ClassesPage() {
  const { gymClasses, upsertGymClass, deleteGymClass } = useFitupAdmin();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const title = editingId ? 'Edit Class' : 'Create Class';

  const currentClass = useMemo(
    () => gymClasses.find((item) => item.id === editingId) || null,
    [gymClasses, editingId]
  );

  const statusMeta = (item) => {
    const cap = Number(item.capacity) || 0;
    const enr = Number(item.enrolled) || 0;
    if (!cap || enr >= cap) return { label: 'Fully Booked', tone: 'full' };
    const ratio = enr / cap;
    if (ratio >= 0.8) return { label: 'Almost Full', tone: 'almost' };
    return { label: `${Math.max(0, cap - enr)} spots left`, tone: 'open' };
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      coach: item.coach,
      room: item.room,
      schedule: item.schedule,
      duration: item.duration,
      enrolled: Number(item.enrolled) || 0,
      capacity: Number(item.capacity) || 0,
      price: Number(item.price) || 0,
    });
    setOpen(true);
  };

  const submitClass = (e) => {
    e.preventDefault();
    const payload = {
      name: String(form.name || '').trim(),
      description: String(form.description || '').trim(),
      coach: String(form.coach || '').trim(),
      room: String(form.room || '').trim(),
      schedule: String(form.schedule || '').trim(),
      duration: String(form.duration || '').trim(),
      enrolled: Math.max(0, Number(form.enrolled) || 0),
      capacity: Math.max(1, Number(form.capacity) || 1),
      price: Math.max(0, Number(form.price) || 0),
    };
    if (!payload.name || !payload.coach) return;

    if (editingId) {
      upsertGymClass({ id: editingId, ...payload });
    } else {
      upsertGymClass(payload);
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const removeClass = (id) => {
    deleteGymClass(id);
    if (editingId === id) {
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  return (
    <div className="clsPg">
      <header className="fu-pageHeader clsPg__head">
        <div>
          <h1>Classes</h1>
          <p>Manage group fitness classes</p>
        </div>
        <button type="button" className="fu-btn fu-btn--primary clsPg__createBtn" onClick={openCreate}>
          + Create Class
        </button>
      </header>

      <section className="clsPg__grid">
        {gymClasses.map((item) => {
          const status = statusMeta(item);
          return (
            <article key={item.id} className="fu-card clsPg__card">
              <div className="clsPg__top">
                <h3>{item.name}</h3>
                <span className={`clsPg__status clsPg__status--${status.tone}`}>{status.label}</span>
              </div>
              <p className="clsPg__desc">{item.description}</p>

              <div className="clsPg__rows">
                <p>
                  <span>Coach</span>
                  <strong>{item.coach}</strong>
                </p>
                <p>
                  <span>Room</span>
                  <strong>{item.room}</strong>
                </p>
                <p>
                  <span>Schedule</span>
                  <strong>{item.schedule}</strong>
                </p>
                <p>
                  <span>Duration</span>
                  <strong>{item.duration}</strong>
                </p>
                <p>
                  <span>Price</span>
                  <strong>${Number(item.price || 0)}</strong>
                </p>
              </div>

              <p className="clsPg__enrolled">
                <span>People:</span> {item.enrolled} / {item.capacity} enrolled
              </p>

              <div className="clsPg__actions">
                <button type="button" className="fu-btn clsPg__edit" onClick={() => openEdit(item)}>
                  Edit
                </button>
                <button type="button" className="fu-btn clsPg__delete" onClick={() => removeClass(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <Modal
        open={open}
        title={title}
        onClose={() => setOpen(false)}
        footer={
          <button type="submit" form="clsPg-form" className="fu-btn fu-btn--primary">
            {editingId ? 'Save changes' : 'Create class'}
          </button>
        }
      >
        <form id="clsPg-form" className="clsPg__form" onSubmit={submitClass}>
          <label className="fu-label">Class name</label>
          <input
            className="fu-input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Morning Yoga"
            required
          />
          <label className="fu-label">Description</label>
          <textarea
            className="fu-textarea"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Class short description"
          />
          <label className="fu-label">Coach</label>
          <input
            className="fu-input"
            value={form.coach}
            onChange={(e) => setForm((p) => ({ ...p, coach: e.target.value }))}
            placeholder="Emma Davis"
            required
          />
          <label className="fu-label">Room</label>
          <input
            className="fu-input"
            value={form.room}
            onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
            placeholder="Studio A"
          />
          <label className="fu-label">Schedule</label>
          <input
            className="fu-input"
            value={form.schedule}
            onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}
            placeholder="Mon, Wed, Fri - 9:00 AM"
          />
          <label className="fu-label">Duration</label>
          <input
            className="fu-input"
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
            placeholder="60 min"
          />
          <label className="fu-label">Capacity</label>
          <input
            type="number"
            min="1"
            className="fu-input"
            value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) || 1 }))}
          />
          <label className="fu-label">Enrolled</label>
          <input
            type="number"
            min="0"
            className="fu-input"
            value={form.enrolled}
            onChange={(e) => setForm((p) => ({ ...p, enrolled: Number(e.target.value) || 0 }))}
          />
          <label className="fu-label">Price ($)</label>
          <input
            type="number"
            min="0"
            className="fu-input"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) || 0 }))}
          />
          {currentClass ? (
            <p className="clsPg__hint">Editing: {currentClass.name}</p>
          ) : (
            <p className="clsPg__hint">Create a new class and publish it to the schedule.</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
