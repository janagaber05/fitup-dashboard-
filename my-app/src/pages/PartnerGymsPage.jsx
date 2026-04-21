import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './PartnerGymsPage.css';

export default function PartnerGymsPage() {
  const { partnerGyms, updatePartnerGym, addPartnerGym, authRole } = useFitupAdmin();
  const ctx = useOutletContext() || {};
  const selectedBranchId = String(ctx.selectedBranchId || '').trim();
  const [selectedId, setSelectedId] = useState(null);
  const [profileGymName, setProfileGymName] = useState('');
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addBranchTargetGymName, setAddBranchTargetGymName] = useState('');
  const emptyAddBranchForm = () => ({
    brandName: '',
    branchAddress: '',
    contactPhone: '',
    contactEmail: '',
    branchMembers: '0',
    branchCoaches: '0',
    onboardingStatus: 'pending',
    contractSigned: false,
    managerName: '',
    openingHours: '',
    monthlyRevenue: '',
    facilities: '',
    branchEquipment: '',
    gymSpaceSqft: '',
    classroomCount: '',
    classroomSpaceSqft: '',
    capacity: '500',
    yearEstablished: '',
  });
  const [addBranchForm, setAddBranchForm] = useState(emptyAddBranchForm);
  const gymNameKey = (gym) =>
    String(gym?.legalName || gym?.brandName || 'Unnamed Gym')
      .trim()
      .toLowerCase();

  const rows = useMemo(
    () =>
      [...partnerGyms].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [partnerGyms]
  );
  const visibleRows = useMemo(() => {
    if (authRole !== 'gym') return rows;
    const selectedBranch =
      rows.find((r) => String(r.id) === selectedBranchId) || rows[0] || null;
    if (!selectedBranch) return [];
    const selectedGymKey = gymNameKey(selectedBranch);
    return rows.filter((r) => gymNameKey(r) === selectedGymKey);
  }, [rows, authRole, selectedBranchId]);
  const selected = visibleRows.find((r) => r.id === selectedId) || null;
  const selectedGymBranches = useMemo(() => {
    if (!selected) return [];
    const key = gymNameKey(selected);
    return visibleRows
      .filter((r) => gymNameKey(r) === key)
      .sort((a, b) =>
        String(a.brandName || a.legalName || a.id).localeCompare(
          String(b.brandName || b.legalName || b.id)
        )
      );
  }, [visibleRows, selected]);
  const gymProfiles = useMemo(() => {
    const byGym = new Map();
    visibleRows.forEach((branch) => {
      const gymName = String(branch.legalName || branch.brandName || 'Unnamed Gym').trim();
      const key = gymName.toLowerCase();
      if (!byGym.has(key)) {
        byGym.set(key, {
          gymName,
          branches: [],
        });
      }
      byGym.get(key).branches.push(branch);
    });
    return [...byGym.values()]
      .map((g) => {
        const official = g.branches.find(
          (b) =>
            String(b.contactName || '').trim() ||
            String(b.managerName || '').trim() ||
            String(b.contactEmail || '').trim() ||
            String(b.contactPhone || '').trim()
        );
        const branchCount = g.branches.length;
        const members = g.branches.reduce((sum, b) => sum + (Number(b.branchMembers) || 0), 0);
        const coaches = g.branches.reduce((sum, b) => sum + (Number(b.branchCoaches) || 0), 0);
        return {
          ...g,
          branchCount,
          members,
          coaches,
          gymAccountId: String(g.branches[0]?.gymAccountId || g.branches[0]?.id || '').trim() || '—',
          openingHours: String(g.branches[0]?.openingHours || '').trim() || '—',
          yearEstablished: Number(g.branches[0]?.yearEstablished) || null,
          monthlyRevenue: Number(g.branches[0]?.monthlyRevenue) || 0,
          billingAmount: Number(g.branches[0]?.billingAmount) || 0,
          billingCurrency: String(g.branches[0]?.billingCurrency || 'USD').trim(),
          billingCycle: String(g.branches[0]?.billingCycle || 'monthly').trim(),
          paymentStatus: String(g.branches[0]?.paymentStatus || 'pending').trim(),
          paymentMethod: String(g.branches[0]?.paymentMethod || 'bank_transfer')
            .replace(/_/g, ' ')
            .trim(),
          contractSigned: !!g.branches[0]?.contractSigned,
          contractStart: String(g.branches[0]?.contractStart || '').trim() || '—',
          contractEnd: String(g.branches[0]?.contractEnd || '').trim() || '—',
          contractFileName: String(g.branches[0]?.contractFileName || '').trim() || '—',
          contractFileDataUrl: String(g.branches[0]?.contractFileDataUrl || '').trim(),
          onboardingStatus: String(g.branches[0]?.onboardingStatus || 'pending').trim(),
          website: String(g.branches[0]?.website || '').trim() || '—',
          companySize: String(g.branches[0]?.companySize || '').trim() || '—',
          hasEms: !!g.branches[0]?.hasEms,
          gymSpaceSqft: Number(g.branches[0]?.gymSpaceSqft) || 0,
          classroomCount: Number(g.branches[0]?.classroomCount) || 0,
          classroomSpaceSqft: Number(g.branches[0]?.classroomSpaceSqft) || 0,
          capacity: Number(g.branches[0]?.capacity) || 0,
          facilities: String(g.branches[0]?.facilities || '').trim() || '—',
          branchEquipment: String(g.branches[0]?.branchEquipment || '').trim() || '—',
          notes: String(g.branches[0]?.notes || '').trim() || '—',
          restriction: g.branches[0]?.restricted ? 'Restricted' : 'Active',
          complaintStatus: String(g.branches[0]?.complaintStatus || 'none').replace(/_/g, ' '),
          complaintNote: String(g.branches[0]?.complaintNote || '').trim() || '—',
          restrictionNote: String(g.branches[0]?.restrictionNote || '').trim() || '—',
          officialName: String(official?.contactName || official?.managerName || '').trim() || '—',
          officialEmail: String(official?.contactEmail || '').trim() || '—',
          officialPhone: String(official?.contactPhone || '').trim() || '—',
          branchAddresses: g.branches
            .map((b) => String(b.branchAddress || '').trim())
            .filter(Boolean),
        };
      })
      .sort((a, b) => a.gymName.localeCompare(b.gymName));
  }, [visibleRows]);
  const selectedProfile =
    gymProfiles.find((g) => g.gymName === profileGymName) || null;

  const submitAddBranch = (e) => {
    e.preventDefault();
    const name = String(addBranchForm.brandName || '').trim();
    if (!name) return;
    const contractSigned = !!addBranchForm.contractSigned;
    const onboardingStatus = contractSigned
      ? addBranchForm.onboardingStatus || 'active'
      : 'pending';
    const targetGymName = String(addBranchTargetGymName || '').trim();
    const created = addPartnerGym({
      brandName: name,
      legalName: targetGymName || name,
      branchAddress: addBranchForm.branchAddress,
      contactPhone: addBranchForm.contactPhone,
      contactEmail: addBranchForm.contactEmail,
      contactName: addBranchForm.managerName,
      branchMembers: addBranchForm.branchMembers,
      branchCoaches: addBranchForm.branchCoaches,
      managerName: addBranchForm.managerName,
      openingHours: addBranchForm.openingHours,
      monthlyRevenue: addBranchForm.monthlyRevenue,
      facilities: addBranchForm.facilities,
      branchEquipment: addBranchForm.branchEquipment,
      gymSpaceSqft: addBranchForm.gymSpaceSqft,
      classroomCount: addBranchForm.classroomCount,
      classroomSpaceSqft: addBranchForm.classroomSpaceSqft,
      capacity: addBranchForm.capacity,
      yearEstablished: addBranchForm.yearEstablished,
      contractSigned,
      onboardingStatus,
    });
    setAddBranchForm(emptyAddBranchForm());
    setAddBranchTargetGymName('');
    setAddBranchOpen(false);
    if (created?.id) setSelectedId(created.id);
  };

  const submitManageBranch = (e) => {
    e.preventDefault();
    if (!selected) return;
    const current = partnerGyms.find((g) => g.id === selected.id);
    if (current && !current.contractSigned && current.onboardingStatus !== 'pending') {
      updatePartnerGym(selected.id, { onboardingStatus: 'pending' });
    }
    setSelectedId(null);
  };

  const handleManageContractUpload = (file) => {
    if (!selected || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updatePartnerGym(selected.id, {
        contractFileName: file.name || '',
        contractFileDataUrl: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pgymPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Gyms</h1>
          <p>
            {authRole === 'gym'
              ? 'Manage your gym branches and branch details.'
              : 'Track gym profiles, branch counts, and official contacts.'}
          </p>
        </div>
        <button type="button" className="fu-btn fu-btn--primary" onClick={() => setAddBranchOpen(true)}>
          Add Branch
        </button>
      </header>

      <section className="pgymPg__overviewGrid">
        <article className="fu-card pgymPg__overviewCard">
          <p className="pgymPg__overviewLabel">Total gyms</p>
          <p className="pgymPg__overviewValue">{gymProfiles.length}</p>
        </article>
        <article className="fu-card pgymPg__overviewCard">
          <p className="pgymPg__overviewLabel">Total branches</p>
          <p className="pgymPg__overviewValue">{visibleRows.length}</p>
        </article>
        <article className="fu-card pgymPg__overviewCard">
          <p className="pgymPg__overviewLabel">Official contacts</p>
          <p className="pgymPg__overviewValue">
            {gymProfiles.filter((g) => g.officialName !== '—').length}
          </p>
        </article>
      </section>

      <section className="pgymPg__gymGrid">
        {gymProfiles.map((g) => (
          <article key={g.gymName} className="fu-card pgymPg__gymCard">
            <h2>{g.gymName}</h2>
            <p className="pgymPg__gymMeta">
              {g.branchCount} branch{g.branchCount === 1 ? '' : 'es'} · {g.members} members · {g.coaches}{' '}
              coaches
            </p>
            <p className="pgymPg__gymId">Gym ID: {g.gymAccountId}</p>
            <div className="pgymPg__gymCardActions">
              <button
                type="button"
                className="fu-btn pgymPg__manageBtn"
                onClick={() => setProfileGymName(g.gymName)}
              >
                Open Profile
              </button>
              <button
                type="button"
                className="fu-btn pgymPg__manageBtn"
                onClick={() => setSelectedId(g.branches[0]?.id || null)}
              >
                Manage Gym
              </button>
              <button
                type="button"
                className="fu-btn pgymPg__manageBtn"
                onClick={() => {
                  setAddBranchTargetGymName(g.gymName);
                  setAddBranchForm((prev) => ({
                    ...prev,
                    brandName: '',
                  }));
                  setAddBranchOpen(true);
                }}
              >
                Add Branch to Gym
              </button>
            </div>
          </article>
        ))}
      </section>

      <Modal
        open={!!selectedProfile}
        title={selectedProfile ? `${selectedProfile.gymName} profile` : 'Gym profile'}
        subtitle="Full gym profile details"
        modalClassName="fu-modal--wide"
        onClose={() => setProfileGymName('')}
      >
        {selectedProfile ? (
          <>
            <dl className="pgymPg__gymContact">
              <div><dt>Official person</dt><dd>{selectedProfile.officialName}</dd></div>
              <div><dt>Email</dt><dd>{selectedProfile.officialEmail}</dd></div>
              <div><dt>Phone</dt><dd>{selectedProfile.officialPhone}</dd></div>
            </dl>
            <dl className="pgymPg__gymDetails">
              <div><dt>Onboarding status</dt><dd>{selectedProfile.onboardingStatus}</dd></div>
              <div><dt>Opening hours</dt><dd>{selectedProfile.openingHours}</dd></div>
              <div><dt>Established</dt><dd>{selectedProfile.yearEstablished || '—'}</dd></div>
              <div><dt>Monthly revenue</dt><dd>{selectedProfile.billingCurrency} {Number(selectedProfile.monthlyRevenue || 0).toLocaleString()}</dd></div>
              <div><dt>Billing</dt><dd>{selectedProfile.billingCurrency} {Number(selectedProfile.billingAmount || 0).toLocaleString()} / {selectedProfile.billingCycle}</dd></div>
              <div><dt>Payment status</dt><dd>{selectedProfile.paymentStatus}</dd></div>
              <div><dt>Payment method</dt><dd>{selectedProfile.paymentMethod}</dd></div>
              <div><dt>Contract</dt><dd>{selectedProfile.contractSigned ? 'Signed' : 'Not signed'}</dd></div>
              <div><dt>Contract period</dt><dd>{selectedProfile.contractStart} - {selectedProfile.contractEnd}</dd></div>
              <div className="pgymPg__gymDetailsWide">
                <dt>Contract file</dt>
                <dd>
                  {selectedProfile.contractFileDataUrl ? (
                    <a
                      className="pgymPg__contractLink"
                      href={selectedProfile.contractFileDataUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedProfile.contractFileName || 'View contract file'}
                    </a>
                  ) : (
                    selectedProfile.contractFileName
                  )}
                </dd>
              </div>
              <div><dt>Website</dt><dd>{selectedProfile.website}</dd></div>
              <div><dt>Company size</dt><dd>{selectedProfile.companySize}</dd></div>
              <div><dt>EMS availability</dt><dd>{selectedProfile.hasEms ? 'Yes' : 'No'}</dd></div>
              <div><dt>Gym space</dt><dd>{selectedProfile.gymSpaceSqft ? `${selectedProfile.gymSpaceSqft.toLocaleString()} sq ft` : '—'}</dd></div>
              <div><dt>Classrooms</dt><dd>{selectedProfile.classroomCount || 0}{selectedProfile.classroomSpaceSqft ? ` · ${selectedProfile.classroomSpaceSqft.toLocaleString()} sq ft` : ''}</dd></div>
              <div><dt>Capacity</dt><dd>{selectedProfile.capacity ? selectedProfile.capacity.toLocaleString() : '—'}</dd></div>
              <div><dt>Restriction</dt><dd>{selectedProfile.restriction}</dd></div>
              <div><dt>Restriction note</dt><dd>{selectedProfile.restrictionNote}</dd></div>
              <div><dt>Complaint status</dt><dd>{selectedProfile.complaintStatus}</dd></div>
              <div><dt>Complaint note</dt><dd>{selectedProfile.complaintNote}</dd></div>
              <div className="pgymPg__gymDetailsWide"><dt>Facilities</dt><dd>{selectedProfile.facilities}</dd></div>
              <div className="pgymPg__gymDetailsWide"><dt>Equipment</dt><dd>{selectedProfile.branchEquipment}</dd></div>
              <div className="pgymPg__gymDetailsWide"><dt>Notes</dt><dd>{selectedProfile.notes}</dd></div>
            </dl>
            <div className="pgymPg__branchMiniList">
              <p className="pgymPg__branchMiniTitle">
                Branch profile{selectedProfile.branchCount === 1 ? '' : 's'}
              </p>
              <ul>
                {selectedProfile.branches.map((b) => (
                  <li key={b.id}>
                    <strong>{b.brandName || b.legalName || 'Branch'}</strong>
                    <span>{b.branchAddress || '—'}</span>
                    <small>
                      Status: {b.onboardingStatus || 'pending'} · Contact:{' '}
                      {b.contactName || b.managerName || '—'}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={addBranchOpen}
        title={addBranchTargetGymName ? `Add Branch · ${addBranchTargetGymName}` : 'Add Branch'}
        subtitle={
          addBranchTargetGymName
            ? 'Add a new branch under this existing gym.'
            : 'Add a new branch to create a gym.'
        }
        modalClassName="fu-modal--wide"
        onClose={() => {
          setAddBranchOpen(false);
          setAddBranchTargetGymName('');
        }}
        footer={
          <button type="submit" form="pgym-add-branch-form" className="fu-btn fu-btn--primary">
            Add Branch
          </button>
        }
      >
        <form id="pgym-add-branch-form" className="pgymPg__manageForm pgymPg__addBranchForm" onSubmit={submitAddBranch}>
          {addBranchTargetGymName ? (
            <>
              <label className="pgymPg__fieldLabel">Target gym</label>
              <input className="fu-input" value={addBranchTargetGymName} disabled />
            </>
          ) : null}
          <label className="pgymPg__fieldLabel">Name</label>
          <input
            className="fu-input"
            value={addBranchForm.brandName}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, brandName: e.target.value }))}
            placeholder="Branch name"
            required
          />

          <label className="pgymPg__fieldLabel">Address</label>
          <input
            className="fu-input"
            value={addBranchForm.branchAddress}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, branchAddress: e.target.value }))}
            placeholder="Street, city"
          />

          <label className="pgymPg__fieldLabel">Phone</label>
          <input
            className="fu-input"
            value={addBranchForm.contactPhone}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, contactPhone: e.target.value }))}
            placeholder="+1 …"
          />

          <label className="pgymPg__fieldLabel">Email</label>
          <input
            type="email"
            className="fu-input"
            value={addBranchForm.contactEmail}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, contactEmail: e.target.value }))}
            placeholder="branch@example.com"
          />

          <label className="pgymPg__fieldLabel">Members</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.branchMembers}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, branchMembers: e.target.value }))}
          />

          <label className="pgymPg__fieldLabel">Coaches</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.branchCoaches}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, branchCoaches: e.target.value }))}
          />

          <label className="pgymPg__fieldLabel">Status</label>
          <select
            className="fu-select"
            value={addBranchForm.onboardingStatus}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, onboardingStatus: e.target.value }))}
            disabled={!addBranchForm.contractSigned}
          >
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="churned">churned</option>
          </select>

          <label className="pgymPg__fieldLabel">Contract signed</label>
          <select
            className="fu-select"
            value={addBranchForm.contractSigned ? 'yes' : 'no'}
            onChange={(e) => {
              const yes = e.target.value === 'yes';
              setAddBranchForm((f) => ({
                ...f,
                contractSigned: yes,
                onboardingStatus: yes ? f.onboardingStatus : 'pending',
              }));
            }}
          >
            <option value="no">no</option>
            <option value="yes">yes</option>
          </select>

          <p className="pgymPg__addBranchHint">
            Status stays pending until the contract is signed; then you can set active.
          </p>

          <label className="pgymPg__fieldLabel">Manager</label>
          <input
            className="fu-input"
            value={addBranchForm.managerName}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, managerName: e.target.value }))}
            placeholder="Manager name"
          />

          <label className="pgymPg__fieldLabel">Opening Hours</label>
          <input
            className="fu-input"
            value={addBranchForm.openingHours}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, openingHours: e.target.value }))}
            placeholder="e.g. Mon–Fri 6AM–10PM"
          />

          <label className="pgymPg__fieldLabel">Monthly Revenue</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.monthlyRevenue}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, monthlyRevenue: e.target.value }))}
            placeholder="0"
          />

          <label className="pgymPg__fieldLabel">Facilities</label>
          <textarea
            className="fu-input"
            rows={4}
            value={addBranchForm.facilities}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, facilities: e.target.value }))}
            placeholder="Sauna, pool, studios, locker rooms…"
          />

          <label className="pgymPg__fieldLabel">Equipment</label>
          <textarea
            className="fu-input"
            rows={3}
            value={addBranchForm.branchEquipment}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, branchEquipment: e.target.value }))}
            placeholder="Treadmills, racks, dumbbells, rowers…"
          />

          <label className="pgymPg__fieldLabel">Gym floor space (sq ft)</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.gymSpaceSqft}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, gymSpaceSqft: e.target.value }))}
            placeholder="Total training floor"
          />

          <label className="pgymPg__fieldLabel">Classrooms</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.classroomCount}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, classroomCount: e.target.value }))}
            placeholder="Number of class / studio rooms"
          />

          <label className="pgymPg__fieldLabel">Classroom space (sq ft)</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.classroomSpaceSqft}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, classroomSpaceSqft: e.target.value }))}
            placeholder="Total classroom area (optional)"
          />

          <label className="pgymPg__fieldLabel">Capacity</label>
          <input
            className="fu-input"
            type="number"
            min="0"
            value={addBranchForm.capacity}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, capacity: e.target.value }))}
          />

          <label className="pgymPg__fieldLabel">Year Established</label>
          <input
            className="fu-input"
            type="number"
            min="1900"
            max="2100"
            value={addBranchForm.yearEstablished}
            onChange={(e) => setAddBranchForm((f) => ({ ...f, yearEstablished: e.target.value }))}
            placeholder="e.g. 2018"
          />
        </form>
      </Modal>

      <Modal
        open={!!selected}
        title="Manage Gym & Branches"
        onClose={() => setSelectedId(null)}
        footer={
          <button type="submit" form="pgym-manage-form" className="fu-btn fu-btn--primary">
            Save updates
          </button>
        }
      >
        {selected && (
          <form id="pgym-manage-form" className="pgymPg__manageForm" onSubmit={submitManageBranch}>
            <p className="pgymPg__manageSub">
              Manage full gym details. If this gym has multiple branches, select a branch and edit it.
            </p>

            {selectedGymBranches.length > 1 ? (
              <>
                <label className="pgymPg__fieldLabel">Branch selector</label>
                <select
                  className="fu-select"
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {selectedGymBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brandName || b.legalName || 'Branch'} ({b.branchAddress || 'No address'})
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <label className="pgymPg__fieldLabel">Gym ID</label>
            <input className="fu-input" value={selected.gymAccountId || selected.id} disabled />

            <label className="pgymPg__fieldLabel">Legal name</label>
            <input
              className="fu-input"
              value={selected.legalName || ''}
              onChange={(e) => updatePartnerGym(selected.id, { legalName: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Branch name</label>
            <input
              className="fu-input"
              value={selected.brandName || ''}
              onChange={(e) => updatePartnerGym(selected.id, { brandName: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Address</label>
            <input
              className="fu-input"
              value={selected.branchAddress || ''}
              onChange={(e) => updatePartnerGym(selected.id, { branchAddress: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Website</label>
            <input
              className="fu-input"
              value={selected.website || ''}
              onChange={(e) => updatePartnerGym(selected.id, { website: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Contact name</label>
            <input
              className="fu-input"
              value={selected.contactName || selected.managerName || ''}
              onChange={(e) =>
                updatePartnerGym(selected.id, {
                  contactName: e.target.value,
                  managerName: e.target.value,
                })
              }
            />

            <label className="pgymPg__fieldLabel">Contact email</label>
            <input
              type="email"
              className="fu-input"
              value={selected.contactEmail || ''}
              onChange={(e) => updatePartnerGym(selected.id, { contactEmail: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Contact phone</label>
            <input
              className="fu-input"
              value={selected.contactPhone || ''}
              onChange={(e) => updatePartnerGym(selected.id, { contactPhone: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Payment status</label>
            <select
              className="fu-select"
              value={selected.paymentStatus || 'pending'}
              onChange={(e) => updatePartnerGym(selected.id, { paymentStatus: e.target.value })}
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
              <option value="failed">failed</option>
            </select>

            <label className="pgymPg__fieldLabel">Billing amount</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.billingAmount ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { billingAmount: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Billing cycle</label>
            <select
              className="fu-select"
              value={selected.billingCycle || 'monthly'}
              onChange={(e) => updatePartnerGym(selected.id, { billingCycle: e.target.value })}
            >
              <option value="monthly">monthly</option>
              <option value="quarterly">quarterly</option>
              <option value="yearly">yearly</option>
            </select>

            <label className="pgymPg__fieldLabel">Billing currency</label>
            <input
              className="fu-input"
              value={selected.billingCurrency || 'USD'}
              onChange={(e) => updatePartnerGym(selected.id, { billingCurrency: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Payment method</label>
            <select
              className="fu-select"
              value={selected.paymentMethod || 'bank_transfer'}
              onChange={(e) => updatePartnerGym(selected.id, { paymentMethod: e.target.value })}
            >
              <option value="bank_transfer">bank transfer</option>
              <option value="card">card</option>
              <option value="cash">cash</option>
              <option value="wallet">wallet</option>
              <option value="other">other</option>
            </select>

            <label className="pgymPg__fieldLabel">Onboarding status</label>
            <select
              className="fu-select"
              value={selected.onboardingStatus || 'pending'}
              onChange={(e) => updatePartnerGym(selected.id, { onboardingStatus: e.target.value })}
            >
              <option value="pending">pending</option>
              <option value="active">active</option>
              <option value="pilot">pilot</option>
              <option value="paused">paused</option>
              <option value="churned">churned</option>
            </select>

            <label className="pgymPg__fieldLabel">Contract signed</label>
            <select
              className="fu-select"
              value={selected.contractSigned ? 'yes' : 'no'}
              onChange={(e) =>
                updatePartnerGym(selected.id, { contractSigned: e.target.value === 'yes' })
              }
            >
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>

            <label className="pgymPg__fieldLabel">Contract start</label>
            <input
              type="date"
              className="fu-input"
              value={selected.contractStart || ''}
              onChange={(e) => updatePartnerGym(selected.id, { contractStart: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Contract end</label>
            <input
              type="date"
              className="fu-input"
              value={selected.contractEnd || ''}
              onChange={(e) => updatePartnerGym(selected.id, { contractEnd: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Contract file</label>
            <div>
              <input
                type="file"
                accept=".pdf,image/*"
                className="fu-input"
                onChange={(e) => handleManageContractUpload(e.target.files?.[0])}
              />
              {selected.contractFileName ? (
                <p className="pgymPg__addBranchHint">
                  Current file: {selected.contractFileName}
                </p>
              ) : null}
            </div>

            <label className="pgymPg__fieldLabel">Members</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.branchMembers ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { branchMembers: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Coaches</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.branchCoaches ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { branchCoaches: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Opening hours</label>
            <input
              className="fu-input"
              value={selected.openingHours || ''}
              onChange={(e) => updatePartnerGym(selected.id, { openingHours: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Monthly revenue</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.monthlyRevenue ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { monthlyRevenue: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Company size</label>
            <input
              className="fu-input"
              value={selected.companySize || ''}
              onChange={(e) => updatePartnerGym(selected.id, { companySize: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Year established</label>
            <input
              className="fu-input"
              type="number"
              min="1900"
              max="2100"
              value={selected.yearEstablished || ''}
              onChange={(e) =>
                updatePartnerGym(selected.id, { yearEstablished: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Gym space (sq ft)</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.gymSpaceSqft ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { gymSpaceSqft: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Classrooms</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.classroomCount ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, { classroomCount: Number(e.target.value) || 0 })
              }
            />

            <label className="pgymPg__fieldLabel">Classroom space (sq ft)</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.classroomSpaceSqft ?? 0}
              onChange={(e) =>
                updatePartnerGym(selected.id, {
                  classroomSpaceSqft: Number(e.target.value) || 0,
                })
              }
            />

            <label className="pgymPg__fieldLabel">Capacity</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={selected.capacity ?? 0}
              onChange={(e) => updatePartnerGym(selected.id, { capacity: Number(e.target.value) || 0 })}
            />

            <label className="pgymPg__fieldLabel">EMS available</label>
            <select
              className="fu-select"
              value={selected.hasEms ? 'yes' : 'no'}
              onChange={(e) => updatePartnerGym(selected.id, { hasEms: e.target.value === 'yes' })}
            >
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>

            <label className="pgymPg__fieldLabel">Restriction</label>
            <select
              className="fu-select"
              value={selected.restricted ? 'yes' : 'no'}
              onChange={(e) => updatePartnerGym(selected.id, { restricted: e.target.value === 'yes' })}
            >
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>

            <label className="pgymPg__fieldLabel">Restriction note</label>
            <textarea
              className="fu-input"
              rows={2}
              value={selected.restrictionNote || ''}
              onChange={(e) => updatePartnerGym(selected.id, { restrictionNote: e.target.value })}
              placeholder="Reason for restriction"
            />

            <label className="pgymPg__fieldLabel">Complaint status</label>
            <select
              className="fu-select"
              value={selected.complaintStatus || 'none'}
              onChange={(e) => updatePartnerGym(selected.id, { complaintStatus: e.target.value })}
            >
              <option value="none">none</option>
              <option value="open">open</option>
              <option value="in_review">in review</option>
              <option value="resolved">resolved</option>
            </select>

            <label className="pgymPg__fieldLabel">Complaint note</label>
            <textarea
              className="fu-input"
              rows={3}
              value={selected.complaintNote || ''}
              onChange={(e) => updatePartnerGym(selected.id, { complaintNote: e.target.value })}
              placeholder="Complaint details"
            />

            <label className="pgymPg__fieldLabel">Facilities</label>
            <textarea
              className="fu-input"
              rows={3}
              value={selected.facilities || ''}
              onChange={(e) => updatePartnerGym(selected.id, { facilities: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Equipment</label>
            <textarea
              className="fu-input"
              rows={3}
              value={selected.branchEquipment || ''}
              onChange={(e) => updatePartnerGym(selected.id, { branchEquipment: e.target.value })}
            />

            <label className="pgymPg__fieldLabel">Internal notes</label>
            <textarea
              className="fu-input"
              rows={3}
              value={selected.notes || ''}
              onChange={(e) => updatePartnerGym(selected.id, { notes: e.target.value })}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
