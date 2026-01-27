import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function CampaignList({ onSelectCampaign, onChanged }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {campaigns.length === 0 ? (
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
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
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

                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => handleLaunch(c.id)}
                      disabled={c.status !== "draft"}
                    >
                      Launch
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
                        disabled={c.status !== "draft"}
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
