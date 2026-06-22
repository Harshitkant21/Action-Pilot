# API Design

## Overview

ActionPilot follows a REST-based API architecture.

The API is organized around the core MVP domains:

* Authentication
* Goals
* Tasks
* Progress Tracking
* Notifications
* AI Agents

All endpoints return JSON responses.

---

# API Versioning

Base URL:

```text
/api/v1
```

---

# Authentication APIs

## Register User

### Endpoint

```http
POST /api/v1/auth/register
```

### Request

```json
{
  "name": "Harshit Kant",
  "email": "harshit@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

## Login User

### Endpoint

```http
POST /api/v1/auth/login
```

### Request

```json
{
  "email": "harshit@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "token": "jwt_token"
}
```

---

## Get Current User

### Endpoint

```http
GET /api/v1/auth/me
```

### Response

```json
{
  "id": "uuid",
  "name": "Harshit Kant",
  "email": "harshit@example.com"
}
```

---

# Goal APIs

## Create Goal

### Endpoint

```http
POST /api/v1/goals
```

### Request

```json
{
  "title": "Build Hackathon Project",
  "description": "Build ActionPilot MVP",
  "deadline": "2026-06-29T14:00:00Z"
}
```

### Response

```json
{
  "success": true,
  "goalId": "uuid"
}
```

---

## Get All Goals

### Endpoint

```http
GET /api/v1/goals
```

---

## Get Goal By ID

### Endpoint

```http
GET /api/v1/goals/:goalId
```

---

## Update Goal

### Endpoint

```http
PUT /api/v1/goals/:goalId
```

---

## Archive Goal

### Endpoint

```http
DELETE /api/v1/goals/:goalId
```

---

# Task APIs

## Get Goal Tasks

### Endpoint

```http
GET /api/v1/goals/:goalId/tasks
```

---

## Update Task Status

### Endpoint

```http
PATCH /api/v1/tasks/:taskId/status
```

### Request

```json
{
  "status": "completed"
}
```

---

## Update Task Progress

### Endpoint

```http
PATCH /api/v1/tasks/:taskId/progress
```

### Request

```json
{
  "progress": 75
}
```

---

# Progress APIs

## Create Progress Update

### Endpoint

```http
POST /api/v1/progress
```

### Request

```json
{
  "goalId": "uuid",
  "taskId": "uuid",
  "updateText": "Completed authentication module",
  "progressPercentage": 60
}
```

---

## Get Goal Progress History

### Endpoint

```http
GET /api/v1/goals/:goalId/progress
```

---

# Notification APIs

## Get Notifications

### Endpoint

```http
GET /api/v1/notifications
```

---

## Mark Notification As Read

### Endpoint

```http
PATCH /api/v1/notifications/:notificationId/read
```

---

# AI APIs

These endpoints trigger AI agent workflows.

---

# Goal Analysis

## Endpoint

```http
POST /api/v1/ai/analyze-goal
```

### Purpose

Runs Goal Analyzer Agent.

---

### Request

```json
{
  "goalId": "uuid"
}
```

---

### Response

```json
{
  "complexity": "high",
  "estimatedEffort": 30,
  "riskFactors": [
    "tight deadline"
  ]
}
```

---

# Generate Plan

## Endpoint

```http
POST /api/v1/ai/generate-plan
```

### Purpose

Runs Planning Agent.

---

### Request

```json
{
  "goalId": "uuid"
}
```

---

### Response

```json
{
  "tasks": [],
  "milestones": []
}
```

---

# Risk Evaluation

## Endpoint

```http
POST /api/v1/ai/evaluate-risk
```

### Purpose

Runs Risk Agent.

---

### Request

```json
{
  "goalId": "uuid"
}
```

---

### Response

```json
{
  "riskScore": 72,
  "classification": "high",
  "reason": "Progress is behind schedule"
}
```

---

# Recovery Plan

## Endpoint

```http
POST /api/v1/ai/recovery-plan
```

### Purpose

Runs Recovery Agent.

---

### Request

```json
{
  "goalId": "uuid"
}
```

---

### Response

```json
{
  "suggestions": [
    "Reduce testing scope",
    "Focus on backend completion"
  ]
}
```

---

# Daily Standup

## Endpoint

```http
POST /api/v1/ai/standup
```

### Purpose

Runs Standup Agent.

---

### Response

```json
{
  "summary": "Today's focus is frontend implementation.",
  "confidence": 84
}
```

---

# Health Check API

## Endpoint

```http
GET /api/v1/health
```

### Response

```json
{
  "status": "healthy"
}
```

---

# Standard Response Format

## Success Response

```json
{
  "success": true,
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# Authentication Strategy

Protected routes require:

```http
Authorization: Bearer <token>
```

JWT-based authentication will be used for the MVP.

---

# Future APIs

The following APIs are intentionally excluded from the MVP:

* Calendar APIs
* Voice APIs
* Email APIs
* Team Collaboration APIs
* Third-Party Integrations

These may be introduced in future releases.

---

# API Design Summary

The ActionPilot API is designed around the complete execution lifecycle:

Goal Creation

↓

Planning

↓

Execution

↓

Progress Tracking

↓

Risk Detection

↓

Recovery

↓

Completion

The API remains intentionally simple to support rapid development while covering all core MVP functionality.
