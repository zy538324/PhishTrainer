// src/components/TemplateList.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function TemplateList({ onChanged, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/templates');
      setTemplates(data);
    } catch (err) {
      setError(err.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.del(`/api/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (onChanged) onChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete template.');
    }
  }

  function handleEdit(template) {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  }

  if (loading) return <Loader label="Loading templates…" />;

  return (
    <div className="template-list">
      <h2>Templates</h2>

      <ErrorMessage message={error} />

      {templates.length === 0 ? (
        <p>No templates yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Subject</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleEdit(t)}
                  >
                    {t.name}
                  </button>
                </td>
                <td>{t.subject}</td>
                <td>
                  {t.updatedAtUtc
                    ? new Date(t.updatedAtUtc).toLocaleString()
                    : '—'}
                </td>
                <td>
                  <button type="button" onClick={() => handleEdit(t)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(t.id)}>
                    Delete
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
