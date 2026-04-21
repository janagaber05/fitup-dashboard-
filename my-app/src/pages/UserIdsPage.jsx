import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './UserIdsPage.css';

export default function UserIdsPage() {
  const ctx = useOutletContext() || {};
  const globalSearch = (ctx.globalSearch || '').trim().toLowerCase();
  const { users, gyms, partnerGyms, deleteUser, restrictUser, unrestrictUser, fileUserComplaint } =
    useFitupAdmin();
  const [selectedId, setSelectedId] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: '', text: '' });

  const gymNameById = useMemo(() => {
    const map = {};
    gyms.forEach((g) => {
      map[g.id] = g.name;
    });
    partnerGyms.forEach((g) => {
      map[g.id] = g.brandName || g.legalName || g.gymAccountId;
    });
    return map;
  }, [gyms, partnerGyms]);

  const rows = useMemo(
    () =>
      users.filter((u) => {
        if (!globalSearch) return true;
        const gymName = gymNameById[u.registeredGymId] || '';
        return (
          String(u.fitupUserId || '').toLowerCase().includes(globalSearch) ||
          String(u.name || '').toLowerCase().includes(globalSearch) ||
          String(u.email || '').toLowerCase().includes(globalSearch) ||
          gymName.toLowerCase().includes(globalSearch)
        );
      }),
    [users, gymNameById, globalSearch]
  );
  const selected = rows.find((u) => u.id === selectedId) || null;
  const memberComplaints = Array.isArray(selected?.profile?.memberComplaints)
    ? selected.profile.memberComplaints
    : [];
  const memberActionHistory = Array.isArray(selected?.profile?.memberActionHistory)
    ? selected.profile.memberActionHistory
    : [];
  const memberHistory = Array.isArray(selected?.profile?.memberHistory)
    ? selected.profile.memberHistory
    : [];
  const submitUserAction = () => {
    if (!selected || !actionModal.type) return;
    const text = actionModal.text.trim();
    if (!text) return;
    if (actionModal.type === 'restrict') {
      restrictUser(selected.id, text);
    } else if (actionModal.type === 'unrestrict') {
      unrestrictUser(selected.id, text);
    } else if (actionModal.type === 'complaint') {
      fileUserComplaint(selected.id, text);
    }
    setActionModal({ open: false, type: '', text: '' });
  };

  return (
    <div className="uidPg">
      <header className="fu-pageHeader">
        <div>
          <h1>User IDs</h1>
          <p>All registered members with FITUP ID, email, and registered gym.</p>
        </div>
      </header>

      <div className="fu-tableWrap">
        <table className="fu-table">
          <thead>
            <tr>
              <th>FITUP user ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Registered gym</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="uidPg__mono">{u.fitupUserId || '—'}</td>
                <td>{u.name || '—'}</td>
                <td>{u.email || '—'}</td>
                <td>{gymNameById[u.registeredGymId] || 'Not assigned'}</td>
                <td>
                  <button
                    type="button"
                    className="fu-btn fu-btn--ghost"
                    onClick={() => setSelectedId(u.id)}
                  >
                    Profile
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>No matching users.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!selected}
        title={selected ? `${selected.name} · ${selected.fitupUserId || '—'}` : ''}
        onClose={() => setSelectedId(null)}
        footer={
          <button type="button" className="fu-btn" onClick={() => setSelectedId(null)}>
            Close
          </button>
        }
      >
        {selected && (
          <div className="uidPg__profile">
            <p>
              <strong>Email:</strong> {selected.email || '—'}
            </p>
            <p>
              <strong>Registered gym:</strong>{' '}
              {gymNameById[selected.registeredGymId] || 'Not assigned'}
            </p>
            <p>
              <strong>Phone:</strong> {selected.profile?.phone || '—'}
            </p>
            <p>
              <strong>Address:</strong> {selected.profile?.address || '—'}
            </p>
            <p>
              <strong>City:</strong> {selected.profile?.city || '—'}
            </p>
            <p>
              <strong>Date of birth:</strong> {selected.profile?.dateOfBirth || '—'}
            </p>
            <p>
              <strong>Membership type:</strong> {selected.profile?.membershipType || '—'}
            </p>
            <p>
              <strong>Sessions left:</strong>{' '}
              {selected.profile?.sessionsLeft ?? 0}
            </p>
            <p>
              <strong>Membership price paid:</strong>{' '}
              {selected.profile?.membershipPricePaid ?? 0}{' '}
              {selected.profile?.membershipCurrency || 'USD'}
            </p>
            <p>
              <strong>Member status:</strong> {selected.profile?.memberStatus || '—'}
            </p>
            <p>
              <strong>Emergency contact:</strong>{' '}
              {selected.profile?.emergencyContact || '—'}
            </p>
            <p>
              <strong>Emergency phone:</strong> {selected.profile?.emergencyPhone || '—'}
            </p>
            <p>
              <strong>Goals:</strong> {selected.profile?.goals || '—'}
            </p>
            <p>
              <strong>Medical notes:</strong> {selected.profile?.medicalNotes || '—'}
            </p>
            <p>
              <strong>Weight:</strong> {selected.profile?.weight || '—'}
            </p>
            <p>
              <strong>Height:</strong> {selected.profile?.height || '—'}
            </p>
            <p>
              <strong>Joined from:</strong> {selected.profile?.joinedFrom || '—'}
            </p>
            <p>
              <strong>Created:</strong>{' '}
              {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
            </p>
            <p>
              <strong>Member complaints:</strong>
            </p>
            {memberComplaints.length ? (
              <ul className="uidPg__list">
                {memberComplaints.map((c) => (
                  <li key={c.id}>
                    {c.text || 'Complaint'} ({c.status || 'open'}){' '}
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
            <p>
              <strong>Admin actions:</strong>
            </p>
            {memberActionHistory.length ? (
              <ul className="uidPg__list">
                {memberActionHistory.map((a) => (
                  <li key={a.id}>
                    {a.type || 'action'} - {a.note || '—'}{' '}
                    {a.at ? new Date(a.at).toLocaleString() : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
            <p>
              <strong>Member history:</strong>
            </p>
            {memberHistory.length ? (
              <ul className="uidPg__list">
                {memberHistory.map((h) => (
                  <li key={h.id || `${h.type}_${h.date}`}>
                    {h.type || 'event'} - {h.gymName || h.gymId || 'Gym'} -{' '}
                    {h.date ? new Date(h.date).toLocaleDateString() : ''} {h.note ? `- ${h.note}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No previous gym booking/membership history.</p>
            )}
            <div className="uidPg__actions">
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({ open: true, type: 'restrict', text: '' });
                }}
              >
                Restrict user
              </button>
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({ open: true, type: 'unrestrict', text: '' });
                }}
              >
                Unrestrict user
              </button>
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({ open: true, type: 'complaint', text: '' });
                }}
              >
                File complaint
              </button>
              <button
                type="button"
                className="fu-btn uidPg__danger"
                onClick={() => {
                  if (!selected) return;
                  if (!window.confirm('Delete this user?')) return;
                  deleteUser(selected.id);
                  setSelectedId(null);
                }}
              >
                Delete user
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={actionModal.open}
        title={
          actionModal.type === 'complaint'
            ? 'File User Complaint'
            : actionModal.type === 'unrestrict'
              ? 'Unrestrict User'
              : 'Restrict User'
        }
        onClose={() => setActionModal({ open: false, type: '', text: '' })}
        footer={
          <>
            <button
              type="button"
              className="fu-btn"
              onClick={() => setActionModal({ open: false, type: '', text: '' })}
            >
              Cancel
            </button>
            <button type="button" className="fu-btn fu-btn--primary" onClick={submitUserAction}>
              Save
            </button>
          </>
        }
      >
        <label className="fu-label">
          {actionModal.type === 'complaint'
            ? 'Complaint details'
            : actionModal.type === 'unrestrict'
              ? 'Why are you removing restriction?'
              : 'Why are you restricting this user?'}
        </label>
        <textarea
          className="fu-input"
          rows={4}
          value={actionModal.text}
          onChange={(e) => setActionModal((p) => ({ ...p, text: e.target.value }))}
          placeholder="Write details..."
        />
      </Modal>
    </div>
  );
}
