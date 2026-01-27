// src/components/TargetForm.jsx
import React, { useState } from 'react';
import { api } from '../api/client';
import ErrorMessage from './ErrorMessage';

export default function TargetForm({ group, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!group) {
    return <div>Select a target group to add people.</div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const dto = {
        name,
        email,
        groupId: group.id,
      };

      await api.post('/api/targets', dto);

      setName('');
      setEmail('');

      if (onCreated) onCreated();
    } catch (err) {
      setError(err.message || 'Failed to add target.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="target-form" onSubmit={handleSubmit}>
      <h3>Add target to “{group.name}”</h3>

      <ErrorMessage message={error} />

      <label>
        Full name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        Email address
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Adding…' : 'Add target'}
      </button>
    </form>
  );
}
