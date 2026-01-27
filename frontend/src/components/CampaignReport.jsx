import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function CampaignReport({ campaign }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     Load report when campaign changes
     ========================= */

  useEffect(() => {
    if (!campaign) {
      setReport(null);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");
        setReport(null);

        const data = await api.get(
          `/api/campaigns/${campaign.id}/report`
        );

        if (!cancelled) {
          setReport(data);
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
