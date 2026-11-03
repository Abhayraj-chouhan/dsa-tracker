import React from "react";
import { useAppContext } from "../App";
import { questions, TOPICS } from "../data/questions.jsx";

export default function TopicStats() {
  const { solved } = useAppContext();

  const topicStats = TOPICS.map((topic) => {
    const qs = questions.filter((q) => q.topic === topic);
    const solvedCount = qs.filter((q) => solved.has(q.id)).length;
    const pct = Math.round((solvedCount / qs.length) * 100);
    return { topic, total: qs.length, solved: solvedCount, pct };
  });

  return (
    <div className="topic-stats-tab">
      <div className="topic-stats-grid">
        {topicStats.map(({ topic, total: t, solved: s, pct: p }) => (
          <div key={topic} className="topic-stat-card">
            <div className="topic-stat-header">
              <span className="topic-stat-name">{topic}</span>
              <span className="topic-stat-count">
                {s}/{t}
              </span>
            </div>
            <div className="topic-stat-bar">
              <div
                className="topic-stat-fill"
                style={{ width: `${p}%` }}
              ></div>
            </div>
            <div className="topic-stat-pct">{p}% complete</div>
          </div>
        ))}
      </div>
    </div>
  );
}
