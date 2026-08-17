// ============================================================
// CareerPilot Worker — Main Entry Point
// Starts the Express HTTP server + all three BullMQ workers.
//
// Architecture:
//   Python FastAPI  →  HTTP POST  →  Express server  →  BullMQ Queue  →  Worker
//
// Run:
//   node src/index.js          (production)
//   node --watch src/index.js  (development)
// ============================================================

import "dotenv/config";
import { startServer } from "./server.js";
import { startResumeWorker } from "./workers/resume.worker.js";
import { startMatchScoreWorker } from "./workers/matchScore.worker.js";
import { startJobEmbedWorker } from "./workers/jobEmbed.worker.js";
import { config } from "./config.js";

// ---------------------------------------------------------------------------
// Validation — fail fast if critical env vars are missing
// ---------------------------------------------------------------------------
function validateConfig() {
  const required = [
    ["GOOGLE_API_KEY", config.gemini.apiKey],
    ["DATABASE_URL", config.database.connectionString],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `[Startup] ❌ Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("[Startup]    Copy worker/.env.example to worker/.env and fill in the values.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
let workers = [];
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Shutdown] Received ${signal} — draining workers gracefully...`);

  // Give active jobs up to 30 seconds to finish
  await Promise.all(
    workers.map((w) =>
      w.close().catch((err) =>
        console.error("[Shutdown] Worker close error:", err.message)
      )
    )
  );

  console.log("[Shutdown] ✅ All workers stopped. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CareerPilot Worker Service — Starting up");
  console.log(`  Redis:   ${config.redis.host}:${config.redis.port}`);
  console.log(`  Server:  http://localhost:${config.server.port}`);
  console.log("═══════════════════════════════════════════════════════");

  validateConfig();

  // Start the Express HTTP server (accepts job submissions from Python)
  await startServer();

  // Start all BullMQ workers
  workers = [
    startResumeWorker(),
    startMatchScoreWorker(),
    startJobEmbedWorker(),
  ];

  console.log("\n[Startup] ✅ All workers running. Waiting for jobs...");
  console.log("[Startup]    Queues: resume-parse | match-score | job-embed");
}

main().catch((err) => {
  console.error("[Startup] Fatal error:", err);
  process.exit(1);
});
