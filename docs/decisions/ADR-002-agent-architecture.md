# ADR-002: Multi-Agent Architecture

## Status

Accepted

---

## Context

ActionPilot aims to act as an AI execution companion rather than a traditional task manager.

The system must support:

* Goal understanding
* Planning
* Monitoring
* Accountability
* Recovery

A single monolithic AI workflow would become difficult to maintain and extend.

---

## Decision

ActionPilot will use a specialized multi-agent architecture.

The MVP includes:

1. Goal Analyzer Agent
2. Planning Agent
3. Risk Agent
4. Recovery Agent
5. Standup Agent

Each agent owns a specific responsibility.

---

## Rationale

### Separation of Concerns

Each agent focuses on a single domain.

### Maintainability

Agent prompts and logic can evolve independently.

### Extensibility

New agents can be introduced without major architectural changes.

### Explainability

Agent outputs can be stored and reviewed individually.

---

## Agent Orchestration

Agents do not communicate directly.

The backend acts as the orchestration layer.

```text id="adr2flow"
Backend
↓
Agent
↓
Database
↓
Agent
↓
Frontend
```

---

## Consequences

### Positive

* Clear responsibilities.
* Easier debugging.
* Better prompt management.
* Improved extensibility.

### Negative

* Additional orchestration logic required.
* More AI requests may increase latency and cost.
