import React, { useState } from 'react';
import TenantForm from '../components/TenantForm';
import TenantList from '../components/TenantList';

export default function TenantsPage() {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [listKey, setListKey] = useState(0);

  function handleChanged() {
    setListKey(k => k + 1);
  }

  return (
    <div className="page page--tenants">
      <h1>Tenants</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <TenantForm
            initialTenant={selectedTenant}
            onCreated={handleChanged}
            onUpdated={handleChanged}
          />
          <TenantList key={listKey} onChanged={handleChanged} onSelectTenant={setSelectedTenant} />
        </div>
      </div>
    </div>
  );
}
