import pg from "pg";
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in process.env");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
      process.exit(-1);
    });
  }
  return pool;
}

/**
 * Execute a parameterized SQL query.
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export function query(text, params) {
  return getPool().query(text, params);
}

/**
 * Get a client from the pool for transactions.
 * Remember to call client.release() when done.
 */
export function getClient() {
  return getPool().connect();
}

export default {
  query,
  getClient
};
