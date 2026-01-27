// src/components/TargetList.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function TargetList({ group, reloadKey }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!group) {
      setTargets([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get(`/api/targets?groupId=${group.id}`);
        if (!cancelled) setTargets(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load targets.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [group, reloadKey]);

  async function handleDelete(id) {
    if (!window.confirm('Remove this target?')) return;
    try {
      await api.del(`/api/targets/${id}`);
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove target.');
    }
  }

  if (!group) {
    return null;
  }

  if (loading) return <Loader label="Loading targets…" />;

  return (
    <div className="target-list">
      <h3>Targets in “{group.name}”</h3>

      <ErrorMessage message={error} />

      {targets.length === 0 ? (
        <p>No targets in this group yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.isActive ? 'Yes' : 'No'}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(t.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
