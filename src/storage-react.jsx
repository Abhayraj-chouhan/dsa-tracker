/**
 * Storage helpers adapted for React.
 * Pure functions — no global state mutation.
 */

import { apiPost } from "./apiClient.jsx";

export function loadProgressForUser(userId) {
  if (!userId) return new Set();
  const storageKey = `dsa-tracker-solved-${userId}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return new Set(JSON.parse(saved));

    // Migration of legacy data
    const legacy = localStorage.getItem("dsa-tracker-solved");
    if (legacy) {
      const legacyData = JSON.parse(legacy);
      if (legacyData.length > 0) {
        localStorage.setItem(storageKey, legacy);
        localStorage.removeItem("dsa-tracker-solved");
        return new Set(legacyData);
      }
    }

    return new Set();
  } catch {
    return new Set();
  }
}

export function saveProgress(userId, solvedSet) {
  if (!userId) return;
  const storageKey = `dsa-tracker-solved-${userId}`;
  localStorage.setItem(storageKey, JSON.stringify([...solvedSet]));
}
