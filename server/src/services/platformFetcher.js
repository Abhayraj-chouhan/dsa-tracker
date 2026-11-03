/**
 * Platform Stats Fetcher Service
 *
 * Server-side logic to fetch stats from LeetCode, Codeforces, and GFG.
 * No CORS issues since these are server-to-server calls.
 */

// ─── Helpers ────────────────────────────────────────────────────────────

function parseRawCalendar(rawCal) {
  const calendar = {};
  if (!rawCal) return calendar;

  let parsed = rawCal;
  if (typeof rawCal === "string") {
    try {
      parsed = JSON.parse(rawCal);
    } catch {
      return calendar;
    }
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

function generateSimulatedCalendar(total, username) {
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
    dates.push(d.toISOString().split("T")[0]);
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

// ─── LeetCode ───────────────────────────────────────────────────────────

async function fetchLeetCodeContests(username) {
  try {
    const lcQuery = `
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
          contest { title startTime }
        }
      }
    `;

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://leetcode.com",
        Referer: "https://leetcode.com/",
      },
      body: JSON.stringify({ query: lcQuery, variables: { username } }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };

    const json = await res.json();
    if (json.errors || !json.data) return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };

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
    return { attendedCount: 0, currentRating: 0, globalRanking: 0, history: [] };
  }
}

async function fetchLeetCode(username) {
  const profileQuery = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal { acSubmissionNum { difficulty count } }
        profile { ranking }
        submissionCalendar
      }
    }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://leetcode.com",
      Referer: "https://leetcode.com/",
    },
    body: JSON.stringify({ query: profileQuery, variables: { username } }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error("LeetCode API error");

  const json = await res.json();
  if (json.errors || !json.data?.matchedUser) {
    throw new Error(`LeetCode user "${username}" not found`);
  }

  const user = json.data.matchedUser;
  const stats = user.submitStatsGlobal.acSubmissionNum;
  const getDiff = (d) => (stats.find((s) => s.difficulty === d) || {}).count || 0;

  const contestData = await fetchLeetCodeContests(username);

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
    contestData,
  };
}

// ─── Codeforces ─────────────────────────────────────────────────────────

async function fetchCodeforcesContests(username) {
  try {
    const res = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { attendedCount: 0, currentRating: 0, history: [] };
    const data = await res.json();
    if (data.status !== "OK" || !data.result) return { attendedCount: 0, currentRating: 0, history: [] };

    return {
      attendedCount: data.result.length,
      currentRating: data.result.length > 0 ? data.result[data.result.length - 1].newRating : 0,
      history: data.result.map((h) => ({
        date: h.ratingUpdateTimeSeconds,
        name: h.contestName,
        rating: h.newRating,
      })),
    };
  } catch {
    return { attendedCount: 0, currentRating: 0, history: [] };
  }
}

async function fetchCodeforces(username) {
  const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${username}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!infoRes.ok) throw new Error("Codeforces API unreachable");
  const infoData = await infoRes.json();

  if (infoData.status !== "OK") {
    throw new Error(infoData.comment || `Codeforces user "${username}" not found`);
  }

  const info = infoData.result[0];
  let uniqueSolved = 0, easy = 0, medium = 0, hard = 0;
  const calendar = {};

  try {
    const subRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (subRes.ok) {
      const subData = await subRes.json();
      if (subData.status === "OK") {
        const solvedSet = new Set();
        subData.result.forEach((s) => {
          if (s.creationTimeSeconds) {
            const date = new Date(s.creationTimeSeconds * 1000);
            calendar[date.toISOString().split("T")[0]] =
              (calendar[date.toISOString().split("T")[0]] || 0) + 1;
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

  const contestData = await fetchCodeforcesContests(username);

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
    contestData,
  };
}

// ─── GeeksforGeeks ──────────────────────────────────────────────────────

async function fetchGFG(username) {
  const apiUrls = [
    `https://gfgstatscard.vercel.app/${username}?raw=true`,
    `https://geeks-for-geeks-stats-api.vercel.app/?raw=y&userName=${username}`,
  ];

  const parseGFGData = (data) => {
    if (!data || typeof data !== "object" || data.error) return null;

    let easy = 0, medium = 0, hard = 0, total = 0, score = 0;

    if (data.info) {
      const ss = data.solvedStats || {};
      easy = (ss.easy?.count || 0) + (ss.basic?.count || 0) + (ss.school?.count || 0);
      medium = ss.medium?.count || 0;
      hard = ss.hard?.count || 0;
      total = data.info.totalProblemsSolved || (easy + medium + hard);
      score = data.info.codingScore || 0;
    } else {
      easy = (data.Easy || 0) + (data.Basic || 0) + (data.School || 0);
      medium = data.Medium || 0;
      hard = data.Hard || 0;
      total = data.totalProblemsSolved || (easy + medium + hard);
      score = data.codingScore || 0;
    }

    if (total === 0 && easy === 0 && medium === 0 && hard === 0) return null;

    return {
      platform: "gfg",
      username,
      total,
      easy,
      medium,
      hard,
      score,
      profileUrl: `https://www.geeksforgeeks.org/user/${username}`,
      calendar: generateSimulatedCalendar(total, username),
    };
  };

  for (const url of apiUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseGFGData(data);
      if (parsed) return parsed;
    } catch {}
  }

  throw new Error(`GFG user "${username}" not found or profile is private.`);
}

// ─── Main export ────────────────────────────────────────────────────────

/**
 * Fetch stats for a given platform and username.
 * @param {"leetcode"|"codeforces"|"gfg"} platform
 * @param {string} username
 * @returns {Promise<object>} Platform-specific stats object
 */
export async function fetchPlatformStats(platform, username) {
  switch (platform) {
    case "leetcode":
      return await fetchLeetCode(username);
    case "codeforces":
      return await fetchCodeforces(username);
    case "gfg":
      return await fetchGFG(username);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
