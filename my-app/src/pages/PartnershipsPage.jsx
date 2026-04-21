import { useEffect, useMemo, useState } from 'react';
import { Badge, Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './PartnershipsPage.css';

const toneForApplication = (s) => {
  if (s === 'accepted') return 'success';
  if (s === 'rejected') return 'danger';
  if (s === 'reviewing') return 'warn';
  return 'neutral';
};

/** Default English labels — match `name` on partner form fields in Content → Contact. */
const PARTNER_FIELD_LABELS = {
  companyName: 'Company name',
  companySize: 'Company size',
  website: 'Website URL',
  fullName: 'Full name',
  jobTitle: 'Job title',
  email: 'Email',
  phone: 'Phone',
  description: 'Partnership description',
  expectedPartnershipValue: 'Expected partnership value',
};

const PARTNER_FORM_SECTIONS = [
  { title: 'Company information', keys: ['companyName', 'companySize', 'website'] },
  { title: 'Contact person', keys: ['fullName', 'jobTitle', 'email', 'phone'] },
  {
    title: 'Partnership details',
    keys: ['description', 'expectedPartnershipValue'],
  },
];

function formatSubmittedAt(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso || '—';
  }
}

function labelForField(key) {
  return PARTNER_FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function displayValue(v) {
  if (v === undefined || v === null || String(v).trim() === '') return '—';
  return String(v);
}

export default function PartnershipsPage() {
  const {
    partnerApplicationSubmissions,
    updatePartnerApplicationSubmission,
    onboardSubmissionToPartnerGym,
    settings,
  } = useFitupAdmin();

  const [detailId, setDetailId] = useState(null);
  const [onboardId, setOnboardId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [onboardForm, setOnboardForm] = useState({
    gymAccountId: '',
    legalName: '',
    brandName: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companySize: '',
    locationsPlanned: 1,
    billingAmount: 0,
    billingCurrency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    hasEms: false,
    contractSigned: false,
    contractStart: '',
    contractEnd: '',
    contractServices: '',
    contractFees: '',
    contractMessage: '',
    onboardingStatus: 'active',
    notes: '',
  });
  const [onboardError, setOnboardError] = useState('');
  const [contractSendMsg, setContractSendMsg] = useState('');
  const [detailContractForm, setDetailContractForm] = useState({
    contactEmail: '',
    contractServices: '',
    contractFees: '',
    contractMessage: '',
  });

  const sortedApps = useMemo(
    () =>
      [...partnerApplicationSubmissions].sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      ),
    [partnerApplicationSubmissions]
  );
  const visibleApps = useMemo(() => sortedApps, [sortedApps]);
  const filteredApps = useMemo(() => {
    if (statusFilter === 'all') return visibleApps;
    const statusMap = {
      new: 'submitted',
      approved: 'accepted',
      rejected: 'rejected',
      review: 'reviewing',
    };
    const wanted = statusMap[statusFilter] || '';
    if (!wanted) return visibleApps;
    return visibleApps.filter((row) => String(row.status || '').toLowerCase() === wanted);
  }, [visibleApps, statusFilter]);

  const detail = sortedApps.find((r) => r.id === detailId) || null;
  const onboardRow = sortedApps.find((r) => r.id === onboardId) || null;
  const fields = detail?.fields && typeof detail.fields === 'object' ? detail.fields : {};

  const openOnboard = (row) => {
    const f = row.fields || {};
    setOnboardId(row.id);
    setOnboardForm((prev) => ({
      ...prev,
      gymAccountId: '',
      legalName: f.companyName || '',
      brandName: f.companyName || '',
      website: f.website || '',
      contactName: f.fullName || '',
      contactEmail: f.email || '',
      contactPhone: f.phone || '',
      companySize: f.companySize || '',
      locationsPlanned: 1,
      billingAmount: 0,
      billingCurrency: 'USD',
      billingCycle: 'monthly',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending',
      hasEms: false,
      contractSigned: false,
      contractStart: '',
      contractEnd: '',
      contractServices: String(row.contractServices || '').trim(),
      contractFees: String(row.contractFees || '').trim(),
      contractMessage: String(row.contractMessage || '').trim(),
      onboardingStatus: 'active',
      contractFileName: String(row.contractFileName || '').trim(),
      contractFileDataUrl: String(row.contractFileDataUrl || '').trim(),
      notes: '',
    }));
    setOnboardError('');
    setContractSendMsg('');
  };

  const handleSignedContractUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOnboardForm((p) => ({
        ...p,
        contractFileName: file.name || '',
        contractFileDataUrl: String(reader.result || ''),
      }));
      setOnboardError('');
    };
    reader.readAsDataURL(file);
  };

  const submitOnboard = (e) => {
    e.preventDefault();
    if (!onboardId) return;
    if (!onboardForm.contractSigned) {
      setOnboardError('Contract must be marked as signed before approval.');
      return;
    }
    if (!String(onboardForm.contractFileDataUrl || '').trim()) {
      setOnboardError('Contract file is missing. Send the contract from the partner form first.');
      return;
    }
    onboardSubmissionToPartnerGym(onboardId, onboardForm);
    setOnboardError('');
    setContractSendMsg('');
    setOnboardId(null);
  };

  const saveContractTermsFromDetail = () => {
    if (!detail) return;
    updatePartnerApplicationSubmission(detail.id, {
      contractServices: String(detailContractForm.contractServices || '').trim(),
      contractFees: String(detailContractForm.contractFees || '').trim(),
      contractMessage: String(detailContractForm.contractMessage || '').trim(),
    });
    setContractSendMsg('Contract terms saved.');
  };

  const sendContractToApplicant = () => {
    if (!detail) return;
    const email = String(detailContractForm.contactEmail || '').trim();
    if (!email) {
      setOnboardError('Contact email is required to send the contract.');
      return;
    }
    const services = String(detailContractForm.contractServices || '').trim();
    const fees = String(detailContractForm.contractFees || '').trim();
    if (!services || !fees) {
      setOnboardError('Add contract services/terms and fees before sending.');
      return;
    }
    const masterFileUrl = String(settings.contractMasterFileDataUrl || '').trim();
    const masterFileName = String(settings.contractMasterFileName || '').trim();
    if (!masterFileUrl || !masterFileName) {
      setOnboardError('Upload the contract file first in the Contracts page.');
      return;
    }
    setOnboardError('');
    updatePartnerApplicationSubmission(detail.id, {
      status: 'reviewing',
      contractSentAt: new Date().toISOString(),
      contractSentTo: email,
      contractFileName: masterFileName,
      contractFileDataUrl: masterFileUrl,
      contractServices: services,
      contractFees: fees,
      contractMessage: String(detailContractForm.contractMessage || '').trim(),
    });
    setContractSendMsg(`Contract sent to ${email}.`);
  };

  const openDetail = (row) => {
    setDetailId(row.id);
    setDetailContractForm({
      contactEmail: String(row.contractSentTo || row.fields?.email || '').trim(),
      contractServices: String(row.contractServices || '').trim(),
      contractFees: String(row.contractFees || '').trim(),
      contractMessage: String(row.contractMessage || '').trim(),
    });
    setOnboardError('');
    setContractSendMsg('');
  };

  useEffect(() => {
    if (!detail) return;
    setDetailContractForm((prev) => ({
      contactEmail: prev.contactEmail || String(detail.contractSentTo || fields.email || '').trim(),
      contractServices: prev.contractServices || String(detail.contractServices || '').trim(),
      contractFees: prev.contractFees || String(detail.contractFees || '').trim(),
      contractMessage: prev.contractMessage || String(detail.contractMessage || '').trim(),
    }));
  }, [detail, fields.email]);

  const usedKeys = new Set();
  PARTNER_FORM_SECTIONS.forEach((sec) => sec.keys.forEach((k) => usedKeys.add(k)));
  const extraKeys = Object.keys(fields).filter((k) => !usedKeys.has(k));

  return (
    <div className="partPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Partnerships</h1>
          <p>
            Full <strong>Partner with FITUP</strong> applications from your contact page appear here.
            Before acceptance, click <strong>Onboard & accept</strong> to assign a gym account ID,
            contract terms, and payment details.
          </p>
        </div>
      </header>

      <h2 className="partPg__sectionTitle">Partner application form</h2>
      <div className="partPg__filters" role="group" aria-label="Partnership status filter">
        <button
          type="button"
          className={`partPg__filterBtn ${statusFilter === 'all' ? 'partPg__filterBtn--active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`partPg__filterBtn ${statusFilter === 'new' ? 'partPg__filterBtn--active' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          New
        </button>
        <button
          type="button"
          className={`partPg__filterBtn ${statusFilter === 'approved' ? 'partPg__filterBtn--active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved
        </button>
        <button
          type="button"
          className={`partPg__filterBtn ${statusFilter === 'review' ? 'partPg__filterBtn--active' : ''}`}
          onClick={() => setStatusFilter('review')}
        >
          Under review
        </button>
        <button
          type="button"
          className={`partPg__filterBtn ${statusFilter === 'rejected' ? 'partPg__filterBtn--active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected
        </button>
      </div>
      <div className="fu-tableWrap partPg__tableWrap">
        <table className="fu-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Status</th>
              <th>Linked gym ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((row) => {
              const f = row.fields || {};
              return (
                <tr key={row.id}>
                  <td className="partPg__nowrap">{formatSubmittedAt(row.submittedAt)}</td>
                  <td>{displayValue(f.companyName)}</td>
                  <td>{displayValue(f.fullName)}</td>
                  <td>{displayValue(f.email)}</td>
                  <td>
                    <Badge tone={toneForApplication(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="partPg__nowrap">{row.linkedGymAccountId || '—'}</td>
                  <td>
                    <div className="fu-rowActions">
                      <button
                        type="button"
                        className="fu-btn fu-btn--ghost"
                        onClick={() => openDetail(row)}
                      >
                        View full form
                      </button>
                      <button
                        type="button"
                        className="fu-btn fu-btn--primary"
                        disabled={!!row.linkedGymAccountId}
                        onClick={() => openOnboard(row)}
                      >
                        {row.linkedGymAccountId ? 'Onboarded' : 'Onboard & accept'}
                      </button>
                      <button
                        type="button"
                        className="fu-btn fu-btn--ghost"
                        onClick={() =>
                          updatePartnerApplicationSubmission(row.id, { status: 'reviewing' })
                        }
                      >
                        Reviewing
                      </button>
                      <button
                        type="button"
                        className="fu-btn fu-btn--danger"
                        onClick={() =>
                          updatePartnerApplicationSubmission(row.id, { status: 'rejected' })
                        }
                      >
                        Rejected
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="partPg__sectionLead">
        Approved and onboarded partnerships stay listed here and are also available in{' '}
        <strong>Gyms</strong>.
      </p>

      <Modal
        open={!!detail}
        title={detail ? `Application · ${displayValue(fields.companyName)}` : ''}
        onClose={() => setDetailId(null)}
        footer={
          <>
            <button type="button" className="fu-btn" onClick={() => setDetailId(null)}>
              Close
            </button>
            <button type="button" className="fu-btn fu-btn--primary" onClick={sendContractToApplicant}>
              Send contract
            </button>
          </>
        }
      >
        {detail && (
          <div className="partPg__fullForm">
            <p className="partPg__meta">
              <strong>Submitted:</strong> {formatSubmittedAt(detail.submittedAt)}
              <span className="partPg__metaSep">·</span>
              <strong>Status:</strong>{' '}
              <Badge tone={toneForApplication(detail.status)}>{detail.status}</Badge>
            </p>

            {PARTNER_FORM_SECTIONS.map((section) => (
              <section key={section.title} className="partPg__formSection">
                <h3 className="partPg__formSectionTitle">{section.title}</h3>
                <dl className="partPg__dl">
                  {section.keys.map((key) => (
                    <div key={key} className="partPg__dlRow">
                      <dt>{labelForField(key)}</dt>
                      <dd>{displayValue(fields[key])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            {extraKeys.length > 0 && (
              <section className="partPg__formSection">
                <h3 className="partPg__formSectionTitle">Additional fields</h3>
                <dl className="partPg__dl">
                  {extraKeys.map((key) => (
                    <div key={key} className="partPg__dlRow">
                      <dt>{labelForField(key)}</dt>
                      <dd>{displayValue(fields[key])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <section className="partPg__formSection">
              <h3 className="partPg__formSectionTitle">Contract details</h3>
              <label className="fu-label">Send to email</label>
              <input
                className="fu-input"
                type="email"
                value={detailContractForm.contactEmail}
                onChange={(e) =>
                  setDetailContractForm((p) => ({ ...p, contactEmail: e.target.value }))
                }
              />
              <label className="fu-label">Services / terms</label>
              <textarea
                className="fu-input"
                rows={4}
                value={detailContractForm.contractServices}
                onChange={(e) =>
                  setDetailContractForm((p) => ({ ...p, contractServices: e.target.value }))
                }
              />
              <label className="fu-label">Fees</label>
              <textarea
                className="fu-input"
                rows={3}
                value={detailContractForm.contractFees}
                onChange={(e) => setDetailContractForm((p) => ({ ...p, contractFees: e.target.value }))}
              />
              <label className="fu-label">Message (optional)</label>
              <textarea
                className="fu-input"
                rows={3}
                value={detailContractForm.contractMessage}
                onChange={(e) =>
                  setDetailContractForm((p) => ({ ...p, contractMessage: e.target.value }))
                }
              />
              <p className="partPg__hint">
                Contract file source: {settings.contractMasterFileName || 'No file uploaded in Contracts page'}
              </p>
              <div className="partPg__inlineActions">
                <button type="button" className="fu-btn fu-btn--ghost" onClick={saveContractTermsFromDetail}>
                  Save terms
                </button>
                <button type="button" className="fu-btn fu-btn--primary" onClick={sendContractToApplicant}>
                  Send contract
                </button>
              </div>
              {contractSendMsg ? <p className="partPg__hint">{contractSendMsg}</p> : null}
              {onboardError ? <p className="partPg__error">{onboardError}</p> : null}
            </section>
          </div>
        )}
      </Modal>

      <Modal
        open={!!onboardRow}
        title={onboardRow ? `Onboard gym · ${displayValue((onboardRow.fields || {}).companyName)}` : ''}
        onClose={() => setOnboardId(null)}
        footer={
          <>
            <button type="button" className="fu-btn" onClick={() => setOnboardId(null)}>
              Cancel
            </button>
            <button
              type="submit"
              form="partPg-onboard-form"
              className="fu-btn fu-btn--primary"
              disabled={
                !onboardForm.contractSigned ||
                !String(onboardForm.contractFileDataUrl || '').trim()
              }
            >
              Create gym and accept
            </button>
          </>
        }
      >
        {onboardRow && (
          <form id="partPg-onboard-form" className="partPg__onboardForm" onSubmit={submitOnboard}>
            <h3 className="partPg__formSectionTitle">Gym identity</h3>
            <label className="fu-label">Gym account ID (optional)</label>
            <input
              className="fu-input"
              value={onboardForm.gymAccountId}
              onChange={(e) => setOnboardForm((p) => ({ ...p, gymAccountId: e.target.value }))}
              placeholder="Auto-generated if empty"
            />
            <label className="fu-label">Legal company name</label>
            <input
              className="fu-input"
              required
              value={onboardForm.legalName}
              onChange={(e) => setOnboardForm((p) => ({ ...p, legalName: e.target.value }))}
            />
            <label className="fu-label">Brand name</label>
            <input
              className="fu-input"
              value={onboardForm.brandName}
              onChange={(e) => setOnboardForm((p) => ({ ...p, brandName: e.target.value }))}
            />
            <label className="fu-label">Website</label>
            <input
              className="fu-input"
              value={onboardForm.website}
              onChange={(e) => setOnboardForm((p) => ({ ...p, website: e.target.value }))}
            />

            <h3 className="partPg__formSectionTitle">Primary contact</h3>
            <label className="fu-label">Contact name</label>
            <input
              className="fu-input"
              value={onboardForm.contactName}
              onChange={(e) => setOnboardForm((p) => ({ ...p, contactName: e.target.value }))}
            />
            <label className="fu-label">Contact email</label>
            <input
              className="fu-input"
              type="email"
              value={onboardForm.contactEmail}
              onChange={(e) => setOnboardForm((p) => ({ ...p, contactEmail: e.target.value }))}
            />
            <label className="fu-label">Contact phone</label>
            <input
              className="fu-input"
              value={onboardForm.contactPhone}
              onChange={(e) => setOnboardForm((p) => ({ ...p, contactPhone: e.target.value }))}
            />

            <h3 className="partPg__formSectionTitle">Commercial terms</h3>
            <label className="fu-label">Planned locations</label>
            <input
              className="fu-input"
              type="number"
              min="1"
              value={onboardForm.locationsPlanned}
              onChange={(e) =>
                setOnboardForm((p) => ({ ...p, locationsPlanned: Number(e.target.value) || 1 }))
              }
            />
            <label className="fu-label">Billing amount</label>
            <input
              className="fu-input"
              type="number"
              min="0"
              value={onboardForm.billingAmount}
              onChange={(e) =>
                setOnboardForm((p) => ({ ...p, billingAmount: Number(e.target.value) || 0 }))
              }
            />
            <label className="fu-label">Billing currency</label>
            <input
              className="fu-input"
              value={onboardForm.billingCurrency}
              onChange={(e) => setOnboardForm((p) => ({ ...p, billingCurrency: e.target.value }))}
            />
            <label className="fu-label">Billing cycle</label>
            <select
              className="fu-select"
              value={onboardForm.billingCycle}
              onChange={(e) => setOnboardForm((p) => ({ ...p, billingCycle: e.target.value }))}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One-time</option>
            </select>
            <label className="fu-label">Payment method</label>
            <select
              className="fu-select"
              value={onboardForm.paymentMethod}
              onChange={(e) => setOnboardForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="wallet">Wallet</option>
              <option value="other">Other</option>
            </select>
            <label className="fu-label">Payment status</label>
            <select
              className="fu-select"
              value={onboardForm.paymentStatus}
              onChange={(e) => setOnboardForm((p) => ({ ...p, paymentStatus: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <label className="fu-label">Contract start</label>
            <input
              className="fu-input"
              type="date"
              value={onboardForm.contractStart}
              onChange={(e) => setOnboardForm((p) => ({ ...p, contractStart: e.target.value }))}
            />
            <label className="fu-label">Contract end</label>
            <input
              className="fu-input"
              type="date"
              value={onboardForm.contractEnd}
              onChange={(e) => setOnboardForm((p) => ({ ...p, contractEnd: e.target.value }))}
            />
            <label className="partPg__check">
              <input
                type="checkbox"
                checked={onboardForm.hasEms}
                onChange={(e) =>
                  setOnboardForm((p) => ({ ...p, hasEms: e.target.checked }))
                }
              />
              <span>Gym has EMS</span>
            </label>
            <label className="partPg__check">
              <input
                type="checkbox"
                checked={onboardForm.contractSigned}
                onChange={(e) =>
                  setOnboardForm((p) => ({ ...p, contractSigned: e.target.checked }))
                }
              />
              <span>Contract signed (required before creating partner gym account)</span>
            </label>
            <label className="fu-label">Signed contract file (required at onboarding)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              className="fu-input"
              onChange={(e) => handleSignedContractUpload(e.target.files?.[0])}
            />
            {onboardForm.contractFileName ? (
              <p className="partPg__hint">
                Uploaded signed file: <strong>{onboardForm.contractFileName}</strong>
              </p>
            ) : (
              <p className="partPg__hint">Upload the signed contract file to finish onboarding.</p>
            )}
            <p className="partPg__hint">
              You can use the sent master contract, then upload the signed version here.
            </p>
            {onboardError ? <p className="partPg__error">{onboardError}</p> : null}
            <p className="partPg__hint">
              Approval requires a signed contract checkbox and a contract file already sent.
            </p>
            <label className="fu-label">Onboarding status</label>
            <select
              className="fu-select"
              value={onboardForm.onboardingStatus}
              onChange={(e) =>
                setOnboardForm((p) => ({ ...p, onboardingStatus: e.target.value }))
              }
            >
              <option value="active">Active</option>
              <option value="pilot">Pilot</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
            <label className="fu-label">Internal notes</label>
            <textarea
              className="fu-input"
              rows={3}
              value={onboardForm.notes}
              onChange={(e) => setOnboardForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
