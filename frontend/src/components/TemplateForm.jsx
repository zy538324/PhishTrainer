import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  subject: "",
  htmlContent: ""
};

export default function TemplateForm({
  onCreated,
  onUpdated,
  initialTemplate
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load built-in HTML templates from src/templates (Vite raw import)
  const builtInTemplates = useMemo(() => {
    // import.meta.glob returns an object mapping paths -> content when eager + as: 'raw' are used
    // eslint-disable-next-line no-undef
    const modules = import.meta.glob("../templates/*.html", {
      as: "raw",
      eager: true
    });

    return Object.keys(modules).map((p) => {
      const name = p.split("/").pop().replace(/\.html$/i, "");
      return { name, content: modules[p] };
    });
  }, []);

  const isEdit = Boolean(initialTemplate?.id);

  /* =========================
     Sync selected template
     ========================= */

  useEffect(() => {
    if (isEdit) {
      setForm({
        name: initialTemplate.name || "",
        subject: initialTemplate.subject || "",
        htmlContent: initialTemplate.htmlContent || ""
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError("");
  }, [initialTemplate?.id]);

  /* =========================
     Helpers
     ========================= */

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function isValid() {
    return (
      form.name.trim() &&
      form.subject.trim() &&
      form.htmlContent.trim()
    );
  }

  /* =========================
     Submit
     ========================= */

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid()) {
      setError("Template name, subject, and HTML content are required.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const dto = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        htmlContent: form.htmlContent
      };

      if (isEdit) {
        await api.put(`/api/templates/${initialTemplate.id}`, dto);
        onUpdated?.();
      } else {
        await api.post("/api/templates", dto);
        onCreated?.();
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      setError(err?.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (isEdit) {
      setForm({
        name: initialTemplate.name || "",
        subject: initialTemplate.subject || "",
        htmlContent: initialTemplate.htmlContent || ""
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError("");
  }

  /* =========================
     Render
     ========================= */

  return (
    <form
      className="template-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="form-header">
        <h2>{isEdit ? "Edit email template" : "Create email template"}</h2>
        <p className="form-subtitle">
          {isEdit
            ? "Changes will affect future campaigns using this template."
            : "Define the content used in phishing simulations."}
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor="template-name">
          Template name <span aria-hidden>*</span>
        </label>
        <input
          id="template-name"
          type="text"
          value={form.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="Invoice Reminder – Finance"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="template-subject">
          Subject line <span aria-hidden>*</span>
        </label>
        <input
          id="template-subject"
          type="text"
          value={form.subject}
          onChange={e => updateField("subject", e.target.value)}
          placeholder="Urgent: Outstanding invoice"
          required
        />
      </div>

      {builtInTemplates.length > 0 && (
        <div className="form-group">
          <label htmlFor="template-built-in">Built-in template</label>
          <select
            id="template-built-in"
            onChange={e => {
              const idx = e.target.selectedIndex - 1;
              if (idx >= 0) updateField("htmlContent", builtInTemplates[idx].content);
            }}
            defaultValue=""
          >
            <option value="">-- choose a built-in template --</option>
            {builtInTemplates.map((t, i) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <small className="form-hint">Select to load a built-in HTML template into the editor.</small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="template-html">
          HTML content <span aria-hidden>*</span>
        </label>
        <textarea
          id="template-html"
          value={form.htmlContent}
          onChange={e => updateField("htmlContent", e.target.value)}
          rows={14}
          placeholder="<html>…</html>"
          required
        />
        <small className="form-hint">
          Raw HTML is sent as-is. Inline CSS is recommended.
        </small>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving || !isValid()}
        >
          {saving
            ? isEdit
              ? "Updating template…"
              : "Saving template…"
            : isEdit
            ? "Update template"
            : "Save template"}
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleReset}
          disabled={saving}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
