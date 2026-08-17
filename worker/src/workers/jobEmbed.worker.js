// ============================================================
// CareerPilot Worker — Job Embed Worker
// BullMQ consumer for the "job-embed" queue.
//
// Job data shape (sent by Python FastAPI):
//   { job_id, combined_text }
//   combined_text = "Title\nDescription\nSkills: Python, React, ..."
//
// Processing pipeline:
//   1. Generate 768-dim Gemini embedding for job text
//   2. Update jobs.embedding column in PostgreSQL (pgvector)
// ============================================================

import { Worker } from "bullmq";
import { config } from "../config.js";
import { QUEUE_NAMES } from "../queues/names.js";
import { embedText } from "../utils/gemini.js";
import { query } from "../utils/database.js";

// ---------------------------------------------------------------------------
// Worker processor function
// ---------------------------------------------------------------------------
async function processJobEmbedJob(job) {
  const { job_id, combined_text } = job.data;
  console.log(`[JobEmbedWorker] Processing job ${job.id} — job_id=${job_id}`);

  await job.updateProgress(20);

  // Step 1: Generate embedding
  let embedding;
  try {
    embedding = await embedText(combined_text);
    console.log(
      `[JobEmbedWorker] Generated embedding dim=${embedding.length} for job_id=${job_id}`
    );
  } catch (err) {
    throw new Error(`Gemini embedding failed for job ${job_id}: ${err.message}`);
  }

  await job.updateProgress(70);

  // Step 2: Update jobs table with the new embedding vector
  // pgvector accepts '[1.0,2.0,...,768.0]' literal format
  const embeddingLiteral = `[${embedding.join(",")}]`;

  await query(
    `UPDATE jobs SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
    [embeddingLiteral, job_id]
  );

  console.log(`[JobEmbedWorker] ✅ Embedding saved for job_id=${job_id}`);
  await job.updateProgress(100);

  return { job_id, embedding_dim: embedding.length, status: "complete" };
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------
export function startJobEmbedWorker() {
  const worker = new Worker(QUEUE_NAMES.JOB_EMBED, processJobEmbedJob, {
    connection: config.redis,
    concurrency: 8, // Embedding is faster than full parse, can handle more concurrency
    limiter: {
      max: 20,
      duration: 10_000,
    },
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[JobEmbedWorker] ✅ Job ${job.id} completed — job_id=${result.job_id}, dim=${result.embedding_dim}`
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[JobEmbedWorker] ❌ Job ${job?.id} failed for job_id=${job?.data?.job_id}: ${err.message}`
    );
  });

  worker.on("error", (err) => {
    console.error("[JobEmbedWorker] Worker error:", err.message);
  });

  console.log(
    `[JobEmbedWorker] 🚀 Started — listening on queue "${QUEUE_NAMES.JOB_EMBED}"`
  );
  return worker;
}
