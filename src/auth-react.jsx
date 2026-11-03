/**
 * Auth module adapted for React (no direct state mutation).
 * Returns callbacks that the App component can wire up.
 */

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, githubProvider, isFirebaseConfigured } from "./firebaseConfig.jsx";

/**
 * Initialise Firebase auth listener.
 * @param {{ onUser, onNoUser, onUnconfigured }} callbacks
 * @returns {Function|undefined} unsubscribe
 */
export function initAuth({ onUser, onNoUser, onUnconfigured }) {
  if (!isFirebaseConfigured || !auth) {
    onUnconfigured();
    return undefined;
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      onUser(firebaseUser);
    } else {
      onNoUser();
    }
  });
}

export async function loginWithGitHub(setAuthError) {
  if (!isFirebaseConfigured || !auth || !githubProvider) {
    setAuthError("Firebase is not configured. Please set up your .env file.");
    throw new Error("Firebase not configured");
  }
  setAuthError("");
  try {
    await signInWithPopup(auth, githubProvider);
  } catch (err) {
    let errorMsg = err.message || "Something went wrong. Please try again.";
    if (err.code === "auth/popup-closed-by-user") {
      errorMsg = "Sign-in was cancelled. Please try again.";
    } else if (err.code === "auth/account-exists-with-different-credential") {
      errorMsg = "An account already exists with this email using a different sign-in method.";
    } else if (err.code === "auth/popup-blocked") {
      errorMsg = "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
    }
    setAuthError(errorMsg);
    throw err;
  }
}

export async function logout(setUser, setSolved, setShowUserMenu) {
  if (auth) {
    await signOut(auth);
  }
  setUser(null);
  setSolved(new Set());
  setShowUserMenu(false);
}
