// ============================================================
// CareerPilot Worker — PDF Text Extraction Utility
// Uses pdf-parse to extract raw text from PDF resume files.
// Falls back to empty string on parse errors so the
// resume worker can still attempt Gemini summarisation.
// ============================================================

import fs from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

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

/**
 * Dispatch extraction based on file extension.
 * Supports .pdf and .txt files.
 *
 * @param {string} filePath - Path to the resume file
 * @returns {Promise<string>} Extracted raw text
 */
export async function extractResumeText(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return extractTextFromPDF(filePath);
  } else if (lower.endsWith(".txt")) {
    return extractTextFromTXT(filePath);
  } else {
    throw new Error(`Unsupported file type for path: ${filePath}. Only .pdf and .txt are accepted.`);
  }
}
