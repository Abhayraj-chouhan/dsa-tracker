/**
 * API module adapted for React.
 * All functions accept React state setters instead of mutating global state.
 */

import { apiGet, apiPost, apiDelete } from "./apiClient.jsx";

const STORAGE_KEY = "dsa-tracker-platform-usernames";

export function loadSavedUsernames() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSavedUsernames(usernames) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usernames));
}

// Seeded random number generator
function seedRandom(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

export function generateSimulatedCalendar(total, username) {
  const calendar = {};
  if (total <= 0) return calendar;

  const rand = seedRandom(username || "gfg_user");
  const today = new Date();

  let remainingSubmissions = Math.round(total * 1.6);
  const activeDaysCount = Math.min(280, Math.max(5, Math.round(total / 1.8)));

  const dates = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dates.push(dateStr);
  }

  for (let i = 0; i < activeDaysCount; i++) {
    const dateIndex = Math.floor(rand() * dates.length);
    const dateStr = dates[dateIndex];
    const count = Math.min(remainingSubmissions, Math.floor(rand() * 5) + 1);
    if (count <= 0) break;

    calendar[dateStr] = (calendar[dateStr] || 0) + count;
    remainingSubmissions -= count;
  }

  if (remainingSubmissions > 0) {
    const keys = Object.keys(calendar);
    if (keys.length > 0) {
      for (let i = 0; i < remainingSubmissions; i++) {
        const randomKey = keys[Math.floor(rand() * keys.length)];
        calendar[randomKey] += 1;
      }
    }
  }

  return calendar;
}

function parseRawCalendar(rawCal) {
  const calendar = {};
  if (!rawCal) return calendar;

  let parsed = rawCal;
  if (typeof rawCal === "string") {
    try { parsed = JSON.parse(rawCal); } catch { return calendar; }
  }

  Object.entries(parsed).forEach(([timestamp, count]) => {
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return;
    const date = new Date(ts * (ts < 9999999999 ? 1000 : 1));
    const dateStr = date.toISOString().split("T")[0];
    calendar[dateStr] = (calendar[dateStr] || 0) + count;
  });

  return calendar;
}

// ─── Backend-powered fetch stats ────────────────────────────────────────

async function fetchStatsViaBackend(platform) {
  const data = await apiGet(`/platforms/${platform}/stats`);
  return data.stats;
}

// ─── Client-side fallback fetchers ──────────────────────────────────────

async function fetchLeetCodeContestsFallback(username) {
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/contest`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };
    const data = await res.json();

    if (!data || !data.contestParticipation || data.contestParticipation.length === 0) {
      return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };
    }

    const history = data.contestParticipation.map((c) => ({
      name: c.contest.title,
      rating: Math.round(c.rating),
      rank: c.ranking,
      date: c.contest.startTime,
    }));

    return {
      attendedCount: data.contestAttend || history.length,
      currentRating: Math.round(data.contestRating) || 0,
      globalRanking: data.contestGlobalRanking || 0,
      history,
    };
  } catch {
    return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };
  }
}

async function fetchLeetCodeContests(username) {
  try {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
        }
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;

    const res = await fetch(`/leetcode-proxy/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return await fetchLeetCodeContestsFallback(username);

    const json = await res.json();
    if (json.errors || !json.data) return await fetchLeetCodeContestsFallback(username);

    const contestInfo = json.data.userContestRanking;
    const historyData = json.data.userContestRankingHistory;

    if (!contestInfo) return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };

    const history = (historyData || [])
      .filter((h) => h.attended)
      .map((h) => ({
        name: h.contest.title,
        rating: Math.round(h.rating),
        rank: h.ranking,
        date: h.contest.startTime,
      }));

    return {
      attendedCount: contestInfo.attendedContestsCount || 0,
      currentRating: Math.round(contestInfo.rating) || 0,
      globalRanking: contestInfo.globalRanking || 0,
      history,
    };
  } catch {
    return await fetchLeetCodeContestsFallback(username);
  }
}

async function fetchLeetCodeDirect(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
        profile { ranking }
        submissionCalendar
      }
    }
  `;

  const res = await fetch(`/leetcode-proxy/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username } }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error("proxy failed");

  const json = await res.json();
  if (json.errors || !json.data?.matchedUser) throw new Error("user not found");

  const user = json.data.matchedUser;
  const stats = user.submitStatsGlobal.acSubmissionNum;

  const getDiff = (d) => (stats.find((s) => s.difficulty === d) || {}).count || 0;

  return {
    platform: "leetcode",
    username,
    total: getDiff("All"),
    easy: getDiff("Easy"),
    medium: getDiff("Medium"),
    hard: getDiff("Hard"),
    ranking: user.profile?.ranking || 0,
    profileUrl: `https://leetcode.com/${username}`,
    calendar: parseRawCalendar(user.submissionCalendar),
  };
}

async function fetchLeetCodeFallback(username) {
  try {
    const result = await fetchLeetCodeDirect(username);
    result.contestData = await fetchLeetCodeContests(username);
    return result;
  } catch {}

  const fallbackEndpoints = [
    {
      url: `https://alfa-leetcode-api.onrender.com/${username}/solved`,
      parse: async (d) => {
        let calendar = {};
        try {
          const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`, { signal: AbortSignal.timeout(5000) });
          if (calRes.ok) {
            const calData = await calRes.json();
            calendar = parseRawCalendar(calData.submissionCalendar);
          }
        } catch {}
        return {
          platform: "leetcode",
          username,
          total: d.solvedProblem,
          easy: d.easySolved,
          medium: d.mediumSolved,
          hard: d.hardSolved,
          profileUrl: `https://leetcode.com/${username}`,
          calendar,
        };
      },
      valid: (d) => d.solvedProblem !== undefined,
    },
    {
      url: `https://leetcode-api-faisalshohag.vercel.app/${username}`,
      parse: (d) => ({
        platform: "leetcode",
        username,
        total: (d.easySolved || 0) + (d.mediumSolved || 0) + (d.hardSolved || 0),
        easy: d.easySolved,
        medium: d.mediumSolved,
        hard: d.hardSolved,
        ranking: d.ranking,
        profileUrl: `https://leetcode.com/${username}`,
        calendar: parseRawCalendar(d.submissionCalendar),
      }),
      valid: (d) => d.easySolved !== undefined,
    },
  ];

  for (const ep of fallbackEndpoints) {
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (!ep.valid(data)) continue;
      const parsed = await ep.parse(data);
      parsed.contestData = await fetchLeetCodeContests(username);
      return parsed;
    } catch {}
  }

  throw new Error(`LeetCode user "${username}" not found or API is unreachable.`);
}

async function fetchCodeforcesFallback(username) {
  let infoData;
  try {
    const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${username}`, { signal: AbortSignal.timeout(8000) });
    if (!infoRes.ok) throw new Error("bad response");
    infoData = await infoRes.json();
  } catch {
    throw new Error(`Codeforces API unreachable.`);
  }

  if (infoData.status !== "OK") {
    throw new Error(infoData.comment || `Codeforces user "${username}" not found`);
  }

  const info = infoData.result[0];

  let uniqueSolved = 0, easy = 0, medium = 0, hard = 0;
  const calendar = {};

  try {
    const subRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`, { signal: AbortSignal.timeout(10000) });
    if (subRes.ok) {
      const subData = await subRes.json();
      if (subData.status === "OK") {
        const solvedSet = new Set();
        subData.result.forEach((s) => {
          if (s.creationTimeSeconds) {
            const date = new Date(s.creationTimeSeconds * 1000);
            const dateStr = date.toISOString().split("T")[0];
            calendar[dateStr] = (calendar[dateStr] || 0) + 1;
          }

          if (s.verdict === "OK") {
            const key = `${s.problem.contestId}-${s.problem.index}`;
            if (!solvedSet.has(key)) {
              solvedSet.add(key);
              const rating = s.problem.rating || 0;
              if (rating === 0 || rating < 1200) easy++;
              else if (rating >= 1200 && rating <= 1600) medium++;
              else hard++;
            }
          }
        });
        uniqueSolved = solvedSet.size;
      }
    }
  } catch {}

  let contestData = { attendedCount: 0, currentRating: 0, history: [] };
  try {
    const res = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK" && data.result) {
        contestData = {
          attendedCount: data.result.length,
          currentRating: data.result.length > 0 ? data.result[data.result.length - 1].newRating : 0,
          history: data.result.map(h => ({
            date: h.ratingUpdateTimeSeconds,
            name: h.contestName,
            rating: h.newRating
          }))
        };
      }
    }
  } catch {}

  return {
    platform: "codeforces",
    username: info.handle,
    total: uniqueSolved,
    easy,
    medium,
    hard,
    rating: info.rating || 0,
    maxRating: info.maxRating || 0,
    rank: info.rank || "Unrated",
    maxRank: info.maxRank || "Unrated",
    avatar: info.avatar || info.titlePhoto,
    profileUrl: `https://codeforces.com/profile/${info.handle}`,
    calendar,
    contestData
  };
}

async function fetchGFGFallback(username) {
  const apiUrls = [
    `https://gfgstatscard.vercel.app/${username}?raw=true`,
    `https://geeks-for-geeks-stats-api.vercel.app/?raw=y&userName=${username}`,
  ];

  const parseGFGData = (data) => {
    if (!data || typeof data !== "object" || data.error) return null;

    let easy = 0, medium = 0, hard = 0, total = 0, score = 0;

    if (data.info) {
      const info = data.info;
      const ss = data.solvedStats || {};
      easy = (ss.easy?.count || 0) + (ss.basic?.count || 0) + (ss.school?.count || 0);
      medium = ss.medium?.count || 0;
      hard = ss.hard?.count || 0;
      total = info.totalProblemsSolved || (easy + medium + hard);
      score = info.codingScore || 0;
    } else {
      easy = (data.Easy || 0) + (data.Basic || 0) + (data.School || 0);
      medium = data.Medium || 0;
      hard = data.Hard || 0;
      total = data.totalProblemsSolved || (easy + medium + hard);
      score = data.codingScore || 0;
    }

    if (total === 0 && easy === 0 && medium === 0 && hard === 0) return null;

    const calendar = generateSimulatedCalendar(total, username);

    return {
      platform: "gfg",
      username,
      total,
      easy,
      medium,
      hard,
      score,
      profileUrl: `https://www.geeksforgeeks.org/user/${username}`,
      calendar,
    };
  };

  for (const apiUrl of apiUrls) {
    const proxyVariants = [
      `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
    ];

    for (const proxyUrl of proxyVariants) {
      try {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
        if (!res.ok) continue;
        const text = await res.text();
        let data;
        try {
          const outer = JSON.parse(text);
          data = outer.contents !== undefined ? JSON.parse(outer.contents) : outer;
        } catch { continue; }

        const parsed = parseGFGData(data);
        if (parsed) return parsed;
      } catch {}
    }
  }

  throw new Error(`GFG user "${username}" not found or profile is private.`);
}

// ─── Main API functions ─────────────────────────────────────────────────

export async function fetchStats(platform, username, setPlatformStats, setPlatformLoading, setPlatformErrors) {
  if (!username.trim()) return;
  setPlatformLoading((prev) => ({ ...prev, [platform]: true }));
  setPlatformErrors((prev) => ({ ...prev, [platform]: null }));

  try {
    let result;

    try {
      result = await fetchStatsViaBackend(platform, username.trim());
    } catch {
      if (platform === "leetcode") result = await fetchLeetCodeFallback(username.trim());
      else if (platform === "codeforces") result = await fetchCodeforcesFallback(username.trim());
      else if (platform === "gfg") result = await fetchGFGFallback(username.trim());
    }

    setPlatformStats((prev) => ({ ...prev, [platform]: result }));
    setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
  } catch (err) {
    setPlatformErrors((prev) => ({ ...prev, [platform]: err.message }));
    setPlatformStats((prev) => ({ ...prev, [platform]: null }));
    setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
  }
}

export async function connectPlatform(platform, username, setUsernames, setPlatformStats, setPlatformLoading, setPlatformErrors) {
  const trimmed = username.trim();
  setUsernames((prev) => {
    const updated = { ...prev, [platform]: trimmed };
    saveSavedUsernames(updated);
    return updated;
  });

  try {
    const data = await apiPost("/platforms/connect", { platform, username: trimmed });
    if (data.stats) {
      setPlatformStats((prev) => ({ ...prev, [platform]: data.stats }));
      setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
      return;
    }
    if (data.error) {
      setPlatformErrors((prev) => ({ ...prev, [platform]: data.error }));
      setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
      return;
    }
  } catch {
    // Backend unavailable — fall through to direct fetch
  }

  await fetchStats(platform, trimmed, setPlatformStats, setPlatformLoading, setPlatformErrors);
}

export function disconnectPlatform(platform, setUsernames, setPlatformStats, setPlatformErrors) {
  setUsernames((prev) => {
    const updated = { ...prev };
    delete updated[platform];
    saveSavedUsernames(updated);
    return updated;
  });

  setPlatformStats((prev) => {
    const updated = { ...prev };
    delete updated[platform];
    return updated;
  });

  setPlatformErrors((prev) => {
    const updated = { ...prev };
    delete updated[platform];
    return updated;
  });

  apiDelete(`/platforms/${platform}`).catch((err) => {
    console.warn("Backend disconnect failed:", err.message);
  });
}
