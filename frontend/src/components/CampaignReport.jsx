import React, { useEffect, useMemo, useState } from "react";
import { api, API_BASE_URL } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function CampaignReport({ campaign }) {
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     Load report when campaign changes
     ========================= */

  useEffect(() => {
    if (!campaign) {
      setReport(null);
      setUsers([]);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");
        setReport(null);
        setUsers([]);

        const [data, userData] = await Promise.all([
          api.get(`/api/campaigns/${campaign.id}/report`),
          api.get(`/api/reports/campaigns/${campaign.id}/users`)
        ]);

        if (!cancelled) {
          setReport(data);
          setUsers(userData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load campaign report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [campaign?.id]);

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

  async function downloadCsv() {
    if (!campaign?.id) return;
    try {
      const headers = {
        'X-Tenant': resolveTenantSlug(),
        'X-Role': resolveUserRole(),
        ...(resolveUserEmail() ? { 'X-User-Email': resolveUserEmail() } : {})
      };

      const res = await fetch(`${API_BASE_URL}/api/reports/campaigns/${campaign.id}/users/export`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign_${campaign.id}_users.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Export failed.');
    }
  }

  /* =========================
     Empty states
     ========================= */

  if (!campaign) {
    return (
      <aside className="campaign-report campaign-report--empty">
        <p>Select a campaign to view performance and engagement data.</p>
      </aside>
    );
  }

  if (loading) {
    return <Loader label="Loading campaign report…" />;
  }

  if (error) {
    return (
      <aside className="campaign-report">
        <ErrorMessage message={error} />
      </aside>
    );
  }

  if (!report) {
    return (
      <aside className="campaign-report campaign-report--empty">
        <p>No report data is available for this campaign yet.</p>
      </aside>
    );
  }

  const { summary, perStatus } = report;

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matchesQuery = (u) => {
      if (!term) return true;
      return (
        (u.email || '').toLowerCase().includes(term) ||
        (u.displayName || '').toLowerCase().includes(term) ||
        (u.department || '').toLowerCase().includes(term)
      );
    };

    const matchesFilter = (u) => {
      if (filter === 'clicked') return u.clicked;
      if (filter === 'submitted') return u.submitted;
      if (filter === 'reported') return u.reported;
      if (filter === 'safe') return !u.clicked && !u.submitted;
      return true;
    };

    return (users || [])
      .filter(u => matchesQuery(u) && matchesFilter(u))
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
  }, [users, query, filter]);

  /* =========================
     Render
     ========================= */

  return (
    <aside className="campaign-report">
      <header className="report-header">
        <h2>Campaign report</h2>
        <p className="report-title">{campaign.name}</p>
      </header>

      {summary && (
        <section className="report-summary">
          <h3>Summary</h3>
          <dl className="summary-grid">
            <div>
              <dt>Total targets</dt>
              <dd>{summary.totalTargets}</dd>
            </div>
            <div>
              <dt>Sent</dt>
              <dd>{summary.sent}</dd>
            </div>
            <div>
              <dt>Delivered</dt>
              <dd>{summary.delivered}</dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{summary.opened}</dd>
            </div>
            <div>
              <dt>Clicked</dt>
              <dd className="risk">{summary.clicked}</dd>
            </div>
            <div>
              <dt>Bounced</dt>
              <dd>{summary.bounced}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="report-users">
        <header className="report-header-row">
          <h3>Targets & risk</h3>
          <div className="report-actions">
            <button className="btn btn-ghost btn--small" type="button" onClick={downloadCsv}>
              Export CSV
            </button>
          </div>
        </header>

        <div className="report-filters">
          <input
            type="text"
            placeholder="Search by name, email, or dept"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="clicked">Clicked</option>
            <option value="submitted">Submitted</option>
            <option value="reported">Reported</option>
            <option value="safe">No click/submit</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="empty-state">No targets match the current filters.</p>
        ) : (
          <div className="report-table-wrapper">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Department</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.targetUserId}>
                    <td>
                      <div className="user-cell">
                        <strong>{u.displayName || u.email}</strong>
                        <span className="muted small">{u.email}</span>
                      </div>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>
                      <span className={u.riskScore >= 70 ? 'badge badge--danger' : u.riskScore >= 40 ? 'badge badge--warn' : 'badge'}>
                        {Number(u.riskScore || 0).toFixed(1)} pts
                      </span>
                    </td>
                    <td>
                      <div className="activity-badges">
                        {u.opened && <span className="badge">Opened</span>}
                        {u.clicked && <span className="badge badge--warn">Clicked</span>}
                        {u.submitted && <span className="badge badge--danger">Submitted</span>}
                        {u.reported && <span className="badge badge--success">Reported</span>}
                        {!u.opened && !u.clicked && !u.submitted && !u.reported && (
                          <span className="badge">No activity</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {Array.isArray(perStatus) && perStatus.length > 0 && (
        <section className="report-breakdown">
          <h3>Status breakdown</h3>
          <table className="table table--compact">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {perStatus.map(row => (
                <tr key={row.status}>
                  <td>{row.status}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!summary && (!perStatus || perStatus.length === 0) && (
        <p className="muted">
          Data will appear once messages are sent and interacted with.
        </p>
      )}
    </aside>
  );
}
