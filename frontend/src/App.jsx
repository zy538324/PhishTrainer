// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import CampaignForm from './components/CampaignForm';
import CampaignList from './components/CampaignList';
import CampaignReport from './components/CampaignReport';
import TemplateForm from './components/TemplateForm';
import TemplateList from './components/TemplateList';
import TargetGroupForm from './components/TargetGroupForm';
import TargetGroupList from './components/TargetGroupList';
import TargetForm from './components/TargetForm';
import TargetList from './components/TargetList';
import SettingsForm from './components/SettingsForm';
import SettingsPage from './pages/Settings';
import TenantsPage from './pages/Tenants';
import DashboardPage from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UsersPage from './pages/Users';
import HelpPage from './pages/Help';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [campaignListKey, setCampaignListKey] = useState(0);
  const [templateListKey, setTemplateListKey] = useState(0);
  const [groupListKey, setGroupListKey] = useState(0);
  const [targetListKey, setTargetListKey] = useState(0);

  useEffect(() => {
    function handleKeyDown(e) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = useMemo(() => ([
    { id: 'nav-admin', label: 'Go to MSP Admin', hint: 'Dashboard', action: () => setActiveTab('admin'), kbd: 'A' },
    { id: 'nav-dashboard', label: 'Go to Dashboard', hint: 'KPIs & insights', action: () => setActiveTab('dashboard'), kbd: 'D' },
    { id: 'nav-users', label: 'Go to Users', hint: 'Manage admins', action: () => setActiveTab('users'), kbd: 'U' },
    { id: 'nav-campaigns', label: 'Go to Campaigns', hint: 'Launch and schedule', action: () => setActiveTab('campaigns'), kbd: 'C' },
    { id: 'nav-templates', label: 'Go to Templates', hint: 'Email content', action: () => setActiveTab('templates'), kbd: 'T' },
    { id: 'nav-targets', label: 'Go to Targets', hint: 'Groups and users', action: () => setActiveTab('targets'), kbd: 'G' },
    { id: 'nav-settings', label: 'Go to Settings', hint: 'SMTP & branding', action: () => setActiveTab('settings'), kbd: 'S' },
    { id: 'nav-tenants', label: 'Go to Tenants', hint: 'MSP only', action: () => setActiveTab('tenants'), kbd: 'N' },
    { id: 'nav-help', label: 'Go to Help', hint: 'Guides', action: () => setActiveTab('help'), kbd: 'H' }
  ]), []);

  function handleCampaignCreated() {
    setCampaignListKey((k) => k + 1);
  }

  function handleTemplateCreated() {
    setTemplateListKey((k) => k + 1);
  }

  function handleGroupCreated() {
    setGroupListKey((k) => k + 1);
  }

  function handleTargetCreated() {
    setTargetListKey((k) => k + 1);
    handleGroupCreated();
  }

  function renderCampaigns() {
    return (
      <div className="tab-content tab-content--campaigns">
        <div className="layout-two-columns">
          <div className="col col--wide">
            <CampaignForm onCreated={handleCampaignCreated} />
            <CampaignList
              key={campaignListKey}
              onSelectCampaign={setSelectedCampaign}
              onChanged={handleCampaignCreated}
            />
          </div>
          <div className="col col--side">
            <CampaignReport campaign={selectedCampaign} />
          </div>
        </div>
      </div>
    );
  }

  function renderTemplates() {
    return (
      <div className="tab-content tab-content--templates">
        <div className="layout-two-columns">
          <div className="col col--wide">
            <TemplateForm
              initialTemplate={selectedTemplate}
              onCreated={handleTemplateCreated}
              onUpdated={handleTemplateCreated}
            />
            <TemplateList
              key={templateListKey}
              onChanged={handleTemplateCreated}
              onSelectTemplate={setSelectedTemplate}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderTargets() {
    return (
      <div className="tab-content tab-content--targets">
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
                <h3>Group details</h3>
                <p>Name: {selectedGroup.name}</p>
                <p>Description: {selectedGroup.description}</p>
                <p>
                  Active/total: {selectedGroup.activeTargets}/
                  {selectedGroup.totalTargets}
                </p>

                <TargetForm
                  group={selectedGroup}
                  onCreated={handleTargetCreated}
                />
                <TargetList
                  group={selectedGroup}
                  reloadKey={targetListKey}
                />
              </>
            ) : (
              <p>Select a group to see details and manage its targets.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="tab-content tab-content--settings">
        <SettingsForm>
          <SettingsPage />
        </SettingsForm>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="tab-content tab-content--dashboard">
        <DashboardPage />
      </div>
    );
  }

  function renderUsers() {
    return (
      <div className="tab-content tab-content--users">
        <UsersPage />
      </div>
    );
  }

  function renderHelp() {
    return (
      <div className="tab-content tab-content--help">
        <HelpPage />
      </div>
    );
  }

  function renderAdmin() {
    return (
      <div className="tab-content tab-content--admin">
        <AdminDashboard />
      </div>
    );
  }

  function renderTenants() {
    return (
      <div className="tab-content tab-content--tenants">
        <div className="layout-two-columns">
          <div className="col col--wide">
            <TenantsPage />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      <main className="app-main">
        {activeTab === 'admin' && renderAdmin()}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'targets' && renderTargets()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'tenants' && renderTenants()}
        {activeTab === 'help' && renderHelp()}
      </main>
    </div>
  );
}
