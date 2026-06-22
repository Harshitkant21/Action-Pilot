# User Flows

## Overview

This document defines how users interact with ActionPilot and how AI agents participate throughout the execution lifecycle.

The goal is to ensure that every interaction helps users move closer to completing their goals before deadlines.

---

# Primary User Flow

## Goal Creation Flow

### User Action

The user creates a new goal.

Inputs:

* Goal Title
* Description
* Deadline

Example:

Goal:
Build Hackathon Project

Deadline:
29 June 2026

---

### System Action

The system validates the goal and stores it.

---

### AI Action

Goal Analyzer Agent evaluates:

* Goal type
* Complexity
* Estimated effort
* Time constraints

Output:

* Goal metadata
* Complexity score
* Risk indicators

---

## AI Planning Flow

### Trigger

Goal successfully created.

---

### AI Action

Planner Agent generates:

* Task breakdown
* Milestones
* Suggested execution timeline

Example:

Goal:
Build Hackathon Project

Generated Tasks:

1. Research
2. Planning
3. Backend Development
4. Frontend Development
5. Testing
6. Deployment

---

### System Action

Tasks and milestones are stored in the database.

---

## Dashboard Flow

### User Action

User opens dashboard.

---

### System Displays

* Active Goals
* Upcoming Deadlines
* Current Progress
* Risk Levels
* AI Recommendations

---

### AI Contribution

Standup Agent generates:

* Today's focus
* Priority tasks
* Suggested actions

---

# Progress Update Flow

## User Action

User updates task progress.

Examples:

* Completed
* In Progress
* Blocked

---

### System Action

Progress logs are recorded.

---

### AI Action

Risk Agent re-evaluates:

* Remaining work
* Available time
* Goal completion probability

---

### Output

Updated:

* Risk score
* Completion forecast
* Suggested next actions

---

# Inactivity Detection Flow

## Trigger

No progress updates for a predefined period.

Examples:

* 24 hours
* 48 hours

---

### System Action

Background monitoring job executes.

---

### AI Action

Standup Agent initiates follow-up.

Example:

You haven't updated progress in two days.

Are you blocked or simply behind schedule?

---

### User Response

Options:

* I'm blocked
* I'm delayed
* I'm still working
* Goal completed

---

### Result

User response becomes additional context for replanning.

---

# Risk Detection Flow

## Trigger

Progress deviates from plan.

---

### AI Action

Risk Agent evaluates:

* Progress percentage
* Remaining tasks
* Deadline proximity
* Historical updates

---

### Output

Risk Classification:

* Low
* Medium
* High

Risk Score:

0–100

---

### Example

Current Risk: High

Reason:

Backend development is delayed and only three days remain before deadline.

---

# Recovery Flow

## Trigger

Risk level exceeds threshold.

Example:

Risk Score > 70

---

### AI Action

Recovery Agent generates:

* Revised schedule
* Scope reduction suggestions
* Priority adjustments

---

### Example

Previous Plan:

Backend
Frontend
Testing
Deployment

Revised Plan:

Backend
Frontend
Deployment

Testing reduced to essential checks only.

---

# Daily Standup Flow

## Trigger

Scheduled daily job.

---

### AI Action

Standup Agent generates:

Daily Summary:

Yesterday:

* Completed authentication APIs

Pending:

* Dashboard UI

Today's Focus:

* Complete dashboard implementation

Confidence:
82%

---

### User Response

User can:

* Confirm progress
* Update tasks
* Report blockers

---

# Notification Flow

## Notification Types

### Deadline Alert

Upcoming deadline detected.

---

### Risk Alert

High risk score detected.

---

### Progress Reminder

No recent updates.

---

### Recovery Suggestion

AI generated revised plan.

---

### Daily Standup

Morning execution summary.

---

# Goal Completion Flow

## Trigger

All tasks completed.

---

### System Action

Goal marked as completed.

---

### AI Action

Generate completion summary.

Example:

Goal Completed Successfully

Total Duration:
6 Days

Tasks Completed:
12

Recovery Plans Used:
1

Final Status:
Completed Before Deadline

---

# User States

A goal can exist in one of the following states:

* Draft
* Planned
* Active
* At Risk
* Delayed
* Completed
* Archived

---

# Flow Summary
```
Goal Created

↓

Goal Analyzed

↓

Plan Generated

↓

Execution Started

↓

Progress Tracking

↓

Risk Evaluation

↓

AI Intervention

↓

Recovery Planning

↓

Goal Completion
```