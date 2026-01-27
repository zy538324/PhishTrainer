// src/components/TargetGroupList.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function TargetGroupList({ onSelectGroup, onChanged }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/targets/groups');
      setGroups(data);
    } catch (err) {
      setError(err.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this group?')) return;
    try {
      await api.del(`/api/targets/groups/${id}`);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (onChanged) onChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete group.');
    }
  }

  if (loading) return <div>Loading target groups…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="target-group-list">
      <h2>Target groups</h2>
      {groups.length === 0 ? (
        <p>No target groups yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Active / Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelectGroup && onSelectGroup(g)}
                  >
                    {g.name}
                  </button>
                </td>
                <td>{g.description}</td>
                <td>
                  {g.activeTargets}/{g.totalTargets}
                </td>
                <td>
                  <button type="button" onClick={() => handleDelete(g.id)}>
                    Delete
                  </button>
                  {/* Add edit/view members later */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
