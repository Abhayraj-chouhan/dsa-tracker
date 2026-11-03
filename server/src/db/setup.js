/**
 * Database Setup Script
 * Run with: npm run db:setup
 *
 * Creates the dsa_tracker database (if needed) and all required tables.
 */

import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env");
  process.exit(1);
}

// Parse the connection URL to extract db name
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1); // remove leading "/"
const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`;

async function createDatabaseIfNotExists() {
  const adminPool = new Pool({ connectionString: adminUrl });
  try {
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (result.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function createTables() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  const sql = `
    -- Users table (synced from Firebase Auth)
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      firebase_uid  VARCHAR(128) UNIQUE NOT NULL,
      display_name  VARCHAR(255),
      email         VARCHAR(255),
      photo_url     TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    -- Index for fast lookups by Firebase UID
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

    -- User progress: which problems each user has solved
    CREATE TABLE IF NOT EXISTS user_progress (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id  INTEGER NOT NULL,
      solved_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, problem_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

    -- Platform connections: linked usernames for LeetCode, Codeforces, GFG
    CREATE TABLE IF NOT EXISTS platform_connections (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform  VARCHAR(20) NOT NULL,  -- 'leetcode', 'codeforces', 'gfg'
      username  VARCHAR(100) NOT NULL,
      linked_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, platform)
    );

    CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON platform_connections(user_id);

    -- Platform stats cache: cached API responses to avoid hammering external APIs
    CREATE TABLE IF NOT EXISTS platform_stats_cache (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform    VARCHAR(20) NOT NULL,
      stats_json  JSONB NOT NULL DEFAULT '{}',
      fetched_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, platform)
    );

    CREATE INDEX IF NOT EXISTS idx_platform_stats_cache_user_id ON platform_stats_cache(user_id);
  `;

  try {
    await pool.query(sql);
    console.log("✅ All tables created successfully.");
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("🚀 Setting up DSA Tracker database...\n");

  try {
    await createDatabaseIfNotExists();
    await createTables();
    console.log("\n🎉 Database setup complete!");
  } catch (err) {
    console.error("\n❌ Setup failed:", err.message);
    process.exit(1);
  }
}

main();
