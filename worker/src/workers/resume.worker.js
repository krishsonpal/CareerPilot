// ============================================================
// CareerPilot Worker — Resume Parse Worker
// BullMQ consumer for the "resume-parse" queue.
//
// Job data shape (sent by Python FastAPI):
//   { user_id, file_path, resume_url }
//
// Processing pipeline:
//   1. Extract text from PDF/TXT file on disk
//   2. Call Gemini to extract structured JSON profile
//   3. Call Gemini to generate 768-dim embedding vector
//   4. Upsert result into resume_profiles table (PostgreSQL)
//   5. Update processing_status = 'ready'
// ============================================================

import { Worker } from "bullmq";
import { config } from "../config.js";
import { QUEUE_NAMES } from "../queues/names.js";
import { extractResumeText } from "../utils/pdf.js";
import { embedText, extractJSON } from "../utils/gemini.js";
import { query } from "../utils/database.js";

// ---------------------------------------------------------------------------
// Gemini prompt for structured resume extraction
// ---------------------------------------------------------------------------
const RESUME_PARSE_PROMPT = (rawText) => `
You are a professional resume parser. Extract structured information from the following resume text.

Resume text:
---
${rawText.slice(0, 8000)}
---

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "A professional 2-3 sentence summary of the candidate's profile, skills, and experience",
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    {
      "degree": "Bachelor of Technology",
      "institution": "University Name",
      "year": "2024",
      "gpa": "8.5"
    }
  ],
  "experience": [
    {
      "title": "Software Engineer Intern",
      "company": "Company Name",
      "duration": "June 2023 - August 2023",
      "description": "Brief description of responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does",
      "tech_stack": ["React", "Node.js", "MongoDB"],
      "link": "https://github.com/..."
    }
  ]
}

Rules:
- skills must be individual technology/tool names (e.g., "Python", "React", "AWS")
- All arrays can be empty [] if not found
- summary should highlight the strongest points
- Return ONLY the JSON, no extra text
`;

// ---------------------------------------------------------------------------
// Worker processor function
// ---------------------------------------------------------------------------
async function processResumeJob(job) {
  const { user_id, file_path, resume_url } = job.data;
  console.log(`[ResumeWorker] Processing job ${job.id} for user=${user_id}`);

  await job.updateProgress(10);

  // Step 1: Mark resume profile as processing
  await query(
    `UPDATE resume_profiles SET processing_status = 'processing' WHERE user_id = $1`,
    [user_id]
  );

  // Step 2: Extract raw text from file
  let rawText = "";
  try {
    rawText = await extractResumeText(file_path);
    if (!rawText || rawText.length < 50) {
      throw new Error("Extracted text is too short — possibly a scanned/image-only PDF");
    }
    console.log(`[ResumeWorker] Extracted ${rawText.length} chars from ${file_path}`);
  } catch (err) {
    throw new Error(`Text extraction failed: ${err.message}`);
  }

  await job.updateProgress(30);

  // Step 3: Parse structured profile via Gemini
  let profile;
  try {
    profile = await extractJSON(RESUME_PARSE_PROMPT(rawText));
    console.log(
      `[ResumeWorker] Parsed profile — skills: ${profile.skills?.length}, experience: ${profile.experience?.length}`
    );
  } catch (err) {
    throw new Error(`Gemini resume parsing failed: ${err.message}`);
  }

  await job.updateProgress(60);

  // Step 4: Generate 768-dim embedding from the summary
  let embedding;
  try {
    const embedInput = `${profile.summary}\nSkills: ${(profile.skills || []).join(", ")}`;
    embedding = await embedText(embedInput);
    console.log(`[ResumeWorker] Generated embedding dim=${embedding.length}`);
  } catch (err) {
    throw new Error(`Gemini embedding failed: ${err.message}`);
  }

  await job.updateProgress(85);

  // Step 5: Upsert into resume_profiles table
  // Convert embedding array to pgvector literal: '[1.0,2.0,...]'
  const embeddingLiteral = `[${embedding.join(",")}]`;

  await query(
    `INSERT INTO resume_profiles
       (user_id, raw_text, summary, skills, education, experience, projects, embedding, resume_url, processing_status, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9, 'ready', NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       raw_text          = EXCLUDED.raw_text,
       summary           = EXCLUDED.summary,
       skills            = EXCLUDED.skills,
       education         = EXCLUDED.education,
       experience        = EXCLUDED.experience,
       projects          = EXCLUDED.projects,
       embedding         = EXCLUDED.embedding,
       resume_url        = EXCLUDED.resume_url,
       processing_status = 'ready',
       last_updated      = NOW()`,
    [
      user_id,
      rawText,
      profile.summary || "",
      profile.skills || [],
      JSON.stringify(profile.education || []),
      JSON.stringify(profile.experience || []),
      JSON.stringify(profile.projects || []),
      embeddingLiteral,
      resume_url,
    ]
  );

  console.log(`[ResumeWorker] ✅ Resume profile saved for user=${user_id}`);
  await job.updateProgress(100);

  return {
    user_id,
    skills_count: (profile.skills || []).length,
    summary_length: (profile.summary || "").length,
    status: "complete",
  };
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------
export function startResumeWorker() {
  const worker = new Worker(QUEUE_NAMES.RESUME_PARSE, processResumeJob, {
    connection: config.redis,
    concurrency: 3, // Process up to 3 resumes concurrently
    limiter: {
      max: 5,
      duration: 10_000, // Max 5 Gemini calls per 10 seconds (rate limiting)
    },
  });

  worker.on("completed", (job, result) => {
    console.log(`[ResumeWorker] ✅ Job ${job.id} completed — user=${result.user_id}`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[ResumeWorker] ❌ Job ${job?.id} failed: ${err.message}`);
    // Mark resume as failed in DB
    if (job?.data?.user_id) {
      await query(
        `UPDATE resume_profiles SET processing_status = 'failed' WHERE user_id = $1`,
        [job.data.user_id]
      ).catch((dbErr) =>
        console.error("[ResumeWorker] Failed to update status:", dbErr.message)
      );
    }
  });

  worker.on("error", (err) => {
    console.error("[ResumeWorker] Worker error:", err.message);
  });

  console.log(`[ResumeWorker] 🚀 Started — listening on queue "${QUEUE_NAMES.RESUME_PARSE}"`);
  return worker;
}
