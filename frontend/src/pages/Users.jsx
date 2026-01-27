// src/pages/Users.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      // Adjust endpoint to match your backend
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

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="users-table users-table--readonly">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role || 'user'}</td>
                <td>{u.isActive ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
