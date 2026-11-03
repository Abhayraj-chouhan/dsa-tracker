import React, { useEffect, useRef, useMemo } from "react";
import { useAppContext } from "../App";

export default function Contests() {
  const { platformStats } = useAppContext();
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const lcStats = platformStats.leetcode;
  const cfStats = platformStats.codeforces;

  const lcContest = lcStats?.contestData || {
    attendedCount: 0,
    currentRating: 0,
    globalRanking: 0,
    history: [],
  };
  const cfContest = cfStats?.contestData || {
    attendedCount: 0,
    currentRating: 0,
    history: [],
  };

  // Build chart data
  const { allLabels, lcData, cfData } = useMemo(() => {
    const lcHistory = lcStats?.contestData?.history || [];
    const cfHistory = cfStats?.contestData?.history || [];

    const labels = [
      ...new Set([
        ...lcHistory.map((h) => h.name || `Contest ${h.date}`),
        ...cfHistory.map((h) => h.name || `Contest ${h.date}`),
      ]),
    ].slice(-20);

    const lc = labels.map((label) => {
      const match = lcHistory.find((h) => (h.name || `Contest ${h.date}`) === label);
      return match ? match.rating : null;
    });

    const cf = labels.map((label) => {
      const match = cfHistory.find((h) => (h.name || `Contest ${h.date}`) === label);
      return match ? match.rating : null;
    });

    return { allLabels: labels, lcData: lc, cfData: cf };
  }, [lcStats, cfStats]);

  // Render Chart.js chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.Chart) return;

    if (allLabels.length === 0) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "#888";
      ctx.textAlign = "center";
      ctx.fillText(
        "No contest history available. Connect LeetCode or Codeforces profiles to view rating graph.",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new window.Chart(canvas, {
      type: "line",
      data: {
        labels: allLabels,
        datasets: [
          {
            label: "LeetCode Rating",
            data: lcData,
            borderColor: "#ffa116",
            backgroundColor: "rgba(255, 161, 22, 0.1)",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Codeforces Rating",
            data: cfData,
            borderColor: "#1f8acb",
            backgroundColor: "rgba(31, 138, 203, 0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: "#888" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: {
            ticks: { color: "#888" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
        plugins: {
          legend: { labels: { color: "#fff" } },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [allLabels, lcData, cfData]);

  return (
    <div className="contests-tab">
      <div className="contests-header">
        <h2>Contest Performance &amp; Analytics</h2>
        <p>
          Track your rating growth, rank progression, and contest history across
          platforms.
        </p>
      </div>

      <div className="contests-summary-grid">
        <div className="contest-card leetcode">
          <div className="c-card-header">
            <span className="c-icon">⚡</span>
            <h3>LeetCode Contests</h3>
          </div>
          <div className="c-card-numbers">
            <div className="c-num-box">
              <span className="c-val">
                {lcContest.currentRating || "—"}
              </span>
              <span className="c-lbl">Rating</span>
            </div>
            <div className="c-num-box">
              <span className="c-val">{lcContest.attendedCount}</span>
              <span className="c-lbl">Attended</span>
            </div>
            <div className="c-num-box">
              <span className="c-val">
                {lcContest.globalRanking ? `#${lcContest.globalRanking}` : "—"}
              </span>
              <span className="c-lbl">Global Rank</span>
            </div>
          </div>
        </div>

        <div className="contest-card codeforces">
          <div className="c-card-header">
            <span className="c-icon">🏆</span>
            <h3>Codeforces Contests</h3>
          </div>
          <div className="c-card-numbers">
            <div className="c-num-box">
              <span className="c-val">
                {cfContest.currentRating || "—"}
              </span>
              <span className="c-lbl">Rating</span>
            </div>
            <div className="c-num-box">
              <span className="c-val">{cfContest.attendedCount}</span>
              <span className="c-lbl">Attended</span>
            </div>
            <div className="c-num-box">
              <span className="c-val">
                {cfStats?.maxRating || "—"}
              </span>
              <span className="c-lbl">Max Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        className="contest-graph-container"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          marginTop: "24px",
        }}
      >
        <h3 style={{ marginBottom: "16px", fontSize: "1.1rem", color: "var(--text)" }}>
          Rating Progression History
        </h3>
        <div style={{ height: "320px", position: "relative" }}>
          <canvas ref={canvasRef} id="contest-chart-canvas"></canvas>
        </div>
      </div>
    </div>
  );
}
