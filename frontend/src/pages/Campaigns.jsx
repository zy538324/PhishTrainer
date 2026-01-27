// src/pages/Campaigns.jsx
import React, { useState } from 'react';
import CampaignForm from '../components/CampaignForm';
import CampaignList from '../components/CampaignList';
import CampaignReport from '../components/CampaignReport';

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignListKey, setCampaignListKey] = useState(0);

  function handleCampaignChanged() {
    setCampaignListKey((k) => k + 1);
  }

  return (
    <div className="page page--campaigns">
      <h1>Campaigns</h1>

      <div className="layout-two-columns">
        <div className="col col--wide">
          <CampaignForm onCreated={handleCampaignChanged} />
          <CampaignList
            key={campaignListKey}
            onSelectCampaign={setSelectedCampaign}
            onChanged={handleCampaignChanged}
          />
        </div>
        <div className="col col--side">
          <CampaignReport campaign={selectedCampaign} />
        </div>
      </div>
    </div>
  );
}
