import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import ErrorMessage from "./ErrorMessage";

const INITIAL_FORM = {
  name: "",
  subject: "",
  htmlContent: "",
  category: "",
  difficulty: "",
  tagsCsv: ""
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

    const meta = {
      "document-share": { category: "IT", difficulty: "Medium", tagsCsv: "document,share,spoofed" },
      "urgent-invoice": { category: "Finance", difficulty: "Hard", tagsCsv: "invoice,finance,urgent" },
      "extortion-security-alert": { category: "Security", difficulty: "Hard", tagsCsv: "extortion,security,alert" },
      "it-support-verification": { category: "IT", difficulty: "Easy", tagsCsv: "it,support,verification" },
      "caught": { category: "Training", difficulty: "VeryEasy", tagsCsv: "training,awareness" }
    };

    return Object.keys(modules).map((p) => {
      const name = p.split("/").pop().replace(/\.html$/i, "");
      return { name, content: modules[p], ...(meta[name] || {}) };
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
        htmlContent: initialTemplate.htmlContent || "",
        category: initialTemplate.category || "",
        difficulty: initialTemplate.difficulty || "",
        tagsCsv: initialTemplate.tagsCsv || ""
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

  function ensureTrackingPlaceholders(html) {
    let updated = html;

    if (!updated.includes("{{ClickLink}}")) {
      updated += "\n\n<p><a href=\"{{ClickLink}}\">View document</a></p>";
    }

    if (!updated.includes("{{TrackingPixel}}")) {
      updated += "\n\n{{TrackingPixel}}";
    }

    return updated;
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
        htmlBody: ensureTrackingPlaceholders(form.htmlContent),
        category: form.category?.trim() || null,
        difficulty: form.difficulty?.trim() || null,
        tagsCsv: form.tagsCsv?.trim() || null
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
              if (idx >= 0) {
                const t = builtInTemplates[idx];
                updateField("htmlContent", t.content);
                if (t.category) updateField("category", t.category);
                if (t.difficulty) updateField("difficulty", t.difficulty);
                if (t.tagsCsv) updateField("tagsCsv", t.tagsCsv);
              }
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="template-category">Category</label>
          <input
            id="template-category"
            type="text"
            value={form.category}
            onChange={e => updateField("category", e.target.value)}
            placeholder="Finance, HR, IT, Delivery"
          />
        </div>
        <div className="form-group">
          <label htmlFor="template-difficulty">Difficulty</label>
          <select
            id="template-difficulty"
            value={form.difficulty}
            onChange={e => updateField("difficulty", e.target.value)}
          >
            <option value="">Select difficulty…</option>
            <option value="VeryEasy">VeryEasy</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="VeryHard">VeryHard</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="template-tags">Tags</label>
        <input
          id="template-tags"
          type="text"
          value={form.tagsCsv}
          onChange={e => updateField("tagsCsv", e.target.value)}
          placeholder="invoice, spoofed-brand, finance"
        />
        <small className="form-hint">Comma-separated tags</small>
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
