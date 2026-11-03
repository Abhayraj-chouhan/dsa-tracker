/**
 * API Client
 *
 * Thin HTTP wrapper that attaches the Firebase ID token
 * to every request. Falls back gracefully if the backend is unavailable.
 */

import { getIdToken } from "./firebaseConfig.jsx";

const API_BASE = "/api";

async function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const token = await getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // No token available — request will be sent without auth
  }
  return headers;
}

/**
 * Make an authenticated GET request to the backend.
 */
export async function apiGet(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Make an authenticated POST request to the backend.
 */
export async function apiPost(path, body = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Make an authenticated DELETE request to the backend.
 */
export async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
