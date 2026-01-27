// src/pages/Targets.jsx
import React, { useState } from 'react';
import { api } from '../api/client';
import ErrorMessage from '../components/ErrorMessage';
import TargetGroupForm from '../components/TargetGroupForm';
import TargetGroupList from '../components/TargetGroupList';
import TargetForm from '../components/TargetForm';
import TargetList from '../components/TargetList';

export default function TargetsPage() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupListKey, setGroupListKey] = useState(0);
  const [targetListKey, setTargetListKey] = useState(0);
  const [csvRows, setCsvRows] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  function handleGroupCreated() {
    setGroupListKey((k) => k + 1);
  }

  function handleTargetCreated() {
    setTargetListKey((k) => k + 1);
    handleGroupCreated(); // refresh counts
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const hasHeader = header.includes('email');
    const start = hasHeader ? 1 : 0;
    const rows = [];

    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const row = hasHeader
        ? {
            email: cols[header.indexOf('email')] || '',
            displayName: cols[header.indexOf('name')] || cols[header.indexOf('displayname')] || '',
            department: cols[header.indexOf('department')] || '',
            managerEmail: cols[header.indexOf('manageremail')] || '',
            location: cols[header.indexOf('location')] || ''
          }
        : {
            email: cols[0] || '',
            displayName: cols[1] || '',
            department: cols[2] || '',
            managerEmail: cols[3] || '',
            location: cols[4] || ''
          };

      rows.push(row);
    }

    return rows;
  }

  async function handleCsvFile(e) {
    const file = e.target.files?.[0];
    setCsvErrors([]);
    setImportResult(null);
    setImportError('');
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    setCsvRows(rows);
  }

  async function handleImport() {
    if (!selectedGroup || csvRows.length === 0) return;
    setCsvErrors([]);
    setImportResult(null);
    setImportError('');

    try {
      const res = await api.post(`/api/targets/groups/${selectedGroup.id}/targets/bulk`, csvRows);
      setImportResult(res);
      if (res?.errors?.length) setCsvErrors(res.errors);
      handleTargetCreated();
    } catch (err) {
      setImportError(err?.message || 'Failed to import targets.');
    }
  }

  return (
    <div className="page page--targets">
      <h1>Targets</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <TargetGroupForm onCreated={handleGroupCreated} />
          <TargetGroupList
            key={groupListKey}
            onSelectGroup={(g) => {
              setSelectedGroup(g);
              setTargetListKey((k) => k + 1);
            }}
            onChanged={handleGroupCreated}
          />
        </div>
        <div className="col col--side">
          {selectedGroup ? (
            <>
              <h2>Group details</h2>
              <p>Name: {selectedGroup.name}</p>
              <p>Description: {selectedGroup.description}</p>
              <p>
                Active/total: {selectedGroup.activeTargets}/
                {selectedGroup.totalTargets}
              </p>

              <TargetForm group={selectedGroup} onCreated={handleTargetCreated} />
              <section className="import-section">
                <header className="form-header">
                  <h3>Bulk import (CSV)</h3>
                  <p className="form-subtitle">Columns: email, name, department, managerEmail, location</p>
                </header>
                <ErrorMessage message={importError} />
                <input type="file" accept=".csv" onChange={handleCsvFile} />
                {csvRows.length > 0 && (
                  <div className="csv-preview">
                    <p className="muted small">Previewing {csvRows.length} rows</p>
                    <button className="btn btn--primary" onClick={handleImport}>Import targets</button>
                  </div>
                )}
                {importResult && (
                  <div className="doc-callout">
                    Imported: {importResult.created} created, {importResult.updated} updated, {importResult.skipped} skipped
                  </div>
                )}
                {csvErrors.length > 0 && (
                  <ul className="csv-errors">
                    {csvErrors.slice(0, 10).map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                )}
              </section>
              <TargetList group={selectedGroup} reloadKey={targetListKey} />
            </>
          ) : (
            <p>Select a group to see details and manage its targets.</p>
          )}
        </div>
      </div>
    </div>
  );
}
