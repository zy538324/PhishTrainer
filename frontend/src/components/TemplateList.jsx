import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TemplateList({ onChanged, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
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
      const data = await api.get("/api/templates");
      setTemplates(data);
    } catch (err) {
      setError(err?.message || "Failed to load templates.");
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

  function handleEdit(template) {
    onSelectTemplate?.(template);
  }

  async function confirmDelete(id) {
    setActionError("");

    try {
      await api.del(`/api/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setPendingDeleteId(null);
      onChanged?.();
    } catch (err) {
      setActionError(err?.message || "Failed to delete template.");
    }
  }

  if (loading) {
    return <Loader label="Loading templates…" />;
  }

  /* =========================
     Render
     ========================= */

  return (
    <section className="template-list">
      <header className="list-header">
        <h2>Templates</h2>
      </header>

      <ErrorMessage message={error || actionError} />

      {templates.length === 0 ? (
        <p className="empty-state">
          No email templates have been created yet.
        </p>
      ) : (
        <table className="table table--templates">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Subject</th>
              <th scope="col">Last updated</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {templates.map(t => {
              const isDeleting = pendingDeleteId === t.id;

              return (
                <tr key={t.id}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleEdit(t)}
                    >
                      {t.name}
                    </button>
                  </td>

                  <td>{t.subject}</td>

                  <td>
                    {t.updatedAtUtc
                      ? new Date(t.updatedAtUtc).toLocaleString()
                      : "—"}
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
                      <>
                        <button
                          type="button"
                          className="btn btn--small"
                          onClick={() => handleEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => {
                            setPendingDeleteId(t.id);
                            setActionError("");
                          }}
                        >
                          Delete
                        </button>
                      </>
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
