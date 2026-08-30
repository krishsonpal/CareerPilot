// ============================================================
// CareerPilot Worker — PDF Text Extraction Utility
// Uses pdf-parse to extract raw text from PDF resume files.
// Falls back to empty string on parse errors so the
// resume worker can still attempt Gemini summarisation.
//
// Production note: When deployed on Render, `file_path` in the
// BullMQ job payload may be a Cloudinary HTTPS URL instead of a
// local path. Use extractResumeText() which handles both cases.
// ============================================================

import fs from "fs";
import os from "os";
import path from "path";
import https from "https";
import http from "http";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

// ---------------------------------------------------------------------------
// Core extractors (local disk)
// ---------------------------------------------------------------------------

/**
 * Extract plain text from a PDF file on disk.
 *
 * @param {string} filePath - Absolute or relative path to the PDF file
 * @returns {Promise<string>} Extracted text (may be empty for image-only PDFs)
 */
export async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return result.text?.trim() || "";
}

/**
 * Extract plain text from a TXT file on disk.
 *
 * @param {string} filePath - Absolute path to the text file
 * @returns {string} Raw file contents
 */
export function extractTextFromTXT(filePath) {
  return fs.readFileSync(filePath, "utf-8").trim();
}

// ---------------------------------------------------------------------------
// URL download helper (used in production on Render)
// ---------------------------------------------------------------------------

/**
 * Download a file from an HTTPS/HTTP URL to a temp path on disk.
 * Returns the temp file path. Caller is responsible for cleanup.
 *
 * @param {string} url    - Full HTTPS URL (e.g. Cloudinary secure URL)
 * @param {string} ext    - File extension including dot (e.g. ".pdf")
 * @returns {Promise<string>} Absolute path to the downloaded temp file
 */
function downloadToTemp(url, ext = ".pdf") {
  return new Promise((resolve, reject) => {
    const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}${ext}`);
    const file = fs.createWriteStream(tmpPath);
    const client = url.startsWith("https://") ? https : http;

    client
      .get(url, (response) => {
        // Follow redirects (Cloudinary may redirect once)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlink(tmpPath, () => {});
          return downloadToTemp(response.headers.location, ext).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(tmpPath, () => {});
          return reject(new Error(`Download failed: HTTP ${response.statusCode} for ${url}`));
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(tmpPath));
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(tmpPath, () => {});
        reject(new Error(`Network error downloading resume: ${err.message}`));
      });
  });
}

// ---------------------------------------------------------------------------
// Smart dispatcher — handles both local paths and remote URLs
// ---------------------------------------------------------------------------

/**
 * Dispatch extraction based on file source.
 *
 * Handles:
 *   - Local paths:  "/app/static/resumes/user_resume.pdf"
 *   - Remote URLs:  "https://res.cloudinary.com/.../resume.pdf"
 *
 * In production on Render, file_path will be a Cloudinary URL because
 * FastAPI and the Node.js worker run on separate machines without a
 * shared disk. The URL is downloaded to /tmp before extraction.
 *
 * @param {string} filePathOrUrl - Local path OR HTTPS URL to the resume file
 * @returns {Promise<string>} Extracted raw text
 */
export async function extractResumeText(filePathOrUrl) {
  const isUrl =
    filePathOrUrl.startsWith("http://") || filePathOrUrl.startsWith("https://");

  if (isUrl) {
    // Determine extension from URL (default to .pdf)
    const urlPath = new URL(filePathOrUrl).pathname;
    const ext = path.extname(urlPath).toLowerCase() || ".pdf";

    console.log(`[pdf.js] Downloading resume from URL: ${filePathOrUrl}`);
    const tmpPath = await downloadToTemp(filePathOrUrl, ext);

    try {
      const text = await extractFromLocalPath(tmpPath);
      return text;
    } finally {
      // Always clean up temp file
      fs.unlink(tmpPath, () => {});
    }
  }

  return extractFromLocalPath(filePathOrUrl);
}

/**
 * Extract text from a local file path (PDF or TXT).
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractFromLocalPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return extractTextFromPDF(filePath);
  } else if (lower.endsWith(".txt")) {
    return extractTextFromTXT(filePath);
  } else {
    throw new Error(
      `Unsupported file type for path: ${filePath}. Only .pdf and .txt are accepted.`
    );
  }
}
