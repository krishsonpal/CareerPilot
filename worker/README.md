# CareerPilot — BullMQ Worker Service

This Node.js service is the asynchronous AI task processor for CareerPilot.
It connects to the same Redis instance as the Python FastAPI backend and
processes heavy AI operations (resume parsing, match scoring, job embedding)
without blocking the API layer.

## Architecture

```
Python FastAPI (port 8000)
       │
       │  HTTP POST /queue/<task-name>
       ▼
Node.js Worker HTTP Server (port 3001)
       │
       │  BullMQ.Queue.add(jobData)
       ▼
BullMQ Queue (Redis)
       │
       │  BullMQ.Worker.process(job)
       ▼
AI Processing (Gemini API + PostgreSQL writes)
```

## Queues

| Queue Name | Triggered by | What it does |
|---|---|---|
| `resume-parse` | Student uploads resume PDF | Extracts text → Gemini JSON parse → 768-dim embed → DB upsert |
| `match-score` | Student submits job application | Gemini evaluates fit → writes score + skill gaps to applications table |
| `job-embed` | Recruiter creates/edits job | Generates Gemini vector embedding → updates jobs.embedding (pgvector) |

## Setup

```bash
cd worker
npm install
cp .env.example .env
# Fill in GOOGLE_API_KEY, DATABASE_URL in .env
npm run dev   # development
npm start     # production
```

## Environment Variables

See `.env.example` for all required variables.

## Checking Job Status

```
GET http://localhost:3001/queue/<queue-name>/status/<job-id>
```

Returns:
```json
{
  "task_id": "resume-user123-1697123456789",
  "queue": "resume-parse",
  "state": "completed",
  "progress": 100,
  "result": { "user_id": "...", "skills_count": 12, "status": "complete" }
}
```
