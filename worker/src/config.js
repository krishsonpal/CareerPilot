// ============================================================
// CareerPilot Worker — Configuration
// Reads all settings from environment variables (.env)
//
// Redis: Supports both REDIS_URL (Upstash, production) and
//        individual REDIS_HOST/PORT/PASSWORD (local dev).
// ============================================================

import "dotenv/config";

/**
 * Build the ioredis connection config from environment variables.
 *
 * Priority:
 *   1. REDIS_URL  — full connection string (Upstash production format)
 *                   e.g. rediss://default:password@host.upstash.io:6380
 *   2. REDIS_HOST + REDIS_PORT + REDIS_PASSWORD — local dev / custom Redis
 *
 * BullMQ requires maxRetriesPerRequest: null.
 */
function buildRedisConfig() {
  if (process.env.REDIS_URL) {
    // Upstash / production: parse from URL
    const url = new URL(process.env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || "6380", 10),
      password: url.password || undefined,
      username: url.username && url.username !== "default" ? url.username : undefined,
      tls: url.protocol === "rediss:" ? {} : undefined, // TLS for rediss://
      maxRetriesPerRequest: null, // Required by BullMQ
    };
  }

  // Local dev: individual env vars
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
  };
}

export const config = {
  // Redis connection (BullMQ uses ioredis under the hood)
  redis: buildRedisConfig(),

  // Neon DB / PostgreSQL connection
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
  },

  // Google Gemini API
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY,
    llmModel: process.env.GEMINI_LLM_MODEL || "gemini-2.0-flash",
    embeddingModel:
      process.env.GEMINI_EMBEDDING_MODEL || "models/gemini-embedding-001",
    embeddingDim: parseInt(process.env.GEMINI_EMBEDDING_DIM || "768", 10),
  },

  // HTTP server port (accepts job enqueue requests from Python FastAPI)
  server: {
    port: parseInt(process.env.WORKER_PORT || "3001", 10),
  },

  // Python FastAPI base URL (for internal callbacks if needed)
  api: {
    baseUrl: process.env.API_BASE_URL || "http://localhost:8000",
  },
};
