import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './CoachesPage.css';

export default function CoachesPage() {
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

  const branchLabel = (id) => {
    if (!id) return '—';
    const byPartner = partnerGyms.find((g) => g.id === id);
    if (byPartner) return byPartner.brandName || byPartner.legalName || id;
    const byLegacy = partnerGyms.find((g) => g.linkedGymId === id);
    if (byLegacy) return byLegacy.brandName || byLegacy.legalName || id;
    return id;
  };

  const { users, moderateCoach, updateCoachProfile, addGymMemberToFitup, authRole } = useFitupAdmin();
  const isFitupDemo = authRole === 'fitup';
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [profileMode, setProfileMode] = useState('view');
  const [addOpen, setAddOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, type: '', text: '' });
  const [addForm, setAddForm] = useState({
    coachName: '',
    coachEmail: '',
    coachPhone: '',
    coachSpecialty: '',
    coachSessionsPerWeek: 0,
    coachRating: 0,
    coachTotalSessions: 0,
    coachBio: '',
    coachExperience: '',
    coachAvailability: '',
    coachImage: '',
    coachAdminNotes: '',
    certificationName: '',
    certificationImageUrl: '',
  });
  const [editForm, setEditForm] = useState({
    coachName: '',
    coachEmail: '',
    coachPhone: '',
    coachSpecialty: '',
    coachSessionsPerWeek: 0,
    coachRating: 0,
    coachTotalSessions: 0,
    coachBio: '',
    coachExperience: '',
    coachAvailability: '',
    coachImage: '',
    coachAdminNotes: '',
  });
  const [certForm, setCertForm] = useState({
    name: '',
    imageUrl: '',
  });

  const rows = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const p = u.profile || {};
      const coachId = String(p.coachId || '').trim();
      const coachName = String(p.coachName || '').trim();
      const coachEmail = String(p.coachEmail || '').trim();
      const coachPhone = String(p.coachPhone || '').trim();
      const coachSpecialty = String(p.coachSpecialty || '').trim();
      const coachSessionsPerWeek = Number(p.coachSessionsPerWeek) || 0;
      const coachRating = Number(p.coachRating) || 0;
      const coachTotalSessions = Number(p.coachTotalSessions) || 0;
      const coachBio = String(p.coachBio || '').trim();
      const coachExperience = String(p.coachExperience || '').trim();
      const coachAvailability = String(p.coachAvailability || '').trim();
      const coachImage = String(p.coachImage || '').trim();
      const coachCertifications = Array.isArray(p.coachCertifications)
        ? p.coachCertifications
            .map((c) => ({
              id: String(c?.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`),
              name: String(c?.name || '').trim(),
              imageUrl: String(c?.imageUrl || '').trim(),
            }))
            .filter((c) => c.name || c.imageUrl)
        : [];
      const coachRestricted = !!p.coachRestricted;
      const coachComplaints = Array.isArray(p.coachComplaints) ? p.coachComplaints : [];
      const coachActionHistory = Array.isArray(p.coachActionHistory) ? p.coachActionHistory : [];
      const coachJoinedAt = String(p.coachJoinedAt || u.createdAt || '').trim();
      if (!coachId && !coachName) return;
      const key = coachId || coachEmail || coachName.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          coachId: coachId || '—',
          coachName: coachName || '—',
          coachEmail: coachEmail || '—',
          coachPhone: coachPhone || '—',
          coachSpecialty: coachSpecialty || '—',
          coachSessionsPerWeek,
          coachRating,
          coachTotalSessions,
          coachBio,
          coachExperience,
          coachAvailability,
          coachImage,
          coachCertifications,
          coachRestricted,
          coachComplaints,
          coachActionHistory,
          gymWorkHistory: [],
          members: [u],
        });
      } else {
        existing.members.push(u);
        if (!existing.coachBio && coachBio) existing.coachBio = coachBio;
        if (!existing.coachExperience && coachExperience)
          existing.coachExperience = coachExperience;
        if (!existing.coachAvailability && coachAvailability)
          existing.coachAvailability = coachAvailability;
        if (!existing.coachImage && coachImage) existing.coachImage = coachImage;
        if (!existing.coachSessionsPerWeek && coachSessionsPerWeek)
          existing.coachSessionsPerWeek = coachSessionsPerWeek;
        if (!existing.coachRating && coachRating) existing.coachRating = coachRating;
        if (!existing.coachTotalSessions && coachTotalSessions)
          existing.coachTotalSessions = coachTotalSessions;
        if (!existing.coachCertifications.length && coachCertifications.length) {
          existing.coachCertifications = coachCertifications;
        }
        if (!existing.coachComplaints.length && coachComplaints.length) {
          existing.coachComplaints = coachComplaints;
        }
        if (!existing.coachActionHistory.length && coachActionHistory.length) {
          existing.coachActionHistory = coachActionHistory;
        }
        if (!existing.coachRestricted && coachRestricted) existing.coachRestricted = true;
      }
      const target = map.get(key);
      const branchId =
        u.partnerGymId ||
        partnerGyms.find((g) => g.linkedGymId === u.registeredGymId)?.id ||
        u.registeredGymId ||
        '';
      const createdAt = String(u.createdAt || '').trim();
      if (branchId) {
        const existingWork = target.gymWorkHistory.find((w) => w.gymId === branchId);
        if (!existingWork) {
          target.gymWorkHistory.push({
            gymId: branchId,
            startedAt: coachJoinedAt || createdAt || '',
            endedAt: '',
          });
        } else if (!existingWork.startedAt && (coachJoinedAt || createdAt)) {
          existingWork.startedAt = coachJoinedAt || createdAt;
        }
      }
    });
    return Array.from(map.values()).filter((c) => {
      if (!globalSearch) return true;
      return (
        c.coachId.toLowerCase().includes(globalSearch) ||
        c.coachName.toLowerCase().includes(globalSearch) ||
        c.coachEmail.toLowerCase().includes(globalSearch) ||
        c.coachSpecialty.toLowerCase().includes(globalSearch)
      );
    });
  }, [users, globalSearch, partnerGyms]);

  const selected = rows.find((r) => r.key === selectedCoachId) || null;
  const gymsCount = selected
    ? new Set(
        selected.members
          .map((m) => m.partnerGymId || partnerGyms.find((g) => g.linkedGymId === m.registeredGymId)?.id || m.registeredGymId)
          .filter(Boolean)
      ).size
    : 0;
  const restrictedCount = selected
    ? selected.coachActionHistory.filter((h) => h.type === 'restricted').length
    : 0;

  const openCertificate = (imageUrl) => {
    if (!imageUrl) return;
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const submitCoachAction = () => {
    if (!selected || !actionModal.type) return;
    const text = actionModal.text.trim();
    if (!text) return;
    if (actionModal.type === 'restrict') {
      moderateCoach(selected.key, 'restrict', { reason: text });
    } else if (actionModal.type === 'unrestrict') {
      moderateCoach(selected.key, 'unrestrict', { reason: text });
    } else if (actionModal.type === 'complaint') {
      moderateCoach(selected.key, 'complaint', { text });
    }
    setActionModal({ open: false, type: '', text: '' });
  };

  useEffect(() => {
    if (!selected) return;
    setEditForm({
      coachName: selected.coachName || '',
      coachEmail: selected.coachEmail || '',
      coachPhone: selected.coachPhone || '',
      coachSpecialty: selected.coachSpecialty || '',
      coachSessionsPerWeek: Number(selected.coachSessionsPerWeek) || 0,
      coachRating: Number(selected.coachRating) || 0,
      coachTotalSessions: Number(selected.coachTotalSessions) || 0,
      coachBio: selected.coachBio || '',
      coachExperience: selected.coachExperience || '',
      coachAvailability: selected.coachAvailability || '',
      coachImage: selected.coachImage || '',
      coachAdminNotes: String(selected.members?.[0]?.profile?.coachAdminNotes || ''),
    });
    setCertForm({ name: '', imageUrl: '' });
  }, [selectedCoachId, selected]);

  const handleCertImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCertForm((p) => ({ ...p, imageUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleCoachImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((p) => ({ ...p, coachImage: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddCoachImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAddForm((p) => ({ ...p, coachImage: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddCertificationImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAddForm((p) => ({ ...p, certificationImageUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const saveCoachProfile = () => {
    if (!selected) return;
    updateCoachProfile(selected.key, {
      coachName: String(editForm.coachName || '').trim(),
      coachEmail: String(editForm.coachEmail || '').trim(),
      coachPhone: String(editForm.coachPhone || '').trim(),
      coachSpecialty: String(editForm.coachSpecialty || '').trim(),
      coachSessionsPerWeek: Number(editForm.coachSessionsPerWeek) || 0,
      coachRating: Number(editForm.coachRating) || 0,
      coachTotalSessions: Number(editForm.coachTotalSessions) || 0,
      coachBio: String(editForm.coachBio || '').trim(),
      coachExperience: String(editForm.coachExperience || '').trim(),
      coachAvailability: String(editForm.coachAvailability || '').trim(),
      coachImage: String(editForm.coachImage || '').trim(),
      coachAdminNotes: String(editForm.coachAdminNotes || '').trim(),
    });
  };

  const addCertification = () => {
    if (!selected) return;
    const name = String(certForm.name || '').trim();
    const imageUrl = String(certForm.imageUrl || '').trim();
    if (!name && !imageUrl) return;
    const current = Array.isArray(selected.coachCertifications)
      ? selected.coachCertifications
      : [];
    updateCoachProfile(selected.key, {
      coachCertifications: [
        ...current,
        {
          id: `cert_${Date.now()}`,
          name: name || 'Certificate',
          imageUrl,
        },
      ],
    });
    setCertForm({ name: '', imageUrl: '' });
  };

  const submitAddCoach = (e) => {
    e.preventDefault();
    const coachName = String(addForm.coachName || '').trim();
    const coachEmail = String(addForm.coachEmail || '').trim();
    if (!coachName || !coachEmail) return;
    const certName = String(addForm.certificationName || '').trim();
    const certImage = String(addForm.certificationImageUrl || '').trim();
    addGymMemberToFitup(linkedGymId, {
      name: coachName,
      email: coachEmail,
      partnerGymId: partnerGymIdForAdd,
      coachName,
      coachEmail,
      coachPhone: String(addForm.coachPhone || '').trim(),
      coachSpecialty: String(addForm.coachSpecialty || '').trim(),
      coachSessionsPerWeek: Number(addForm.coachSessionsPerWeek) || 0,
      coachRating: Number(addForm.coachRating) || 0,
      coachTotalSessions: Number(addForm.coachTotalSessions) || 0,
      coachBio: String(addForm.coachBio || '').trim(),
      coachExperience: String(addForm.coachExperience || '').trim(),
      coachAvailability: String(addForm.coachAvailability || '').trim(),
      coachImage: String(addForm.coachImage || '').trim(),
      coachAdminNotes: String(addForm.coachAdminNotes || '').trim(),
      coachCertifications: certName || certImage ? [{ name: certName, imageUrl: certImage }] : [],
      joinedFrom: 'Coach onboarding',
    });
    setAddOpen(false);
    setAddForm({
      coachName: '',
      coachEmail: '',
      coachPhone: '',
      coachSpecialty: '',
      coachSessionsPerWeek: 0,
      coachRating: 0,
      coachTotalSessions: 0,
      coachBio: '',
      coachExperience: '',
      coachAvailability: '',
      coachImage: '',
      coachAdminNotes: '',
      certificationName: '',
      certificationImageUrl: '',
    });
  };

  const coachInitials = (name) =>
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'C';


  return (
    <div className="coachPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Coaches</h1>
          <p>Manage your fitness professionals.</p>
        </div>
        <button type="button" className="fu-btn fu-btn--primary coachPg__addBtn" onClick={() => setAddOpen(true)}>
          Add Coach
        </button>
      </header>

      <div className="coachPg__grid">
        {rows.map((c) => (
          <article key={c.key} className="fu-card coachPg__card">
            <div className="coachPg__head">
              <div className="coachPg__avatar">
                {c.coachImage ? (
                  <img src={c.coachImage} alt={`${c.coachName} profile`} className="coachPg__avatarImg" />
                ) : (
                  coachInitials(c.coachName)
                )}
              </div>
              <div>
                <h3>{c.coachName}</h3>
                <p className="coachPg__specialty">{c.coachSpecialty}</p>
                <p className="coachPg__rating">
                  <span>★</span> {Number(c.coachRating || 0).toFixed(1)} ({c.coachTotalSessions || 0}{' '}
                  sessions)
                </p>
              </div>
            </div>

            <div className="coachPg__meta">
              <p>
                <span>Gym + FITUP ID</span>
                <strong>{c.coachId}</strong>
              </p>
              <p>
                <span>Sessions/week</span>
                <strong>{c.coachSessionsPerWeek || 0}</strong>
              </p>
              <p>
                <span>Email</span>
                <strong>{c.coachEmail}</strong>
              </p>
              <p>
                <span>Phone</span>
                <strong>{c.coachPhone}</strong>
              </p>
              <p>
                <span>Certifications</span>
                <strong>{(c.coachCertifications || []).map((x) => x.name).filter(Boolean).join('  ') || '—'}</strong>
              </p>
            </div>

            <div className="coachPg__cardActions">
              <button
                type="button"
                className="fu-btn coachPg__viewBtn"
                onClick={() => {
                  setProfileMode('view');
                  setSelectedCoachId(c.key);
                }}
              >
                View Profile
              </button>
              <button
                type="button"
                className="fu-btn fu-btn--primary coachPg__scheduleBtn"
                onClick={() => {
                  if (isFitupDemo) {
                    setProfileMode('view');
                    setSelectedCoachId(c.key);
                    setActionModal({
                      open: true,
                      type: 'complaint',
                      text: '',
                    });
                    return;
                  }
                  setProfileMode('edit');
                  setSelectedCoachId(c.key);
                }}
              >
                {isFitupDemo ? 'Flag Coach' : 'Edit Profile'}
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 ? <p className="coachPg__empty">No coaches found.</p> : null}
      </div>

      <Modal
        open={!!selected}
        title={!isFitupDemo && profileMode === 'edit' ? 'Edit Coach Profile' : 'Coach Profile'}
        onClose={() => {
          setSelectedCoachId(null);
          setProfileMode('view');
        }}
        modalClassName="coachPg__modal"
        footer={
          <button type="button" className="fu-btn" onClick={() => setSelectedCoachId(null)}>
            Close
          </button>
        }
      >
        {selected && (
          <div className="coachPg__profile">
            <p className="coachPg__sub">View detailed information about the coach.</p>
            <section className="coachPg__profileTop">
              <div className="coachPg__profileAvatar">
                {selected.coachImage ? (
                  <img
                    src={selected.coachImage}
                    alt={`${selected.coachName} profile`}
                    className="coachPg__profileAvatarImg"
                  />
                ) : (
                  coachInitials(selected.coachName)
                )}
              </div>
              <div>
                <h3 className="coachPg__profileName">{selected.coachName}</h3>
                <p className="coachPg__profileSpecialty">{selected.coachSpecialty || '—'}</p>
                <p className="coachPg__profileRating">
                  <span>★</span> {Number(selected.coachRating || 0).toFixed(1)} ({selected.coachTotalSessions || 0}{' '}
                  sessions)
                </p>
              </div>
            </section>

            <div className="coachPg__profileStats">
              <div className="coachPg__statRow">
                <span>🗓 Sessions/week</span>
                <strong>{selected.coachSessionsPerWeek || 0}</strong>
              </div>
              <div className="coachPg__statRow">
                <span>✉ {selected.coachEmail}</span>
              </div>
              <div className="coachPg__statRow">
                <span>📞 {selected.coachPhone}</span>
              </div>
              <div className="coachPg__statRow">
                <span>⌁ Gym + FITUP ID</span>
                <strong>{selected.coachId}</strong>
              </div>
              <div className="coachPg__statRow">
                <span>Status</span>
                <strong>{selected.coachRestricted ? 'Restricted' : 'Active'}</strong>
              </div>
              <div className="coachPg__statRow">
                <span>Gyms</span>
                <strong>{gymsCount}</strong>
              </div>
              <div className="coachPg__statRow">
                <span>Complaints</span>
                <strong>{selected.coachComplaints.length}</strong>
              </div>
              <div className="coachPg__statRow">
                <span>Restricted before</span>
                <strong>{restrictedCount > 0 ? 'Yes' : 'No'} ({restrictedCount})</strong>
              </div>
            </div>
            {!isFitupDemo && profileMode === 'edit' ? (
              <div className="coachPg__editGrid">
                <label className="fu-label">Name</label>
                <input
                  className="fu-input"
                  value={editForm.coachName}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachName: e.target.value }))}
                />
                <label className="fu-label">Email</label>
                <input
                  className="fu-input"
                  value={editForm.coachEmail}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachEmail: e.target.value }))}
                />
                <label className="fu-label">Phone</label>
                <input
                  className="fu-input"
                  value={editForm.coachPhone}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachPhone: e.target.value }))}
                />
                <label className="fu-label">Specialty</label>
                <input
                  className="fu-input"
                  value={editForm.coachSpecialty}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachSpecialty: e.target.value }))}
                />
                <label className="fu-label">Sessions/week</label>
                <input
                  className="fu-input"
                  type="number"
                  min="0"
                  value={editForm.coachSessionsPerWeek}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, coachSessionsPerWeek: Number(e.target.value) || 0 }))
                  }
                />
                <label className="fu-label">Rating</label>
                <input
                  className="fu-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.coachRating}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, coachRating: Number(e.target.value) || 0 }))
                  }
                />
                <label className="fu-label">Total sessions</label>
                <input
                  className="fu-input"
                  type="number"
                  min="0"
                  value={editForm.coachTotalSessions}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, coachTotalSessions: Number(e.target.value) || 0 }))
                  }
                />
                <label className="fu-label">Experience</label>
                <input
                  className="fu-input"
                  value={editForm.coachExperience}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachExperience: e.target.value }))}
                />
                <label className="fu-label">Availability</label>
                <select
                  className="fu-select"
                  value={editForm.coachAvailability}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachAvailability: e.target.value }))}
                >
                  <option value="">Select availability</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Weekends">Weekends</option>
                  <option value="Evenings">Evenings</option>
                  <option value="Flexible">Flexible</option>
                </select>
                <label className="fu-label">Coach image URL</label>
                <input
                  className="fu-input"
                  value={editForm.coachImage}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachImage: e.target.value }))}
                  placeholder="https://..."
                />
                <label className="fu-label">Upload coach image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="fu-input"
                  onChange={(e) => handleCoachImageUpload(e.target.files?.[0])}
                />
                <label className="fu-label">Bio</label>
                <textarea
                  className="fu-input coachPg__fieldBig"
                  rows={4}
                  value={editForm.coachBio}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachBio: e.target.value }))}
                />
                <label className="fu-label">Admin notes</label>
                <textarea
                  className="fu-input"
                  rows={3}
                  value={editForm.coachAdminNotes}
                  onChange={(e) => setEditForm((p) => ({ ...p, coachAdminNotes: e.target.value }))}
                  placeholder="Write notes about this coach..."
                />
                <button type="button" className="fu-btn fu-btn--primary" onClick={saveCoachProfile}>
                  Save profile updates
                </button>
              </div>
            ) : (
              <div className="coachPg__viewOnly">
                <p><strong>Bio:</strong> {selected.coachBio || '—'}</p>
                <p><strong>Experience:</strong> {selected.coachExperience || '—'}</p>
                <p><strong>Availability:</strong> {selected.coachAvailability || '—'}</p>
                <p><strong>Admin notes:</strong> {selected.members?.[0]?.profile?.coachAdminNotes || '—'}</p>
              </div>
            )}
            <p>
              <strong>Certifications:</strong>
            </p>
            {!isFitupDemo && profileMode === 'edit' ? (
              <div className="coachPg__certAdd">
                <input
                  className="fu-input"
                  placeholder="Certificate name"
                  value={certForm.name}
                  onChange={(e) => setCertForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="fu-input"
                  onChange={(e) => handleCertImageUpload(e.target.files?.[0])}
                />
                <button type="button" className="fu-btn fu-btn--primary" onClick={addCertification}>
                  Add certificate
                </button>
              </div>
            ) : null}
            <div className="coachPg__chips">
              {(selected.coachCertifications || []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="coachPg__chip"
                  onClick={() => openCertificate(c.imageUrl)}
                  title={c.imageUrl ? 'Open certificate image' : 'No image attached'}
                >
                  {c.name || 'Certificate'}
                </button>
              ))}
            </div>
            <div className="coachPg__certGrid">
              {(selected.coachCertifications || [])
                .filter((c) => c.imageUrl)
                .map((c) => (
                  <button
                    key={`${c.id}_img`}
                    type="button"
                    className="coachPg__certThumbWrap"
                    onClick={() => openCertificate(c.imageUrl)}
                  >
                    <img
                      className="coachPg__certThumb"
                      src={c.imageUrl}
                      alt={`${c.name || 'Certificate'} proof`}
                    />
                  </button>
                ))}
            </div>
            <p>
              <strong>Gym work history:</strong>
            </p>
            {selected.gymWorkHistory.length ? (
              <ul className="coachPg__members">
                {selected.gymWorkHistory.map((w) => (
                  <li key={`${w.gymId}_${w.startedAt}`}>
                    {branchLabel(w.gymId)} - from{' '}
                    {w.startedAt ? new Date(w.startedAt).toLocaleDateString() : '—'} to{' '}
                    {w.endedAt ? new Date(w.endedAt).toLocaleDateString() : 'Present'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No gym history found.</p>
            )}
            <p>
              <strong>Coach complaints:</strong>
            </p>
            {selected.coachComplaints.length ? (
              <ul className="coachPg__members">
                {selected.coachComplaints.map((c) => (
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
              <strong>Action history:</strong>
            </p>
            {selected.coachActionHistory.length ? (
              <ul className="coachPg__members">
                {selected.coachActionHistory.map((h) => (
                  <li key={h.id}>
                    {h.type || 'action'} - {h.note || '—'}{' '}
                    {h.at ? new Date(h.at).toLocaleString() : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
            {isFitupDemo || profileMode === 'edit' ? (
            <div className="coachPg__actions">
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({
                    open: true,
                    type: 'restrict',
                    text: '',
                  });
                }}
              >
                Restrict coach
              </button>
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({
                    open: true,
                    type: 'unrestrict',
                    text: '',
                  });
                }}
              >
                Unrestrict coach
              </button>
              <button
                type="button"
                className="fu-btn fu-btn--ghost"
                onClick={() => {
                  setActionModal({
                    open: true,
                    type: 'complaint',
                    text: '',
                  });
                }}
              >
                Flag coach
              </button>
              <button
                type="button"
                className="fu-btn coachPg__danger"
                onClick={() => {
                  if (!window.confirm('Delete this coach from FITUP records?')) return;
                  moderateCoach(selected.key, 'delete', {
                    reason: 'Deleted by FITUP admin',
                  });
                  setSelectedCoachId(null);
                }}
              >
                Delete coach
              </button>
            </div>
            ) : null}
          </div>
        )}
      </Modal>
      <Modal
        open={addOpen}
        title="Add Coach"
        onClose={() => setAddOpen(false)}
        footer={
          <button type="submit" form="coachPg-add-form" className="fu-btn fu-btn--primary">
            Create coach
          </button>
        }
      >
        <form id="coachPg-add-form" className="coachPg__editGrid" onSubmit={submitAddCoach}>
          <p className="coachPg__branchHint">
            {activeBranch ? (
              <>
                New coach is added to <strong>{activeBranch.brandName || activeBranch.legalName}</strong>. Change branch from
                the top bar.
              </>
            ) : (
              <>No branches configured — coach is linked to the default gym only.</>
            )}
          </p>
          <label className="fu-label">Coach name</label>
          <input className="fu-input" required value={addForm.coachName} onChange={(e) => setAddForm((p) => ({ ...p, coachName: e.target.value }))} />
          <label className="fu-label">Coach email</label>
          <input className="fu-input" required value={addForm.coachEmail} onChange={(e) => setAddForm((p) => ({ ...p, coachEmail: e.target.value }))} />
          <label className="fu-label">Phone</label>
          <input className="fu-input" value={addForm.coachPhone} onChange={(e) => setAddForm((p) => ({ ...p, coachPhone: e.target.value }))} />
          <label className="fu-label">Specialty</label>
          <input className="fu-input" value={addForm.coachSpecialty} onChange={(e) => setAddForm((p) => ({ ...p, coachSpecialty: e.target.value }))} />
          <label className="fu-label">Sessions/week</label>
          <input type="number" min="0" className="fu-input" value={addForm.coachSessionsPerWeek} onChange={(e) => setAddForm((p) => ({ ...p, coachSessionsPerWeek: Number(e.target.value) || 0 }))} />
          <label className="fu-label">Rating</label>
          <input type="number" min="0" step="0.1" className="fu-input" value={addForm.coachRating} onChange={(e) => setAddForm((p) => ({ ...p, coachRating: Number(e.target.value) || 0 }))} />
          <label className="fu-label">Total sessions</label>
          <input type="number" min="0" className="fu-input" value={addForm.coachTotalSessions} onChange={(e) => setAddForm((p) => ({ ...p, coachTotalSessions: Number(e.target.value) || 0 }))} />
          <label className="fu-label">Experience</label>
          <input className="fu-input" value={addForm.coachExperience} onChange={(e) => setAddForm((p) => ({ ...p, coachExperience: e.target.value }))} />
          <label className="fu-label">Availability</label>
          <input className="fu-input" value={addForm.coachAvailability} onChange={(e) => setAddForm((p) => ({ ...p, coachAvailability: e.target.value }))} />
          <label className="fu-label">Coach image URL</label>
          <input className="fu-input" value={addForm.coachImage} onChange={(e) => setAddForm((p) => ({ ...p, coachImage: e.target.value }))} />
          <label className="fu-label">Upload coach image</label>
          <input type="file" accept="image/*" className="fu-input" onChange={(e) => handleAddCoachImageUpload(e.target.files?.[0])} />
          <label className="fu-label">Certification name</label>
          <input className="fu-input" value={addForm.certificationName} onChange={(e) => setAddForm((p) => ({ ...p, certificationName: e.target.value }))} />
          <label className="fu-label">Certification image URL</label>
          <input className="fu-input" value={addForm.certificationImageUrl} onChange={(e) => setAddForm((p) => ({ ...p, certificationImageUrl: e.target.value }))} />
          <label className="fu-label">Upload certification image</label>
          <input type="file" accept="image/*" className="fu-input" onChange={(e) => handleAddCertificationImageUpload(e.target.files?.[0])} />
          <label className="fu-label">Bio</label>
          <textarea className="fu-input" rows={3} value={addForm.coachBio} onChange={(e) => setAddForm((p) => ({ ...p, coachBio: e.target.value }))} />
          <label className="fu-label">Admin notes</label>
          <textarea className="fu-input" rows={3} value={addForm.coachAdminNotes} onChange={(e) => setAddForm((p) => ({ ...p, coachAdminNotes: e.target.value }))} />
        </form>
      </Modal>
      <Modal
        open={actionModal.open}
        title={
          actionModal.type === 'complaint'
            ? 'File Coach Complaint'
            : actionModal.type === 'unrestrict'
              ? 'Unrestrict Coach'
              : 'Restrict Coach'
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
            <button type="button" className="fu-btn fu-btn--primary" onClick={submitCoachAction}>
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
              : 'Why are you restricting this coach?'}
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
