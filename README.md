# 🚀 ActionPilot

### From Intention to Completion

ActionPilot is an AI-powered execution companion designed to help users complete goals before deadlines are missed.

Unlike traditional productivity tools that rely on passive reminders, ActionPilot actively assists users throughout the execution lifecycle by creating plans, monitoring progress, identifying risks, and recommending recovery actions when goals fall behind schedule.

Built using Google Gemini, ActionPilot transforms productivity from simple task management into proactive execution support.

---

# 🎯 Problem Statement

Students, professionals, freelancers, and entrepreneurs frequently miss deadlines despite using productivity tools.

The problem is not a lack of reminders.

The real challenges are:
* Underestimating effort
* Procrastination
* Lack of accountability
* Poor prioritization
* Failure to adapt when plans break down

Most productivity applications notify users about deadlines but do little to help them actually complete their work. ActionPilot addresses this gap by acting as an AI-powered execution companion that helps users move from intention to completion.

---

# 💡 Solution Overview

ActionPilot combines AI planning, progress monitoring, risk detection, and adaptive recovery strategies to help users achieve their goals.

### Core Workflow
```
Goal Creation ➔ AI Goal Analysis ➔ Task Breakdown & Planning ➔ Execution Tracking ➔ Risk Detection ➔ Recovery Recommendations ➔ Goal Completion
```

---

# 🤖 AI Agent Architecture

ActionPilot uses a specialized multi-agent architecture:

* **Goal Analyzer Agent**: Evaluates goals, estimating complexity, estimated hours, potential constraints, and initial risk parameters.
* **Planning Agent**: Automatically generates detailed task checklists, priority tags, and suggested execution timelines.
* **Risk Agent**: Continuously tracks progress logs, checks remaining hours, and raises risk alerts.
* **Standup Agent**: Generates daily standup summaries, accountability check-in logs, and coaching tips.
* **Recovery Agent**: Steps in when goals are flagged as `AT_RISK` or `BLOCKED` to suggest task scope reduction plans and adjust checklist efforts.

---

# 🏗️ System Architecture

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, TanStack React Query.
* **Backend**: Node.js, Express, TypeScript, BullMQ, ioredis.
* **Database**: PostgreSQL with Prisma ORM.
* **AI Engine**: Google Gemini API client.

---

# 🔒 Authentication & Password Security

ActionPilot implements strict authentication mechanisms. User logins generate secure JSON Web Tokens (JWT) signed by the backend. Registration enforces a robust password complexity policy.

### Password Strength Requirements:
* **Length**: At least 8 characters.
* **Casing**: Contains at least one uppercase letter (`A-Z`) and one lowercase letter (`a-z`).
* **Digits**: Contains at least one number (`0-9`).
* **Special Characters**: Contains at least one special symbol from the set: `@$!%*?&^#()_-+=`.

---

# 🛠️ Installation & Setup

Follow these steps to run ActionPilot locally on your machine.

### Prerequisites
* **Node.js**: Version >= 18
* **Database**: PostgreSQL instance running
* **Caching**: Redis instance running

---

### Step 1: Configure Backend Environment
Navigate to the server directory:
```bash
cd server
```
Create a `.env` file based on `.env.example` and set your local variables:
```bash
cp .env.example .env
```
Ensure your database connection and Gemini API Key are registered:
```ini
PORT=3001
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/actionpilot?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-at-least-32-chars-long"
GEMINI_API_KEY="your-gemini-api-key"
```

---

### Step 2: Install Server Dependencies & Migrate Database
Install dependencies:
```bash
npm install
```
Run the Prisma migrations to set up database schemas:
```bash
npx prisma migrate dev
```
Generate the client code:
```bash
npx prisma generate
```

---

### Step 3: Configure Frontend Environment
Navigate to the client directory:
```bash
cd ../client
```
Install dependencies:
```bash
npm install
```
Confirm your client configuration in `client/src/config/appConfig.ts` is pointed to the correct backend API endpoint:
```typescript
export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  notificationPollingIntervalMs: parseInt(import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL_MS || '30000', 10),
};
```

---

### Step 4: Run Services
Start the backend development server:
```bash
# In server folder
npm run dev
```
Start the frontend development server:
```bash
# In client folder
npm run dev
```

---

# 🧪 Verification & Testing

ActionPilot includes a paced end-to-end integration smoke test suite that verifies user registration, login, goal creation, progress logging, AI sweeps execution, recovery applications, and archiving.

To run the integration smoke test:
```bash
# In server folder
node smoke_test.js
```
For more testing details, see **[TESTING.md](file:///d:/Projects/hackathon/ActionPilot/TESTING.md)**.

---

# 🏆 Hackathon Alignment

ActionPilot directly addresses the challenge objective:
> Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed.

The solution demonstrates:
* Intelligent Planning
* Agentic Workflows
* Context-Aware Assistance
* Adaptive Decision Making
* Proactive User Engagement

---

## Tagline
**ActionPilot — Your AI Execution Companion.**  
**From Intention to Completion.**
