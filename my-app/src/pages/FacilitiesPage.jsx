import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './FacilitiesPage.css';

function fmtMoney(amount, ccy = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(
      Number(amount) || 0
    );
  } catch {
    return `${ccy} ${Number(amount) || 0}`;
  }
}

export default function FacilitiesPage() {
  const ctx = useOutletContext() || {};
  const partnerGyms = Array.isArray(ctx.partnerGyms) ? ctx.partnerGyms : [];
  const branchId = ctx.selectedBranchId || partnerGyms[0]?.id || '';
  const {
    users,
    gymFacilities,
    facilityBookingRequests,
    addGymFacility,
    updateGymFacility,
    addFacilityBookingRequest,
    submitFacilityBookingFromApplication,
    updateFacilityBookingRequest,
  } = useFitupAdmin();

  const facilities = useMemo(
    () => gymFacilities.filter((f) => (branchId ? f.branchId === branchId : true)),
    [gymFacilities, branchId]
  );
  const requests = useMemo(
    () => facilityBookingRequests.filter((r) => (branchId ? r.branchId === branchId : true)),
    [facilityBookingRequests, branchId]
  );
  const memberOptions = useMemo(
    () =>
      users.filter((u) => {
        if (!branchId) return true;
        return String(u.partnerGymId || '') === String(branchId);
      }),
    [users, branchId]
  );

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    schedule: '',
    price: '',
    currency: 'USD',
    status: 'active',
    notes: '',
  });
  const [requestForm, setRequestForm] = useState({
    facilityId: '',
    memberId: '',
    requestedSlot: '',
    paymentMethod: 'cash',
    paidOnline: false,
    note: '',
  });
  const [msg, setMsg] = useState('');
  const [appRequestForm, setAppRequestForm] = useState({
    facilityId: '',
    memberId: '',
    requestedSlot: '',
    paymentMethod: 'cash',
    note: '',
  });

  const addFacility = (e) => {
    e.preventDefault();
    const created = addGymFacility({ ...facilityForm, branchId });
    if (!created) {
      setMsg('Please add branch, facility name, and required fields.');
      return;
    }
    setFacilityForm({
      name: '',
      schedule: '',
      price: '',
      currency: 'USD',
      status: 'active',
      notes: '',
    });
    setMsg(`Facility ${created.name} added.`);
  };

  const addRequest = (e) => {
    e.preventDefault();
    const created = addFacilityBookingRequest({ ...requestForm, branchId });
    if (!created) {
      setMsg('Please fill request fields and choose a facility.');
      return;
    }
    setRequestForm({
      facilityId: '',
      memberId: '',
      requestedSlot: '',
      paymentMethod: 'cash',
      paidOnline: false,
      note: '',
    });
    setMsg(
      created.status === 'approved'
        ? 'Booking auto-approved (paid online).'
        : 'Booking request added as pending.'
    );
  };

  const submitFromApp = (e) => {
    e.preventDefault();
    const created = submitFacilityBookingFromApplication({ ...appRequestForm, branchId });
    if (!created) {
      setMsg('Please fill member, facility, and slot for app booking.');
      return;
    }
    setAppRequestForm({
      facilityId: '',
      memberId: '',
      requestedSlot: '',
      paymentMethod: 'cash',
      note: '',
    });
    setMsg(
      created.status === 'approved'
        ? 'App booking auto-approved (paid online).'
        : 'App booking created as pending.'
    );
  };

  return (
    <div className="facPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Facilities</h1>
          <p>Manage gym facilities, schedules, prices, and booking requests.</p>
        </div>
      </header>

      <section className="fu-card facPg__card">
        <h2>Add Facility</h2>
        <form className="facPg__addForm" onSubmit={addFacility}>
          <input
            className="fu-input"
            placeholder="Facility name (Juice Bar, Sauna, Jacuzzi...)"
            value={facilityForm.name}
            onChange={(e) => setFacilityForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="fu-input"
            placeholder="Schedule (e.g., Daily 08:00 - 22:00)"
            value={facilityForm.schedule}
            onChange={(e) => setFacilityForm((p) => ({ ...p, schedule: e.target.value }))}
          />
          <input
            className="fu-input"
            type="number"
            min="0"
            placeholder="Price"
            value={facilityForm.price}
            onChange={(e) => setFacilityForm((p) => ({ ...p, price: e.target.value }))}
          />
          <select
            className="fu-select"
            value={facilityForm.currency}
            onChange={(e) => setFacilityForm((p) => ({ ...p, currency: e.target.value }))}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AED">AED</option>
          </select>
          <select
            className="fu-select"
            value={facilityForm.status}
            onChange={(e) => setFacilityForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed">Closed</option>
          </select>
          <input
            className="fu-input"
            placeholder="Notes"
            value={facilityForm.notes}
            onChange={(e) => setFacilityForm((p) => ({ ...p, notes: e.target.value }))}
          />
          <button className="fu-btn fu-btn--primary" type="submit">Add Facility</button>
        </form>
        {msg ? <p className="facPg__msg">{msg}</p> : null}
      </section>

      <section className="fu-card facPg__card">
        <h2>Facilities List</h2>
        <div className="facPg__list">
          {facilities.map((f) => (
            <article key={f.id} className="facPg__item">
              <h3>{f.name}</h3>
              <p>{f.schedule || '-'}</p>
              <p>{fmtMoney(f.price, f.currency)}</p>
              <select
                className="fu-select"
                value={f.status}
                onChange={(e) => updateGymFacility(f.id, { status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="closed">Closed</option>
              </select>
              <textarea
                className="fu-textarea"
                rows={2}
                value={f.notes || ''}
                onChange={(e) => updateGymFacility(f.id, { notes: e.target.value })}
              />
            </article>
          ))}
          {facilities.length === 0 ? <p className="facPg__empty">No facilities yet.</p> : null}
        </div>
      </section>

      <section className="fu-card facPg__card">
        <h2>Add Booking Request</h2>
        <form className="facPg__requestForm" onSubmit={addRequest}>
          <select
            className="fu-select"
            value={requestForm.facilityId}
            onChange={(e) => setRequestForm((p) => ({ ...p, facilityId: e.target.value }))}
          >
            <option value="">Select facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <input
            className="fu-input"
            placeholder="Requested slot (e.g. 2026-04-12 14:00)"
            value={requestForm.requestedSlot}
            onChange={(e) => setRequestForm((p) => ({ ...p, requestedSlot: e.target.value }))}
          />
          <select
            className="fu-select"
            value={requestForm.memberId}
            onChange={(e) => setRequestForm((p) => ({ ...p, memberId: e.target.value }))}
          >
            <option value="">Select member (name + ID)</option>
            {memberOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.fitupUserId || u.id})
              </option>
            ))}
          </select>
          <select
            className="fu-select"
            value={requestForm.paymentMethod}
            onChange={(e) =>
              setRequestForm((p) => ({
                ...p,
                paymentMethod: e.target.value,
                paidOnline: e.target.value.toLowerCase() === 'online',
              }))
            }
          >
            <option value="cash">Cash</option>
            <option value="online">Online payment</option>
            <option value="transfer">Bank transfer</option>
          </select>
          <input
            className="fu-input"
            placeholder="Note"
            value={requestForm.note}
            onChange={(e) => setRequestForm((p) => ({ ...p, note: e.target.value }))}
          />
          <button className="fu-btn fu-btn--primary" type="submit">Add Request</button>
        </form>
      </section>

      <section className="fu-card facPg__card">
        <h2>Booking Request From Application</h2>
        <form className="facPg__requestForm" onSubmit={submitFromApp}>
          <select
            className="fu-select"
            value={appRequestForm.facilityId}
            onChange={(e) => setAppRequestForm((p) => ({ ...p, facilityId: e.target.value }))}
          >
            <option value="">Select facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            className="fu-select"
            value={appRequestForm.memberId}
            onChange={(e) => setAppRequestForm((p) => ({ ...p, memberId: e.target.value }))}
          >
            <option value="">Select member (name + ID)</option>
            {memberOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.fitupUserId || u.id})
              </option>
            ))}
          </select>
          <input
            className="fu-input"
            placeholder="Requested slot (e.g. 2026-04-12 18:00)"
            value={appRequestForm.requestedSlot}
            onChange={(e) => setAppRequestForm((p) => ({ ...p, requestedSlot: e.target.value }))}
          />
          <select
            className="fu-select"
            value={appRequestForm.paymentMethod}
            onChange={(e) => setAppRequestForm((p) => ({ ...p, paymentMethod: e.target.value }))}
          >
            <option value="cash">Cash</option>
            <option value="online">Online payment</option>
            <option value="transfer">Bank transfer</option>
          </select>
          <input
            className="fu-input"
            placeholder="Note"
            value={appRequestForm.note}
            onChange={(e) => setAppRequestForm((p) => ({ ...p, note: e.target.value }))}
          />
          <button className="fu-btn fu-btn--primary" type="submit">Submit App Booking</button>
        </form>
      </section>

      <section className="fu-card facPg__card">
        <h2>Booking Requests</h2>
        <div className="facPg__requests">
          {requests.map((r) => (
            <div key={r.id} className="facPg__reqRow">
              <div>
                <strong>{r.memberName}</strong>
                <p>User ID: {r.memberUserId || '-'}</p>
                <p>{r.requestedSlot}</p>
                <small>
                  {r.note || '-'} | Payment: {r.paymentMethod || 'cash'}
                  {r.paidOnline ? ' (paid online)' : ''}
                  {r.source === 'application' ? ' | Source: application' : ''}
                </small>
              </div>
              <select
                className="fu-select"
                value={r.status}
                onChange={(e) => updateFacilityBookingRequest(r.id, { status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ))}
          {requests.length === 0 ? <p className="facPg__empty">No booking requests yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
