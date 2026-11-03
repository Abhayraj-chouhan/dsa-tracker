import React, { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useAppContext } from "../App";

// ─── Heatmap Sub-component ──────────────────────────────────────────────
function HeatmapSection({ calendar, streakStats }) {
  const gridRef = useRef(null);
  const tipRef = useRef(null);

  const today = useMemo(() => new Date(), []);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Build 365 days
  const days = useMemo(() => {
    const arr = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = calendar[dateStr] || 0;
      arr.push({
        date: dateStr,
        count,
        month: d.getMonth(),
        year: d.getFullYear(),
        dayOfWeek: d.getDay(),
      });
    }
    return arr;
  }, [calendar, today]);

  const totalSubmissions = useMemo(
    () => Object.values(calendar).reduce((a, b) => a + b, 0),
    [calendar]
  );

  // Ordered unique (year, month) pairs
  const orderedMonths = useMemo(() => {
    const seen = new Set();
    const result = [];
    days.forEach((d) => {
      const key = `${d.year}-${d.month}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ month: d.month, year: d.year });
      }
    });
    return result;
  }, [days]);

  // Build month groups
  const monthGroups = useMemo(
    () =>
      orderedMonths.map(({ month, year }) => {
        const mDays = days.filter((d) => d.month === month && d.year === year);
        const firstDOW = mDays[0].dayOfWeek;
        const lastDOW = mDays[mDays.length - 1].dayOfWeek;
        const padded = [
          ...Array(firstDOW).fill(null),
          ...mDays,
          ...Array(6 - lastDOW).fill(null),
        ];
        const cols = [];
        for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
        return { label: monthNames[month], cols };
      }),
    [orderedMonths, days, monthNames]
  );

  function getLevel(count) {
    if (count <= 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 7) return 3;
    return 4;
  }

  // Tooltip handlers
  useEffect(() => {
    const grid = gridRef.current;
    const tip = tipRef.current;
    if (!grid || !tip) return;

    const onOver = (e) => {
      const cell = e.target.closest(".heatmap-cell[data-date]");
      if (!cell) {
        tip.classList.remove("visible");
        return;
      }
      const date = cell.dataset.date;
      const count = parseInt(cell.dataset.count) || 0;
      const d = new Date(date + "T00:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      tip.textContent =
        count === 0
          ? `No submissions on ${label}`
          : `${count} submission${count !== 1 ? "s" : ""} on ${label}`;
      tip.classList.add("visible");
    };

    const onMove = (e) => {
      const rect = grid.getBoundingClientRect();
      const tipW = tip.offsetWidth;
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 42;
      if (x + tipW > rect.width) x = e.clientX - rect.left - tipW - 14;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    };

    const onLeave = () => {
      tip.classList.remove("visible");
    };

    grid.addEventListener("mouseover", onOver);
    grid.addEventListener("mousemove", onMove);
    grid.addEventListener("mouseleave", onLeave);

    return () => {
      grid.removeEventListener("mouseover", onOver);
      grid.removeEventListener("mousemove", onMove);
      grid.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="heatmap-section">
      {/* Top stats bar */}
      <div className="heatmap-topbar">
        <div className="heatmap-topbar-left">
          <span className="heatmap-total-count">
            {totalSubmissions} submissions in the past one year
          </span>
          <span className="heatmap-info-icon" title="Combined across all connected platforms">ⓘ</span>
        </div>
        <div className="heatmap-topbar-right">
          <span className="heatmap-streak-pill">
            Current streak: <strong>{streakStats.currentStreak}</strong>
          </span>
          <span className="heatmap-streak-pill">
            Max streak: <strong>{streakStats.maxStreak}</strong>
          </span>
          <button className="heatmap-year-btn" id="heatmap-year-btn">
            Current <span className="heatmap-year-caret">▾</span>
          </button>
        </div>
      </div>

      {/* Month-grouped grid */}
      <div className="heatmap-grid-scroll">
        <div className="heatmap-months-container" id="heatmap-grid" ref={gridRef}>
          {monthGroups.map((mg, mgIdx) => (
            <div key={mgIdx} className="heatmap-month-group">
              <div className="heatmap-month-cols">
                {mg.cols.map((col, colIdx) => (
                  <div key={colIdx} className="heatmap-week-col">
                    {col.map((d, dIdx) =>
                      d === null ? (
                        <div key={dIdx} className="heatmap-cell hc-empty"></div>
                      ) : (
                        <div
                          key={dIdx}
                          className={`heatmap-cell level-${getLevel(d.count)}`}
                          data-date={d.date}
                          data-count={d.count}
                        ></div>
                      )
                    )}
                  </div>
                ))}
              </div>
              <span className="heatmap-month-lbl">{mg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-footer">
        <span>Less</span>
        <div className="heatmap-legend">
          <div className="heatmap-cell level-0"></div>
          <div className="heatmap-cell level-1"></div>
          <div className="heatmap-cell level-2"></div>
          <div className="heatmap-cell level-3"></div>
          <div className="heatmap-cell level-4"></div>
        </div>
        <span>More</span>
      </div>

      {/* Floating tooltip */}
      <div className="heatmap-tooltip" id="heatmap-tooltip" ref={tipRef}></div>
    </div>
  );
}

// ─── Streak Calculation ─────────────────────────────────────────────────
function calculateStreakStats(calendar) {
  const dates = Object.keys(calendar).sort();
  if (dates.length === 0) return { currentStreak: 0, maxStreak: 0, activeDays: 0 };

  const activeDays = dates.length;
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  dates.forEach((dStr) => {
    const d = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    prevDate = d;
    if (tempStreak > maxStreak) maxStreak = tempStreak;
  });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let currentStreak = 0;
  if (calendar[today] || calendar[yesterday]) {
    currentStreak = tempStreak;
  }

  return { currentStreak, maxStreak, activeDays };
}

// ─── Main Profiles Component ────────────────────────────────────────────
export default function Profiles() {
  const {
    usernames,
    platformStats,
    platformLoading,
    platformErrors,
    connectPlatform,
    disconnectPlatform,
  } = useAppContext();

  const [inputValues, setInputValues] = useState({
    leetcode: usernames.leetcode || "",
    codeforces: usernames.codeforces || "",
    gfg: usernames.gfg || "",
  });

  const platforms = [
    { id: "leetcode", name: "LeetCode", color: "#ffa116", icon: "⚡", bgGlow: "rgba(255, 161, 22, 0.1)" },
    { id: "codeforces", name: "Codeforces", color: "#1f8acb", icon: "🏆", bgGlow: "rgba(31, 138, 203, 0.1)" },
    { id: "gfg", name: "GeeksforGeeks", color: "#2f9d51", icon: "🟢", bgGlow: "rgba(47, 141, 70, 0.1)" },
  ];

  // Combine calendars for heatmap & streak
  const combinedCalendar = useMemo(() => {
    const cal = {};
    Object.values(platformStats).forEach((st) => {
      if (st && st.calendar) {
        Object.entries(st.calendar).forEach(([date, count]) => {
          cal[date] = (cal[date] || 0) + count;
        });
      }
    });
    return cal;
  }, [platformStats]);

  const streakStats = useMemo(() => calculateStreakStats(combinedCalendar), [combinedCalendar]);

  const handleConnect = useCallback(
    (platformId) => {
      const val = inputValues[platformId]?.trim();
      if (val) {
        connectPlatform(platformId, val);
      }
    },
    [inputValues, connectPlatform]
  );

  return (
    <div className="linked-profiles-tab">
      <div className="profiles-header">
        <h2>Linked Coding Profiles</h2>
        <p>
          Connect your LeetCode, Codeforces, and GeeksforGeeks handles to sync
          live problem-solving stats.
        </p>
      </div>

      <div className="profiles-grid">
        {platforms.map((p) => {
          const stat = platformStats[p.id];
          const loading = platformLoading[p.id];
          const error = platformErrors[p.id];

          return (
            <div
              key={p.id}
              className={`profile-card ${stat ? "connected" : ""}`}
              style={{
                "--platform-color": p.color,
                "--platform-glow": p.bgGlow,
              }}
            >
              <div className="profile-card-header">
                <span className="platform-icon">{p.icon}</span>
                <h3>{p.name}</h3>
                {stat && <span className="connected-badge">Connected</span>}
              </div>

              {!stat && !loading && (
                <div className="connect-form" data-platform={p.id}>
                  <input
                    type="text"
                    className="profile-input"
                    placeholder={`Enter ${p.name} username...`}
                    value={inputValues[p.id] || ""}
                    onChange={(e) =>
                      setInputValues((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    id={`input-handle-${p.id}`}
                  />
                  <button
                    className="connect-btn btn-connect-platform"
                    data-platform={p.id}
                    onClick={() => handleConnect(p.id)}
                  >
                    Connect
                  </button>
                </div>
              )}

              {loading && (
                <div className="profile-loading">
                  <div className="spinner"></div>
                  <span>Fetching {p.name} stats...</span>
                </div>
              )}

              {error && (
                <div className="profile-error">
                  <p>⚠️ {error}</p>
                  <button
                    className="retry-btn btn-connect-platform"
                    data-platform={p.id}
                    onClick={() => handleConnect(p.id)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {stat && (
                <div className="profile-stats-body">
                  <div className="profile-user-info">
                    <span className="profile-handle">@{stat.username}</span>
                    <div className="profile-actions">
                      <a
                        href={stat.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="view-profile-link"
                      >
                        View Profile ↗
                      </a>
                      <button
                        className="disconnect-btn btn-disconnect-platform"
                        data-platform={p.id}
                        title="Disconnect handle"
                        onClick={() => disconnectPlatform(p.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="profile-numbers">
                    <div className="p-num-box">
                      <span className="p-val animated-num">{stat.total}</span>
                      <span className="p-lbl">Total Solved</span>
                    </div>
                    {p.id === "codeforces" && (
                      <div className="p-num-box">
                        <span className="p-val animated-num">
                          {stat.rating}
                        </span>
                        <span className="p-lbl">Rating</span>
                      </div>
                    )}
                    {p.id === "gfg" && (
                      <div className="p-num-box">
                        <span className="p-val animated-num">{stat.score}</span>
                        <span className="p-lbl">Coding Score</span>
                      </div>
                    )}
                  </div>

                  <div className="diff-breakdown">
                    <div className="diff-bar-container">
                      <div
                        className="diff-bar easy-bar"
                        style={{
                          width: `${
                            stat.total
                              ? Math.round((stat.easy / stat.total) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                      <div
                        className="diff-bar med-bar"
                        style={{
                          width: `${
                            stat.total
                              ? Math.round((stat.medium / stat.total) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                      <div
                        className="diff-bar hard-bar"
                        style={{
                          width: `${
                            stat.total
                              ? Math.round((stat.hard / stat.total) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="diff-labels">
                      <span className="d-easy">Easy: {stat.easy}</span>
                      <span className="d-med">Medium: {stat.medium}</span>
                      <span className="d-hard">Hard: {stat.hard}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Streak & Analytics Summary Widget */}
      <div className="streak-analytics-banner">
        <div className="streak-box">
          <div className="streak-icon">🔥</div>
          <div>
            <span className="streak-val">
              {streakStats.currentStreak} Days
            </span>
            <span className="streak-lbl">Current Streak</span>
          </div>
        </div>
        <div className="streak-box">
          <div className="streak-icon">⚡</div>
          <div>
            <span className="streak-val">{streakStats.maxStreak} Days</span>
            <span className="streak-lbl">Longest Streak</span>
          </div>
        </div>
        <div className="streak-box">
          <div className="streak-icon">📅</div>
          <div>
            <span className="streak-val">
              {streakStats.activeDays} Days
            </span>
            <span className="streak-lbl">Active Days (Past Year)</span>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <HeatmapSection calendar={combinedCalendar} streakStats={streakStats} />
    </div>
  );
}
