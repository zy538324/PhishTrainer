// src/components/CampaignList.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function CampaignList({ onSelectCampaign, onChanged }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleValue, setScheduleValue] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/campaigns');
      setCampaigns(data);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function launch(id) {
    try {
      await api.post(`/api/campaigns/${id}/launch`, {});
      if (onChanged) onChanged();
      await load();
    } catch (err) {
      alert(err.message || 'Failed to launch campaign.');
    }
  }

  async function schedule(id) {
    if (!scheduleValue) {
      alert('Please pick a schedule date/time first.');
      return;
    }
    try {
      const iso = new Date(scheduleValue).toISOString();
      await api.post(`/api/campaigns/${id}/schedule`, iso);
      setSchedulingId(null);
      setScheduleValue('');
      if (onChanged) onChanged();
      await load();
    } catch (err) {
      alert(err.message || 'Failed to schedule campaign.');
    }
  }

  if (loading) return <Loader label="Loading campaigns…" />;

  return (
    <div className="campaign-list">
      <h2>Campaigns</h2>

      <ErrorMessage message={error} />

      {campaigns.length === 0 ? (
        <p>No campaigns yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Launched</th>
              <th>Throttle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelectCampaign && onSelectCampaign(c)}
                  >
                    {c.name}
                  </button>
                </td>
                <td>{c.status}</td>
                <td>
                  {c.scheduledAtUtc
                    ? new Date(c.scheduledAtUtc).toLocaleString()
                    : '—'}
                </td>
                <td>
                  {c.launchedAtUtc
                    ? new Date(c.launchedAtUtc).toLocaleString()
                    : '—'}
                </td>
                <td>{c.throttlePerMinute}</td>
                <td>
                  <button type="button" onClick={() => launch(c.id)}>
                    Launch
                  </button>

                  {schedulingId === c.id ? (
                    <>
                      <input
                        type="datetime-local"
                        value={scheduleValue}
                        onChange={(e) => setScheduleValue(e.target.value)}
                      />
                      <button type="button" onClick={() => schedule(c.id)}>
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSchedulingId(null);
                          setScheduleValue('');
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSchedulingId(c.id);
                        setScheduleValue('');
                      }}
                    >
                      Schedule
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
