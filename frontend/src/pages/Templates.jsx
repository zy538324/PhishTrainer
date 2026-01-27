// src/pages/Templates.jsx
import React, { useState } from 'react';
import TemplateForm from '../components/TemplateForm';
import TemplateList from '../components/TemplateList';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateListKey, setTemplateListKey] = useState(0);

  function handleTemplatesChanged() {
    setTemplateListKey((k) => k + 1);
  }

  return (
    <div className="page page--templates">
      <h1>Templates</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <TemplateForm
            initialTemplate={selectedTemplate}
            onCreated={handleTemplatesChanged}
            onUpdated={handleTemplatesChanged}
          />
          <TemplateList
            key={templateListKey}
            onChanged={handleTemplatesChanged}
            onSelectTemplate={setSelectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}
