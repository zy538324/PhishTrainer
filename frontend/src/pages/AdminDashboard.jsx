import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/overview');
      setData(res);
    } catch (err) {
      setError(err?.message || 'Failed to load admin overview.');
    } finally {
      setLoading(false);
    }
  }

  function openTenant(slug) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('tenantSlug', slug);
    }
    if (typeof window !== 'undefined') window.location.reload();
  }

  if (loading) return <Loader label="Loading admin overview…" />;

  return (
    <div className="page page--admin">
      <h1>MSP Admin Dashboard</h1>

      <ErrorMessage message={error} />

      {data && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Tenants</span>
              <strong className="kpi-value">{data.totals.tenants}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Active tenants</span>
              <strong className="kpi-value">{data.totals.activeTenants}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Campaigns</span>
              <strong className="kpi-value">{data.totals.campaigns}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Templates</span>
              <strong className="kpi-value">{data.totals.templates}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Targets</span>
              <strong className="kpi-value">{data.totals.targets}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Emails sent</span>
              <strong className="kpi-value">{data.totals.sent}</strong>
            </div>
          </div>

          <section className="dashboard-section">
            <header className="list-header">
              <h2>Tenants overview</h2>
              <span className="muted small">All tenants</span>
            </header>

            <table className="table table--tenants">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Campaigns</th>
                  <th>Templates</th>
                  <th>Targets</th>
                  <th>Sent</th>
                  <th>Open</th>
                  <th>Click</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.tenants.map(t => (
                  <tr key={t.tenantId}>
                    <td>
                      <span className={`status ${t.isActive ? 'status--Running' : 'status--Paused'}`}>
                        {t.name}
                      </span>
                    </td>
                    <td>{t.slug}</td>
                    <td>{t.campaigns}</td>
                    <td>{t.templates}</td>
                    <td>{t.targets}</td>
                    <td>{t.sent}</td>
                    <td>{t.open}</td>
                    <td>{t.click}</td>
                    <td className="table-actions">
                      <button className="btn btn--small" onClick={() => openTenant(t.slug)}>
                        Open tenant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
