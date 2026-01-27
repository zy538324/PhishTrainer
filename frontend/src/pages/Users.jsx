// src/pages/Users.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { api } from '../api/client';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const INITIAL = {
  displayName: '',
  email: '',
  role: 'TenantAdmin',
  isActive: true
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL);
  const [editingId, setEditingId] = useState(null);
  const [tenantSlug, setTenantSlug] = useState('default');
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tenantSlug');
      if (stored) setTenantSlug(stored);
    }
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/users', { headers: { 'X-Tenant': tenantSlug } });
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantSlug]);

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'TenantAdmin',
      isActive: user.isActive ?? true
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL);
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const hasHeader = header.includes('email');

    const start = hasHeader ? 1 : 0;
    const rows = [];

    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const row = hasHeader
        ? {
            email: cols[header.indexOf('email')] || '',
            displayName: cols[header.indexOf('name')] || cols[header.indexOf('displayname')] || '',
            role: cols[header.indexOf('role')] || 'TenantAdmin',
            isActive: (cols[header.indexOf('active')] || 'true').toLowerCase() !== 'false'
          }
        : {
            email: cols[0] || '',
            displayName: cols[1] || '',
            role: cols[2] || 'TenantAdmin',
            isActive: (cols[3] || 'true').toLowerCase() !== 'false'
          };

      rows.push(row);
    }

    return rows;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const dto = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive
      };

      if (editingId) {
        await api.put(`/api/users/${editingId}`, dto, { headers: { 'X-Tenant': tenantSlug } });
      } else {
        await api.post('/api/users', dto, { headers: { 'X-Tenant': tenantSlug } });
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.del(`/api/users/${id}`, { headers: { 'X-Tenant': tenantSlug } });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  }

  function handleImportFile(file) {
    if (!file) return;

    setImportErrors([]);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map(r => ({
          email: (r.email || r.Email || '').trim(),
          displayName: (r.displayName || r.DisplayName || r.name || r.Name || '').trim(),
          role: (r.role || r.Role || 'TenantAdmin').trim(),
          isActive: String(r.isActive || r.IsActive || 'true').toLowerCase() !== 'false'
        }));

        const errors = [];
        rows.forEach((r, idx) => {
          if (!r.email) errors.push(`Row ${idx + 1}: missing email`);
        });

        setImportRows(rows);
        setImportErrors(errors);
      }
    });
  }

  async function handleImport() {
    if (importRows.length === 0) return;
    try {
      setSaving(true);
      setError('');
      const res = await api.post('/api/users/bulk', importRows, { headers: { 'X-Tenant': tenantSlug } });
      setImportResult(res);
      if (res?.errors?.length) {
        setImportErrors(res.errors);
      }
      setImportRows([]);
      await load();
    } catch (err) {
      setError(err.message || 'Bulk import failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      setSaving(true);
      setError('');
      const dto = {
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || 'TenantAdmin',
        isActive: !user.isActive
      };
      await api.put(`/api/users/${user.id}`, dto, { headers: { 'X-Tenant': tenantSlug } });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  function downloadCsv() {
    const rows = filteredUsers.map(u => ({
      displayName: u.displayName || '',
      email: u.email || '',
      role: u.role || 'TenantAdmin',
      isActive: u.isActive ? 'true' : 'false'
    }));

    const header = 'displayName,email,role,isActive';
    const body = rows.map(r => `${r.displayName},${r.email},${r.role},${r.isActive}`).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(() => {
    const active = users.filter(u => u.isActive).length;
    return {
      total: users.length,
      active,
      inactive: users.length - active
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();

    return users.filter(u => {
      const matchesQuery = !term ||
        (u.displayName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term);

      const matchesRole = roleFilter === 'all' || (u.role || 'TenantAdmin') === roleFilter;

      const matchesActive = activeFilter === 'all'
        || (activeFilter === 'active' && u.isActive)
        || (activeFilter === 'inactive' && !u.isActive);

      return matchesQuery && matchesRole && matchesActive;
    });
  }, [users, query, roleFilter, activeFilter]);

  if (loading) {
    return (
      <div className="page page--users">
        <h1>Users</h1>
        <Loader label="Loading users…" />
      </div>
    );
  }

  return (
    <div className="page page--users">
      <h1>Users</h1>

      <ErrorMessage message={error} />

      <section className="user-stats">
        <div className="stat-card">
          <span>Total users</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="stat-card">
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </div>
      </section>

      <form className="user-form" onSubmit={handleSubmit} noValidate>
        <header className="form-header">
          <h2>{editingId ? 'Edit user' : 'Create user'}</h2>
        </header>

        <div className="form-group">
          <label htmlFor="user-name">Name</label>
          <input
            id="user-name"
            type="text"
            value={form.displayName}
            onChange={e => updateField('displayName', e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            type="email"
            value={form.email}
            onChange={e => updateField('email', e.target.value)}
            placeholder="jane@tenant.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="user-role">Role</label>
          <select
            id="user-role"
            value={form.role}
            onChange={e => updateField('role', e.target.value)}
          >
            <option value="MspAdmin">MspAdmin</option>
            <option value="TenantAdmin">TenantAdmin</option>
            <option value="Auditor">Auditor</option>
            <option value="Analyst">Analyst</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="user-active"
            checked={form.isActive}
            onChange={e => updateField('isActive', e.target.checked)}
          />
          <label htmlFor="user-active">Active</label>
        </div>

        <div className="form-actions">
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update user' : 'Create user'}
          </button>
          {editingId && (
            <button className="btn" type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="import-section">
        <header className="form-header">
          <h2>Bulk import (CSV)</h2>
          <p className="form-subtitle">Columns: email, displayName, role, isActive</p>
        </header>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleImportFile(e.target.files?.[0])}
        />
        {importErrors.length > 0 && (
          <div className="doc-callout">
            {importErrors.map((e, i) => (<div key={i}>{e}</div>))}
          </div>
        )}
        {importRows.length > 0 && (
          <>
            <table className="table table--users">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.email}</td>
                    <td>{r.displayName || '—'}</td>
                    <td>{r.role}</td>
                    <td>{r.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn--primary" onClick={handleImport} disabled={saving || importErrors.length > 0}>
              {saving ? 'Importing…' : 'Import users'}
            </button>
          </>
        )}
        {importResult && (
          <div className="doc-callout">
            Imported: {importResult.created} created, {importResult.updated} updated, {importResult.skipped} skipped
          </div>
        )}
      </section>

      <section className="user-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="MspAdmin">MspAdmin</option>
            <option value="TenantAdmin">TenantAdmin</option>
            <option value="Auditor">Auditor</option>
            <option value="Analyst">Analyst</option>
            <option value="Viewer">Viewer</option>
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn--small" type="button" onClick={downloadCsv}>
            Export CSV
          </button>
        </div>
      </section>

      {filteredUsers.length === 0 ? (
        <p className="empty-state">No users found.</p>
      ) : (
        <table className="table table--users">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName || '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge">{u.role || 'TenantAdmin'}</span>
                </td>
                <td>
                  <span className={u.isActive ? 'status status--running' : 'status status--paused'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-actions">
                  <button className="btn btn--small" onClick={() => startEdit(u)}>Edit</button>
                  <button className="btn btn--small" onClick={() => handleToggleActive(u)} disabled={saving}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn--small btn--danger" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
