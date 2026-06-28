# AI Agent Architecture

## Purpose

ActionPilot is designed around multiple specialized AI agents instead of a single generic AI assistant.

Each agent has one responsibility and operates independently while sharing context through structured outputs stored in the database.

This modular architecture makes the system easier to maintain, test, and extend.

---

# High Level Flow

Goal Created
        │
        ▼
Goal Analyzer Agent
        │
        ▼
Planning Agent
        │
        ▼
Tasks Generated
        │
        ▼
User Executes Tasks
        │
        ▼
Progress Check-ins
        │
        ▼
Risk Agent
        │
        ▼
Risk Score Updated
        │
        ▼
Standup Agent
        │
        ▼
Recommendations
        │
        ▼
Recovery Agent (if required)

---

# Agents

## 1. Goal Analyzer

Purpose

Analyze the user's goal before execution.

Input

- Goal title
- Description
- Deadline

Output

- Complexity
- Estimated effort
- Categories
- Initial Risk
- Goal Summary

Triggers

- Goal Creation

---

## 2. Planning Agent

Purpose

Break goals into executable tasks.

Input

Goal Analysis

Output

- Task list
- Priorities
- Suggested ordering
- Estimated duration

Triggers

Immediately after Goal Analyzer

---

## 3. Risk Agent

Purpose

Predict the probability of missing deadlines.

Input

- Progress %
- Remaining Tasks
- Confidence
- Remaining Hours
- Blockers

Output

- Risk Score
- Completion Probability
- Risk Explanation
- Suggested Action

Triggers

Progress Check-ins

Background Monitoring

---

## 4. Standup Agent

Purpose

Acts like a daily accountability coach.

Input

Recent Progress

Output

- Yesterday Summary
- Today's Focus
- Recommendations
- Accountability Questions

Triggers

Background Worker

Manual Generation

---

## 5. Recovery Agent

Purpose

Recover projects that are likely to fail.

Input

Risk Report

Current Tasks

Output

- Revised Plan
- Scope Reduction
- Priority Changes
- Timeline Adjustments

Rules

Completed tasks must never be removed.

Triggers

Risk > Threshold

Manual Recovery Request

---

# Shared Context

Agents communicate through structured Agent Reports stored inside PostgreSQL.

No agent directly calls another.

Each agent consumes previous reports.

This keeps agents loosely coupled.

---

# Current AI Model

Google Gemini 2.5 Flash

Structured JSON responses

Strict schemas

Fallback handling enabled

---

# Failure Strategy

If AI generation fails

↓

Fallback responses

↓

Database remains consistent

↓

User can retry later

No user workflow should completely fail because of AI.

---

# Future Expansion

Future agents may include

- Dependency Agent
- Meeting Agent
- Calendar Agent
- Productivity Coach
- Team Collaboration Agent
- Analytics Agent

The architecture supports adding these without modifying existing agents.