import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  templateId: "",
  landingPageId: "",
  targetGroupId: "",
  scheduledAtUtc: "",
  throttlePerMinute: 60
};

export default function CampaignForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     Data loading
     ========================= */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        const [templatesRes, groupsRes] = await Promise.all([
          api.get("/api/templates"),
          api.get("/api/targets/groups")
        ]);

        if (!cancelled) {
          setTemplates(templatesRes);
          setGroups(groupsRes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load campaign prerequisites.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================
     Helpers
     ========================= */

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function isValid() {
    return (
      form.name.trim() &&
      form.templateId &&
      form.landingPageId &&
      form.targetGroupId
    );
  }

  /* =========================
     Submit
     ========================= */

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid()) {
      setError("Please complete all required fields.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const dto = {
        name: form.name.trim(),
        templateId: Number(form.templateId),
        landingPageId: Number(form.landingPageId),
        targetGroupId: Number(form.targetGroupId),
        scheduledAtUtc: form.scheduledAtUtc
          ? new Date(form.scheduledAtUtc).toISOString()
          : null,
        throttlePerMinute: Number(form.throttlePerMinute) || 0
      };

      await api.post("/api/campaigns", dto);

      setForm(INITIAL_FORM);
      onCreated?.();
    } catch (err) {
      setError(err?.message || "Failed to create campaign.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loader label="Loading campaign options…" />;
  }

  /* =========================
     Render
     ========================= */

  return (
    <form className="campaign-form" onSubmit={handleSubmit} noValidate>
      <header className="form-header">
        <h2>Create campaign</h2>
        <p className="form-subtitle">
          Configure a phishing simulation and schedule its delivery.
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor="campaign-name">
          Campaign name <span aria-hidden>*</span>
        </label>
        <input
          id="campaign-name"
          type="text"
          value={form.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="Quarterly Finance Phish Test"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="template-id">
          Email template <span aria-hidden>*</span>
        </label>
        <select
          id="template-id"
          value={form.templateId}
          onChange={e => updateField("templateId", e.target.value)}
          required
        >
          <option value="">Select template…</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="landing-page-id">
          Landing page ID <span aria-hidden>*</span>
        </label>
        <input
          id="landing-page-id"
          type="number"
          value={form.landingPageId}
          onChange={e => updateField("landingPageId", e.target.value)}
          placeholder="e.g. 3"
          required
        />
        <small className="form-hint">
          Temporary field. Will be replaced with a landing page selector.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="target-group-id">
          Target group <span aria-hidden>*</span>
        </label>
        <select
          id="target-group-id"
          value={form.targetGroupId}
          onChange={e => updateField("targetGroupId", e.target.value)}
          required
        >
          <option value="">Select group…</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.activeTargets}/{g.totalTargets})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="scheduled-at">
          Schedule (UTC)
        </label>
        <input
          id="scheduled-at"
          type="datetime-local"
          value={form.scheduledAtUtc}
          onChange={e => updateField("scheduledAtUtc", e.target.value)}
        />
        <small className="form-hint">
          Leave empty to send immediately.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="throttle">
          Throttle (emails per minute)
        </label>
        <input
          id="throttle"
          type="number"
          min="0"
          value={form.throttlePerMinute}
          onChange={e => updateField("throttlePerMinute", e.target.value)}
        />
        <small className="form-hint">
          Set to 0 for no rate limit.
        </small>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving || !isValid()}
        >
          {saving ? "Creating campaign…" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}
