import React, { useRef, useEffect } from "react";
import { useAppContext } from "../App";
import { questions } from "../data/questions.jsx";

export default function Header() {
  const {
    user,
    solved,
    showUserMenu,
    setShowUserMenu,
    activeTab,
    setActiveTab,
    resetProgress,
    logout,
  } = useAppContext();

  const menuRef = useRef(null);

  const total = questions.length;
  const done = solved.size;
  const pct = Math.round((done / total) * 100);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (showUserMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, setShowUserMenu]);

  const tabs = [
    {
      id: "problems",
      label: "Problem List",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      id: "stats",
      label: "Topic Stats",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
    },
    {
      id: "profiles",
      label: "Linked Profiles",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      id: "sheets",
      label: "Practice Sheets",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <circle cx="8" cy="17" r="1" />
        </svg>
      ),
    },
    {
      id: "contests",
      label: "Contests",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="logo-badge">⚡</div>
          <div>
            <h1 className="app-title">DSA Tracker</h1>
            <p className="app-sub">Master {total} curated problems</p>
          </div>
        </div>
        <div className="header-right">
          <div className="stat-box">
            <span className="stat-num">{done}</span>
            <span className="stat-box-label">Solved</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{total - done}</span>
            <span className="stat-box-label">Remaining</span>
          </div>
          <div className="stat-box highlight">
            <span className="stat-num">{pct}%</span>
            <span className="stat-box-label">Complete</span>
          </div>

          <div className="user-menu-container" ref={menuRef}>
            <button
              id="user-menu-trigger"
              className="user-avatar-btn"
              title={user ? (user.displayName || user.email || "User") : "User"}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user && user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="user-avatar-img"
                />
              ) : (
                <div className="user-avatar-fallback">
                  {(user ? (user.displayName || user.email || "U") : "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </button>

            {showUserMenu && user && (
              <div className="user-menu-dropdown">
                <div className="user-menu-info">
                  <span className="user-menu-name">
                    {user.displayName || "User"}
                  </span>
                  {user.email && (
                    <span className="user-menu-email">{user.email}</span>
                  )}
                </div>

                <div className="user-menu-divider"></div>
                <button
                  id="btn-logout"
                  className="user-menu-item logout-item"
                  onClick={logout}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="progress-text">
          {done}/{total} problems solved
        </div>
      </div>

      <div className="status-bar">
        <div className="sync-status">
          <div className="sync-dot"></div>
          Progress synced locally
        </div>
        <button
          id="btn-reset-all"
          className="reset-btn"
          title="Reset all progress"
          onClick={resetProgress}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset All
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </div>
        ))}
      </div>
    </>
  );
}
