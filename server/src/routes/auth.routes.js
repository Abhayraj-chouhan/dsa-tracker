/**
 * Auth Routes
 * POST /api/auth/sync — Upsert user after Firebase login, return user data + progress + connections
 */

import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * POST /api/auth/sync
 * Called from frontend right after Firebase login.
 * Upserts the user record and returns their saved progress + platform connections.
 */
router.post("/sync", async (req, res, next) => {
  try {
    const { uid, email, name, picture } = req.user;

    // Upsert user
    const upsertResult = await query(
      `INSERT INTO users (firebase_uid, display_name, email, photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         email = COALESCE(EXCLUDED.email, users.email),
         photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
         updated_at = NOW()
       RETURNING id, firebase_uid, display_name, email, photo_url`,
      [uid, name, email, picture]
    );

    const dbUser = upsertResult.rows[0];

    // Load solved problem IDs
    const progressResult = await query(
      "SELECT problem_id FROM user_progress WHERE user_id = $1",
      [dbUser.id]
    );
    const solvedIds = progressResult.rows.map((r) => r.problem_id);

    // Load platform connections
    const connectionsResult = await query(
      "SELECT platform, username FROM platform_connections WHERE user_id = $1",
      [dbUser.id]
    );
    const connections = {};
    connectionsResult.rows.forEach((r) => {
      connections[r.platform] = r.username;
    });

    // Load cached platform stats
    const statsResult = await query(
      "SELECT platform, stats_json, fetched_at FROM platform_stats_cache WHERE user_id = $1",
      [dbUser.id]
    );
    const cachedStats = {};
    statsResult.rows.forEach((r) => {
      cachedStats[r.platform] = {
        stats: r.stats_json,
        fetchedAt: r.fetched_at,
      };
    });

    res.json({
      user: {
        id: dbUser.id,
        firebaseUid: dbUser.firebase_uid,
        displayName: dbUser.display_name,
        email: dbUser.email,
        photoUrl: dbUser.photo_url,
      },
      solvedIds,
      connections,
      cachedStats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
