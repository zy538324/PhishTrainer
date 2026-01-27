import React, { createContext, useContext, useState } from "react";

/*
  SettingsForm
  ------------
  Centralised form state + helpers for the Settings page.

  Responsibilities:
  • Hold all settings values
  • Provide change handlers
  • Provide save helpers per section
  • Stay UI-agnostic
*/

const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsForm");
  }
  return ctx;
}

export default function SettingsForm({ children }) {
  const [values, setValues] = useState({
    /* ======================
       General
       ====================== */
    orgName: "",
    industry: "",
    timezone: "UTC",
    language: "en",

    gdprMode: false,
    autoRetention: false,
    retentionDays: 365,

    adminEmail: "",
    weeklyReports: true,
    campaignAlerts: true,
    highRiskAlerts: true,

    /* ======================
       Campaigns
       ====================== */
    campaignDifficulty: "medium",
    campaignFrequency: "biweekly",
    usersPerBatch: 50,

    sendWindowStart: "09:00",
    sendWindowEnd: "17:00",
    excludeWeekends: true,
    excludeHolidays: true,
    excludedDays: [],

    landingAction: "acknowledgment",
    landingMessage: "",
    showReportingButton: true,

    botDetection: true,
    botSensitivity: "medium",
    botIpExclusions: "",

    /* ======================
       Email / SMTP
       ====================== */
    smtpHost: "",
    smtpPort: 587,
    smtpEncryption: "tls",
    smtpUsername: "",
    smtpPassword: "",

    fromEmail: "",
    fromName: "",
    replyTo: "",
    randomizeSender: false,

    simulationDomain: "",
    trackingDomain: "",

    trainingFromEmail: "",
    trainingFromName: "",
    sendTrainingReminders: true,
    reminderFrequency: 3,

    /* ======================
       Training
       ====================== */
    autoEnrollFails: true,
    autoEnrollNew: true,
    failureThreshold: 2,

    trainingModules: {
      phishing: true,
      smishing: true,
      vishing: false,
      password: true,
      mfa: true,
      data: false,
      social: false
    },

    requireAcknowledgment: true,
    requireQuiz: false,
    passingScore: 80,
    completionDeadline: 14,

    complianceTraining: {
      gdpr: false,
      hipaa: false,
      pci: false,
      sox: false
    },
    annualTraining: "annually",

    /* ======================
       Users
       ====================== */
    defaultGroup: "all-users",
    autoSyncUsers: false,
    syncFrequency: "daily",

    adaptiveProfiling: true,
    riskThreshold: "medium",
    targetHighRisk: true,

    inactiveDays: 90,
    excludeInactive: true,
    excludeInactiveAnalytics: false,

    /* ======================
       Security
       ====================== */
    requireMfa: true,
    mfaMethods: {
      totp: true,
      sms: false,
      email: false,
      hardware: false
    },

    minPasswordLength: 12,
    passwordRules: {
      upper: true,
      lower: true,
      numbers: true,
      special: true
    },
    passwordExpiry: 90,
    passwordHistory: 5,

    sessionTimeout: 60,
    maxSessions: 3,
    rememberDevice: true,

    ipWhitelist: "",
    ipBlacklistEnabled: false,
    ipBlacklist: "",

    auditLogging: true,
    auditRetention: 365,

    /* ======================
       Branding
       ====================== */
    primaryColor: "#0066cc",
    secondaryColor: "#333333",
    accentColor: "#ff6600",

    customDomain: "",
    useLogoEmails: true,
    emailHeaderColor: "#0066cc",
    emailFooter: "",

    /* ======================
       Integrations
       ====================== */
    ssoEnabled: false,
    ssoProvider: "",
    ssoEntityId: "",
    ssoLoginUrl: "",
    ssoCertificate: "",

    ldapEnabled: false,
    ldapServer: "",
    ldapBaseDn: "",
    ldapBindDn: "",
    ldapPassword: "",

    siemEnabled: false,
    siemEndpoint: "",
    siemFormat: "cef",

    apiRateLimit: 1000,
    webhookUrl: ""
  });

  /* ======================
     Generic Handlers
     ====================== */

  const setField = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const setCheckbox = (e) => {
    const { name, checked } = e.target;
    setField(name, checked);
  };

  const setInput = (e) => {
    const { name, value, type } = e.target;
    setField(name, type === "number" ? Number(value) : value);
  };

  const setNested = (group, key, value) => {
    setValues(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value
      }
    }));
  };

  /* ======================
     Save Hooks (stubbed)
     ====================== */

  const saveSection = async (sectionName) => {
    const payload = values;
    console.log(`Saving ${sectionName}`, payload);

    // TODO: wire API
    // await api.saveSettings(sectionName, payload);
  };

  return (
    <SettingsContext.Provider
      value={{
        values,
        setField,
        setInput,
        setCheckbox,
        setNested,
        saveSection
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
