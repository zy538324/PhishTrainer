import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TargetList({ group, reloadKey }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [actionError, setActionError] = useState("");

  /* =========================
     Load
     ========================= */

  useEffect(() => {
    if (!group) {
      setTargets([]);
      setError("");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await api.get(`/api/targets?groupId=${group.id}`);
        if (!cancelled) {
          setTargets(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load targets.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [group?.id, reloadKey]);

  /* =========================
     Delete
     ========================= */

  async function confirmDelete(id) {
    setActionError("");

    try {
      await api.del(`/api/targets/${id}`);
      setTargets(prev => prev.filter(t => t.id !== id));
      setPendingDeleteId(null);
    } catch (err) {
      setActionError(err?.message || "Failed to remove target.");
    }
  }

  if (!group) {
    return null;
  }

  if (loading) {
    return <Loader label="Loading targets…" />;
  }

  /* =========================
     Render
     ========================= */

  return (
    <section className="target-list">
      <header className="list-header">
        <h3>
          Targets in <span className="muted">“{group.name}”</span>
        </h3>
      </header>

      <ErrorMessage message={error || actionError} />

      {targets.length === 0 ? (
        <p className="empty-state">
          No targets have been added to this group yet.
        </p>
      ) : (
        <table className="table table--targets">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Active</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {targets.map(t => {
              const isDeleting = pendingDeleteId === t.id;

              return (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>
                    <span
                      className={`status ${
                        t.isActive ? "status--active" : "status--inactive"
                      }`}
                    >
                      {t.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="table-actions">
                    {isDeleting ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => confirmDelete(t.id)}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn btn--small"
                          onClick={() => {
                            setPendingDeleteId(null);
                            setActionError("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--small btn--danger"
                        onClick={() => {
                          setPendingDeleteId(t.id);
                          setActionError("");
                        }}
                      >
                        Remove
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
