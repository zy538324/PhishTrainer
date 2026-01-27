// src/components/CampaignReport.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

export default function CampaignReport({ campaign }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaign) {
      setReport(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get(`/api/campaigns/${campaign.id}/report`);
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  if (!campaign) {
    return <div>Select a campaign to see its report.</div>;
  }

  if (loading) {
    return <Loader label="Loading report…" />;
  }

  if (!report && !error) {
    return <div>No report yet for this campaign.</div>;
  }

  const { summary, perStatus } = report || {};

  return (
    <div className="campaign-report">
      <h2>Report for “{campaign.name}”</h2>

      <ErrorMessage message={error} />

      {summary && (
        <div className="summary">
          <p>Total targets: {summary.totalTargets}</p>
          <p>Sent: {summary.sent}</p>
          <p>Delivered: {summary.delivered}</p>
          <p>Opened: {summary.opened}</p>
          <p>Clicked: {summary.clicked}</p>
          <p>Bounced: {summary.bounced}</p>
        </div>
      )}

      {perStatus && perStatus.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {perStatus.map((row) => (
              <tr key={row.status}>
                <td>{row.status}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!summary && (!perStatus || perStatus.length === 0) && !error && (
        <div>No data available for this campaign yet.</div>
      )}
    </div>
  );
}
