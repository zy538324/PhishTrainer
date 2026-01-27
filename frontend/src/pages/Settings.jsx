// src/pages/Settings.jsx
import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div className="page page--settings">
      <h1>Settings</h1>
      
      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
        <button 
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Email & SMTP
        </button>
        <button 
          className={`tab ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          Training
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Groups
        </button>
        <button 
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button 
          className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Organization Information</h2>
            <div className="form-group">
              <label htmlFor="org-name">Organization Name</label>
              <input 
                type="text" 
                id="org-name" 
                placeholder="Acme Corporation"
              />
            </div>
            <div className="form-group">
              <label htmlFor="industry">Industry Type</label>
              <select id="industry">
                <option value="">Select Industry</option>
                <option value="finance">Financial Services</option>
                <option value="healthcare">Healthcare</option>
                <option value="technology">Technology</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="education">Education</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
              <small>Used for industry benchmarking and comparison reports</small>
            </div>
            <div className="form-group">
              <label htmlFor="timezone">Default Timezone</label>
              <select id="timezone">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Chicago">Central Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="language">Default Language</label>
              <select id="language">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h2>Data & Privacy</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="gdpr-mode" />
              <label htmlFor="gdpr-mode">Enable GDPR Compliance Mode</label>
              <small>Shows consent banners and data processing notifications to users</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="data-retention" />
              <label htmlFor="data-retention">Automatic Data Retention</label>
              <small>Automatically delete campaign data older than specified period</small>
            </div>
            <div className="form-group">
              <label htmlFor="retention-period">Data Retention Period (days)</label>
              <input 
                type="number" 
                id="retention-period" 
                placeholder="365"
                min="30"
              />
            </div>
          </section>

          <section className="settings-section">
            <h2>Notifications</h2>
            <div className="form-group">
              <label htmlFor="admin-email">Admin Notification Email</label>
              <input 
                type="email" 
                id="admin-email" 
                placeholder="admin@company.com"
              />
              <small>Where to send system alerts and reports</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="weekly-reports" defaultChecked />
              <label htmlFor="weekly-reports">Send Weekly Performance Reports</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="campaign-alerts" defaultChecked />
              <label htmlFor="campaign-alerts">Alert on Campaign Completion</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="high-risk-alerts" defaultChecked />
              <label htmlFor="high-risk-alerts">Alert on High-Risk User Behavior</label>
            </div>
          </section>

          <button className="btn btn--primary">Save General Settings</button>
        </div>
      )}

      {/* Campaign Settings */}
      {activeTab === 'campaigns' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Campaign Defaults</h2>
            <div className="form-group">
              <label htmlFor="default-difficulty">Default Difficulty Level</label>
              <select id="default-difficulty">
                <option value="easy">Easy - Obvious phishing indicators</option>
                <option value="medium" selected>Medium - Moderate sophistication</option>
                <option value="hard">Hard - Advanced social engineering</option>
                <option value="adaptive">Adaptive - Adjust based on user performance</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="campaign-frequency">Campaign Frequency</label>
              <select id="campaign-frequency">
                <option value="weekly">Weekly</option>
                <option value="biweekly" selected>Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="users-per-batch">Users Per Campaign Batch</label>
              <input 
                type="number" 
                id="users-per-batch" 
                placeholder="50"
                min="1"
              />
              <small>Number of users to target in each campaign wave</small>
            </div>
          </section>

          <section className="settings-section">
            <h2>Simulation Timing</h2>
            <div className="form-group">
              <label htmlFor="send-window-start">Send Window Start Time</label>
              <input type="time" id="send-window-start" defaultValue="09:00" />
            </div>
            <div className="form-group">
              <label htmlFor="send-window-end">Send Window End Time</label>
              <input type="time" id="send-window-end" defaultValue="17:00" />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="exclude-weekends" defaultChecked />
              <label htmlFor="exclude-weekends">Exclude Weekends</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="exclude-holidays" defaultChecked />
              <label htmlFor="exclude-holidays">Exclude Company Holidays</label>
            </div>
            <div className="form-group">
              <label>Excluded Days</label>
              <div className="checkbox-inline-group">
                <div className="checkbox-inline">
                  <input type="checkbox" id="exclude-mon" />
                  <label htmlFor="exclude-mon">Mon</label>
                </div>
                <div className="checkbox-inline">
                  <input type="checkbox" id="exclude-tue" />
                  <label htmlFor="exclude-tue">Tue</label>
                </div>
                <div className="checkbox-inline">
                  <input type="checkbox" id="exclude-wed" />
                  <label htmlFor="exclude-wed">Wed</label>
                </div>
                <div className="checkbox-inline">
                  <input type="checkbox" id="exclude-thu" />
                  <label htmlFor="exclude-thu">Thu</label>
                </div>
                <div className="checkbox-inline">
                  <input type="checkbox" id="exclude-fri" />
                  <label htmlFor="exclude-fri">Fri</label>
                </div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Landing Pages</h2>
            <div className="form-group">
              <label htmlFor="success-landing">Success Landing Page Action</label>
              <select id="success-landing">
                <option value="training">Show Immediate Training Content</option>
                <option value="acknowledgment" selected>Show Acknowledgment Message</option>
                <option value="survey">Show Quick Survey</option>
                <option value="redirect">Redirect to Custom URL</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="landing-message">Landing Page Message</label>
              <textarea 
                id="landing-message" 
                rows="4"
                placeholder="You've been caught by a phishing simulation! Don't worry, this was a test..."
              ></textarea>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="show-reporting-button" defaultChecked />
              <label htmlFor="show-reporting-button">Show "Report Phishing" Button on Landing Pages</label>
            </div>
          </section>

          <section className="settings-section">
            <h2>Bot & Security Scanner Detection</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-bot-detection" defaultChecked />
              <label htmlFor="enable-bot-detection">Enable Bot Detection</label>
              <small>Filters automated security scanners and email gateways from analytics</small>
            </div>
            <div className="form-group">
              <label htmlFor="bot-threshold">Bot Detection Sensitivity</label>
              <select id="bot-threshold">
                <option value="low">Low - Only obvious bots</option>
                <option value="medium" selected>Medium - Balanced detection</option>
                <option value="high">High - Aggressive filtering</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ip-exclusions">Excluded IP Addresses</label>
              <textarea 
                id="ip-exclusions" 
                rows="3"
                placeholder="192.168.1.1&#10;10.0.0.0/24&#10;Enter one IP or CIDR range per line"
              ></textarea>
              <small>IP addresses to exclude from click tracking (e.g., security appliances)</small>
            </div>
          </section>

          <button className="btn btn--primary">Save Campaign Settings</button>
        </div>
      )}

      {/* Email & SMTP Settings */}
      {activeTab === 'email' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>SMTP Server Configuration</h2>
            <div className="form-group">
              <label htmlFor="smtp-host">SMTP Host</label>
              <input 
                type="text" 
                id="smtp-host" 
                placeholder="smtp.sendgrid.net"
              />
            </div>
            <div className="form-group">
              <label htmlFor="smtp-port">SMTP Port</label>
              <input 
                type="number" 
                id="smtp-port" 
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label htmlFor="smtp-encryption">Encryption</label>
              <select id="smtp-encryption">
                <option value="tls" selected>TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="smtp-username">SMTP Username</label>
              <input 
                type="text" 
                id="smtp-username" 
                placeholder="apikey"
              />
            </div>
            <div className="form-group">
              <label htmlFor="smtp-password">SMTP Password</label>
              <input 
                type="password" 
                id="smtp-password" 
                placeholder="••••••••••"
              />
            </div>
            <button className="btn btn--secondary">Test SMTP Connection</button>
          </section>

          <section className="settings-section">
            <h2>Email Sender Settings</h2>
            <div className="form-group">
              <label htmlFor="from-email">Default From Email</label>
              <input 
                type="email" 
                id="from-email" 
                placeholder="security@company.com"
              />
              <small>This will be used as the sender for phishing simulations</small>
            </div>
            <div className="form-group">
              <label htmlFor="from-name">Default From Name</label>
              <input 
                type="text" 
                id="from-name" 
                placeholder="IT Security Team"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reply-to">Reply-To Address</label>
              <input 
                type="email" 
                id="reply-to" 
                placeholder="no-reply@company.com"
              />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="randomize-sender" />
              <label htmlFor="randomize-sender">Randomize Sender Names</label>
              <small>Use different sender names for increased realism</small>
            </div>
          </section>

          <section className="settings-section">
            <h2>Email Domains & Whitelisting</h2>
            <div className="form-group">
              <label htmlFor="simulation-domain">Simulation Domain</label>
              <input 
                type="text" 
                id="simulation-domain" 
                placeholder="phishtest.company.com"
              />
              <small>Custom domain for phishing simulation links</small>
            </div>
            <div className="form-group">
              <label htmlFor="tracking-domain">Tracking Domain</label>
              <input 
                type="text" 
                id="tracking-domain" 
                placeholder="track.phishtest.company.com"
              />
            </div>
            <div className="alert alert--info">
              <strong>Whitelist Instructions:</strong>
              <p>Add the following to your email gateway whitelist:</p>
              <ul>
                <li>Domain: phishtest.company.com</li>
                <li>IP Range: 192.168.1.100-192.168.1.150</li>
                <li>SPF Record: v=spf1 include:_spf.company.com ~all</li>
              </ul>
            </div>
          </section>

          <section className="settings-section">
            <h2>Training Email Settings</h2>
            <div className="form-group">
              <label htmlFor="training-from-email">Training Email Sender</label>
              <input 
                type="email" 
                id="training-from-email" 
                placeholder="training@company.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="training-from-name">Training Email Name</label>
              <input 
                type="text" 
                id="training-from-name" 
                placeholder="Security Awareness Training"
              />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="send-reminders" defaultChecked />
              <label htmlFor="send-reminders">Send Training Reminders</label>
            </div>
            <div className="form-group">
              <label htmlFor="reminder-frequency">Reminder Frequency (days)</label>
              <input 
                type="number" 
                id="reminder-frequency" 
                placeholder="3"
                min="1"
              />
            </div>
          </section>

          <button className="btn btn--primary">Save Email Settings</button>
        </div>
      )}

      {/* Training Settings */}
      {activeTab === 'training' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Automated Training Enrollment</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="auto-enroll-fails" defaultChecked />
              <label htmlFor="auto-enroll-fails">Auto-Enroll Users Who Fail Simulations</label>
              <small>Automatically assign remedial training to users who click phishing links</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="auto-enroll-new" defaultChecked />
              <label htmlFor="auto-enroll-new">Auto-Enroll New Users</label>
              <small>Enroll new employees in onboarding training automatically</small>
            </div>
            <div className="form-group">
              <label htmlFor="failure-threshold">Failure Threshold for Escalation</label>
              <select id="failure-threshold">
                <option value="1">After 1 failed simulation</option>
                <option value="2" selected>After 2 failed simulations</option>
                <option value="3">After 3 failed simulations</option>
                <option value="custom">Custom threshold</option>
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h2>Training Modules</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-phishing" defaultChecked />
              <label htmlFor="module-phishing">Email Phishing Recognition</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-smishing" defaultChecked />
              <label htmlFor="module-smishing">SMS Phishing (Smishing)</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-vishing" />
              <label htmlFor="module-vishing">Voice Phishing (Vishing)</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-password" defaultChecked />
              <label htmlFor="module-password">Password Security</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-mfa" defaultChecked />
              <label htmlFor="module-mfa">Multi-Factor Authentication</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-data" />
              <label htmlFor="module-data">Data Protection & Privacy</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="module-social" />
              <label htmlFor="module-social">Social Engineering Awareness</label>
            </div>
          </section>

          <section className="settings-section">
            <h2>Training Completion Requirements</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-acknowledgment" defaultChecked />
              <label htmlFor="require-acknowledgment">Require Training Acknowledgment</label>
              <small>Users must acknowledge completion before proceeding</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-quiz" />
              <label htmlFor="require-quiz">Require Quiz Completion</label>
            </div>
            <div className="form-group">
              <label htmlFor="passing-score">Minimum Passing Score (%)</label>
              <input 
                type="number" 
                id="passing-score" 
                placeholder="80"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="completion-deadline">Training Completion Deadline (days)</label>
              <input 
                type="number" 
                id="completion-deadline" 
                placeholder="14"
                min="1"
              />
            </div>
          </section>

          <section className="settings-section">
            <h2>Compliance Training</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="gdpr-training" />
              <label htmlFor="gdpr-training">GDPR Compliance Training</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="hipaa-training" />
              <label htmlFor="hipaa-training">HIPAA Compliance Training</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="pci-training" />
              <label htmlFor="pci-training">PCI-DSS Compliance Training</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="sox-training" />
              <label htmlFor="sox-training">SOX Compliance Training</label>
            </div>
            <div className="form-group">
              <label htmlFor="annual-training">Annual Compliance Training</label>
              <select id="annual-training">
                <option value="disabled">Disabled</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually" selected>Annually</option>
              </select>
            </div>
          </section>

          <button className="btn btn--primary">Save Training Settings</button>
        </div>
      )}

      {/* Users & Groups Settings */}
      {activeTab === 'users' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>User Management</h2>
            <div className="form-group">
              <label htmlFor="default-group">Default User Group</label>
              <select id="default-group">
                <option value="all-users" selected>All Users</option>
                <option value="executives">Executives</option>
                <option value="managers">Managers</option>
                <option value="employees">Employees</option>
                <option value="contractors">Contractors</option>
              </select>
              <small>New users are automatically added to this group</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="auto-sync-users" />
              <label htmlFor="auto-sync-users">Auto-Sync Users from Directory</label>
              <small>Automatically import users from Active Directory or SSO</small>
            </div>
            <div className="form-group">
              <label htmlFor="sync-frequency">Sync Frequency</label>
              <select id="sync-frequency">
                <option value="hourly">Hourly</option>
                <option value="daily" selected>Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h2>Group Configuration</h2>
            <div className="groups-list">
              <div className="group-item">
                <div className="group-info">
                  <strong>All Users</strong>
                  <span className="group-count">1,247 members</span>
                </div>
                <button className="btn btn--small">Edit</button>
              </div>
              <div className="group-item">
                <div className="group-info">
                  <strong>High Risk Users</strong>
                  <span className="group-count">42 members</span>
                </div>
                <button className="btn btn--small">Edit</button>
              </div>
              <div className="group-item">
                <div className="group-info">
                  <strong>Executives</strong>
                  <span className="group-count">18 members</span>
                </div>
                <button className="btn btn--small">Edit</button>
              </div>
              <div className="group-item">
                <div className="group-info">
                  <strong>IT Department</strong>
                  <span className="group-count">65 members</span>
                </div>
                <button className="btn btn--small">Edit</button>
              </div>
            </div>
            <button className="btn btn--secondary">Create New Group</button>
          </section>

          <section className="settings-section">
            <h2>Risk-Based Targeting</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="adaptive-profiling" defaultChecked />
              <label htmlFor="adaptive-profiling">Enable Adaptive Risk Profiling</label>
              <small>Automatically adjust simulation difficulty based on user performance</small>
            </div>
            <div className="form-group">
              <label htmlFor="risk-threshold">High-Risk Threshold</label>
              <select id="risk-threshold">
                <option value="low">Low - 1 failure</option>
                <option value="medium" selected>Medium - 2 failures</option>
                <option value="high">High - 3+ failures</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="target-high-risk" defaultChecked />
              <label htmlFor="target-high-risk">Increase Frequency for High-Risk Users</label>
            </div>
          </section>

          <section className="settings-section">
            <h2>Inactive Users</h2>
            <div className="form-group">
              <label htmlFor="inactive-threshold">Mark Users Inactive After (days)</label>
              <input 
                type="number" 
                id="inactive-threshold" 
                placeholder="90"
                min="1"
              />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="exclude-inactive" defaultChecked />
              <label htmlFor="exclude-inactive">Exclude Inactive Users from Campaigns</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="exclude-analytics" />
              <label htmlFor="exclude-analytics">Exclude Inactive Users from Analytics</label>
            </div>
          </section>

          <button className="btn btn--primary">Save User Settings</button>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Authentication</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-mfa" defaultChecked />
              <label htmlFor="require-mfa">Require Multi-Factor Authentication (MFA)</label>
              <small>All admin users must enable MFA</small>
            </div>
            <div className="form-group">
              <label htmlFor="mfa-method">Allowed MFA Methods</label>
              <div className="checkbox-group">
                <input type="checkbox" id="mfa-totp" defaultChecked />
                <label htmlFor="mfa-totp">Time-Based OTP (Authenticator Apps)</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="mfa-sms" />
                <label htmlFor="mfa-sms">SMS Text Message</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="mfa-email" />
                <label htmlFor="mfa-email">Email Verification</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="mfa-hardware" />
                <label htmlFor="mfa-hardware">Hardware Security Keys</label>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Password Policy</h2>
            <div className="form-group">
              <label htmlFor="min-password-length">Minimum Password Length</label>
              <input 
                type="number" 
                id="min-password-length" 
                defaultValue="12"
                min="8"
                max="128"
              />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-uppercase" defaultChecked />
              <label htmlFor="require-uppercase">Require Uppercase Letters</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-lowercase" defaultChecked />
              <label htmlFor="require-lowercase">Require Lowercase Letters</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-numbers" defaultChecked />
              <label htmlFor="require-numbers">Require Numbers</label>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="require-special" defaultChecked />
              <label htmlFor="require-special">Require Special Characters</label>
            </div>
            <div className="form-group">
              <label htmlFor="password-expiry">Password Expiry (days)</label>
              <input 
                type="number" 
                id="password-expiry" 
                placeholder="90"
                min="0"
              />
              <small>Set to 0 for no expiration</small>
            </div>
            <div className="form-group">
              <label htmlFor="password-history">Password History Count</label>
              <input 
                type="number" 
                id="password-history" 
                defaultValue="5"
                min="0"
              />
              <small>Prevent reusing last N passwords</small>
            </div>
          </section>

          <section className="settings-section">
            <h2>Session Management</h2>
            <div className="form-group">
              <label htmlFor="session-timeout">Session Timeout (minutes)</label>
              <input 
                type="number" 
                id="session-timeout" 
                defaultValue="60"
                min="5"
              />
            </div>
            <div className="form-group">
              <label htmlFor="max-sessions">Maximum Concurrent Sessions</label>
              <input 
                type="number" 
                id="max-sessions" 
                defaultValue="3"
                min="1"
              />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="remember-device" defaultChecked />
              <label htmlFor="remember-device">Allow "Remember This Device"</label>
            </div>
          </section>

          <section className="settings-section">
            <h2>Access Control</h2>
            <div className="form-group">
              <label htmlFor="ip-whitelist">IP Whitelist</label>
              <textarea 
                id="ip-whitelist" 
                rows="4"
                placeholder="192.168.1.0/24&#10;10.0.0.1&#10;Enter one IP or CIDR range per line"
              ></textarea>
              <small>Leave empty to allow all IPs</small>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-ip-blacklist" />
              <label htmlFor="enable-ip-blacklist">Enable IP Blacklist</label>
            </div>
            <div className="form-group">
              <label htmlFor="ip-blacklist">IP Blacklist</label>
              <textarea 
                id="ip-blacklist" 
                rows="4"
                placeholder="Enter blocked IP addresses"
              ></textarea>
            </div>
          </section>

          <section className="settings-section">
            <h2>Role-Based Access Control (RBAC)</h2>
            <div className="roles-list">
              <div className="role-item">
                <div className="role-info">
                  <strong>Super Admin</strong>
                  <span>Full system access</span>
                </div>
                <button className="btn btn--small">Edit Permissions</button>
              </div>
              <div className="role-item">
                <div className="role-info">
                  <strong>Admin</strong>
                  <span>Manage campaigns and users</span>
                </div>
                <button className="btn btn--small">Edit Permissions</button>
              </div>
              <div className="role-item">
                <div className="role-info">
                  <strong>Manager</strong>
                  <span>View reports for their department</span>
                </div>
                <button className="btn btn--small">Edit Permissions</button>
              </div>
              <div className="role-item">
                <div className="role-info">
                  <strong>Viewer</strong>
                  <span>Read-only access to reports</span>
                </div>
                <button className="btn btn--small">Edit Permissions</button>
              </div>
            </div>
            <button className="btn btn--secondary">Create New Role</button>
          </section>

          <section className="settings-section">
            <h2>Audit Logging</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-audit-log" defaultChecked />
              <label htmlFor="enable-audit-log">Enable Audit Logging</label>
              <small>Track all admin actions and configuration changes</small>
            </div>
            <div className="form-group">
              <label htmlFor="audit-retention">Audit Log Retention (days)</label>
              <input 
                type="number" 
                id="audit-retention" 
                defaultValue="365"
                min="30"
              />
            </div>
          </section>

          <button className="btn btn--primary">Save Security Settings</button>
        </div>
      )}

      {/* Branding Settings */}
      {activeTab === 'branding' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Company Branding</h2>
            <div className="form-group">
              <label htmlFor="company-logo">Company Logo</label>
              <div className="file-upload">
                <input type="file" id="company-logo" accept="image/*" />
                <button className="btn btn--secondary">Upload Logo</button>
              </div>
              <small>Recommended size: 300x100px, PNG or SVG format</small>
            </div>
            <div className="form-group">
              <label htmlFor="favicon">Favicon</label>
              <div className="file-upload">
                <input type="file" id="favicon" accept="image/x-icon,image/png" />
                <button className="btn btn--secondary">Upload Favicon</button>
              </div>
              <small>32x32px or 64x64px, ICO or PNG format</small>
            </div>
          </section>

          <section className="settings-section">
            <h2>Color Scheme</h2>
            <div className="form-group">
              <label htmlFor="primary-color">Primary Color</label>
              <input type="color" id="primary-color" defaultValue="#0066cc" />
            </div>
            <div className="form-group">
              <label htmlFor="secondary-color">Secondary Color</label>
              <input type="color" id="secondary-color" defaultValue="#333333" />
            </div>
            <div className="form-group">
              <label htmlFor="accent-color">Accent Color</label>
              <input type="color" id="accent-color" defaultValue="#ff6600" />
            </div>
            <button className="btn btn--secondary">Reset to Default Colors</button>
          </section>

          <section className="settings-section">
            <h2>Custom Domain</h2>
            <div className="form-group">
              <label htmlFor="custom-domain">Custom Domain</label>
              <input 
                type="text" 
                id="custom-domain" 
                placeholder="training.company.com"
              />
              <small>Configure your own domain for the training portal</small>
            </div>
            <div className="alert alert--info">
              <strong>DNS Configuration Required:</strong>
              <p>Add the following CNAME record to your DNS:</p>
              <code>training.company.com CNAME platform.phishdaddy.com</code>
            </div>
            <button className="btn btn--secondary">Verify Domain</button>
          </section>

          <section className="settings-section">
            <h2>Email Branding</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="use-logo-emails" defaultChecked />
              <label htmlFor="use-logo-emails">Include Company Logo in Training Emails</label>
            </div>
            <div className="form-group">
              <label htmlFor="email-header-color">Email Header Color</label>
              <input type="color" id="email-header-color" defaultValue="#0066cc" />
            </div>
            <div className="form-group">
              <label htmlFor="email-footer">Email Footer Text</label>
              <textarea 
                id="email-footer" 
                rows="3"
                placeholder="© 2026 Your Company. All rights reserved."
              ></textarea>
            </div>
          </section>

          <button className="btn btn--primary">Save Branding Settings</button>
        </div>
      )}

      {/* Integrations Settings */}
      {activeTab === 'integrations' && (
        <div className="settings-content">
          <section className="settings-section">
            <h2>Single Sign-On (SSO)</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-sso" />
              <label htmlFor="enable-sso">Enable SSO Authentication</label>
            </div>
            <div className="form-group">
              <label htmlFor="sso-provider">SSO Provider</label>
              <select id="sso-provider">
                <option value="">Select Provider</option>
                <option value="okta">Okta</option>
                <option value="azure">Azure AD / Entra ID</option>
                <option value="google">Google Workspace</option>
                <option value="onelogin">OneLogin</option>
                <option value="saml">Generic SAML 2.0</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sso-entity-id">Entity ID</label>
              <input 
                type="text" 
                id="sso-entity-id" 
                placeholder="https://company.phishdaddy.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sso-login-url">SSO Login URL</label>
              <input 
                type="url" 
                id="sso-login-url" 
                placeholder="https://sso.company.com/login"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sso-certificate">X.509 Certificate</label>
              <textarea 
                id="sso-certificate" 
                rows="5"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              ></textarea>
            </div>
            <button className="btn btn--secondary">Test SSO Configuration</button>
          </section>

          <section className="settings-section">
            <h2>Active Directory / LDAP</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-ldap" />
              <label htmlFor="enable-ldap">Enable LDAP Integration</label>
            </div>
            <div className="form-group">
              <label htmlFor="ldap-server">LDAP Server</label>
              <input 
                type="text" 
                id="ldap-server" 
                placeholder="ldap://dc.company.com:389"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ldap-base-dn">Base DN</label>
              <input 
                type="text" 
                id="ldap-base-dn" 
                placeholder="DC=company,DC=com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ldap-bind-dn">Bind DN</label>
              <input 
                type="text" 
                id="ldap-bind-dn" 
                placeholder="CN=admin,DC=company,DC=com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ldap-password">Bind Password</label>
              <input 
                type="password" 
                id="ldap-password"
              />
            </div>
            <button className="btn btn--secondary">Test LDAP Connection</button>
          </section>

          <section className="settings-section">
            <h2>SIEM Integration</h2>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="enable-siem" />
              <label htmlFor="enable-siem">Enable SIEM Event Forwarding</label>
              <small>Send security events to your SIEM platform</small>
            </div>
            <div className="form-group">
              <label htmlFor="siem-endpoint">SIEM Endpoint URL</label>
              <input 
                type="url" 
                id="siem-endpoint" 
                placeholder="https://siem.company.com/api/events"
              />
            </div>
            <div className="form-group">
              <label htmlFor="siem-format">Event Format</label>
              <select id="siem-format">
                <option value="cef">CEF (Common Event Format)</option>
                <option value="json">JSON</option>
                <option value="syslog">Syslog</option>
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h2>API Access</h2>
            <div className="form-group">
              <label>API Keys</label>
              <div className="api-keys-list">
                <div className="api-key-item">
                  <div className="api-key-info">
                    <strong>Production API Key</strong>
                    <code>pk_live_••••••••••••••••</code>
                    <span>Created: Jan 15, 2026</span>
                  </div>
                  <button className="btn btn--small btn--danger">Revoke</button>
                </div>
              </div>
              <button className="btn btn--secondary">Generate New API Key</button>
            </div>
            <div className="form-group">
              <label htmlFor="api-rate-limit">API Rate Limit (requests/hour)</label>
              <input 
                type="number" 
                id="api-rate-limit" 
                defaultValue="1000"
                min="100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="webhook-url">Webhook URL</label>
              <input 
                type="url" 
                id="webhook-url" 
                placeholder="https://api.company.com/webhooks/phishdaddy"
              />
              <small>Receive real-time event notifications</small>
            </div>
          </section>

          <section className="settings-section">
            <h2>Third-Party Integrations</h2>
            <div className="integrations-grid">
              <div className="integration-card">
                <div className="integration-header">
                  <strong>Slack</strong>
                  <span className="status status--connected">Connected</span>
                </div>
                <p>Send campaign notifications to Slack channels</p>
                <button className="btn btn--small">Configure</button>
              </div>
              <div className="integration-card">
                <div className="integration-header">
                  <strong>Microsoft Teams</strong>
                  <span className="status status--disconnected">Not Connected</span>
                </div>
                <p>Post training reminders to Teams channels</p>
                <button className="btn btn--small">Connect</button>
              </div>
              <div className="integration-card">
                <div className="integration-header">
                  <strong>Jira</strong>
                  <span className="status status--disconnected">Not Connected</span>
                </div>
                <p>Create tickets for high-risk user incidents</p>
                <button className="btn btn--small">Connect</button>
              </div>
              <div className="integration-card">
                <div className="integration-header">
                  <strong>ServiceNow</strong>
                  <span className="status status--disconnected">Not Connected</span>
                </div>
                <p>Sync training records with ServiceNow</p>
                <button className="btn btn--small">Connect</button>
              </div>
            </div>
          </section>

          <button className="btn btn--primary">Save Integration Settings</button>
        </div>
      )}
    </div>
  );
}
