// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, API_BASE_URL } from '../api/client';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [campaignData, riskData, healthData, trendData] = await Promise.all([
        api.get('/api/reports/campaigns'),
        api.get('/api/reports/risk/high-risk-users?top=10'),
        api.get('/api/reports/health'),
        api.get('/api/reports/trends?days=30')
      ]);
      setCampaigns(campaignData || []);
      setHighRiskUsers(riskData || []);
      setHealth(healthData || null);
      setTrends(trendData || []);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  function resolveTenantSlug() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tenantSlug');
      if (stored && stored.trim()) return stored.trim().toLowerCase();
    }

    return 'default';
  }

  function resolveUserRole() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('userRole');
      if (stored && stored.trim()) return stored.trim();
    }

    return 'TenantAdmin';
  }

  function resolveUserEmail() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('userEmail');
      if (stored && stored.trim()) return stored.trim();
    }

    return '';
  }

  async function downloadCsv(path, filename) {
    try {
      const headers = {
        'X-Tenant': resolveTenantSlug(),
        'X-Role': resolveUserRole(),
        ...(resolveUserEmail() ? { 'X-User-Email': resolveUserEmail() } : {})
      };

      const res = await fetch(`${API_BASE_URL}${path}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Export failed.');
    }
  }

  const kpis = useMemo(() => {
    const totals = campaigns.reduce(
      (acc, c) => {
        acc.sent += c.totalSent || 0;
        acc.open += c.totalOpen || 0;
        acc.click += c.totalClick || 0;
        acc.submitted += c.totalSubmitted || 0;
        acc.reported += c.totalReported || 0;
        return acc;
      },
      { sent: 0, open: 0, click: 0, submitted: 0, reported: 0 }
    );

    const rate = (count) => (totals.sent > 0 ? (count * 100) / totals.sent : 0);

    return {
      campaigns: campaigns.length,
      sent: totals.sent,
      openRate: rate(totals.open),
      clickRate: rate(totals.click),
      submittedRate: rate(totals.submitted),
      reportedRate: rate(totals.reported)
    };
  }, [campaigns]);

  const recentCampaigns = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => (b.campaignId || 0) - (a.campaignId || 0))
      .slice(0, 6);
  }, [campaigns]);

  const trendSlice = useMemo(() => {
    if (!Array.isArray(trends)) return [];
    return trends.slice(-14);
  }, [trends]);

  const trendMax = useMemo(() => {
    if (trendSlice.length === 0) return 1;
    return Math.max(
      1,
      ...trendSlice.map(t => Math.max(t.sent || 0, t.open || 0, t.click || 0, t.submitted || 0, t.reported || 0))
    );
  }, [trendSlice]);

  return (
    <div className="page page--dashboard">
      <h1>Dashboard</h1>

      <ErrorMessage message={error} />

      {loading ? (
        <Loader label="Loading dashboard…" />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Campaigns</span>
              <strong className="kpi-value">{kpis.campaigns}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Emails sent</span>
              <strong className="kpi-value">{kpis.sent}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Open rate</span>
              <strong className="kpi-value">{kpis.openRate.toFixed(1)}%</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Click rate</span>
              <strong className="kpi-value">{kpis.clickRate.toFixed(1)}%</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Submitted</span>
              <strong className="kpi-value">{kpis.submittedRate.toFixed(1)}%</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Reported</span>
              <strong className="kpi-value">{kpis.reportedRate.toFixed(1)}%</strong>
            </div>
          </div>

          <div className="layout-two-columns">
            <div className="col col--wide">
              <section className="dashboard-section">
                <header className="list-header">
                  <h2>Recent campaign performance</h2>
                  <div className="dashboard-actions">
                    <span className="muted small">Last {recentCampaigns.length} campaigns</span>
                    <button
                      className="btn btn-ghost btn--small"
                      type="button"
                      onClick={() => downloadCsv('/api/reports/campaigns/export', 'campaign_summaries.csv')}
                    >
                      Export CSV
                    </button>
                  </div>
                </header>

                <div className="chart">
                  {recentCampaigns.map(c => (
                    <div key={c.campaignId} className="chart-row">
                      <div className="chart-label">{c.name}</div>
                      <div className="chart-bars">
                        <div className="chart-bar chart-bar--open" style={{ width: `${c.openRate || 0}%` }}>
                          <span>Open {Number(c.openRate || 0).toFixed(1)}%</span>
                        </div>
                        <div className="chart-bar chart-bar--click" style={{ width: `${c.clickRate || 0}%` }}>
                          <span>Click {Number(c.clickRate || 0).toFixed(1)}%</span>
                        </div>
                        <div className="chart-bar chart-bar--submit" style={{ width: `${c.submittedRate || 0}%` }}>
                          <span>Submit {Number(c.submittedRate || 0).toFixed(1)}%</span>
                        </div>
                        <div className="chart-bar chart-bar--report" style={{ width: `${c.reportedRate || 0}%` }}>
                          <span>Report {Number(c.reportedRate || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-section">
                <header className="list-header">
                  <h2>30-day engagement trend</h2>
                  <span className="muted small">Last 14 days shown</span>
                </header>

                {trendSlice.length === 0 ? (
                  <p className="empty-state">No trend data yet.</p>
                ) : (
                  <div className="trend-chart">
                    {trendSlice.map(day => (
                      <div key={day.date} className="trend-row">
                        <div className="trend-label">{day.date}</div>
                        <div className="trend-bars">
                          <div
                            className="trend-bar trend-bar--sent"
                            style={{ width: `${(day.sent / trendMax) * 100}%` }}
                          >
                            Sent {day.sent}
                          </div>
                          <div
                            className="trend-bar trend-bar--open"
                            style={{ width: `${(day.open / trendMax) * 100}%` }}
                          >
                            Open {day.open}
                          </div>
                          <div
                            className="trend-bar trend-bar--click"
                            style={{ width: `${(day.click / trendMax) * 100}%` }}
                          >
                            Click {day.click}
                          </div>
                          <div
                            className="trend-bar trend-bar--submit"
                            style={{ width: `${(day.submitted / trendMax) * 100}%` }}
                          >
                            Submit {day.submitted}
                          </div>
                          <div
                            className="trend-bar trend-bar--report"
                            style={{ width: `${(day.reported / trendMax) * 100}%` }}
                          >
                            Report {day.reported}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="col col--side">
              <section className="dashboard-section">
                <header className="list-header">
                  <h2>Tenant health</h2>
                  <span className="muted small">Score out of 100</span>
                </header>

                {!health ? (
                  <p className="empty-state">No health data yet.</p>
                ) : (
                  <div className="health-card">
                    <div className="health-score">{Number(health.healthScore || 0).toFixed(1)}</div>
                    <div className="health-breakdown">
                      <div><span>Open</span><strong>{Number(health.openRate || 0).toFixed(1)}%</strong></div>
                      <div><span>Click</span><strong>{Number(health.clickRate || 0).toFixed(1)}%</strong></div>
                      <div><span>Submit</span><strong>{Number(health.submittedRate || 0).toFixed(1)}%</strong></div>
                      <div><span>Report</span><strong>{Number(health.reportedRate || 0).toFixed(1)}%</strong></div>
                    </div>
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <header className="list-header">
                  <h2>High-risk users</h2>
                  <div className="dashboard-actions">
                    <span className="muted small">Top 10</span>
                    <button
                      className="btn btn-ghost btn--small"
                      type="button"
                      onClick={() => downloadCsv('/api/reports/risk/high-risk-users/export?top=50', 'high_risk_users.csv')}
                    >
                      Export CSV
                    </button>
                  </div>
                </header>

                {highRiskUsers.length === 0 ? (
                  <p className="empty-state">No high-risk users yet.</p>
                ) : (
                  <ul className="risk-list">
                    {highRiskUsers.map(u => (
                      <li key={u.targetUserId} className="risk-item">
                        <div>
                          <strong>{u.displayName || u.email}</strong>
                          <div className="muted small">{u.department || '—'}</div>
                        </div>
                        <div className="risk-score">
                          {u.riskScore}
                          <span className="muted small">pts</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
