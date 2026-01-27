// src/components/CampaignForm.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function CampaignForm({ onCreated }) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [landingPageId, setLandingPageId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [scheduledAtUtc, setScheduledAtUtc] = useState('');
  const [throttlePerMinute, setThrottlePerMinute] = useState(60);

  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load templates and target groups once
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [templatesRes, groupsRes] = await Promise.all([
          api.get('/api/templates'),
          api.get('/api/targets/groups'),
        ]);
        if (!cancelled) {
          setTemplates(templatesRes);
          setGroups(groupsRes);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !templateId || !landingPageId || !targetGroupId) {
      setError('Name, template, landing page, and target group are required.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const dto = {
        name,
        templateId: Number(templateId),
        landingPageId: Number(landingPageId),
        targetGroupId: Number(targetGroupId),
        scheduledAtUtc: scheduledAtUtc
          ? new Date(scheduledAtUtc).toISOString()
          : null,
        throttlePerMinute: Number(throttlePerMinute) || 0,
      };

      await api.post('/api/campaigns', dto);

      // Reset form
      setName('');
      setTemplateId('');
      setLandingPageId('');
      setTargetGroupId('');
      setScheduledAtUtc('');
      setThrottlePerMinute(60);

      if (onCreated) onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loader label="Loading campaign form…" />;
  }

  return (
    <form className="campaign-form" onSubmit={handleSubmit}>
      <h2>Create campaign</h2>

      <ErrorMessage message={error} />

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
        Email template
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          required
        >
          <option value="">Select template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {/* For now, landing page is a numeric ID.
          Later you can replace this with a real landing page selector. */}
      <label>
        Landing page
        <input
          type="number"
          value={landingPageId}
          onChange={(e) => setLandingPageId(e.target.value)}
          placeholder="Landing page ID"
          required
        />
      </label>

      <label>
        Target group
        <select
          value={targetGroupId}
          onChange={(e) => setTargetGroupId(e.target.value)}
          required
        >
          <option value="">Select group…</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.activeTargets}/{g.totalTargets})
            </option>
          ))}
        </select>
      </label>

      <label>
        Schedule (UTC, optional)
        <input
          type="datetime-local"
          value={scheduledAtUtc}
          onChange={(e) => setScheduledAtUtc(e.target.value)}
        />
      </label>

      <label>
        Throttle (emails per minute, 0 = no limit)
        <input
          type="number"
          min="0"
          value={throttlePerMinute}
          onChange={(e) => setThrottlePerMinute(e.target.value)}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create campaign'}
      </button>
    </form>
  );
}
