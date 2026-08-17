// ============================================================
// CareerPilot Worker — Match Score Worker
// BullMQ consumer for the "match-score" queue.
//
// Job data shape (sent by Python FastAPI):
//   { user_id, job_id, application_id }
//
// Processing pipeline:
//   1. Fetch candidate resume profile from PostgreSQL
//   2. Fetch job details from PostgreSQL
//   3. Call Gemini to compute AI match score (0-100)
//   4. Update applications table with score + skill arrays
// ============================================================

import { Worker } from "bullmq";
import { config } from "../config.js";
import { QUEUE_NAMES } from "../queues/names.js";
import { extractJSON } from "../utils/gemini.js";
import { query } from "../utils/database.js";

// ---------------------------------------------------------------------------
// Gemini prompt for match score computation
// ---------------------------------------------------------------------------
const MATCH_SCORE_PROMPT = ({ jobTitle, jobDescription, jobSkills, candidateSummary, candidateSkills, candidateExperience }) => `
You are an expert technical recruiter evaluating a candidate for a job opening.

Job Details:
Title: ${jobTitle}
Required Skills: ${jobSkills}
Description: ${jobDescription.slice(0, 1000)}

Candidate Profile:
Professional Summary: ${candidateSummary}
Skills: ${candidateSkills}
Experience: ${candidateExperience.slice(0, 800)}

Evaluate the candidate-job fit and respond with ONLY a JSON object:
{
  "score": 78.5,
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": ["Kubernetes", "Go"]
}

Rules:
- score must be a float between 0.0 and 100.0
- matched_skills: exact skills from the job requirements that the candidate demonstrably has
- missing_skills: exact skills from job requirements that the candidate lacks
- Be precise and realistic — don't overrate or underrate
`;

// ---------------------------------------------------------------------------
// Worker processor function
// ---------------------------------------------------------------------------
async function processMatchScoreJob(job) {
  const { user_id, job_id, application_id } = job.data;
  console.log(
    `[MatchScoreWorker] Processing job ${job.id} — application=${application_id}`
  );

  await job.updateProgress(10);

  // Step 1: Fetch resume profile
  const profileResult = await query(
    `SELECT summary, skills, experience FROM resume_profiles WHERE user_id = $1`,
    [user_id]
  );
  if (profileResult.rows.length === 0) {
    throw new Error(`Resume profile not found for user=${user_id}`);
  }
  const profile = profileResult.rows[0];

  await job.updateProgress(25);

  // Step 2: Fetch job details
  const jobResult = await query(
    `SELECT title, description, skills_required FROM jobs WHERE id = $1`,
    [job_id]
  );
  if (jobResult.rows.length === 0) {
    throw new Error(`Job not found for id=${job_id}`);
  }
  const jobData = jobResult.rows[0];

  await job.updateProgress(40);

  // Step 3: Compute match score via Gemini
  let matchResult;
  try {
    matchResult = await extractJSON(
      MATCH_SCORE_PROMPT({
        jobTitle: jobData.title,
        jobDescription: jobData.description,
        jobSkills: (jobData.skills_required || []).join(", "),
        candidateSummary: profile.summary,
        candidateSkills: (profile.skills || []).join(", "),
        candidateExperience: JSON.stringify(profile.experience || []),
      })
    );
  } catch (err) {
    throw new Error(`Gemini match scoring failed: ${err.message}`);
  }

  const score = parseFloat(matchResult.score || 0);
  const matchedSkills = Array.isArray(matchResult.matched_skills)
    ? matchResult.matched_skills.map(String)
    : [];
  const missingSkills = Array.isArray(matchResult.missing_skills)
    ? matchResult.missing_skills.map(String)
    : [];

  console.log(
    `[MatchScoreWorker] Score=${score}, matched=${matchedSkills.length}, missing=${missingSkills.length}`
  );

  await job.updateProgress(80);

  // Step 4: Update application record with computed score
  await query(
    `UPDATE applications
     SET match_score     = $1,
         matched_skills  = $2,
         missing_skills  = $3,
         status          = CASE WHEN status = 'processing' THEN 'applied' ELSE status END,
         updated_at      = NOW()
     WHERE id = $4`,
    [score, matchedSkills, missingSkills, application_id]
  );

  console.log(
    `[MatchScoreWorker] ✅ Application ${application_id} updated with score=${score}`
  );
  await job.updateProgress(100);

  return { application_id, score, matched_skills: matchedSkills, missing_skills: missingSkills };
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------
export function startMatchScoreWorker() {
  const worker = new Worker(QUEUE_NAMES.MATCH_SCORE, processMatchScoreJob, {
    connection: config.redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 10_000,
    },
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[MatchScoreWorker] ✅ Job ${job.id} completed — score=${result.score}`
    );
  });

  worker.on("failed", async (job, err) => {
    console.error(
      `[MatchScoreWorker] ❌ Job ${job?.id} failed: ${err.message}`
    );
    // On failure, set score to 0 so application is not stuck in "processing"
    if (job?.data?.application_id) {
      await query(
        `UPDATE applications
         SET match_score = 0, status = CASE WHEN status = 'processing' THEN 'applied' ELSE status END
         WHERE id = $1`,
        [job.data.application_id]
      ).catch((dbErr) =>
        console.error(
          "[MatchScoreWorker] Failed to update application on error:",
          dbErr.message
        )
      );
    }
  });

  worker.on("error", (err) => {
    console.error("[MatchScoreWorker] Worker error:", err.message);
  });

  console.log(
    `[MatchScoreWorker] 🚀 Started — listening on queue "${QUEUE_NAMES.MATCH_SCORE}"`
  );
  return worker;
}
