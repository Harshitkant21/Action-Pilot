# Agent Architecture

## Overview

ActionPilot is built around a collection of specialized AI agents that collaborate to help users complete goals before deadlines are missed.

Instead of relying on a single AI interaction, the platform uses multiple agents with distinct responsibilities throughout the goal lifecycle.

Each agent focuses on a specific aspect of execution management, allowing the system to provide proactive, contextual, and adaptive assistance.

---

# Agent Ecosystem

The current MVP consists of four core agents:

1. Goal Analyzer Agent
2. Planning Agent
3. Risk Agent
4. Recovery Agent

Additionally, one supporting agent is responsible for user engagement and accountability:

5. Standup Agent

---

# Goal Analyzer Agent

## Purpose

Understand and classify user goals.

This agent converts raw user input into structured information that other agents can use.

---

## Responsibilities

* Analyze goal descriptions
* Determine goal category
* Estimate complexity
* Identify constraints
* Detect potential risks

---

## Input

Goal Title

Goal Description

Deadline

---

## Output

Goal Metadata

Example:

* Category
* Complexity
* Estimated Effort
* Time Sensitivity

---

## Example

Input:

Goal:
Prepare for Software Engineering Interviews

Deadline:
14 Days

Output:

Category:
Career Development

Complexity:
Medium

Estimated Effort:
25 Hours

Time Sensitivity:
High

---

# Planning Agent

## Purpose

Transform goals into executable plans.

This agent creates the roadmap users will follow.

---

## Responsibilities

* Generate task breakdowns
* Create milestones
* Suggest execution timelines
* Prioritize activities

---

## Input

Goal Metadata

Goal Description

Deadline

---

## Output

Tasks

Milestones

Timeline

Priority Ordering

---

## Example

Input:

Build Hackathon Project

Output:

1. Research
2. Planning
3. Backend Development
4. Frontend Development
5. Testing
6. Deployment

---

# Risk Agent

## Purpose

Predict the likelihood of deadline failure.

The Risk Agent continuously evaluates execution progress and identifies potential issues before they become critical.

---

## Responsibilities

* Monitor progress
* Evaluate remaining workload
* Detect delays
* Calculate risk scores
* Identify bottlenecks

---

## Input

Task Progress

Completion Percentage

Remaining Tasks

Time Remaining

Historical Updates

---

## Output

Risk Score

Risk Classification

Risk Explanation

---

## Risk Levels

Low

Medium

High

Critical

---

## Example

Risk Score:
82

Classification:
High

Reason:

Frontend implementation is delayed and deadline is approaching.

---

# Recovery Agent

## Purpose

Generate recovery strategies when goals become at risk.

Instead of merely warning users, the system proposes actionable solutions.

---

## Responsibilities

* Replan schedules
* Reprioritize tasks
* Recommend scope reductions
* Optimize execution plans

---

## Input

Risk Report

Current Plan

Progress Data

Deadline Information

---

## Output

Recovery Strategy

Updated Schedule

Priority Changes

---

## Example

Current Situation:

Three days remaining.

Frontend incomplete.

Testing not started.

Generated Recovery Plan:

* Finish frontend first.
* Limit testing to critical paths.
* Deploy immediately after validation.

---

# Standup Agent

## Purpose

Maintain accountability and user engagement.

This agent acts as the primary communication layer between the user and the system.

---

## Responsibilities

* Daily check-ins
* Progress collection
* Blocker identification
* Execution guidance
* Daily summaries

---

## Input

Goal Status

Task Status

Recent Activity

---

## Output

Daily Updates

Execution Recommendations

Follow-Up Questions

---

## Example

Good Morning.

Yesterday:

* Backend APIs completed

Pending:

* Dashboard UI

Today's Focus:

* Complete Dashboard
* Integrate AI Planning

Confidence:

84%

---

# Agent Collaboration Flow

Goal Created

↓

Goal Analyzer Agent

↓

Planning Agent

↓

Execution Phase

↓

Standup Agent

↓

Risk Agent

↓

Recovery Agent

↓

Updated Plan

↓

Goal Completion

---

# Agent Trigger Events

## Goal Created

Triggers:

* Goal Analyzer Agent
* Planning Agent

---

## Progress Updated

Triggers:

* Risk Agent

---

## Risk Threshold Exceeded

Triggers:

* Recovery Agent

---

## Scheduled Daily Check-In

Triggers:

* Standup Agent

---

## Goal Completed

Triggers:

* Completion Summary Generation

---

# Design Principles

## Specialized Responsibilities

Each agent has a single primary responsibility.

---

## Context-Aware Decision Making

Agents should operate using both current state and historical progress information.

---

## Action-Oriented Outputs

Agents should provide actionable recommendations instead of generic advice.

---

## Human-in-the-Loop

Users always retain control over decisions.

Agents recommend actions but do not make irreversible decisions on behalf of users.

---

# Future Agents

The following agents are intentionally excluded from the MVP but may be added in future versions:

* Calendar Agent
* Habit Coach Agent
* Voice Assistant Agent
* Focus Session Agent
* Email Management Agent
* Meeting Preparation Agent

---

# Agent Architecture Summary

ActionPilot uses a collaborative multi-agent architecture where specialized agents analyze goals, create plans, monitor execution, detect risks, generate recovery strategies, and maintain accountability.

Together, these agents function as an AI-powered execution companion that helps users move from intention to completion.
