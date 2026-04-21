import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './EquipmentPage.css';

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function EquipmentPage() {
  const ctx = useOutletContext() || {};
  const selectedBranchId = ctx.selectedBranchId || '';
  const partnerGyms = Array.isArray(ctx.partnerGyms) ? ctx.partnerGyms : [];
  const {
    equipmentInventory,
    addEquipmentItem,
    updateEquipmentItem,
  } = useFitupAdmin();

  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [branchIdForAdd, setBranchIdForAdd] = useState(
    selectedBranchId || partnerGyms[0]?.id || ''
  );
  const [msg, setMsg] = useState('');

  const activeBranch = partnerGyms.find((g) => g.id === branchIdForAdd) || null;
  const rows = useMemo(
    () =>
      equipmentInventory.filter((row) =>
        branchIdForAdd ? row.branchId === branchIdForAdd : true
      ),
    [equipmentInventory, branchIdForAdd]
  );
  const totalUnits = useMemo(
    () => rows.reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0),
    [rows]
  );

  const addRow = (e) => {
    e.preventDefault();
    const created = addEquipmentItem({
      branchId: branchIdForAdd,
      name: newName,
      quantity: newQuantity,
      hasEquipment: true,
    });
    if (!created) {
      setMsg('Select a branch and enter equipment name.');
      return;
    }
    setMsg(`Added ${created.name}.`);
    setNewName('');
    setNewQuantity(1);
  };

  return (
    <div className="eqPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Equipment</h1>
          <p>
            Track each machine with checkboxes and signs: under maintenance, need one more, need
            change, or complaint.
          </p>
        </div>
      </header>

      <section className="fu-card eqPg__card">
        <div className="eqPg__head">
          <h2>Add Equipment</h2>
          <p>
            Branch: <strong>{activeBranch?.brandName || activeBranch?.legalName || 'No branch selected'}</strong>
          </p>
        </div>
        <form className="eqPg__add" onSubmit={addRow}>
          <select
            className="fu-select"
            value={branchIdForAdd}
            onChange={(e) => setBranchIdForAdd(e.target.value)}
            aria-label="Equipment branch"
          >
            {partnerGyms.map((g) => (
              <option key={g.id} value={g.id}>
                {g.brandName || g.legalName || g.id}
              </option>
            ))}
          </select>
          <input
            className="fu-input"
            placeholder="Equipment name (e.g., Leg Press Machine)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="fu-input"
            type="number"
            min="1"
            value={newQuantity}
            onChange={(e) => setNewQuantity(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Equipment quantity"
          />
          <button
            className="fu-btn fu-btn--primary"
            type="submit"
            disabled={!branchIdForAdd || !newName.trim()}
          >
            Add Equipment
          </button>
        </form>
        {msg ? <p className="eqPg__msg">{msg}</p> : null}
      </section>

      <section className="fu-card eqPg__card">
        <div className="eqPg__head">
          <h2>Equipment Checklist</h2>
          <p>{rows.length} machine type(s) | Total items: {totalUnits}</p>
        </div>
        <div className="eqPg__list">
          {rows.map((row) => (
            <article className="eqPg__item" key={row.id}>
              <div className="eqPg__itemTop">
                <h3>{row.name}</h3>
                <small>Updated: {fmtDate(row.updatedAt)}</small>
              </div>

              <label className="eqPg__qty">
                <span>How many of this machine do you have?</span>
                <input
                  className="fu-input"
                  type="number"
                  min="0"
                  value={Math.max(0, Number(row.quantity) || 0)}
                  onChange={(e) => updateEquipmentItem(row.id, { quantity: e.target.value })}
                />
              </label>

              <label className="eqPg__check">
                <input
                  type="checkbox"
                  checked={!!row.hasEquipment}
                  onChange={(e) => updateEquipmentItem(row.id, { hasEquipment: e.target.checked })}
                />
                <span>Machine exists in gym</span>
              </label>

              <div className="eqPg__flags">
                <label className="eqPg__check">
                  <input
                    type="checkbox"
                    checked={!!row.underMaintenance}
                    onChange={(e) =>
                      updateEquipmentItem(row.id, { underMaintenance: e.target.checked })
                    }
                  />
                  <span>Under maintenance</span>
                </label>
                <label className="eqPg__check">
                  <input
                    type="checkbox"
                    checked={!!row.needOneMore}
                    onChange={(e) => updateEquipmentItem(row.id, { needOneMore: e.target.checked })}
                  />
                  <span>Need one more machine</span>
                </label>
                <label className="eqPg__check">
                  <input
                    type="checkbox"
                    checked={!!row.needChange}
                    onChange={(e) => updateEquipmentItem(row.id, { needChange: e.target.checked })}
                  />
                  <span>Need to change machine</span>
                </label>
                <label className="eqPg__check">
                  <input
                    type="checkbox"
                    checked={!!row.complaint}
                    onChange={(e) => updateEquipmentItem(row.id, { complaint: e.target.checked })}
                  />
                  <span>Machine has complaint</span>
                </label>
              </div>

              <textarea
                className="fu-textarea"
                rows={2}
                value={row.complaintText || ''}
                placeholder="Complaint/details note..."
                onChange={(e) => updateEquipmentItem(row.id, { complaintText: e.target.value })}
              />
            </article>
          ))}
          {rows.length === 0 ? (
            <p className="eqPg__empty">No equipment added yet for this branch.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
