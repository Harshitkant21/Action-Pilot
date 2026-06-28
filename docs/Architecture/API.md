# API Architecture

## Overview

ActionPilot follows a REST-first architecture.

Frontend communicates exclusively with backend APIs.

The backend is responsible for

- Authentication
- AI orchestration
- Database access
- Background jobs
- Notification generation

---

## Versioning

/api/v1

---

## Authentication

JWT

Protected Routes

Authorization Middleware

---

## Main Modules

Authentication

Goal Management

Task Management

AI

Notifications

Analytics (Future)

Settings (Future)

---

## AI Endpoints

Goal Analysis

Planning

Standup

Risk Evaluation

Recovery Generation

Recovery Apply

Trigger Monitoring

---

## Notification APIs

Current

GET Notifications

Mark Read

Mark All Read

Future

Browser Push Registration

Email Preferences

Notification Settings

---

## Response Format

Success

{
    success: true,
    data: {}
}

Failure

{
    success: false,
    message: ""
}

---

## Validation

Zod

Prisma Validation

JWT Middleware

---

## Error Handling

Centralized Error Middleware

No sensitive stack traces returned to client

---

## Future APIs

Analytics

Dashboard Metrics

Calendar Sync

Slack Integration

Dependency Graph

Team Workspace