import React, { useState } from "react";
import { api } from "../api/client";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  description: ""
};

export default function TargetGroupForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function isValid() {
    return form.name.trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid()) {
      setError("Group name is required.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const dto = {
        name: form.name.trim(),
        description: form.description.trim()
      };

      await api.post("/api/targets/groups", dto);

      setForm(INITIAL_FORM);
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Failed to create target group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="target-group-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="form-header">
        <h2>Create target group</h2>
        <p className="form-subtitle">
          Organise users for targeted phishing simulations.
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor="group-name">
          Group name <span aria-hidden>*</span>
        </label>
        <input
          id="group-name"
          type="text"
          value={form.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="Finance Department"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="group-description">
          Description
        </label>
        <textarea
          id="group-description"
          value={form.description}
          onChange={e => updateField("description", e.target.value)}
          rows={4}
          placeholder="Employees handling invoices and payments"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving || !isValid()}
        >
          {saving ? "Creating group…" : "Create group"}
        </button>
      </div>
    </form>
  );
}
