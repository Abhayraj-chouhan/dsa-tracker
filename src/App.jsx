import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { initAuth, loginWithGitHub, logout } from "./auth-react.jsx";
import { loadProgressForUser, saveProgress } from "./storage-react.jsx";
import { loadSavedUsernames, fetchStats, connectPlatform, disconnectPlatform } from "./api-react.jsx";
import { apiPost } from "./apiClient.jsx";
import AuthPage from "./components/AuthPage";
import Header from "./components/Header";
import ProblemList from "./components/ProblemList";
import TopicStats from "./components/TopicStats";
import Profiles from "./components/Profiles";
import PracticeSheets from "./components/PracticeSheets";
import Contests from "./components/Contests";

// ─── App Context ───────────────────────────────────────────────────────
const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState("problems");

  // Filters – Problem List
  const [search, setSearch] = useState("");
  const [topicF, setTopicF] = useState("");
  const [diffF, setDiffF] = useState("");
  const [platformF, setPlatformF] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  // Filters – Practice Sheets
  const [selectedSheet, setSelectedSheet] = useState("all");
  const [sheetTopicF, setSheetTopicF] = useState("");
  const [sheetDiffF, setSheetDiffF] = useState("");
  const [sheetSearch, setSheetSearch] = useState("");
  const [showCompletedSheets, setShowCompletedSheets] = useState(true);

  // Accordion state
  const [expandedTopics, setExpandedTopics] = useState({});

  // Progress
  const [solved, setSolved] = useState(new Set());

  // Platform profiles
  const [usernames, setUsernames] = useState({});
  const [platformStats, setPlatformStats] = useState({});
  const [platformLoading, setPlatformLoading] = useState({});
  const [platformErrors, setPlatformErrors] = useState({});

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Ref for syncWithBackend to avoid stale closures
  const solvedRef = useRef(solved);
  solvedRef.current = solved;

  // ─── Toggle a problem solved / unsolved ──────────────────────────────
  const toggleProblem = useCallback(
    (id) => {
      setSolved((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);

        if (user) saveProgress(user.uid, next);

        // fire-and-forget backend sync
        apiPost("/progress/toggle", { problemId: id }).catch((err) =>
          console.warn("Backend toggle failed:", err.message)
        );

        return next;
      });
    },
    [user]
  );

  // ─── Reset all progress ──────────────────────────────────────────────
  const resetProgress = useCallback(() => {
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      const empty = new Set();
      if (user) saveProgress(user.uid, empty);
      setSolved(empty);

      apiPost("/progress/reset").catch((err) =>
        console.warn("Backend reset failed:", err.message)
      );
    }
  }, [user]);

  // ─── syncWithBackend ─────────────────────────────────────────────────
  const syncWithBackend = useCallback(
    async (firebaseUser) => {
      try {
        const data = await apiPost("/auth/sync");

        const migrationFlagKey = `dsa-tracker-migrated-${firebaseUser.uid}`;
        const alreadyMigrated = localStorage.getItem(migrationFlagKey) === "true";

        const backendSolved = new Set(data.solvedIds || []);
        const localSolved = loadProgressForUser(firebaseUser.uid);

        if (!alreadyMigrated && localSolved.size > 0 && backendSolved.size === 0) {
          try {
            await apiPost("/progress/sync", { solvedIds: [...localSolved] });
            localStorage.setItem(migrationFlagKey, "true");
            setSolved(localSolved);
          } catch {
            setSolved(localSolved);
          }
        } else {
          setSolved(backendSolved);
          saveProgress(firebaseUser.uid, backendSolved);
          localStorage.setItem(migrationFlagKey, "true");
        }

        const backendConnections = data.connections || {};
        const localConnections = loadSavedUsernames();

        if (Object.keys(backendConnections).length > 0) {
          setUsernames(backendConnections);
          localStorage.setItem("dsa-tracker-platform-usernames", JSON.stringify(backendConnections));

          if (data.cachedStats) {
            Object.entries(data.cachedStats).forEach(([platform, cached]) => {
              if (cached.stats) {
                setPlatformStats((prev) => ({ ...prev, [platform]: cached.stats }));
              }
            });
          }
        } else if (Object.keys(localConnections).length > 0) {
          for (const [platform, username] of Object.entries(localConnections)) {
            if (username && username.trim()) {
              try {
                await apiPost("/platforms/connect", { platform, username: username.trim() });
              } catch (connErr) {
                console.warn(`Failed to sync platform connection ${platform}:`, connErr.message);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Backend sync failed, using localStorage fallback:", err.message);
        const solvedSet = loadProgressForUser(firebaseUser.uid);
        setSolved(solvedSet);
      }
    },
    []
  );

  // ─── Bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    const savedUsernames = loadSavedUsernames();
    setUsernames(savedUsernames);

    // Auth listener — sets user when Firebase auth state changes
    const unsubscribe = initAuth({
      onUser: (firebaseUser) => {
        const u = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email || "User",
          photoURL: firebaseUser.photoURL,
          email: firebaseUser.email,
        };
        setUser(u);
        setLoading(false);

        // Non-blocking backend sync
        syncWithBackend(firebaseUser);

        // Fetch stats for saved usernames
        Object.entries(savedUsernames).forEach(([platform, username]) => {
          if (username) {
            fetchStats(platform, username, setPlatformStats, setPlatformLoading, setPlatformErrors);
          }
        });
      },
      onNoUser: () => {
        setUser(null);
        setSolved(new Set());
        setLoading(false);
      },
      onUnconfigured: () => {
        setLoading(false);
      },
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [syncWithBackend]);

  // ─── Context value ───────────────────────────────────────────────────
  const ctx = {
    user, setUser,
    loading,
    authError, setAuthError,
    activeTab, setActiveTab,
    search, setSearch,
    topicF, setTopicF,
    diffF, setDiffF,
    platformF, setPlatformF,
    showCompleted, setShowCompleted,
    selectedSheet, setSelectedSheet,
    sheetTopicF, setSheetTopicF,
    sheetDiffF, setSheetDiffF,
    sheetSearch, setSheetSearch,
    showCompletedSheets, setShowCompletedSheets,
    expandedTopics, setExpandedTopics,
    solved, setSolved,
    usernames, setUsernames,
    platformStats, setPlatformStats,
    platformLoading, setPlatformLoading,
    platformErrors, setPlatformErrors,
    showUserMenu, setShowUserMenu,
    toggleProblem,
    resetProgress,
    loginWithGitHub: () => loginWithGitHub(setAuthError),
    logout: () => logout(setUser, setSolved, setShowUserMenu),
    connectPlatform: (platform, username) =>
      connectPlatform(platform, username, setUsernames, setPlatformStats, setPlatformLoading, setPlatformErrors),
    disconnectPlatform: (platform) =>
      disconnectPlatform(platform, setUsernames, setPlatformStats, setPlatformErrors),
  };

  // ─── Render ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p className="app-loading-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AppContext.Provider value={ctx}>
        <AuthPage />
      </AppContext.Provider>
    );
  }

  const tabComponent = {
    problems: <ProblemList />,
    stats: <TopicStats />,
    profiles: <Profiles />,
    sheets: <PracticeSheets />,
    contests: <Contests />,
  }[activeTab] || <ProblemList />;

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        <Header />
        <main className="app-main-content">{tabComponent}</main>
      </div>
    </AppContext.Provider>
  );
}
