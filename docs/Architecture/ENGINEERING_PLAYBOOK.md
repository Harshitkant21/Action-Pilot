# Engineering Playbook

> **Version:** 1.0  
> **Status:** Living Document  
> **Audience:** Engineers, AI Coding Assistants, Contributors

---

# Purpose

This document defines the engineering standards, development workflow, implementation rules, and release process for ActionPilot.

Every contributor—human or AI—must read this document before making changes.

The objective is to ensure that every feature is implemented consistently without breaking existing functionality or deviating from the product vision.

---

# About ActionPilot

ActionPilot is an **AI Execution Companion**.

It is **not**:

- A To-Do App
- A Calendar
- A Chatbot
- A Note Taking Tool

Instead, it helps users execute goals through:

- AI Planning
- Continuous Monitoring
- Risk Detection
- Standups
- Recovery Planning
- Intelligent Notifications
- Productivity Insights

Every implementation should reinforce this identity.

---

# Required Reading Order

Before making any code changes, read these documents in order.

## Step 1

PRODUCT_PRINCIPLES.md

Understand

- Vision
- Mission
- Product Philosophy
- Engineering Philosophy

---

## Step 2

PROJECT_GUARDRAILS.md

Understand

- Boundaries
- Rules
- AI Constraints
- Coding Standards

---

## Step 3

AI_CONTEXT.md

Understand

- AI Architecture
- Existing Agents
- Prompt Rules
- Current Context

---

## Step 4

README.md

Understand

- Setup
- Features
- Architecture Overview

---

## Step 5

Architecture/

Understand

System Design

Database

Workers

AI Flow

API Structure

---

## Step 6

Decision Records

Review

Previous architectural decisions

Avoid reversing existing decisions.

---

## Step 7

Release Candidate Documents

Read current RC documents before implementing new work.

---

# Development Philosophy

Every change must satisfy the following principles.

---

## 1. Never Break Existing Features

Always extend.

Never rewrite working systems unnecessarily.

Backward compatibility is preferred.

---

## 2. Preserve User Data

Never delete

Goals

Tasks

Reports

Notifications

Completed work

unless explicitly requested.

---

## 3. Prefer Small Iterations

Avoid large refactors.

Implement features in incremental phases.

Every phase should leave the application in a working state.

---

## 4. Documentation First

Before implementing:

Understand the documentation.

Update documentation if architecture changes.

Documentation is the source of truth.

---

## 5. AI Is an Assistant

AI should recommend.

Users approve.

No automatic destructive behavior.

---

# Feature Development Workflow

Every feature follows the same lifecycle.

Idea

↓

Documentation

↓

Architecture Review

↓

Implementation Plan

↓

Implementation

↓

Testing

↓

Documentation Update

↓

Release

Do not skip steps.

---

# Release Candidate Workflow

Current release work follows:

RC-0 Audit

↓

RC-1 Stability

↓

RC-2 Notifications

↓

RC-3 Demo Polish

↓

RC-4 Security

↓

RC-5 AI Engine

↓

RC-6 Analytics

↓

RC-7 Release

Complete one phase before starting another.

---

# Coding Standards

Backend

- TypeScript Strict Mode
- Modular Architecture
- SOLID Principles where practical
- Prisma ORM
- Zod Validation
- Centralized Error Handling

Frontend

- React
- TypeScript
- Reusable Components
- React Query
- TailwindCSS

AI

- Structured JSON Responses
- Strict Schemas
- Safe Parsing
- Fallbacks
- Retry Logic

---

# Implementation Rules

Every new feature must include:

Backend

API

Validation

Error Handling

Logging

Frontend

UI

Loading State

Empty State

Error State

Success State

Testing

Documentation

---

# Error Handling Standards

Never expose:

Stack Traces

Database Schema

API Keys

JWT Secrets

Internal Errors

Always return user-friendly messages.

---

# AI Standards

Every AI feature must:

Explain reasoning

Validate responses

Use structured output

Handle malformed responses

Gracefully fallback

Avoid repeated requests

Respect cooldown logic

---

# Notification Standards

Every notification must:

Have a purpose

Be actionable

Support future delivery channels

Support read/unread

Support future preferences

Never spam users

---

# User Configuration Philosophy

Users should configure the companion.

The companion should not force workflows.

Everything should be configurable where reasonable.

Examples

Standups

Risk Thresholds

Recovery Behavior

Notification Channels

Dashboard Widgets

Coaching Style

Timezone

Quiet Hours

Planning Depth

Reminder Frequency

Future integrations

---

# Security Standards

Never commit

API Keys

Secrets

Passwords

Database URLs

SMTP Credentials

JWT Secrets

Tokens

Always use

Environment Variables

Secret Isolation

Validation

Authorization

Rate Limiting

Prompt Security

---

# Performance Standards

Avoid

Duplicate AI calls

Duplicate DB queries

Blocking APIs

Large renders

Unnecessary rerenders

Prefer

Caching

Background Workers

Incremental Loading

Optimistic Updates

---

# Testing Standards

Every feature must pass

Unit Tests (where applicable)

Smoke Tests

Regression Tests

Manual Testing

Demo Testing

Edge Case Testing

Future

Load Testing

Stress Testing

Security Testing

---

# Documentation Standards

Every feature should update:

Architecture

README (if needed)

Release Candidate docs

Decision Records (if architectural)

Testing documentation

Avoid undocumented changes.

---

# Definition of Done

A feature is complete only when:

✓ Code implemented

✓ Build succeeds

✓ No regressions

✓ Tested manually

✓ Error states handled

✓ Loading states handled

✓ Documentation updated

✓ Security reviewed

✓ Demo ready

---

# Things to Avoid

Do NOT

Rewrite working systems

Introduce unnecessary abstractions

Over-engineer

Break APIs

Ignore documentation

Bypass testing

Create hidden AI behavior

Store secrets in Git

---

# Long-Term Vision

ActionPilot should evolve into an AI Chief of Staff capable of:

Planning

Monitoring

Recovery

Analytics

Collaboration

Scheduling

Productivity Coaching

Predictive Insights

Multi-Agent Coordination

Every implementation should move the platform toward this vision.

---

# Final Engineering Rule

Before merging or completing any implementation, ask:

Does this strengthen ActionPilot as an AI Execution Companion?

If the answer is **No**, reconsider the implementation.

Every line of code should move the product closer to its vision.