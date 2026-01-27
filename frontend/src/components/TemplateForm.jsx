// src/components/TemplateForm.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import ErrorMessage from './ErrorMessage';

export default function TemplateForm({ onCreated, onUpdated, initialTemplate }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!(initialTemplate && initialTemplate.id);

  // When initialTemplate changes (e.g. user selects a template to edit),
  // sync its values into the form.
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setSubject(initialTemplate.subject || '');
      setHtmlContent(initialTemplate.htmlContent || '');
    } else {
      setName('');
      setSubject('');
      setHtmlContent('');
    }
  }, [initialTemplate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !subject || !htmlContent) {
      setError('Name, subject, and content are required.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const dto = {
        name,
        subject,
        htmlContent,
      };

      if (isEdit) {
        // Update existing
        await api.put(`/api/templates/${initialTemplate.id}`, dto);
        if (onUpdated) onUpdated();
      } else {
        // Create new
        await api.post('/api/templates', dto);
        if (onCreated) onCreated();
      }

      // Clear only when creating; for edit you usually keep values
      if (!isEdit) {
        setName('');
        setSubject('');
        setHtmlContent('');
      }
    } catch (err) {
      setError(err.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setSubject(initialTemplate.subject || '');
      setHtmlContent(initialTemplate.htmlContent || '');
    } else {
      setName('');
      setSubject('');
      setHtmlContent('');
    }
    setError('');
  }

  return (
    <form className="template-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit email template' : 'Create email template'}</h2>

      <ErrorMessage message={error} />

      <label>
        Template name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        Subject line
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </label>

      <label>
        HTML content
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={12}
          placeholder="<html>...</html>"
          required
        />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving
            ? isEdit
              ? 'Updating…'
              : 'Saving…'
            : isEdit
            ? 'Update template'
            : 'Save template'}
        </button>
        <button type="button" onClick={handleReset} disabled={saving}>
          Reset
        </button>
      </div>
    </form>
  );
}
