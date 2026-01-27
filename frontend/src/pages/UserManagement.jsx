// src/pages/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isActive, setIsActive] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      // Adjust endpoint to match your backend, e.g. /api/users or /api/tenants/{id}/users
      const data = await api.get('/api/users');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !email) {
      setFormError('Name and email are required.');
      return;
    }

    setFormError('');
    setSaving(true);

    try {
      const dto = {
        name,
        email,
        role,
        isActive,
      };

      // Adjust endpoint if needed for multi-tenant (e.g. include tenantId)
      await api.post('/api/users', dto);

      setName('');
      setEmail('');
      setRole('user');
      setIsActive(true);

      await load();
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      // Example: PUT /api/users/{id}/status with toggled isActive
      await api.put(`/api/users/${user.id}`, {
        ...user,
        isActive: !user.isActive,
      });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update user.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.del(`/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  }

  if (loading) {
    return (
      <div className="page page--users">
        <h1>User management</h1>
        <Loader label="Loading users…" />
      </div>
    );
  }

  return (
    <div className="page page--users">
      <h1>User management</h1>

      <section className="users-section users-section--form">
        <h2>Add user</h2>

        <ErrorMessage message={formError} />

        <form onSubmit={handleSubmit} className="user-form">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add user'}
          </button>
        </form>
      </section>

      <section className="users-section users-section--list">
        <h2>Existing users</h2>

        <ErrorMessage message={error} />

        {users.length === 0 ? (
          <p>No users yet.</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role || 'user'}</td>
                  <td>{u.isActive ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" onClick={() => handleToggleActive(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
