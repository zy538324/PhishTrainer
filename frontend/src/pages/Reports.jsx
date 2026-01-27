// src/pages/Reports.jsx
import React, { useState } from 'react';
import CampaignList from '../components/CampaignList';
import CampaignReport from '../components/CampaignReport';

export default function ReportsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignListKey, setCampaignListKey] = useState(0);

  function handleCampaignsChanged() {
    setCampaignListKey((k) => k + 1);
  }

  return (
    <div className="page page--reports">
      <h1>Reports</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <h2>All campaigns</h2>
          <CampaignList
            key={campaignListKey}
            onSelectCampaign={setSelectedCampaign}
            onChanged={handleCampaignsChanged}
          />
        </div>
        <div className="col col--side">
          <h2>Campaign report</h2>
          <CampaignReport campaign={selectedCampaign} />
        </div>
      </div>
    </div>
  );
}
