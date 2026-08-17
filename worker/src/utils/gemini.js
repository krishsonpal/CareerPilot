// ============================================================
// CareerPilot Worker — Google Gemini AI Utility
// Wraps @google/genai SDK for embedding + structured LLM calls.
// Uses the same models as the Python FastAPI backend for
// consistent 768-dim vectors and JSON-mode responses.
// ============================================================

import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";

let client = null;

/**
 * Returns a shared Gemini client (lazy init).
 * @returns {GoogleGenAI}
 */
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    console.log(
      `[Gemini] Client initialised — LLM: ${config.gemini.llmModel}, Embed: ${config.gemini.embeddingModel}`
    );
  }
  return client;
}

/**
 * Generate a 768-dim embedding vector for a text string.
 * Uses Gemini Embedding model (text-embedding-004 / gemini-embedding-001).
 *
 * @param {string} text - Input text to embed
 * @returns {Promise<number[]>} 768-dimensional float array
 */
export async function embedText(text) {
  const ai = getClient();
  const response = await ai.models.embedContent({
    model: config.gemini.embeddingModel,
    contents: text,
    config: { outputDimensionality: config.gemini.embeddingDim },
  });
  const vector = response.embeddings[0].values;
  if (!vector || vector.length === 0) {
    throw new Error("[Gemini] embedText: received empty embedding vector");
  }
  return vector;
}

/**
 * Call Gemini LLM and parse a structured JSON response.
 * Uses JSON response mode (response_mime_type=application/json) for reliability.
 *
 * @param {string} prompt        - Full prompt instructing the model to respond in JSON
 * @param {number} [temperature] - Sampling temperature (default 0.1 for deterministic output)
 * @returns {Promise<object>}    - Parsed JSON object
 */
export async function extractJSON(prompt, temperature = 0.1) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: config.gemini.llmModel,
    contents: prompt,
    config: {
      temperature,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  let raw = response.text?.trim() || "";

  // Strip markdown code fences if present (some models include them)
  if (raw.startsWith("```")) {
    const parts = raw.split("```");
    raw = parts[1] || parts[0];
    if (raw.startsWith("json")) raw = raw.slice(4);
    raw = raw.trim();
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Gemini] extractJSON parse error. Raw response:", raw.slice(0, 500));
    throw new Error(`Gemini did not return valid JSON: ${err.message}`);
  }
}

/**
 * Standard chat completion — returns a plain text response.
 *
 * @param {string} prompt       - Full prompt text
 * @param {number} [temperature]- Sampling temperature
 * @returns {Promise<string>}   - Generated text
 */
export async function chatComplete(prompt, temperature = 0.3) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: config.gemini.llmModel,
    contents: prompt,
    config: { temperature, maxOutputTokens: 2048 },
  });
  return (response.text || "").trim();
}
