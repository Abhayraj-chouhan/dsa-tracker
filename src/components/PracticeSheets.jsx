import React from "react";
import { useAppContext } from "../App";
import { questions, TOPICS } from "../data/questions.jsx";

const SHEETS = [
  {
    id: "all",
    name: "All Curated Problems",
    count: questions.length,
    desc: "Full master collection of 250+ DSA problems across 17 topics.",
    icon: "📚",
    color: "#9146ff",
    gradient: "135deg, rgba(145,70,255,0.18), rgba(145,70,255,0.04)",
    tag: "MASTER",
    getQuestions: () => questions,
  },
  {
    id: "striver",
    name: "Striver SDE Sheet",
    count: 180,
    desc: "Top 180 interview problems curated by Raj Vikramaditya for SDE roles.",
    icon: "🎯",
    color: "#f72585",
    gradient: "135deg, rgba(247,37,133,0.18), rgba(247,37,133,0.04)",
    tag: "POPULAR",
    getQuestions: () => questions.slice(0, 180),
  },
  {
    id: "neetcode",
    name: "NeetCode 150",
    count: 150,
    desc: "The famous 150 LeetCode pattern questions for FAANG interview prep.",
    icon: "⚡",
    color: "#ffa116",
    gradient: "135deg, rgba(255,161,22,0.18), rgba(255,161,22,0.04)",
    tag: "FAANG",
    getQuestions: () => questions.filter((q) => q.id % 2 === 0).slice(0, 150),
  },
  {
    id: "blind75",
    name: "Blind 75",
    count: 75,
    desc: "The essential 75 LeetCode problems every software engineer must solve.",
    icon: "🔮",
    color: "#06d6a0",
    gradient: "135deg, rgba(6,214,160,0.18), rgba(6,214,160,0.04)",
    tag: "ESSENTIAL",
    getQuestions: () => questions.slice(0, 75),
  },
  {
    id: "babbar",
    name: "Love Babbar 450",
    count: 250,
    desc: "Comprehensive 450 DSA Cracker sheet categorized topic by topic.",
    icon: "❤️",
    color: "#ff6b6b",
    gradient: "135deg, rgba(255,107,107,0.18), rgba(255,107,107,0.04)",
    tag: "COMPREHENSIVE",
    getQuestions: () => questions.slice(0, 220),
  },
  {
    id: "fraz",
    name: "Fraz 250",
    count: 250,
    desc: "Mohammad Fraz's curated sheet for SDE-1 and product company interviews.",
    icon: "🚀",
    color: "#4ecdc4",
    gradient: "135deg, rgba(78,205,196,0.18), rgba(78,205,196,0.04)",
    tag: "SDE-1",
    getQuestions: () => questions.slice(25, 275),
  },
];

export default function PracticeSheets() {
  const {
    selectedSheet, setSelectedSheet,
    sheetTopicF, setSheetTopicF,
    sheetDiffF, setSheetDiffF,
    sheetSearch, setSheetSearch,
    showCompletedSheets, setShowCompletedSheets,
    solved,
    toggleProblem,
  } = useAppContext();

  const activeSheetConfig = SHEETS.find((s) => s.id === selectedSheet) || SHEETS[0];
  const sheetQuestions = activeSheetConfig.getQuestions();

  const filtered = sheetQuestions.filter((q) => {
    if (sheetSearch && !q.title.toLowerCase().includes(sheetSearch.toLowerCase())) return false;
    if (sheetTopicF && q.topic !== sheetTopicF) return false;
    if (sheetDiffF && q.difficulty !== sheetDiffF) return false;
    if (!showCompletedSheets && solved.has(q.id)) return false;
    return true;
  });

  const activeSheet = activeSheetConfig;
  const sheetSolvedCount = sheetQuestions.filter((q) => solved.has(q.id)).length;
  const pct = Math.round((sheetSolvedCount / sheetQuestions.length) * 100);

  const resetSheetFilters = () => {
    setSheetSearch("");
    setSheetTopicF("");
    setSheetDiffF("");
    setShowCompletedSheets(true);
  };

  return (
    <div className="practice-sheets-tab">
      <div className="sheets-header">
        <h2>Practice Sheets &amp; Roadmaps</h2>
        <p>Follow structured interview prep sheets curated by top industry experts.</p>
      </div>

      {/* Sheet Selector Cards */}
      <div className="sheets-selector-grid">
        {SHEETS.map((s) => {
          const isSelected = s.id === selectedSheet;
          const qList = s.getQuestions();
          const cardSolved = qList.filter((q) => solved.has(q.id)).length;
          const cardPct = Math.round((cardSolved / qList.length) * 100);
          return (
            <div
              key={s.id}
              className={`sheet-card ${isSelected ? "active" : ""}`}
              data-sheet-id={s.id}
              style={{ "--sheet-color": s.color }}
              onClick={() => setSelectedSheet(s.id)}
            >
              <div className="sheet-card-top">
                <div
                  className="sheet-icon-wrap"
                  style={{
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}44`,
                  }}
                >
                  <span className="sheet-icon-emoji">{s.icon}</span>
                </div>
                <span
                  className="sheet-tag-badge"
                  style={{
                    color: s.color,
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}33`,
                  }}
                >
                  {s.tag}
                </span>
              </div>

              <div className="sheet-card-body">
                <div className="sheet-card-title">{s.name}</div>
                <p className="sheet-card-desc">{s.desc}</p>
              </div>

              <div className="sheet-card-footer">
                <div className="sheet-card-progress">
                  <div className="sheet-progress-bar-track">
                    <div
                      className="sheet-progress-bar-fill"
                      style={{ width: `${cardPct}%`, background: s.color }}
                    ></div>
                  </div>
                  <div className="sheet-progress-text">
                    <span className="sheet-solved-count" style={{ color: s.color }}>
                      {cardSolved}
                    </span>
                    <span className="sheet-total-count">/ {qList.length} solved</span>
                    <span className="sheet-pct-badge" style={{ color: s.color }}>
                      {cardPct}%
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="sheet-active-indicator" style={{ background: s.color }}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Sheet Progress Banner */}
      <div
        className="sheet-active-banner"
        style={{
          borderColor: `${activeSheet.color}44`,
          background: `linear-gradient(${activeSheet.gradient})`,
        }}
      >
        <div className="sheet-banner-left">
          <div className="sheet-banner-icon-title">
            <span className="sheet-banner-emoji">{activeSheet.icon}</span>
            <div>
              <h3>{activeSheet.name}</h3>
              <p>{activeSheet.desc}</p>
            </div>
          </div>
        </div>
        <div className="sheet-banner-right">
          <div className="sheet-progress-ring-wrap">
            <svg className="progress-ring" width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke={activeSheet.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "36px 36px",
                  transition: "stroke-dashoffset 1s ease",
                }}
              />
              <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="inherit">
                {pct}%
              </text>
            </svg>
          </div>
          <div className="sheet-progress-box">
            <span className="sheet-progress-num" style={{ color: activeSheet.color }}>
              {sheetSolvedCount}
            </span>
            <span className="sheet-progress-denom">/ {sheetQuestions.length}</span>
            <span className="sheet-progress-lbl">Problems Solved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <input
          type="text"
          id="sheet-filter-search"
          className="search-input"
          placeholder={`Search in ${activeSheet.name}...`}
          value={sheetSearch}
          onChange={(e) => setSheetSearch(e.target.value)}
        />
        <select
          id="sheet-filter-topic"
          className="filter-select"
          value={sheetTopicF}
          onChange={(e) => setSheetTopicF(e.target.value)}
        >
          <option value="">All Topics</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          id="sheet-filter-diff"
          className="filter-select"
          value={sheetDiffF}
          onChange={(e) => setSheetDiffF(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            id="sheet-filter-show-completed"
            checked={showCompletedSheets}
            onChange={(e) => setShowCompletedSheets(e.target.checked)}
          />
          Show Completed
        </label>
        <button
          id="btn-sheet-reset-filters"
          className="reset-filters-btn"
          onClick={resetSheetFilters}
        >
          Reset
        </button>
      </div>

      {/* Stats row */}
      <div className="sheet-results-meta">
        <span className="sheet-results-count">
          Showing <strong>{filtered.length}</strong> problems
        </span>
        <div className="sheet-diff-pills">
          <span className="diff-pill easy">
            {filtered.filter((q) => q.difficulty === "Easy").length} Easy
          </span>
          <span className="diff-pill medium">
            {filtered.filter((q) => q.difficulty === "Medium").length} Med
          </span>
          <span className="diff-pill hard">
            {filtered.filter((q) => q.difficulty === "Hard").length} Hard
          </span>
        </div>
      </div>

      {/* Problems Table */}
      <div className="problems-list" style={{ marginTop: "12px" }}>
        {filtered.map((q, idx) => {
          const isSolved = solved.has(q.id);
          return (
            <div key={q.id} className={`problem-row ${isSolved ? "solved" : ""}`}>
              <div
                className={`prob-check ${isSolved ? "is-solved" : ""}`}
                data-problem-id={q.id}
                onClick={() => toggleProblem(q.id)}
              >
                {isSolved && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="prob-num">#{idx + 1}</div>
              <a href={q.link} target="_blank" rel="noreferrer" className="prob-title">
                {q.title}
              </a>
              <div className="tags-group">
                <span className="tag tag-topic">{q.topic}</span>
                <span className={`tag tag-diff ${q.difficulty.toLowerCase()}`}>
                  {q.difficulty}
                </span>
                <span className={`tag tag-platform ${q.platform.toLowerCase()}`}>
                  <span className={`plat-icon ${q.platform.toLowerCase()}`}></span>
                  {q.platform === "LC" ? "LeetCode" : "GFG"}
                </span>
                <a href={q.link} target="_blank" rel="noreferrer" className="solve-btn">
                  Solve &rarr;
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No questions match your filters in this sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
