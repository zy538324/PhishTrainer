import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import ErrorMessage from "./ErrorMessage";

const INITIAL = { id: null, slug: "", name: "", isActive: true, logoUrl: "", primaryColorHex: "" };

export default function TenantForm({ initialTenant, onCreated, onUpdated }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTenant?.id) {
      setForm({
        id: initialTenant.id,
        slug: initialTenant.slug || "",
        name: initialTenant.name || "",
        isActive: initialTenant.isActive ?? true,
        logoUrl: initialTenant.logoUrl || "",
        primaryColorHex: initialTenant.primaryColorHex || ""
      });
    } else {
      setForm(INITIAL);
    }
    setError("");
  }, [initialTenant?.id]);

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) {
      setError("Slug and name are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const dto = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        isActive: form.isActive,
        logoUrl: form.logoUrl || undefined,
        primaryColorHex: form.primaryColorHex || undefined
      };

      if (form.id) {
        await api.put(`/api/tenants/${form.id}`, dto);
        onUpdated?.();
      } else {
        await api.post(`/api/tenants`, dto);
        onCreated?.();
        setForm(INITIAL);
      }
    } catch (err) {
      setError(err?.message || "Failed to save tenant.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (initialTenant?.id) setForm(initialTenant);
    else setForm(INITIAL);
    setError("");
  }

  return (
    <form className="tenant-form" onSubmit={handleSubmit} noValidate>
      <header className="form-header">
        <h2>{form.id ? "Edit tenant" : "Create tenant"}</h2>
      </header>

      <ErrorMessage message={error} />

      <div className="form-group">
        <label>Slug</label>
        <input value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="acme" required />
      </div>

      <div className="form-group">
        <label>Name</label>
        <input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Acme Inc" required />
      </div>

      <div className="form-group">
        <label>
          <input type="checkbox" checked={form.isActive} onChange={e => updateField('isActive', e.target.checked)} /> Active
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Update tenant' : 'Create tenant'}</button>
        <button type="button" className="btn" onClick={handleReset} disabled={saving}>Reset</button>
      </div>
    </form>
  );
}
