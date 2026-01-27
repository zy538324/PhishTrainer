// src/components/TargetGroupForm.jsx
import React, { useState } from 'react';
import { api } from '../api/client';
import ErrorMessage from './ErrorMessage';

export default function TargetGroupForm({ onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name) {
      setError('Name is required.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const dto = {
        name,
        description,
      };

      await api.post('/api/targets/groups', dto);

      setName('');
      setDescription('');

      if (onCreated) onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create target group.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="target-group-form" onSubmit={handleSubmit}>
      <h2>Create target group</h2>

      <ErrorMessage message={error} />

      <label>
        Group name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        Description (optional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create group'}
      </button>
    </form>
  );
}
