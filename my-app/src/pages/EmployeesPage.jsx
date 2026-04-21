import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './EmployeesPage.css';

const ROLE_OPTIONS = ['super_admin', 'admin', 'manager', 'user'];

function roleLabel(role) {
  return String(role || 'user')
    .replace('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function EmployeesPage() {
  const { globalSearch = '' } = useOutletContext() || {};
  const { employees, employeeActivity, addEmployee, updateEmployee } = useFitupAdmin();
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  });
  const [msg, setMsg] = useState('');

  const filteredEmployees = useMemo(() => {
    const q = String(globalSearch || '').trim().toLowerCase();
    return employees.filter((e) => {
      if (roleFilter !== 'all' && e.role !== roleFilter) return false;
      if (!q) return true;
      return (
        String(e.employeeCode || '').toLowerCase().includes(q) ||
        String(e.name || '').toLowerCase().includes(q) ||
        String(e.email || '').toLowerCase().includes(q) ||
        String(e.role || '').toLowerCase().includes(q)
      );
    });
  }, [employees, globalSearch, roleFilter]);

  const filteredActivity = useMemo(
    () =>
      employeeActivity.filter((a) =>
        selectedEmployeeId === 'all' ? true : a.employeeId === selectedEmployeeId
      ),
    [employeeActivity, selectedEmployeeId]
  );

  const onAdd = (e) => {
    e.preventDefault();
    const created = addEmployee(form);
    if (!created) {
      setMsg('Please enter employee name and email.');
      return;
    }
    setMsg(`Employee ${created.name} added with ID ${created.employeeCode}.`);
    setForm({ name: '', email: '', role: 'user', status: 'active' });
  };

  return (
    <div className="empPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Employees</h1>
          <p>Add dashboard employees, set roles, and track their activity.</p>
        </div>
      </header>

      <section className="fu-card empPg__card">
        <div className="empPg__head">
          <h2>Add Employee</h2>
          <p>Employees can manage the dashboard based on their assigned role.</p>
        </div>
        <form className="empPg__addForm" onSubmit={onAdd}>
          <input
            className="fu-input"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="fu-input"
            type="email"
            placeholder="Work email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <select
            className="fu-select"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
          <select
            className="fu-select"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="fu-btn fu-btn--primary">
            Add Employee
          </button>
        </form>
        {msg ? <p className="empPg__msg">{msg}</p> : null}
      </section>

      <section className="fu-card empPg__card">
        <div className="empPg__toolbar">
          <h2>Employee Access</h2>
          <label className="empPg__filter">
            <span>Filter role</span>
            <select
              className="fu-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="empPg__tableWrap">
          <table className="empPg__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last active</th>
                <th>Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.employeeCode || '-'}</strong>
                  </td>
                  <td>
                    <strong>{e.name}</strong>
                    <div className="empPg__muted">{e.email}</div>
                  </td>
                  <td>
                    <select
                      className="fu-select"
                      value={e.role}
                      onChange={(evt) => updateEmployee(e.id, { role: evt.target.value })}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="fu-select"
                      value={e.status}
                      onChange={(evt) => updateEmployee(e.id, { status: evt.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td>{fmtDate(e.lastActiveAt)}</td>
                  <td>{e.canManageDashboard ? 'Can manage' : 'View only'}</td>
                </tr>
              ))}
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empPg__empty">No employees found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fu-card empPg__card">
        <div className="empPg__toolbar">
          <h2>Employee Activity</h2>
          <label className="empPg__filter">
            <span>Show activity for</span>
            <select
              className="fu-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="all">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.employeeCode ? `${e.employeeCode} - ` : '') + e.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="empPg__activity">
          {filteredActivity.map((a) => (
            <li key={a.id}>
              <div className="empPg__activityTop">
                <strong>{a.action}</strong>
                <time>{fmtDate(a.at)}</time>
              </div>
              <p>{a.detail}</p>
              <small>By: {a.employeeName || 'Unknown'}</small>
            </li>
          ))}
          {filteredActivity.length === 0 ? (
            <li className="empPg__empty">No activity found for this filter.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
