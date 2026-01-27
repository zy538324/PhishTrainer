import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TemplateList({ onChanged, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [actionError, setActionError] = useState("");

  /* =========================
     Load
     ========================= */

  async function load() {
    try {
      setLoading(true);
      setError("");
      const qs = new URLSearchParams();
      if (filterCategory) qs.set("category", filterCategory);
      if (filterDifficulty) qs.set("difficulty", filterDifficulty);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      const data = await api.get(`/api/templates${query}`);
      setTemplates(data);
    } catch (err) {
      setError(err?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterCategory, filterDifficulty]);

  /* =========================
     Actions
     ========================= */

  function handleEdit(template) {
    onSelectTemplate?.(template);
  }

  async function confirmDelete(id) {
    setActionError("");

    try {
      const res = await api.del(`/api/templates/${id}`);
      if (res?.status === "deactivated") {
        setActionError("Template was deactivated. Refreshing list...");
        await load();
      } else {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
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
        <div className="template-filters">
          <input
            type="text"
            placeholder="Category"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          />
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
          >
            <option value="">All difficulties</option>
            <option value="VeryEasy">VeryEasy</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="VeryHard">VeryHard</option>
          </select>
        </div>
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
              <th scope="col">Category</th>
              <th scope="col">Difficulty</th>
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
                  <td>{t.category || "—"}</td>
                  <td>{t.difficulty || "—"}</td>

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
