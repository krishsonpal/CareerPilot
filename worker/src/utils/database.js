// ============================================================
// CareerPilot Worker — PostgreSQL Database Utility
// Thin wrapper around node-postgres (pg) for DB operations.
// ============================================================

import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

let pool = null;

/**
 * Returns a shared PostgreSQL connection pool.
 * Lazily initialised on first call.
 * @returns {pg.Pool}
 */
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database.connectionString,
      ssl: config.database.ssl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err.message);
    });

    console.log("[DB] PostgreSQL pool initialised");
  }
  return pool;
}

/**
 * Execute a parameterised SQL query.
 * @param {string} text   - SQL query string
 * @param {any[]}  params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[DB] Slow query (${duration}ms): ${text.slice(0, 80)}...`);
    }
    return result;
  } catch (err) {
    console.error("[DB] Query error:", err.message);
    console.error("[DB] Query:", text.slice(0, 200));
    throw err;
  }
}
