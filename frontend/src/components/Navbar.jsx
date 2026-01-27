// src/components/Navbar.jsx
import React from 'react';

const TABS = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'templates', label: 'Templates' },
  { id: 'targets', label: 'Targets' },
  { id: 'settings', label: 'Settings' },
];

export default function Navbar({ activeTab, onNavigate }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">PhishDaddy</div>
      <ul className="navbar-tabs">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={
                'navbar-tab' + (activeTab === tab.id ? ' navbar-tab--active' : '')
              }
              onClick={() => onNavigate && onNavigate(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
