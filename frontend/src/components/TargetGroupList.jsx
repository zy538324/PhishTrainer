import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TargetGroupList({ onSelectGroup, onChanged }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [actionError, setActionError] = useState("");

  /* =========================
     Load
     ========================= */

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/targets/groups");
      setGroups(data);
    } catch (err) {
      setError(err?.message || "Failed to load target groups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =========================
     Delete
     ========================= */

  async function confirmDelete(id) {
    setActionError("");

    try {
      await api.del(`/api/targets/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      setPendingDeleteId(null);
      onChanged?.();
    } catch (err) {
      setActionError(err?.message || "Failed to delete target group.");
    }
  }

  if (loading) {
    return <Loader label="Loading target groups…" />;
  }

  /* =========================
     Render
     ========================= */

  return (
    <section className="target-group-list">
      <header className="list-header">
        <h2>Target groups</h2>
      </header>

      <ErrorMessage message={error || actionError} />

      {groups.length === 0 ? (
        <p className="empty-state">
          No target groups have been created yet.
        </p>
      ) : (
        <table className="table table--groups">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Description</th>
              <th scope="col">Active / Total</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const isDeleting = pendingDeleteId === g.id;

              return (
                <tr key={g.id}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onSelectGroup?.(g)}
                    >
                      {g.name}
                    </button>
                  </td>

                  <td>{g.description || "—"}</td>

                  <td>
                    {g.activeTargets}/{g.totalTargets}
                  </td>

                  <td className="table-actions">
                    {isDeleting ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => confirmDelete(g.id)}
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
                          setPendingDeleteId(g.id);
                          setActionError("");
                        }}
                      >
                        Delete
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
