import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

export default function TenantList({ onSelectTenant, onChanged }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/tenants");
      setTenants(data || []);
    } catch (err) {
      setError(err?.message || "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(id) {
    try {
      await api.del(`/api/tenants/${id}`);
      setTenants(prev => prev.filter(t => t.id !== id));
      onChanged?.();
    } catch (err) {
      setError(err?.message || "Failed to delete tenant.");
    }
  }

  if (loading) return <Loader label="Loading tenants…" />;

  return (
    <section className="tenant-list">
      <header className="list-header">
        <h2>Tenants</h2>
      </header>

      <ErrorMessage message={error} />

      {tenants.length === 0 ? (
        <p className="empty-state">No tenants configured.</p>
      ) : (
        <table className="table table--tenants">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Active</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelectTenant?.(t)}
                  >
                    {t.name}
                  </button>
                </td>
                <td>{t.slug}</td>
                <td>{t.isActive ? 'Yes' : 'No'}</td>
                <td className="table-actions">
                  <button type="button" className="btn btn--small" onClick={() => onSelectTenant?.(t)}>Edit</button>
                  <button type="button" className="btn btn--small btn--danger" onClick={() => confirmDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
