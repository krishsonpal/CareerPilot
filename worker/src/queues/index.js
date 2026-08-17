// ============================================================
// CareerPilot Worker — BullMQ Queue Definitions
// Creates Queue instances that the Express HTTP server uses
// to add jobs received from the Python FastAPI backend.
// ============================================================

import { Queue } from "bullmq";
import { config } from "../config.js";
import { QUEUE_NAMES } from "./names.js";

const connection = config.redis;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000, // Start with 2s, then 4s, 8s
  },
  removeOnComplete: {
    age: 60 * 60 * 24, // Keep completed jobs for 24 hours
    count: 500,
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 7, // Keep failed jobs for 7 days for debugging
  },
};

// Queue for parsing and embedding uploaded candidate resumes
export const resumeParseQueue = new Queue(QUEUE_NAMES.RESUME_PARSE, {
  connection,
  defaultJobOptions,
});

// Queue for computing AI match scores between candidates and jobs
export const matchScoreQueue = new Queue(QUEUE_NAMES.MATCH_SCORE, {
  connection,
  defaultJobOptions,
});

// Queue for generating vector embeddings for new or updated job postings
export const jobEmbedQueue = new Queue(QUEUE_NAMES.JOB_EMBED, {
  connection,
  defaultJobOptions,
});

// Convenience map for the HTTP server route handler
export const queues = {
  [QUEUE_NAMES.RESUME_PARSE]: resumeParseQueue,
  [QUEUE_NAMES.MATCH_SCORE]: matchScoreQueue,
  [QUEUE_NAMES.JOB_EMBED]: jobEmbedQueue,
};
