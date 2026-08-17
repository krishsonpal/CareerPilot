// ============================================================
// CareerPilot Worker — Express HTTP Server
// Accepts job submission requests from the Python FastAPI backend.
// The Python side sends HTTP POST requests here instead of
// pushing directly to Redis — this gives us true BullMQ queue
// management with retries, priorities, and progress tracking.
//
// Endpoints:
//   POST /queue/resume-parse      → enqueue resume parse job
//   POST /queue/match-score       → enqueue match score job
//   POST /queue/job-embed         → enqueue job embedding job
//   GET  /queue/:name/status/:id  → check job status by BullMQ job ID
//   GET  /health                  → health check
// ============================================================

import express from "express";
import { queues, resumeParseQueue, matchScoreQueue, jobEmbedQueue } from "./queues/index.js";
import { QUEUE_NAMES } from "./queues/names.js";
import { config } from "./config.js";

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "careerpilot-worker",
    queues: Object.keys(QUEUE_NAMES).map((k) => QUEUE_NAMES[k]),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Enqueue — Resume Parse
// Body: { user_id, file_path, resume_url }
// ---------------------------------------------------------------------------
app.post("/queue/resume-parse", async (req, res) => {
  const { user_id, file_path, resume_url } = req.body;

  if (!user_id || !file_path) {
    return res.status(400).json({ error: "user_id and file_path are required" });
  }

  try {
    const job = await resumeParseQueue.add(
      "parse-resume",
      { user_id, file_path, resume_url },
      {
        jobId: `resume-${user_id}-${Date.now()}`, // Deterministic ID for deduplication
        priority: 1, // High priority
      }
    );

    console.log(`[Server] Enqueued resume-parse job ${job.id} for user=${user_id}`);
    return res.status(202).json({
      task_id: job.id,
      status: "queued",
      queue: QUEUE_NAMES.RESUME_PARSE,
    });
  } catch (err) {
    console.error("[Server] Failed to enqueue resume-parse:", err.message);
    return res.status(500).json({ error: "Failed to enqueue job", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Enqueue — Match Score
// Body: { user_id, job_id, application_id }
// ---------------------------------------------------------------------------
app.post("/queue/match-score", async (req, res) => {
  const { user_id, job_id, application_id } = req.body;

  if (!user_id || !job_id || !application_id) {
    return res.status(400).json({
      error: "user_id, job_id, and application_id are required",
    });
  }

  try {
    const job = await matchScoreQueue.add(
      "compute-match",
      { user_id, job_id, application_id },
      {
        jobId: `match-${application_id}`,
        priority: 2,
      }
    );

    console.log(
      `[Server] Enqueued match-score job ${job.id} for application=${application_id}`
    );
    return res.status(202).json({
      task_id: job.id,
      status: "queued",
      queue: QUEUE_NAMES.MATCH_SCORE,
    });
  } catch (err) {
    console.error("[Server] Failed to enqueue match-score:", err.message);
    return res.status(500).json({ error: "Failed to enqueue job", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Enqueue — Job Embed
// Body: { job_id, combined_text }
// ---------------------------------------------------------------------------
app.post("/queue/job-embed", async (req, res) => {
  const { job_id, combined_text } = req.body;

  if (!job_id || !combined_text) {
    return res.status(400).json({ error: "job_id and combined_text are required" });
  }

  try {
    const job = await jobEmbedQueue.add(
      "embed-job",
      { job_id, combined_text },
      {
        jobId: `embed-${job_id}`,
        priority: 3,
      }
    );

    console.log(`[Server] Enqueued job-embed job ${job.id} for job_id=${job_id}`);
    return res.status(202).json({
      task_id: job.id,
      status: "queued",
      queue: QUEUE_NAMES.JOB_EMBED,
    });
  } catch (err) {
    console.error("[Server] Failed to enqueue job-embed:", err.message);
    return res.status(500).json({ error: "Failed to enqueue job", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Task Status — GET /queue/:name/status/:id
// Returns the current state and progress of a BullMQ job.
// ---------------------------------------------------------------------------
app.get("/queue/:name/status/:id", async (req, res) => {
  const { name, id } = req.params;
  const queue = queues[name];

  if (!queue) {
    return res.status(404).json({
      error: `Unknown queue: ${name}. Valid queues: ${Object.values(QUEUE_NAMES).join(", ")}`,
    });
  }

  try {
    const job = await queue.getJob(id);
    if (!job) {
      return res.status(404).json({ error: `Job ${id} not found in queue ${name}` });
    }

    const state = await job.getState(); // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
    const progress = job.progress || 0;

    const response = {
      task_id: job.id,
      queue: name,
      state,
      progress,
      created_at: new Date(job.timestamp).toISOString(),
    };

    if (state === "completed") {
      response.result = job.returnvalue;
      response.completed_at = new Date(job.finishedOn).toISOString();
    }

    if (state === "failed") {
      response.error = job.failedReason;
      response.attempts = job.attemptsMade;
    }

    return res.json(response);
  } catch (err) {
    console.error(`[Server] Status check error for job ${id}:`, err.message);
    return res.status(500).json({ error: "Failed to fetch job status" });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
export function startServer() {
  return new Promise((resolve) => {
    app.listen(config.server.port, () => {
      console.log(
        `[Server] 🚀 Worker HTTP server running on port ${config.server.port}`
      );
      console.log(
        `[Server]    Health: http://localhost:${config.server.port}/health`
      );
      resolve();
    });
  });
}

export default app;
