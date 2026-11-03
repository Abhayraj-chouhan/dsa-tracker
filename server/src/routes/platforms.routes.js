/**
 * Platform Connection Routes
 * GET    /api/platforms              — Get connected platforms
 * POST   /api/platforms/connect      — Connect a platform
 * DELETE /api/platforms/:platform    — Disconnect a platform
 * GET    /api/platforms/:platform/stats — Get stats (cached or fresh)
 */

import { Router } from "express";
import { query } from "../db.js";
import { fetchPlatformStats } from "../services/platformFetcher.js";

const router = Router();

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getUserId(firebaseUid) {
  const result = await query(
    "SELECT id FROM users WHERE firebase_uid = $1",
    [firebaseUid]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].id;
}

/**
 * GET /api/platforms
 * Returns all connected platforms and usernames for the authenticated user.
 */
router.get("/", async (req, res, next) => {
  try {
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.json({ connections: {} });

    const result = await query(
      "SELECT platform, username FROM platform_connections WHERE user_id = $1",
      [userId]
    );

    const connections = {};
    result.rows.forEach((r) => {
      connections[r.platform] = r.username;
    });

    res.json({ connections });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/platforms/connect
 * Body: { platform: string, username: string }
 * Connects a platform, fetches stats, and caches them.
 */
router.post("/connect", async (req, res, next) => {
  try {
    const { platform, username } = req.body;

    if (!platform || !username) {
      return res.status(400).json({ error: "platform and username are required" });
    }

    const validPlatforms = ["leetcode", "codeforces", "gfg"];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` });
    }

    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    // Upsert the platform connection
    await query(
      `INSERT INTO platform_connections (user_id, platform, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET username = EXCLUDED.username, linked_at = NOW()`,
      [userId, platform, username.trim()]
    );

    // Fetch fresh stats from the platform
    let stats = null;
    let error = null;
    try {
      stats = await fetchPlatformStats(platform, username.trim());

      // Cache the stats
      await query(
        `INSERT INTO platform_stats_cache (user_id, platform, stats_json, fetched_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, platform)
         DO UPDATE SET stats_json = EXCLUDED.stats_json, fetched_at = NOW()`,
        [userId, platform, JSON.stringify(stats)]
      );
    } catch (err) {
      error = err.message;
    }

    res.json({ platform, username: username.trim(), stats, error });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/platforms/:platform
 * Disconnects a platform and removes cached stats.
 */
router.delete("/:platform", async (req, res, next) => {
  try {
    const { platform } = req.params;
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    await query(
      "DELETE FROM platform_connections WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );
    await query(
      "DELETE FROM platform_stats_cache WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );

    res.json({ success: true, platform });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/platforms/:platform/stats
 * Returns cached stats if fresh, otherwise fetches new data.
 */
router.get("/:platform/stats", async (req, res, next) => {
  try {
    const { platform } = req.params;
    const userId = await getUserId(req.user.uid);
    if (!userId) return res.status(404).json({ error: "User not found" });

    // Get the username for this platform
    const connResult = await query(
      "SELECT username FROM platform_connections WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );

    if (connResult.rows.length === 0) {
      return res.status(404).json({ error: `Platform ${platform} is not connected` });
    }

    const username = connResult.rows[0].username;

    // Check cache
    const cacheResult = await query(
      "SELECT stats_json, fetched_at FROM platform_stats_cache WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );

    if (cacheResult.rows.length > 0) {
      const { stats_json, fetched_at } = cacheResult.rows[0];
      const age = Date.now() - new Date(fetched_at).getTime();

      if (age < CACHE_TTL_MS) {
        return res.json({ stats: stats_json, cached: true, fetchedAt: fetched_at });
      }
    }

    // Cache is stale or missing — fetch fresh
    try {
      const stats = await fetchPlatformStats(platform, username);

      await query(
        `INSERT INTO platform_stats_cache (user_id, platform, stats_json, fetched_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, platform)
         DO UPDATE SET stats_json = EXCLUDED.stats_json, fetched_at = NOW()`,
        [userId, platform, JSON.stringify(stats)]
      );

      return res.json({ stats, cached: false, fetchedAt: new Date().toISOString() });
    } catch (fetchErr) {
      // If fresh fetch fails, return stale cache if available
      if (cacheResult.rows.length > 0) {
        return res.json({
          stats: cacheResult.rows[0].stats_json,
          cached: true,
          stale: true,
          fetchedAt: cacheResult.rows[0].fetched_at,
          warning: "Using stale cached data: " + fetchErr.message,
        });
      }
      return res.status(502).json({ error: fetchErr.message });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
