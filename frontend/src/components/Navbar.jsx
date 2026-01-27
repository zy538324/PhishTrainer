// src/components/Navbar.jsx
import React, { useState } from "react";

const NAV_ITEMS = [
  { id: "campaigns", label: "Campaigns" },
  { id: "templates", label: "Templates" },
  { id: "targets", label: "Targets" },
  { id: "tenants", label: "Tenants" },
  { id: "settings", label: "Settings" }
];

export default function Navbar({ activeTab, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleNavigate(tabId) {
    onNavigate?.(tabId);
    setIsOpen(false);
  }

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar-inner">
        {/* Brand */}
        <header className="sidebar-brand">
          <div className="brand-mark" aria-hidden>
            PC
          </div>
          <div className="brand-text">
            <strong className="brand-name">Phish'n'Catch</strong>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(v => !v)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* Navigation */}
        <nav
          className={`sidebar-nav${isOpen ? " is-open" : ""}`}
          role="navigation"
        >
          <ul className="sidebar-list">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;

              return (
                <li key={item.id} className="sidebar-item">
                  <button
                    type="button"
                    className={`sidebar-tab${isActive ? " sidebar-tab--active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <span className="sidebar-tab-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <footer className="sidebar-footer">
          <small className="sidebar-version">
            PhishnCatch • v0.1 • Dev
          </small>
        </footer>
      </div>
    </aside>
  );
}
