/**
 * Progress Routes
 * GET    /api/progress        — Get all solved problem IDs
 * POST   /api/progress/toggle — Toggle a problem's solved status
 * POST   /api/progress/reset  — Reset all progress
 * POST   /api/progress/sync   — Bulk sync from localStorage migration
 */

import { Router } from "express";
import { query, getClient } from "../db.js";

const router = Router();

/**
 * Helper: get internal user ID from Firebase UID
 */
async function getUserId(firebaseUid) {
  const result = await query(
    "SELECT id FROM users WHERE firebase_uid = $1",
    [firebaseUid]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].id;
}

/**
 * GET /api/progress
 * Returns all solved problem IDs for the authenticated user.
 */
router.get("/", async (req, res, next) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.json({ solvedIds: [] });

    const result = await query(
      "SELECT problem_id FROM user_progress WHERE user_id = $1 ORDER BY solved_at",
      [userId]
    );

    res.json({ solvedIds: result.rows.map((r) => r.problem_id) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/progress/toggle
 * Body: { problemId: number }
 * Toggles a problem — inserts if not solved, deletes if already solved.
 */
router.post("/toggle", async (req, res, next) => {
  try {
    const { problemId } = req.body;
    if (problemId === undefined || problemId === null) {
      return res.status(400).json({ error: "problemId is required" });
    }

    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    // Check if already solved
    const existing = await query(
      "SELECT id FROM user_progress WHERE user_id = $1 AND problem_id = $2",
      [userId, problemId]
    );

    let solved;
    if (existing.rows.length > 0) {
      // Un-solve
      await query(
        "DELETE FROM user_progress WHERE user_id = $1 AND problem_id = $2",
        [userId, problemId]
      );
      solved = false;
    } else {
      // Mark as solved
      await query(
        "INSERT INTO user_progress (user_id, problem_id) VALUES ($1, $2)",
        [userId, problemId]
      );
      solved = true;
    }

    res.json({ problemId, solved });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/progress/reset
 * Deletes all progress for the authenticated user.
 */
router.post("/reset", async (req, res, next) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    await query("DELETE FROM user_progress WHERE user_id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/progress/sync
 * Body: { solvedIds: number[] }
 * Bulk sync — used to migrate localStorage data to the backend.
 * Inserts all IDs that don't already exist (idempotent).
 */
router.post("/sync", async (req, res, next) => {
  const client = await getClient();
  try {
    const { solvedIds } = req.body;
    if (!Array.isArray(solvedIds)) {
      return res.status(400).json({ error: "solvedIds must be an array" });
    }

    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    await client.query("BEGIN");

    for (const problemId of solvedIds) {
      await client.query(
        `INSERT INTO user_progress (user_id, problem_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, problem_id) DO NOTHING`,
        [userId, problemId]
      );
    }

    await client.query("COMMIT");

    res.json({ synced: solvedIds.length });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
