# System Architecture

## High Level

Frontend

↓

REST API

↓

Business Layer

↓

AI Layer

↓

Database

↓

Background Workers

↓

Notifications

---

# Technology Stack

Frontend

React

TypeScript

Tailwind

React Query

Backend

Node.js

Express

TypeScript

Prisma

PostgreSQL

Redis

BullMQ

Google Gemini

---

# Request Flow

User

↓

Frontend

↓

REST API

↓

Controller

↓

Service

↓

AI

↓

Database

↓

Response

---

# Background Flow

BullMQ Scheduler

↓

Monitoring Worker

↓

Risk Detection

↓

Standup Generation

↓

Recovery Detection

↓

Notifications

---

# AI Flow

Goal

↓

Analyze

↓

Plan

↓

Execution

↓

Risk

↓

Recovery

↓

Completion

---

# Notification Flow

Background Worker

↓

Notification Table

↓

Notification API

↓

Frontend Notification Center

↓

Future

Browser Push

Email

Slack

Teams

---

# Security

JWT

Bcrypt

Helmet

CORS

Environment Variables

Input Validation

Prisma ORM

---

# Deployment

Frontend

Vercel

Backend

Railway / Render

Database

Neon PostgreSQL

Redis

Upstash

---

# Future System

Analytics Engine

↓

Prediction Engine

↓

Dependency Planner

↓

Calendar

↓

Team Collaboration

↓

AI Productivity Insights

↓

Cross-platform Mobile App