import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  templateId: "",
  templateBId: "",
  abSplitPercent: 0,
  landingPageId: "",
  targetGroupId: "",
  scheduledAtUtc: "",
  throttlePerMinute: 60,
  recurrenceType: "None",
  recurrenceInterval: 1,
  recurrenceEndUtc: ""
};

export default function CampaignForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [templates, setTemplates] = useState([]);
  const [landingPages, setLandingPages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tenantSlug, setTenantSlug] = useState("default");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     Data loading
     ========================= */

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tenantSlug');
      if (stored) setTenantSlug(stored);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const tenantHeader = { headers: { 'X-Tenant': tenantSlug } };

        const [templatesRes, groupsRes, landingRes] = await Promise.all([
          api.get("/api/templates", tenantHeader),
          api.get("/api/targets/groups", tenantHeader),
          api.get("/api/landing-pages", tenantHeader)
        ]);

        if (!cancelled) {
          setTemplates(templatesRes);
          setGroups(groupsRes);
          setLandingPages(landingRes || []);
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
  }, [tenantSlug]);


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
        templateBId: form.templateBId ? Number(form.templateBId) : null,
        abSplitPercent: Number(form.abSplitPercent) || 0,
        landingPageId: Number(form.landingPageId),
        targetGroupId: Number(form.targetGroupId),
        scheduledAtUtc: form.scheduledAtUtc
          ? new Date(form.scheduledAtUtc).toISOString()
          : null,
        throttlePerMinute: Number(form.throttlePerMinute) || 0,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: Number(form.recurrenceInterval) || 1,
        recurrenceEndUtc: form.recurrenceEndUtc
          ? new Date(form.recurrenceEndUtc).toISOString()
          : null
      };

      await api.post("/api/campaigns", dto, { headers: { 'X-Tenant': tenantSlug } });

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
        <label htmlFor="campaign-tenant">Tenant</label>
        <input
          id="campaign-tenant"
          type="text"
          value={tenantSlug}
          readOnly
        />
        <small className="form-hint">
          Campaign data will be created under the currently selected tenant.
        </small>
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
        <label htmlFor="template-b-id">
          Template B (A/B test)
        </label>
        <select
          id="template-b-id"
          value={form.templateBId}
          onChange={e => updateField("templateBId", e.target.value)}
        >
          <option value="">None</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <small className="form-hint">
          Optional: choose a second template to split‑test.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="ab-split">A/B split (% for Template B)</label>
        <input
          id="ab-split"
          type="number"
          min="0"
          max="100"
          value={form.abSplitPercent}
          onChange={e => updateField("abSplitPercent", e.target.value)}
        />
        <small className="form-hint">
          0 uses Template A only. 50 splits evenly. 100 uses Template B only.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="landing-page-id">
          Landing page <span aria-hidden>*</span>
        </label>
        <select
          id="landing-page-id"
          value={form.landingPageId}
          onChange={e => updateField("landingPageId", e.target.value)}
          required
        >
          <option value="">Select landing page…</option>
          {landingPages.map(lp => (
            <option key={lp.id} value={lp.id}>
              {lp.name}
            </option>
          ))}
        </select>
        <small className="form-hint">
          Choose which landing experience users see after clicking.
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="recurrence-type">Recurrence</label>
          <select
            id="recurrence-type"
            value={form.recurrenceType}
            onChange={e => updateField("recurrenceType", e.target.value)}
          >
            <option value="None">None</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="recurrence-interval">Interval</label>
          <input
            id="recurrence-interval"
            type="number"
            min="1"
            value={form.recurrenceInterval}
            onChange={e => updateField("recurrenceInterval", e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="recurrence-end">Recurrence end (UTC)</label>
        <input
          id="recurrence-end"
          type="datetime-local"
          value={form.recurrenceEndUtc}
          onChange={e => updateField("recurrenceEndUtc", e.target.value)}
        />
        <small className="form-hint">
          Optional end date for recurring campaigns.
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
