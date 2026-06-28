# PROJECT GUARDRAILS

## Purpose

This document serves as the governing framework for ActionPilot.

Its purpose is to ensure that all development decisions remain aligned with the product vision, architecture, scope, and implementation strategy.

This document exists to prevent:

* Scope creep
* Architecture drift
* Random feature additions
* Inconsistent AI-generated code
* Overengineering
* Unnecessary complexity

All contributors, AI assistants, and development tools must follow the rules defined in this document.

---

# Project Identity

## Product Name

ActionPilot

---

## Tagline

From Intention to Completion

---

## Category

AI Execution Companion

---

## Core Problem

People frequently miss deadlines because traditional productivity tools rely on passive reminders and do not actively help users complete work.

Most tools help users organize tasks.

Very few help users consistently execute and complete them.

---

## Product Goal

Help users complete goals before deadlines are missed through:

* Planning
* Accountability
* Execution Monitoring
* Risk Detection
* Recovery Support
* Intelligent Interventions

---

## Product Positioning

ActionPilot is NOT:

* A task manager
* A note-taking application
* A project management platform
* A reminder application
* A productivity dashboard

ActionPilot IS:

An AI-powered execution companion that actively helps users complete goals before deadlines are missed.

---

# Source Of Truth

The following documents define the system.

Any implementation must follow them.

## Product

* 00-problem-analysis.md
* 01-product-vision.md

---

## User Experience

* 02-user-flows.md

---

## Architecture

* 03-system-architecture.md

---

## AI System

* 04-agents.md

---

## Database

* 05-database-design.md

---

## APIs

* 06-api-design.md

---

## Scope

* 07-mvp-scope.md

---

## Development

* 08-development-plan.md

---

## Roadmap

* 09-future-roadmap.md

---

## Execution Engine

* 10-execution-engine.md

---

# MVP Scope Lock

The following capabilities are included in the MVP.

## Authentication

* Register
* Login
* User Session

---

## Goal Management

* Create Goal
* Update Goal
* View Goal
* Archive Goal

---

## AI Goal Analysis

Goal Analyzer Agent

---

## AI Planning

Planning Agent

---

## Task Management

* View Tasks
* Update Tasks
* Track Progress

---

## Check-In System

* Structured Progress Updates
* Blocker Reporting
* Confidence Tracking
* Execution Status Tracking

---

## Execution Monitoring

* Progress Monitoring
* Activity Monitoring
* Completion Probability Tracking

---

## Risk Detection

Risk Agent

---

## Recovery Planning

Recovery Agent

---

## Notifications

* Check-In Reminders
* Risk Alerts
* Recovery Suggestions
* Execution Summaries
* Goal Completion Notifications

---

# Explicitly Out Of Scope

The following features are intentionally excluded from the MVP.

## Team Collaboration

Rejected

---

## Mobile Applications

Rejected

---

## Slack Integration

Rejected

---

## Jira Integration

Rejected

---

## Notion Integration

Rejected

---

## Voice Assistant

Rejected

---

## Social Features

Rejected

---

## Enterprise Features

Rejected

---

## Multi-Tenant Systems

Rejected

---

## Microservices

Rejected

---

## Advanced Analytics

Rejected

---

# Technology Lock

Technologies are frozen unless explicitly approved.

## Frontend

* React
* TypeScript
* Tailwind CSS
* React Query

---

## Backend

* Node.js
* Express.js
* TypeScript

---

## Database

* PostgreSQL
* Prisma

---

## Background Processing

* Redis
* BullMQ

---

## AI Layer

* Google Gemini API

---

# Agent System

Only the following agents exist in the MVP.

---

## Goal Analyzer Agent

### Inputs

* Goal
* Description
* Deadline

### Outputs

* Complexity
* Estimated Effort
* Risk Factors

---

## Planning Agent

### Inputs

* Goal

### Outputs

* Tasks
* Milestones
* Timeline

---

## Execution Monitoring Agent

### Inputs

* Tasks
* Progress Updates
* Check-In History
* Deadline

### Outputs

* Execution Summary
* Monitoring Signals
* Completion Probability

---

## Risk Agent

### Inputs

* Progress
* Deadline
* Remaining Work
* Completion Probability

### Outputs

* Risk Score
* Risk Level
* Risk Explanation

---

## Recovery Agent

### Inputs

* Risk Report
* Current Progress
* Remaining Work

### Outputs

* Recovery Recommendations
* Updated Execution Plan
* Priority Adjustments
* Scope Reduction Suggestions

---

# Execution Engine Rules

ActionPilot is fundamentally an execution monitoring system.

Planning is only the first step.

The platform must continuously:

* Monitor execution
* Collect check-ins
* Evaluate risks
* Generate recovery plans
* Intervene when required

Every feature should strengthen execution rather than simply organize information.

---

# Check-In System

Check-ins are a core product capability.

The system must support structured progress reporting.

Required fields:

* Progress Percentage
* Execution Status
* Blocker Description
* Estimated Hours Remaining
* Confidence Score

Check-in frequency should be configurable.

Examples:

* Daily
* Twice Daily
* Every 4 Hours
* Custom Schedule

---

# Completion Probability

Every goal should maintain a completion probability score.

This score represents the estimated likelihood of successful completion before the deadline.

Inputs may include:

* Progress Velocity
* Remaining Work
* Deadline Proximity
* Check-In Consistency
* User Confidence
* Active Blockers

The score should be visible to users.

---

# AI Intervention Principle

ActionPilot should proactively engage users when execution deviates from the plan.

Users should not always need to initiate interactions.

The system should identify risks and offer recovery assistance automatically.

Examples:

* Missed Check-In
* High Risk Score
* Repeated Blockers
* Low Completion Probability
* Long Periods of Inactivity

---

# Core Execution Loop

Every feature must support the following workflow:

Goal Creation

↓

Goal Analysis

↓

Plan Generation

↓

Task Creation

↓

Execution Check-In

↓

Execution Monitoring

↓

Risk Evaluation

↓

Recovery Planning

↓

Goal Completion

If a feature does not strengthen this loop, it should not be included in the MVP.

---

# Development Rules

## Rule 1

Build MVP only.

Do not build future roadmap features.

---

## Rule 2

Workflow first.

AI second.

Build complete workflows before integrating Gemini.

---

## Rule 3

Mock before AI.

Example:

Goal

↓

Mock Tasks

↓

UI

↓

Replace Mock Logic with Gemini

---

## Rule 4

Every feature must be demoable.

Question:

Can a judge understand this feature within 30 seconds?

If not:

Do not build it.

---

## Rule 5

No architecture changes after setup phase.

Architecture is frozen.

---

## Rule 6

No database changes without updating:

05-database-design.md

---

## Rule 7

No API changes without updating:

06-api-design.md

---

## Rule 8

No random Gemini calls.

Every AI interaction must belong to a defined agent.

---

## Rule 9

Prefer simple solutions.

Avoid:

* Overengineering
* Premature Optimization
* Unnecessary Abstractions

---

## Rule 10

Always maintain a deployable application.

The project should remain deployable throughout development.

---

## Rule 11

Execution support takes priority over task management.

If a feature improves task management but does not improve execution, accountability, monitoring, risk detection, or recovery, it should be rejected from the MVP.

---

# AI Assistant Instructions

These instructions apply to:

* Antigravity
* Claude
* Gemini
* Cursor
* Codex
* ChatGPT
* Any future AI coding assistant

---

## Required Behavior

Before implementation:

1. Read PROJECT_GUARDRAILS.md
2. Read AI_CONTEXT.md
3. Identify the current development phase
4. Explain the implementation plan
5. Wait for approval
6. Generate code only after approval

---

## Forbidden Behavior

Do not:

* Change project scope
* Introduce new technologies
* Rewrite architecture
* Add unapproved features
* Refactor unrelated code
* Generate excessive code without approval

---

# End Goal

The objective is NOT to build a productivity application.

The objective is to build an AI Execution Companion that helps users complete goals before deadlines are missed through planning, accountability, execution monitoring, risk detection, recovery support, and intelligent interventions.

Every implementation decision must support this objective.

---

# Final Principle

Completion over perfection.

A polished, complete, and demoable MVP is more valuable than a partially finished ambitious system.
