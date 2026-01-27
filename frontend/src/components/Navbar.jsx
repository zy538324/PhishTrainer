// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api/client";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "campaigns", label: "Campaigns" },
  { id: "templates", label: "Templates" },
  { id: "targets", label: "Targets" },
  { id: "tenants", label: "Tenants" },
  { id: "settings", label: "Settings" }
  ,{ id: "help", label: "Help" }
];

export default function Navbar({ activeTab, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [tenantSlug, setTenantSlug] = useState("default");
  const [activeTenant, setActiveTenant] = useState(null);
  const [userRole, setUserRole] = useState("TenantAdmin");
  const [theme, setTheme] = useState("system");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tenantSlug');
      if (stored) setTenantSlug(stored);
      const storedRole = window.localStorage.getItem('userRole');
      if (storedRole) setUserRole(storedRole);
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme) setTheme(storedTheme);
      const storedCollapsed = window.localStorage.getItem('sidebarCollapsed');
      if (storedCollapsed) setCollapsed(storedCollapsed === 'true');
    }

    loadTenants();
  }, []);

  useEffect(() => {
    if (!tenants.length) return;
    const tenant = tenants.find(t => t.slug === tenantSlug) || tenants[0];
    setActiveTenant(tenant);
    applyTenantBranding(tenant);
  }, [tenants, tenantSlug]);

  async function loadTenants() {
    try {
      const data = await api.get('/api/tenants');
      setTenants(data || []);
    } catch {
      // Ignore load errors for now; tenant switching is optional
    }
  }

  function applyTenantBranding(tenant) {
    if (!tenant || typeof document === 'undefined') return;
    const root = document.documentElement;
    const color = tenant.primaryColorHex;
    if (color) {
      root.style.setProperty('--color-brand-600', color);
      root.style.setProperty('--color-brand-500', color);
      root.style.setProperty('--color-brand-400', color);
    }
  }

  function handleTenantChange(e) {
    const slug = e.target.value;
    setTenantSlug(slug);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('tenantSlug', slug);
    }

    // Reload to ensure all views use the new tenant
    if (typeof window !== 'undefined') window.location.reload();
  }

  function handleRoleChange(e) {
    const role = e.target.value;
    setUserRole(role);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('userRole', role);
    }
    if (typeof window !== 'undefined') window.location.reload();
  }

  function applyTheme(nextTheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    const mode = nextTheme === 'system' ? (prefersDark ? 'dark' : 'light') : nextTheme;
    root.setAttribute('data-theme', mode);
  }

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  function handleThemeChange(e) {
    const next = e.target.value;
    setTheme(next);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', next);
    }
  }

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('sidebarCollapsed', String(next));
    }
  }

  function handleNavigate(tabId) {
    onNavigate?.(tabId);
    setIsOpen(false);
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} aria-label="Primary">
      <div className="sidebar-inner">
        {/* Brand */}
        <header className="sidebar-brand">
          {userRole === 'MspAdmin' ? (
            <button
              type="button"
              className="brand-home"
              onClick={() => handleNavigate('admin')}
              aria-label="Go to MSP Admin dashboard"
            >
              <div className="brand-logo" aria-hidden>
                {activeTenant?.logoUrl ? (
                  <img src={activeTenant.logoUrl} alt="" />
                ) : (
                  "PC"
                )}
              </div>
            </button>
          ) : (
            <div className="brand-logo" aria-hidden>
              {activeTenant?.logoUrl ? (
                <img src={activeTenant.logoUrl} alt="" />
              ) : (
                "PC"
              )}
            </div>
          )}
          <div className="brand-text">
            <strong className="brand-name">
              {activeTenant?.name || "Phish'n'Catch"}
            </strong>
          </div>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>

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

        {/* Tenant selector (under logo) */}
        {tenants.length > 0 && (
          <div className="sidebar-tenant">
            <label className="sidebar-tenant-label" htmlFor="tenant-select">Tenant</label>
            <select id="tenant-select" value={tenantSlug} onChange={handleTenantChange}>
              {tenants.map(t => (
                <option key={t.id} value={t.slug}>{t.name} ({t.slug})</option>
              ))}
            </select>
          </div>
        )}

        <div className="sidebar-tenant">
          <label className="sidebar-tenant-label" htmlFor="role-select">Role</label>
          <select id="role-select" value={userRole} onChange={handleRoleChange}>
            <option value="MspAdmin">MspAdmin</option>
            <option value="TenantAdmin">TenantAdmin</option>
            <option value="Auditor">Auditor</option>
            <option value="Analyst">Analyst</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        <div className="sidebar-tenant">
          <label className="sidebar-tenant-label" htmlFor="theme-select">Theme</label>
          <select id="theme-select" value={theme} onChange={handleThemeChange}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Navigation */}
        <nav
          className={`sidebar-nav${isOpen ? " is-open" : ""}`}
          role="navigation"
        >
          <ul className="sidebar-list">
            {NAV_ITEMS
              .filter(item => userRole === 'MspAdmin' || item.id !== 'tenants')
              .map(item => {
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
