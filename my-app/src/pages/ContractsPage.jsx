import { useMemo, useState } from 'react';
import { Badge, Modal } from '../components/Ui';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './ContractsPage.css';

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
  { title: 'Partnership details', keys: ['description', 'expectedPartnershipValue'] },
];

const toneForApplication = (s) => {
  if (s === 'accepted') return 'success';
  if (s === 'rejected') return 'danger';
  if (s === 'reviewing') return 'warn';
  return 'neutral';
};

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

export default function ContractsPage() {
  const { partnerApplicationSubmissions, updatePartnerApplicationSubmission, settings, updateSettings } =
    useFitupAdmin();
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendMsg, setSendMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const rows = useMemo(
    () => [...partnerApplicationSubmissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    [partnerApplicationSubmissions]
  );
  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    const statusMap = { new: 'submitted', approved: 'accepted', rejected: 'rejected', review: 'reviewing' };
    const wanted = statusMap[statusFilter] || '';
    if (!wanted) return rows;
    return rows.filter((r) => String(r.status || '').toLowerCase() === wanted);
  }, [rows, statusFilter]);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const fields = selected?.fields && typeof selected.fields === 'object' ? selected.fields : {};

  const uploadMasterFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({
        contractMasterFileName: file.name,
        contractMasterFileDataUrl: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  const saveMasterDraft = () => {
    if (!selected) return;
    const draft = String(settings.contractMasterDraft || '').trim();
    updatePartnerApplicationSubmission(selected.id, { contractDraft: draft });
    setSendMsg('Contract draft saved.');
  };

  const sendContract = () => {
    if (!selected) return;
    const to = String(selected.contractSentTo || fields.email || '').trim();
    if (!to) {
      setErrorMsg('No contact email found in this partnership form.');
      return;
    }
    const fileUrl = String(settings.contractMasterFileDataUrl || '').trim();
    const fileName = String(settings.contractMasterFileName || '').trim();
    if (!fileUrl || !fileName) {
      setErrorMsg('Upload the contract file first.');
      return;
    }
    setErrorMsg('');
    updatePartnerApplicationSubmission(selected.id, {
      status: 'reviewing',
      contractSentAt: new Date().toISOString(),
      contractSentTo: to,
      contractFileName: fileName,
      contractFileDataUrl: fileUrl,
    });
    setSendMsg(`Contract sent to ${to}.`);
  };

  const usedKeys = new Set();
  PARTNER_FORM_SECTIONS.forEach((sec) => sec.keys.forEach((k) => usedKeys.add(k)));
  const extraKeys = Object.keys(fields).filter((k) => !usedKeys.has(k));

  return (
    <div className="ctrPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Contracts</h1>
          <p>Review partnership forms and send the FITUP contract from here.</p>
        </div>
      </header>

      <section className="fu-card ctrPg__master">
        <h2 className="ctrPg__sectionTitle">Master contract</h2>
        <p className="ctrPg__hint">Upload the main contract file and optional draft text.</p>
        <label className="fu-label">Contract text</label>
        <textarea
          className="fu-input"
          rows={6}
          value={settings.contractMasterDraft || ''}
          onChange={(e) => updateSettings({ contractMasterDraft: e.target.value })}
          placeholder="Standard FITUP partnership terms…"
        />
        <label className="fu-label">Upload master contract file (PDF / image)</label>
        <input
          className="fu-input"
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => uploadMasterFile(e.target.files?.[0])}
        />
        {settings.contractMasterFileName ? (
          <p className="ctrPg__fileMeta">
            <strong>Master file:</strong> {settings.contractMasterFileName}
          </p>
        ) : null}
      </section>

      <h2 className="ctrPg__sectionTitle">Partner application form</h2>
      <div className="ctrPg__filters" role="group" aria-label="Contract status filter">
        <button type="button" className={`ctrPg__filterBtn ${statusFilter === 'all' ? 'ctrPg__filterBtn--active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
        <button type="button" className={`ctrPg__filterBtn ${statusFilter === 'new' ? 'ctrPg__filterBtn--active' : ''}`} onClick={() => setStatusFilter('new')}>New</button>
        <button type="button" className={`ctrPg__filterBtn ${statusFilter === 'approved' ? 'ctrPg__filterBtn--active' : ''}`} onClick={() => setStatusFilter('approved')}>Approved</button>
        <button type="button" className={`ctrPg__filterBtn ${statusFilter === 'review' ? 'ctrPg__filterBtn--active' : ''}`} onClick={() => setStatusFilter('review')}>Under review</button>
        <button type="button" className={`ctrPg__filterBtn ${statusFilter === 'rejected' ? 'ctrPg__filterBtn--active' : ''}`} onClick={() => setStatusFilter('rejected')}>Rejected</button>
      </div>
      <div className="fu-tableWrap">
        <table className="fu-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Contract file</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => {
              const f = r.fields || {};
              return (
              <tr key={r.id}>
                <td>{formatSubmittedAt(r.submittedAt)}</td>
                <td>{displayValue(f.companyName)}</td>
                <td>{displayValue(r.contractSentTo || f.email)}</td>
                <td><Badge tone={toneForApplication(r.status)}>{r.status}</Badge></td>
                <td>{displayValue(r.contractFileName)}</td>
                <td>
                  <button type="button" className="fu-btn fu-btn--ghost" onClick={() => { setSelectedId(r.id); setSendMsg(''); setErrorMsg(''); }}>
                    View full form
                  </button>
                </td>
              </tr>
            )})}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6}>No contracts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!selected}
        modalClassName="fu-modal--wide"
        title={selected ? `Application · ${displayValue(fields.companyName)}` : 'Contract'}
        onClose={() => setSelectedId(null)}
        footer={
          <>
            <button type="button" className="fu-btn" onClick={() => setSelectedId(null)}>Close</button>
            <button type="button" className="fu-btn fu-btn--primary" onClick={sendContract}>Send contract</button>
          </>
        }
      >
        {selected && (
          <div className="ctrPg__fullForm">
            <p className="ctrPg__hint">
              <strong>Submitted:</strong> {formatSubmittedAt(selected.submittedAt)}
            </p>

            {PARTNER_FORM_SECTIONS.map((section) => (
              <section key={section.title} className="ctrPg__formSection">
                <h3 className="ctrPg__sectionTitle">{section.title}</h3>
                <dl className="ctrPg__dl">
                  {section.keys.map((key) => (
                    <div key={key} className="ctrPg__dlRow">
                      <dt>{labelForField(key)}</dt>
                      <dd>{displayValue(fields[key])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            {extraKeys.length > 0 && (
              <section className="ctrPg__formSection">
                <h3 className="ctrPg__sectionTitle">Additional fields</h3>
                <dl className="ctrPg__dl">
                  {extraKeys.map((key) => (
                    <div key={key} className="ctrPg__dlRow">
                      <dt>{labelForField(key)}</dt>
                      <dd>{displayValue(fields[key])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <h3 className="ctrPg__sectionTitle">Contract details</h3>
            <p className="ctrPg__hint">
              Recipient: <strong>{displayValue(selected.contractSentTo || fields.email)}</strong>
            </p>
            <label className="fu-label">Services / terms</label>
            <textarea
              className="fu-input"
              rows={4}
              value={selected.contractServices || ''}
              onChange={(e) =>
                updatePartnerApplicationSubmission(selected.id, { contractServices: e.target.value })
              }
            />
            <label className="fu-label">Fees</label>
            <textarea
              className="fu-input"
              rows={3}
              value={selected.contractFees || ''}
              onChange={(e) =>
                updatePartnerApplicationSubmission(selected.id, { contractFees: e.target.value })
              }
            />
            <p className="ctrPg__hint">
              Contract file source: <strong>{settings.contractMasterFileName || 'No file uploaded'}</strong>
            </p>
            <div className="ctrPg__actions">
              <button type="button" className="fu-btn fu-btn--ghost" onClick={saveMasterDraft}>
                Save draft text
              </button>
              <button type="button" className="fu-btn fu-btn--primary" onClick={sendContract}>
                Send contract
              </button>
            </div>
            {sendMsg ? <p className="ctrPg__hint">{sendMsg}</p> : null}
            {errorMsg ? <p className="ctrPg__error">{errorMsg}</p> : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
