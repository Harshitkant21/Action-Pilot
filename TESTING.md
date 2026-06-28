# ActionPilot — Testing & Verification Guide

This guide outlines the quality assurance practices, automation suites, manual testing test-cases, browser support matrices, and known constraints of ActionPilot.

---

## 🤖 Automated Testing

ActionPilot includes a paced end-to-end integration smoke test suite (smoke_test.js) that simulates user activities from registration to goal archiving.

### Executing Paced Smoke Tests
Run the smoke test script inside the server directory:
`Bash
node smoke_test.js
`

### Flow Phases Verified:
1. **User Sign Up**: Registers a unique developer account profile.
2. **User Sign In**: Logins, validates JWT bearer tokens, and saves local session context.
3. **Goal Creation**: Seedes target objective, triggers Gemini synchronous analysis, and generates task breakdowns.
4. **Detail Retrieval**: Fetches goal checklists and estimates.
5. **On-Track Check-in**: Logs progress update notes without blocking issues.
6. **Blocked Check-in**: Logs blockers, which updates status metrics.
7. **AI Monitoring Sweep**: Triggers BullMQ sweep runner to identify risk indicators and stands up summaries.
8. **Sweep Verification**: Asserts that goal status converts to AT_RISK and risk score rises.
9. **AI Recovery replanning**: Generates scope reduction plans.
10. **Recovery Application**: Applies plan checklist rewrites in database transaction (marks status back to ACTIVE, risk to 30%).
11. **Soft Archiving**: Archives target goal to hide from active workspace.

---

## 🧪 Manual Verification Cases

### 1. Celebratory Confetti Burst
- **Objective**: Ensure that a user is awarded a visual confetti celebration when logging check-ins at 100% progress.
- **Steps**:
  1. Open active goal details screen.
  2. Click "Log Progress Check-in".
  3. Change progress percentage slider to 100%.
  4. Submit Check-in form.
- **Verification**: Canvas emoji confetti bursts immediately and alerts success.

### 2. Standup Accountability Coach click-prompts
- **Objective**: Ensure accountability prompts inside standup reports correctly pre-fill progress update inputs.
- **Steps**:
  1. Under the Standup tab, locate "Accountability Prompts".
  2. Click on a question (e.g. *"Did you analyze goal requirements?"*).
  3. Verify check-in logs modal opens automatically and input pre-fills the question text.
- **Verification**: Input text matches exactly.

### 3. Push Alerts Permissions Toggle
- **Objective**: Ensure toggling "Desktop Alerts" registers/unregisters client service workers with the push service.
- **Steps**:
  1. Open notification bell dropdown.
  2. Click "Desktop Alerts" toggle switch.
  3. Allow browser notifications popups.
- **Verification**: Toggle marks switch as enabled and logs database push endpoint logs.

---

## 🌐 Browser Support & Secure Contexts

| Browser | Supported | Push Notifications | Notes |
| :--- | :---: | :---: | :--- |
| **Google Chrome** | Yes | Yes | Fully supported; requires secure contexts. |
| **Mozilla Firefox**| Yes | Yes | Fully supported; requires secure contexts. |
| **Microsoft Edge** | Yes | Yes | Fully supported; requires secure contexts. |
| **Safari** | Yes | Yes | Supported on iOS 16.4+ / macOS 13+ with secure context setup. |

> [!IMPORTANT]
> **Secure Context Requirement**: HTML5 Service Workers and Push Managers require secure origin loops (localhost or HTTPS). Running frontend test configurations over local network IP strings (e.g. http://192.168.1.150:5173) will cause the service worker to bypass registration to prevent security warnings.

---

## ⚠️ Known Limitations
- **Gemini 429 Rate Limits**: Under heavy request cycles, Gemini API model queries may fail due to rate constraints. The backend captures exceptions, registers database report fallbacks, and triggers worker cooldowns to prevent request storms.
- **Service Worker Local Bypass**: Mobile preview tests must run in secure loops to test desktop push alerts.
