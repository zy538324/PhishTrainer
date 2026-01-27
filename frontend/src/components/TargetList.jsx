import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TargetList({ group, reloadKey }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);

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
        const data = await api.get(`/api/targets/groups/${group.id}/targets`);
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

  function handleBulkFile(file) {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map(r => ({
          email: (r.email || r.Email || '').trim(),
          displayName: (r.displayName || r.DisplayName || r.name || r.Name || '').trim(),
          department: (r.department || r.Department || '').trim(),
          managerEmail: (r.managerEmail || r.ManagerEmail || '').trim(),
          location: (r.location || r.Location || '').trim()
        }));

        const errors = [];
        rows.forEach((r, idx) => {
          if (!r.email) errors.push(`Row ${idx + 1}: missing email`);
        });

        setBulkRows(rows);
        setBulkErrors(errors);
      }
    });
  }

  async function handleBulkImport() {
    if (!group || bulkRows.length === 0) return;
    try {
      setActionError("");
      await api.post(`/api/targets/groups/${group.id}/targets/bulk`, bulkRows);
      setBulkRows([]);
      setBulkErrors([]);
      // reload list
      const data = await api.get(`/api/targets/groups/${group.id}/targets`);
      setTargets(data);
    } catch (err) {
      setActionError(err?.message || "Failed to bulk import targets.");
    }
  }

  return (
    <section className="target-list">
      <header className="list-header">
        <h3>
          Targets in <span className="muted">“{group.name}”</span>
        </h3>
      </header>

      <ErrorMessage message={error || actionError} />

      <div className="doc-section">
        <h4>Bulk import (CSV)</h4>
        <p className="muted small">Columns: email, displayName, department, managerEmail, location</p>
        <input type="file" accept=".csv" onChange={(e) => handleBulkFile(e.target.files?.[0])} />
        {bulkErrors.length > 0 && (
          <div className="doc-callout">
            {bulkErrors.map((e, i) => (<div key={i}>{e}</div>))}
          </div>
        )}
        {bulkRows.length > 0 && (
          <button className="btn btn--primary" onClick={handleBulkImport} disabled={bulkErrors.length > 0}>
            Import targets
          </button>
        )}
      </div>

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
                  <td>{t.displayName || "—"}</td>
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
