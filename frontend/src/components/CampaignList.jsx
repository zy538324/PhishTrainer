import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function CampaignList({ onSelectCampaign, onChanged }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [actionError, setActionError] = useState("");

  /* =========================
     Load
     ========================= */

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/campaigns");
      setCampaigns(data);
    } catch (err) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =========================
     Actions
     ========================= */

  async function handleLaunch(id) {
    setActionError("");

    try {
      await api.post(`/api/campaigns/${id}/launch`, {});
      onChanged?.();
      await load();
    } catch (err) {
      setActionError(err?.message || "Failed to launch campaign.");
    }
  }

  async function handleSchedule(id) {
    if (!scheduleAt) {
      setActionError("Please select a date and time to schedule.");
      return;
    }

    setActionError("");

    try {
      const iso = new Date(scheduleAt).toISOString();
      await api.post(`/api/campaigns/${id}/schedule`, iso);

      setActiveScheduleId(null);
      setScheduleAt("");
      onChanged?.();
      await load();
    } catch (err) {
      setActionError(err?.message || "Failed to schedule campaign.");
    }
  }

  async function handleClone(id) {
    setActionError("");
    try {
      await api.post(`/api/campaigns/${id}/clone`, {});
      onChanged?.();
      await load();
    } catch (err) {
      setActionError(err?.message || "Failed to clone campaign.");
    }
  }

  const stats = useMemo(() => {
    const total = campaigns.length;
    const byStatus = campaigns.reduce((acc, c) => {
      const key = (c.status || "Draft").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      draft: byStatus.draft || 0,
      scheduled: byStatus.scheduled || 0,
      running: byStatus.running || 0,
      completed: byStatus.completed || 0
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const term = query.trim().toLowerCase();
    return campaigns.filter(c => {
      const matchesQuery = !term || (c.name || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || (c.status || "draft").toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [campaigns, query, statusFilter]);

  if (loading) {
    return <Loader label="Loading campaigns…" />;
  }

  /* =========================
     Render
     ========================= */

  return (
    <section className="campaign-list">
      <header className="list-header">
        <h2>Campaigns</h2>
      </header>

      <ErrorMessage message={error || actionError} />

      <section className="campaign-stats">
        <div className="stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Draft</span>
          <strong>{stats.draft}</strong>
        </div>
        <div className="stat-card">
          <span>Scheduled</span>
          <strong>{stats.scheduled}</strong>
        </div>
        <div className="stat-card">
          <span>Running</span>
          <strong>{stats.running}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
      </section>

      <div className="campaign-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="Search campaign name"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn--small" type="button" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <p className="empty-state">No campaigns have been created yet.</p>
      ) : (
        <table className="table table--campaigns">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Scheduled</th>
              <th scope="col">Launched</th>
              <th scope="col">Throttle</th>
              <th scope="col">A/B Split</th>
              <th scope="col">Recurrence</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => {
              const isScheduling = activeScheduleId === c.id;

              return (
                <tr key={c.id}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onSelectCampaign?.(c)}
                    >
                      {c.name}
                    </button>
                  </td>

                  <td>
                    <span className={`status status--${c.status}`}>
                      {c.status}
                    </span>
                  </td>

                  <td>
                    {c.scheduledAtUtc
                      ? new Date(c.scheduledAtUtc).toLocaleString()
                      : "—"}
                  </td>

                  <td>
                    {c.launchedAtUtc
                      ? new Date(c.launchedAtUtc).toLocaleString()
                      : "—"}
                  </td>

                  <td>{c.throttlePerMinute}</td>
                  <td>
                    {c.abSplitPercent && c.emailTemplateB
                      ? `${c.abSplitPercent}% B`
                      : "—"}
                  </td>
                  <td>
                    {c.recurrenceType && c.recurrenceType !== "None"
                      ? `${c.recurrenceType} / ${c.recurrenceInterval || 1}`
                      : "—"}
                  </td>

                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => handleLaunch(c.id)}
                      disabled={(c.status || "").toLowerCase() !== "draft"}
                    >
                      Launch
                    </button>

                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => handleClone(c.id)}
                    >
                      Clone
                    </button>

                    {isScheduling ? (
                      <div className="schedule-inline">
                        <input
                          type="datetime-local"
                          value={scheduleAt}
                          onChange={e => setScheduleAt(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn--small btn--primary"
                          onClick={() => handleSchedule(c.id)}
                          disabled={!scheduleAt}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--small"
                          onClick={() => {
                            setActiveScheduleId(null);
                            setScheduleAt("");
                            setActionError("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--small btn--secondary"
                        onClick={() => {
                          setActiveScheduleId(c.id);
                          setScheduleAt("");
                          setActionError("");
                        }}
                        disabled={(c.status || "").toLowerCase() !== "draft"}
                      >
                        Schedule
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
