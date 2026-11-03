import React from "react";
import { useAppContext } from "../App";
import { questions, TOPICS } from "../data/questions.jsx";

function ProblemRow({ q, isSolved, qIndex, toggleProblem }) {
  return (
    <div className={`problem-row ${isSolved ? "solved" : ""}`}>
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
      <div className="prob-num">#{qIndex}</div>
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
}

export default function ProblemList() {
  const {
    search, setSearch,
    topicF, setTopicF,
    diffF, setDiffF,
    platformF, setPlatformF,
    showCompleted, setShowCompleted,
    solved,
    expandedTopics, setExpandedTopics,
    toggleProblem,
  } = useAppContext();

  const filtered = questions.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (topicF && q.topic !== topicF) return false;
    if (diffF && q.difficulty !== diffF) return false;
    if (platformF && q.platform !== platformF) return false;
    if (!showCompleted && solved.has(q.id)) return false;
    return true;
  });

  const groups = {};
  TOPICS.forEach((t) => (groups[t] = []));
  filtered.forEach((q) => {
    if (groups[q.topic]) {
      groups[q.topic].push(q);
    } else {
      groups[q.topic] = [q];
    }
  });

  const groupedQuestions = Object.entries(groups).filter(([, qs]) => qs.length > 0);

  const resetFilters = () => {
    setSearch("");
    setTopicF("");
    setDiffF("");
    setPlatformF("");
    setShowCompleted(true);
  };

  const toggleTopic = (topic) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: prev[topic] !== undefined ? !prev[topic] : false,
    }));
  };

  return (
    <>
      <div className="filters-container">
        <input
          type="text"
          id="filter-search"
          className="search-input"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="filter-topic"
          className="filter-select"
          value={topicF}
          onChange={(e) => setTopicF(e.target.value)}
        >
          <option value="">All Topics</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          id="filter-diff"
          className="filter-select"
          value={diffF}
          onChange={(e) => setDiffF(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          id="filter-platform"
          className="filter-select"
          value={platformF}
          onChange={(e) => setPlatformF(e.target.value)}
        >
          <option value="">All Platforms</option>
          <option value="LC">LeetCode</option>
          <option value="GFG">GeeksForGeeks</option>
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            id="filter-show-completed"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show Completed
        </label>
        <button
          id="btn-reset-filters"
          className="reset-filters-btn"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      <div className="list-header">
        <div className="list-count">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{questions.length}</strong> problems
        </div>
        <div className="diff-legend">
          <span className="legend-item easy">Easy</span>
          <span className="legend-item medium">Medium</span>
          <span className="legend-item hard">Hard</span>
        </div>
      </div>

      <div
        className="problems-accordion-container"
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {groupedQuestions.map(([topic, qs], index) => {
          const solvedCount = qs.filter((q) => solved.has(q.id)).length;
          const totalCount = qs.length;
          const isExpanded =
            expandedTopics[topic] !== undefined
              ? expandedTopics[topic]
              : index === 0;

          return (
            <div
              key={topic}
              className={`topic-accordion ${isExpanded ? "expanded" : ""}`}
            >
              <div
                className="topic-accordion-header"
                data-topic={topic}
                onClick={() => toggleTopic(topic)}
              >
                <div className="topic-accordion-title">
                  <span className="accordion-chevron">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                  <span className="topic-name">{topic}</span>
                </div>
                <div className="topic-accordion-meta">
                  <span
                    className={`topic-progress-badge ${
                      solvedCount === totalCount && totalCount > 0
                        ? "completed"
                        : ""
                    }`}
                  >
                    {solvedCount}/{totalCount}
                  </span>
                  <div className="topic-mini-progress">
                    <div
                      className="topic-mini-fill"
                      style={{
                        width: `${Math.round(
                          (solvedCount / totalCount) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="topic-accordion-content">
                  <div className="problems-list">
                    {qs.map((q) => {
                      const isSolved = solved.has(q.id);
                      const qIndex =
                        questions.findIndex((allQ) => allQ.id === q.id) + 1;
                      return (
                        <ProblemRow
                          key={q.id}
                          q={q}
                          isSolved={isSolved}
                          qIndex={qIndex}
                          toggleProblem={toggleProblem}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No questions match your filters.</p>
            <button id="btn-empty-clear-filters" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
