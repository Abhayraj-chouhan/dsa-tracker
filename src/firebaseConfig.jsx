import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = !!(apiKey && authDomain && projectId);

let auth = null;
let githubProvider = null;

if (isFirebaseConfigured) {
  const app = initializeApp({ apiKey, authDomain, projectId });
  auth = getAuth(app);
  githubProvider = new GithubAuthProvider();
}

/**
 * Get the current Firebase user's ID token for authenticated API calls.
 * Returns null if no user is logged in.
 */
export async function getIdToken() {
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export { auth, githubProvider };

