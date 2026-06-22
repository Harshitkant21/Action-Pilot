# ADR-001: Technology Stack Selection

## Status

Accepted

---

## Context

ActionPilot requires:

* Fast development
* AI integration
* Background processing
* Modern frontend experience
* Reliable database support

The solution must be completed within a hackathon timeline while remaining scalable enough for future iterations.

---

## Decision

The following technology stack has been selected:

### Frontend

* React
* TypeScript
* Tailwind CSS
* React Query

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL

### ORM

* Prisma

### Background Jobs

* BullMQ

### Cache & Queue Backend

* Redis

### AI Layer

* Google Gemini API

---

## Rationale

### React

Provides rapid UI development, strong ecosystem support, and a component-driven architecture.

### Express

Lightweight and fast to develop within hackathon constraints.

### PostgreSQL

Reliable relational database with strong querying capabilities.

### Prisma

Improves developer productivity and type safety.

### Redis + BullMQ

Provides a simple and scalable solution for background monitoring jobs.

### Gemini API

Required by the hackathon and serves as the intelligence layer powering all AI agents.

---

## Consequences

### Positive

* Rapid development speed.
* Strong TypeScript support.
* Easy AI integration.
* Supports future scalability.

### Negative

* Some advanced AI workflows may eventually require more specialized infrastructure.
* Background processing adds additional operational complexity.
