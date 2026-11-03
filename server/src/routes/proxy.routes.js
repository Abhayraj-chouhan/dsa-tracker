/**
 * Proxy Routes
 * POST /api/proxy/leetcode/graphql   — Proxy to LeetCode GraphQL
 * GET  /api/proxy/codeforces/:path   — Proxy to Codeforces API
 * GET  /api/proxy/gfg/:username      — Proxy to GFG stats APIs
 *
 * These run server-side so there are no CORS issues.
 */



 import { Router } from "express";

  const router = Router();

/**
 * POST /api/proxy/leetcode/graphql
 * Proxies a GraphQL request to LeetCode.
 */
  router.post("/leetcode/graphql", async (req, res, next) => {
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://leetcode.com",
        Referer: "https://leetcode.com/",
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "LeetCode API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/codeforces/*
 * Proxies requests to the Codeforces API.
 * Example: /api/proxy/codeforces/user.info?handles=tourist
 */
router.get("/codeforces/*", async (req, res, next) => {
  try {
    // Extract the path after /codeforces/
    const cfPath = req.params[0];
    const queryString = new URLSearchParams(req.query).toString();
    const url = `https://codeforces.com/api/${cfPath}${queryString ? "?" + queryString : ""}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Codeforces API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/gfg/:username
 * Proxies requests to GFG stats APIs. Tries multiple endpoints.
 */
router.get("/gfg/:username", async (req, res, next) => {
  const { username } = req.params;

  const endpoints = [
    `https://gfgstatscard.vercel.app/${username}?raw=true`,
    `https://geeks-for-geeks-stats-api.vercel.app/?raw=y&userName=${username}`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && typeof data === "object" && !data.error) {
        return res.json(data);
      }
    } catch {
      // Try next endpoint
    }
  }

  res.status(502).json({ error: `Could not fetch GFG stats for "${username}"` });
});

export default router;


