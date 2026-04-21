import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './UsersPage.css';

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default function UsersPage() {
  const ctx = useOutletContext() || {};
  const globalSearch = (ctx.globalSearch || '').trim().toLowerCase();
  const partnerGyms = useMemo(
    () => (Array.isArray(ctx.partnerGyms) ? ctx.partnerGyms : []),
    [ctx.partnerGyms]
  );
  const selectedBranchId = String(ctx.selectedBranchId || '');
  const activeBranch = useMemo(
    () => partnerGyms.find((g) => g.id === selectedBranchId) || partnerGyms[0],
    [partnerGyms, selectedBranchId]
  );
  const linkedGymId = activeBranch?.linkedGymId || 'g1';
  const partnerGymIdForAdd = activeBranch?.id || '';

  const { users, addGymMemberToFitup, updateUser } = useFitupAdmin();
  const [memberSearch, setMemberSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    membershipType: 'Basic',
    sessionsLeft: 0,
    memberStatus: 'pending',
    membershipPaymentStatus: 'unpaid',
    membershipExpiryDate: '',
    membershipPaymentMethod: 'cash',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    goals: '',
    medicalNotes: '',
    weight: '',
    height: '',
    preferredCoach: '',
  });

  const filtered = useMemo(() => {
    const q = `${globalSearch} ${memberSearch}`.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.fitupUserId || '').toLowerCase().includes(q)
      );
    });
  }, [users, globalSearch, memberSearch]);

  const statusToneClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'paid') return 'usersPg__status--active';
    if (s === 'pending') return 'usersPg__status--pending';
    return 'usersPg__status--inactive';
  };

  const membershipClass = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('premium')) return 'usersPg__membership--premium';
    if (t.includes('vip')) return 'usersPg__membership--vip';
    return 'usersPg__membership--basic';
  };

  const addMember = (e) => {
    e.preventDefault();
    const name = String(addForm.name || '').trim();
    const email = String(addForm.email || '').trim();
    if (!name || !email) return;
    addGymMemberToFitup(linkedGymId, {
      name,
      email,
      partnerGymId: partnerGymIdForAdd,
      membershipType: addForm.membershipType,
      sessionsLeft: Number(addForm.sessionsLeft) || 0,
      memberStatus: addForm.memberStatus,
      membershipPaymentStatus: addForm.membershipPaymentStatus,
      membershipExpiryDate: addForm.membershipExpiryDate,
      membershipPaymentMethod: addForm.membershipPaymentMethod,
      phone: String(addForm.phone || '').trim(),
      address: String(addForm.address || '').trim(),
      dateOfBirth: String(addForm.dateOfBirth || '').trim(),
      emergencyContact: String(addForm.emergencyContact || '').trim(),
      emergencyPhone: String(addForm.emergencyPhone || '').trim(),
      goals: String(addForm.goals || '').trim(),
      medicalNotes: String(addForm.medicalNotes || '').trim(),
      weight: String(addForm.weight || '').trim(),
      height: String(addForm.height || '').trim(),
      preferredCoach: String(addForm.preferredCoach || '').trim(),
    });
    setAddOpen(false);
    setAddForm({
      name: '',
      email: '',
      membershipType: 'Basic',
      sessionsLeft: 0,
      memberStatus: 'pending',
      membershipPaymentStatus: 'unpaid',
      membershipExpiryDate: '',
      membershipPaymentMethod: 'cash',
      phone: '',
      address: '',
      dateOfBirth: '',
      emergencyContact: '',
      emergencyPhone: '',
      goals: '',
      medicalNotes: '',
      weight: '',
      height: '',
      preferredCoach: '',
    });
  };

  const memberInitials = (name) =>
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'M';

  const openDetail = (u) => {
    setDetail(u);
    setEditOpen(false);
    const p = u.profile || {};
    setEditForm({
      phone: p.phone || '',
      address: p.address || '',
      dateOfBirth: p.dateOfBirth || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      goals: p.goals || '',
      medicalNotes: p.medicalNotes || '',
      weight: p.weight || '',
      height: p.height || '',
      preferredCoach: p.preferredCoach || '',
      membershipType: p.membershipType || 'Basic',
      sessionsLeft: Number(p.sessionsLeft) || 0,
      membershipPaymentStatus: p.membershipPaymentStatus || 'unpaid',
      membershipPaymentMethod: p.membershipPaymentMethod || 'cash',
      membershipExpiryDate: p.membershipExpiryDate || '',
      memberStatus: p.memberStatus || 'pending',
    });
  };

  const saveProfile = () => {
    if (!detail) return;
    updateUser(detail.id, {
      profile: {
        ...(detail.profile || {}),
        ...editForm,
        sessionsLeft: Number(editForm.sessionsLeft) || 0,
      },
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            profile: { ...(prev.profile || {}), ...editForm, sessionsLeft: Number(editForm.sessionsLeft) || 0 },
          }
        : prev
    );
    setEditOpen(false);
  };

  return (
    <div className="usersPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Members</h1>
          <p>Track member identity, memberships, and activity in one place.</p>
        </div>
        <button type="button" className="fu-btn fu-btn--primary usersPg__addBtn" onClick={() => setAddOpen(true)}>
          + Add Member
        </button>
      </header>

      <section className="fu-card usersPg__tableCard">
        <div className="usersPg__tableHead">
          <h2>All Members</h2>
          <input
            className="fu-input usersPg__search"
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>
        <div className="fu-tableWrap usersPg__tableWrap">
          <table className="fu-table usersPg__table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Membership</th>
                <th>Payment</th>
                <th>Pay Method</th>
                <th>Expiry</th>
                <th>Sessions Left</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const profile = u.profile || {};
                const memberStatus = String(profile.memberStatus || u.status || 'inactive');
                return (
                  <tr key={u.id}>
                    <td className="usersPg__memberId">{u.fitupUserId || '-'}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`usersPg__membership ${membershipClass(profile.membershipType)}`}>
                        {profile.membershipType || 'Basic'}
                      </span>
                    </td>
                    <td>
                      <span className={`usersPg__status ${statusToneClass(profile.membershipPaymentStatus || 'unpaid')}`}>
                        {String(profile.membershipPaymentStatus || 'unpaid') === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>{profile.membershipPaymentMethod || '-'}</td>
                    <td>{profile.membershipExpiryDate || '-'}</td>
                    <td className={(Number(profile.sessionsLeft) || 0) <= 4 ? 'usersPg__sessionsLow' : ''}>
                      {Number(profile.sessionsLeft) || 0}
                    </td>
                    <td>
                      <span className={`usersPg__status ${statusToneClass(memberStatus)}`}>
                        {memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <button type="button" className="fu-btn usersPg__viewBtn" onClick={() => openDetail(u)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>No members found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={addOpen}
        title="Add Member"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button type="button" className="fu-btn" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="usersPg-add-form" className="fu-btn fu-btn--primary">
              Add Member
            </button>
          </>
        }
      >
        <form id="usersPg-add-form" className="usersPg__form" onSubmit={addMember}>
          <p className="usersPg__hint">Add a new member to your gym.</p>
          {activeBranch ? (
            <p className="usersPg__hint usersPg__hint--branch">
              Assigns to branch <strong>{activeBranch.brandName || activeBranch.legalName}</strong>. Change it from the{' '}
              <strong>Branch</strong> menu in the top bar.
            </p>
          ) : (
            <p className="usersPg__hint usersPg__hint--branch">No branches configured — member is linked to the default gym record only.</p>
          )}
          <label className="fu-label">Name</label>
          <input className="fu-input" required placeholder="Enter member name" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
          <label className="fu-label">Email</label>
          <input className="fu-input" required placeholder="Enter member email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} />
          <label className="fu-label">Membership Type</label>
          <select className="fu-select" value={addForm.membershipType} onChange={(e) => setAddForm((p) => ({ ...p, membershipType: e.target.value }))}>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
          </select>
          <label className="fu-label">Sessions Left</label>
          <input type="number" min="0" className="fu-input" value={addForm.sessionsLeft} onChange={(e) => setAddForm((p) => ({ ...p, sessionsLeft: Number(e.target.value) || 0 }))} />
          <label className="fu-label">Status</label>
          <select className="fu-select" value={addForm.memberStatus} onChange={(e) => setAddForm((p) => ({ ...p, memberStatus: e.target.value }))}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="fu-label">Payment Status</label>
          <select className="fu-select" value={addForm.membershipPaymentStatus} onChange={(e) => setAddForm((p) => ({ ...p, membershipPaymentStatus: e.target.value }))}>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <label className="fu-label">Membership Expiry Date</label>
          <input type="date" className="fu-input" value={addForm.membershipExpiryDate} onChange={(e) => setAddForm((p) => ({ ...p, membershipExpiryDate: e.target.value }))} />
          <label className="fu-label">Payment Method</label>
          <select className="fu-select" value={addForm.membershipPaymentMethod} onChange={(e) => setAddForm((p) => ({ ...p, membershipPaymentMethod: e.target.value }))}>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="app">Application</option>
          </select>
          <label className="fu-label">Phone</label>
          <input className="fu-input" placeholder="Enter member phone" value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} />
          <label className="fu-label">Address</label>
          <input className="fu-input" placeholder="Enter member address" value={addForm.address} onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))} />
          <label className="fu-label">Date of Birth</label>
          <input type="date" className="fu-input" value={addForm.dateOfBirth} onChange={(e) => setAddForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
          <label className="fu-label">Emergency Contact</label>
          <input className="fu-input" placeholder="Enter emergency contact" value={addForm.emergencyContact} onChange={(e) => setAddForm((p) => ({ ...p, emergencyContact: e.target.value }))} />
          <label className="fu-label">Emergency Phone</label>
          <input className="fu-input" placeholder="Enter emergency phone" value={addForm.emergencyPhone} onChange={(e) => setAddForm((p) => ({ ...p, emergencyPhone: e.target.value }))} />
          <label className="fu-label">Goals</label>
          <textarea rows={3} className="fu-input" placeholder="Enter member goals" value={addForm.goals} onChange={(e) => setAddForm((p) => ({ ...p, goals: e.target.value }))} />
          <label className="fu-label">Medical Notes</label>
          <textarea rows={3} className="fu-input" placeholder="Enter medical notes" value={addForm.medicalNotes} onChange={(e) => setAddForm((p) => ({ ...p, medicalNotes: e.target.value }))} />
          <label className="fu-label">Weight</label>
          <input className="fu-input" placeholder="Enter member weight" value={addForm.weight} onChange={(e) => setAddForm((p) => ({ ...p, weight: e.target.value }))} />
          <label className="fu-label">Height</label>
          <input className="fu-input" placeholder="Enter member height" value={addForm.height} onChange={(e) => setAddForm((p) => ({ ...p, height: e.target.value }))} />
          <label className="fu-label">Preferred Coach</label>
          <input className="fu-input" placeholder="Enter preferred coach" value={addForm.preferredCoach} onChange={(e) => setAddForm((p) => ({ ...p, preferredCoach: e.target.value }))} />
        </form>
      </Modal>

      <Modal
        open={!!detail}
        title={detail ? `Member Profile - ${detail.name}` : ''}
        onClose={() => setDetail(null)}
        modalClassName="usersPg__profileModal"
        footer={
          <>
            {editOpen ? (
              <>
                <button type="button" className="fu-btn" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="fu-btn fu-btn--primary usersPg__closeBtn" onClick={saveProfile}>
                  Save Profile
                </button>
              </>
            ) : (
              <>
                <button type="button" className="fu-btn" onClick={() => setEditOpen(true)}>
                  Edit Profile
                </button>
                <button type="button" className="fu-btn fu-btn--primary usersPg__closeBtn" onClick={() => setDetail(null)}>
                  Close
                </button>
              </>
            )}
          </>
        }
      >
        {detail && (
          <div className="usersPg__detail">
            <p className="usersPg__detailLead">View and manage member details.</p>
            <div className="usersPg__profileTop">
              <div className="usersPg__avatar">{memberInitials(detail.name)}</div>
              <div>
                <h3>{detail.name}</h3>
                <p>{detail.email}</p>
              </div>
              <span className={`usersPg__membership ${membershipClass(detail.profile?.membershipType)}`}>
                {detail.profile?.membershipType || 'Basic'}
              </span>
            </div>
            <p><strong>Member ID</strong><span>{detail.fitupUserId || '-'}</span></p>
            {editOpen ? (
              <div className="usersPg__editGrid">
                <label className="fu-label">Phone</label>
                <input className="fu-input" value={editForm.phone || ''} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                <label className="fu-label">Address</label>
                <input className="fu-input" value={editForm.address || ''} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
                <label className="fu-label">Date of Birth</label>
                <input type="date" className="fu-input" value={editForm.dateOfBirth || ''} onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                <label className="fu-label">Emergency Contact</label>
                <input className="fu-input" value={editForm.emergencyContact || ''} onChange={(e) => setEditForm((p) => ({ ...p, emergencyContact: e.target.value }))} />
                <label className="fu-label">Emergency Phone</label>
                <input className="fu-input" value={editForm.emergencyPhone || ''} onChange={(e) => setEditForm((p) => ({ ...p, emergencyPhone: e.target.value }))} />
                <label className="fu-label">Goals</label>
                <textarea rows={2} className="fu-input" value={editForm.goals || ''} onChange={(e) => setEditForm((p) => ({ ...p, goals: e.target.value }))} />
                <label className="fu-label">Medical Notes</label>
                <textarea rows={2} className="fu-input" value={editForm.medicalNotes || ''} onChange={(e) => setEditForm((p) => ({ ...p, medicalNotes: e.target.value }))} />
                <label className="fu-label">Weight</label>
                <input className="fu-input" value={editForm.weight || ''} onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))} />
                <label className="fu-label">Height</label>
                <input className="fu-input" value={editForm.height || ''} onChange={(e) => setEditForm((p) => ({ ...p, height: e.target.value }))} />
                <label className="fu-label">Preferred Coach</label>
                <input className="fu-input" value={editForm.preferredCoach || ''} onChange={(e) => setEditForm((p) => ({ ...p, preferredCoach: e.target.value }))} />
                <label className="fu-label">Membership Type</label>
                <select className="fu-select" value={editForm.membershipType || 'Basic'} onChange={(e) => setEditForm((p) => ({ ...p, membershipType: e.target.value }))}>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
                <label className="fu-label">Sessions Left</label>
                <input type="number" min="0" className="fu-input" value={editForm.sessionsLeft || 0} onChange={(e) => setEditForm((p) => ({ ...p, sessionsLeft: Number(e.target.value) || 0 }))} />
                <label className="fu-label">Member Status</label>
                <select className="fu-select" value={editForm.memberStatus || 'pending'} onChange={(e) => setEditForm((p) => ({ ...p, memberStatus: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <label className="fu-label">Payment Status</label>
                <select className="fu-select" value={editForm.membershipPaymentStatus || 'unpaid'} onChange={(e) => setEditForm((p) => ({ ...p, membershipPaymentStatus: e.target.value }))}>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <label className="fu-label">Payment Method</label>
                <select className="fu-select" value={editForm.membershipPaymentMethod || 'cash'} onChange={(e) => setEditForm((p) => ({ ...p, membershipPaymentMethod: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="app">Application</option>
                </select>
                <label className="fu-label">Membership Expiry</label>
                <input type="date" className="fu-input" value={editForm.membershipExpiryDate || ''} onChange={(e) => setEditForm((p) => ({ ...p, membershipExpiryDate: e.target.value }))} />
              </div>
            ) : (
              <>
                <p><strong>Phone</strong><span>{detail.profile?.phone || '-'}</span></p>
                <p><strong>Address</strong><span>{detail.profile?.address || '-'}</span></p>
                <p><strong>Date of Birth</strong><span>{detail.profile?.dateOfBirth || '-'}</span></p>
                <p><strong>Emergency Contact</strong><span>{detail.profile?.emergencyContact || '-'}</span></p>
                <p><strong>Emergency Phone</strong><span>{detail.profile?.emergencyPhone || '-'}</span></p>
                <p><strong>Goals</strong><span>{detail.profile?.goals || '-'}</span></p>
                <p><strong>Medical Notes</strong><span>{detail.profile?.medicalNotes || '-'}</span></p>
                <p><strong>Weight</strong><span>{detail.profile?.weight || '-'}</span></p>
                <p><strong>Height</strong><span>{detail.profile?.height || '-'}</span></p>
                <p><strong>Preferred Coach</strong><span>{detail.profile?.preferredCoach || '-'}</span></p>
                <p><strong>Payment Status</strong><span>{detail.profile?.membershipPaymentStatus || 'unpaid'}</span></p>
                <p><strong>Payment Method</strong><span>{detail.profile?.membershipPaymentMethod || '-'}</span></p>
                <p><strong>Membership Expiry</strong><span>{detail.profile?.membershipExpiryDate || '-'}</span></p>
                <p><strong>Last Visit</strong><span>{formatDate(detail.lastSiteVisitAt || detail.createdAt)}</span></p>
                <p><strong>Total Sessions</strong><span>{detail.profile?.totalSessions || detail.profile?.memberHistory?.length || 0}</span></p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
