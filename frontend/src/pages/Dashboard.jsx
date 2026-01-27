// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import CampaignList from '../components/CampaignList';
import CampaignReport from '../components/CampaignReport';
import TemplateList from '../components/TemplateList';
import TargetGroupList from '../components/TargetGroupList';

export default function DashboardPage() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [campaignListKey, setCampaignListKey] = useState(0);
  const [templateListKey, setTemplateListKey] = useState(0);
  const [groupListKey, setGroupListKey] = useState(0);

  function handleCampaignsChanged() {
    setCampaignListKey((k) => k + 1);
  }

  function handleTemplatesChanged() {
    setTemplateListKey((k) => k + 1);
  }

  function handleGroupsChanged() {
    setGroupListKey((k) => k + 1);
  }

  return (
    <div className="page page--dashboard">
      <h1>Dashboard</h1>

      {/* Top row: quick summary via existing lists */}
      <div className="layout-two-columns">
        <div className="col col--wide">
          <section className="dashboard-section">
            <h2>Recent campaigns</h2>
            <CampaignList
              key={campaignListKey}
              onSelectCampaign={setSelectedCampaign}
              onChanged={handleCampaignsChanged}
            />
          </section>
        </div>
        <div className="col col--side">
          <section className="dashboard-section">
            <h2>Selected campaign report</h2>
            <CampaignReport campaign={selectedCampaign} />
          </section>
        </div>
      </div>

      {/* Second row: templates and groups overview */}
      <div className="layout-two-columns">
        <div className="col col--wide">
          <section className="dashboard-section">
            <h2>Templates</h2>
            <TemplateList
              key={templateListKey}
              onChanged={handleTemplatesChanged}
              // no editing from dashboard, so no onSelectTemplate here
            />
          </section>
        </div>
        <div className="col col--side">
          <section className="dashboard-section">
            <h2>Target groups</h2>
            <TargetGroupList
              key={groupListKey}
              onSelectGroup={setSelectedGroup}
              onChanged={handleGroupsChanged}
            />
            {selectedGroup && (
              <p className="dashboard-selected-group">
                Selected group: {selectedGroup.name} (
                {selectedGroup.activeTargets}/{selectedGroup.totalTargets})
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
