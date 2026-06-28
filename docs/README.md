# 📚 ActionPilot Documentation

Welcome to the ActionPilot documentation.

This directory contains everything required to understand, maintain, and extend the project.

---

# Documentation Structure

## 🧠 Product

High-level product documentation.

| File | Description |
|------|-------------|
| 00-problem-analysis.md | Problem being solved |
| 01-product-vision.md | Vision and mission |
| 02-user-flows.md | User journeys |
| 03-system-architecture.md | High-level system overview |
| 04-agents.md | AI capabilities |
| 05-database-design.md | Data model overview |
| 06-api-design.md | API design |
| 07-mvp-scope.md | MVP scope |
| 08-development-plan.md | Development roadmap |
| 09-future-roadmap.md | Future product vision |
| 10-execution-engine.md | AI execution engine |

---

## 🏗 Architecture

Technical implementation details.

| File | Description |
|------|-------------|
| SYSTEM_ARCHITECTURE.md | Complete backend architecture |
| DATABASE.md | Database schema |
| API.md | API reference |
| AI_AGENT_ARCHITECTURE.md | AI agents |
| USER_CONFIGURATION.md | User-configurable features |
| PROJECT_GUARDRAILS.md | Development rules |
| AI_CONTEXT.md | AI coding context |

---

## 📑 ADR (Architecture Decision Records)

Important architectural decisions.

- ADR-001 Tech Stack
- ADR-002 AI Agent Architecture
- ADR-003 Notification Strategy

---

## 🚀 Release Candidate

Tracks the current release.

- RC-STATUS
- RC-0 Audit
- RC-1 Stability
- RC-2 Notifications
- RC-3 Demo Polish
- RC-4 Security
- RC-5 AI Engine
- RC-6 Analytics
- RC-7 Release

---

## 🧪 Testing

Quality assurance documentation.

- Smoke Tests
- Regression Tests
- Stress Test Plan
- Release Checklist
- Engineering Playbook
- Product Principles

---

# Reading Order (New Contributors)

1. Product Vision
2. MVP Scope
3. System Architecture
4. AI Agent Architecture
5. Database
6. API
7. AI Context
8. Project Guardrails
9. Current Release Status

---

# Current Status

Current Release: **Release Candidate (RC)**

Goal: Ship ActionPilot as an AI Execution Companion for the hackathon.

---

# Centralized Configurations (`.env`)

ActionPilot loads centralized config variables in `server/src/config/appConfig.ts`. The following options are customizable inside `server/.env`:

| Key | Description | Default |
| :--- | :--- | :---: |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origin ports | Local dev client ports |
| `STANDUP_COOLDOWN_HOURS` | Hours to lock standup coaching updates | `22` |
| `RISK_COOLDOWN_HOURS` | Hours to lock automated risk updates | `4` |
| `RECOVERY_COOLDOWN_HOURS`| Hours to lock recovery suggestions | `4` |
| `RISK_THRESHOLD` | Score at which goal is flagged AT_RISK | `70` |
| `MONITORING_SWEEP_INTERVAL_MS` | BullMQ repeats sweeps scans interval (ms) | `3600000` (1h) |
| `NOTIFICATION_POLLING_INTERVAL_MS` | Client navbar dropdown alerts refresh (ms) | `30000` (30s) |
| `GEMINI_RETRY_LIMIT` | Gemini API query retry failures limit | `2` |
| `VAPID_PUBLIC_KEY` | Public VAPID credentials key for WebPush | Generated key |
| `VAPID_PRIVATE_KEY` | Private VAPID credentials key for WebPush | Generated key |