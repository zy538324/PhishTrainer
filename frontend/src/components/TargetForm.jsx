import React, { useState } from "react";
import { api } from "../api/client";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  email: ""
};

export default function TargetForm({ group, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!group) {
    return (
      <div className="target-form target-form--empty">
        <p>Select a target group to add individuals.</p>
      </div>
    );
  }

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function isValid() {
    return form.name.trim() && form.email.trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid()) {
      setError("Full name and email address are required.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const dto = {
        displayName: form.name.trim(),
        email: form.email.trim()
      };

      await api.post(`/api/targets/groups/${group.id}/targets`, dto);

      setForm(INITIAL_FORM);
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Failed to add target.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="target-form" onSubmit={handleSubmit} noValidate>
      <header className="form-header">
        <h3>Add target</h3>
        <p className="form-context">
          Group: <strong>{group.name}</strong>
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor="target-name">
          Full name <span aria-hidden>*</span>
        </label>
        <input
          id="target-name"
          type="text"
          value={form.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="Jane Doe"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="target-email">
          Email address <span aria-hidden>*</span>
        </label>
        <input
          id="target-email"
          type="email"
          value={form.email}
          onChange={e => updateField("email", e.target.value)}
          placeholder="jane.doe@company.com"
          required
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving || !isValid()}
        >
          {saving ? "Adding target…" : "Add target"}
        </button>
      </div>
    </form>
  );
}
