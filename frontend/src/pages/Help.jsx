import React from 'react';

export default function HelpPage() {
  return (
    <div className="page page--help">
      <h1>Phish&apos;n&apos;Catch: MSP & Tenant Operations Guide</h1>

      <section className="doc-section">
        <h2>Who this guide is for</h2>
        <p>
          This guide is written for MSP admins, tenant admins, and technicians who manage phishing
          simulations across multiple tenants. It covers platform setup, day‑to‑day operations,
          SMTP configuration, Azure AD permissions, and troubleshooting.
        </p>
      </section>

      <section className="doc-section">
        <h2>System roles (current)</h2>
        <ul>
          <li><strong>MspAdmin</strong> – Overall platform visibility across tenants.</li>
          <li><strong>TenantAdmin</strong> – Full control within a single tenant.</li>
          <li><strong>Auditor</strong> – Read‑only, compliance oriented.</li>
          <li><strong>Analyst</strong> – Read and report on campaign results.</li>
          <li><strong>Viewer</strong> – Read‑only for general users.</li>
        </ul>
        <div className="doc-callout">
          Role enforcement is not yet enabled; roles are recorded for future RBAC.
        </div>
      </section>

      <section className="doc-section">
        <h2>MSP Admin Dashboard (Home)</h2>
        <ol>
          <li>Click the PC logo to open the MSP Admin dashboard.</li>
          <li>Review aggregate KPIs (tenants, campaigns, templates, targets, sent/open/click).</li>
          <li>Use the Tenants overview table to open a tenant context.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Tenant context (critical)</h2>
        <ol>
          <li>Use the Tenant dropdown under the logo.</li>
          <li>All sidebar actions (Users, Campaigns, Templates, Targets, Settings) are scoped to the selected tenant.</li>
          <li>Switching the tenant reloads the UI and changes the API header to keep data isolated.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Tenant onboarding checklist</h2>
        <ol>
          <li>Create a tenant (Tenants page).</li>
          <li>Open the tenant context from the dropdown.</li>
          <li>Set SMTP/OAuth settings (Settings → Email & SMTP).</li>
          <li>Configure branding (Settings → Branding).</li>
          <li>Create Users (Users page).</li>
          <li>Create Templates.</li>
          <li>Create Target Groups and Targets.</li>
          <li>Create a Campaign and schedule/launch.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Users (Tenant Admin Users)</h2>
        <ol>
          <li>Open Users in the sidebar.</li>
          <li>Create users with name, email, role, and active status.</li>
          <li>Edit or remove users from the table.</li>
        </ol>
        <div className="doc-callout">
          This is for platform admin users, not phishing targets. Targets are created in Targets.
        </div>
      </section>

      <section className="doc-section">
        <h2>Templates</h2>
        <ol>
          <li>Open Templates in the sidebar.</li>
          <li>Create or edit templates. Built‑in templates can be loaded into the editor.</li>
          <li>Tracking placeholders are required for analytics.</li>
        </ol>
        <div className="doc-callout">
          <strong>Required placeholders:</strong> {'{{TrackingPixel}}'} and {'{{ClickLink}}'} are inserted automatically if missing.
        </div>
      </section>

      <section className="doc-section">
        <h2>Targets & Target Groups</h2>
        <ol>
          <li>Create a target group in Targets.</li>
          <li>Select the group and add users (name + email).</li>
          <li>Targets are always scoped to the selected tenant.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Campaigns</h2>
        <ol>
          <li>Create a campaign using templates, landing page ID, and target group.</li>
          <li>Schedule or launch immediately.</li>
          <li>A/B testing uses Template B and a split percentage.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>SMTP & Email (Tenant Settings)</h2>
        <p>
          Each tenant has independent SMTP or Azure AD OAuth settings. Go to Settings → Email & SMTP
          while in the tenant context.
        </p>
        <h3>Option A: Standard SMTP</h3>
        <ul>
          <li>SMTP Host (e.g., smtp.sendgrid.net)</li>
          <li>SMTP Port (usually 587)</li>
          <li>From Address and Display Name</li>
        </ul>
        <h3>Option B: Microsoft 365 via Azure AD OAuth</h3>
        <ul>
          <li>Azure AD Tenant ID</li>
          <li>Azure AD Client ID</li>
          <li>Azure AD Client Secret</li>
          <li>Azure AD Domain (optional, for reference)</li>
        </ul>
      </section>

      <section className="doc-section">
        <h2>Azure AD app registration (SMTP OAuth)</h2>
        <ol>
          <li>Create an App Registration in Azure AD.</li>
          <li>Record the Tenant ID and Client ID.</li>
          <li>Create a Client Secret (save the value immediately).</li>
          <li>Add API permissions: <strong>Office 365 Exchange Online</strong> → <strong>SMTP.Send</strong> (Application permission).</li>
          <li>Grant admin consent for the tenant.</li>
        </ol>
        <div className="doc-callout">
          For Microsoft 365 SMTP OAuth, the app must be allowed to send as the configured From address.
          In Exchange Online, ensure the account has mailbox permissions and SMTP AUTH is enabled if required.
        </div>
      </section>

      <section className="doc-section">
        <h2>Branding (Tenant)</h2>
        <ol>
          <li>Settings → Branding</li>
          <li>Provide a Logo URL and primary color.</li>
          <li>Branding immediately updates the tenant theme in the sidebar.</li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Operational Best Practices</h2>
        <ul>
          <li>Always validate DNS/DMARC/SPF for sending domains before live campaigns.</li>
          <li>Start with small batches and gradually increase throttle.</li>
          <li>Use A/B tests to compare template effectiveness before scaling.</li>
          <li>Keep tenant contexts strictly separated in operations and reporting.</li>
        </ul>
      </section>

      <section className="doc-section">
        <h2>Troubleshooting</h2>
        <ul>
          <li><strong>404 errors:</strong> Confirm the API is running and URL is http://localhost:5018.</li>
          <li><strong>Tenant not found:</strong> Ensure tenant exists and tenant dropdown is set.</li>
          <li><strong>Template save error:</strong> HTML must be non‑empty; placeholders are required.</li>
          <li><strong>No emails sent:</strong> Verify SMTP/OAuth credentials and From address permissions.</li>
        </ul>
      </section>
    </div>
  );
}
