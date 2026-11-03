/**
 * Firebase Auth Middleware
 *
 * Verifies Firebase ID tokens without requiring a service account file.
 * Uses Google's public keys endpoint to validate JWT signatures.
 */

import crypto from "crypto";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// Cache for Google's public signing certificates
let cachedCerts = null;
let certsExpiresAt = 0;

async function getGoogleCerts() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiresAt) {
    return cachedCerts;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch Google signing certificates");
  }

  // Parse cache-control header for expiry
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600 * 1000;

  cachedCerts = await res.json();
  certsExpiresAt = now + maxAge;
  return cachedCerts;
}

/**
 * Decode a JWT without verification (to read header & payload).
 */
function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf8")
  );
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8")
  );

  return { header, payload, signatureInput: `${parts[0]}.${parts[1]}`, signature: parts[2] };
}

/**
 * Verify a Firebase ID token.
 */
async function verifyFirebaseToken(idToken) {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const { header, payload, signatureInput, signature } = decodeJwt(idToken);

  // 1. Check algorithm
  if (header.alg !== "RS256") {
    throw new Error("Unexpected algorithm: " + header.alg);
  }

  // 2. Check issuer
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error("Invalid issuer");
  }

  // 3. Check audience
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error("Invalid audience");
  }

  // 4. Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token expired");
  }

  // 5. Check not-before
  if (payload.iat > now + 60) {
    throw new Error("Token issued in the future");
  }

  // 6. Verify signature with Google's public key
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error("Unknown key ID: " + header.kid);
  }

  const isValid = crypto.verify(
    "sha256",
    Buffer.from(signatureInput),
    { key: cert, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(signature, "base64url")
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  return payload;
}

/**
 * Express middleware that verifies the Firebase ID token
 * from the Authorization header and attaches user info to req.user.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await verifyFirebaseToken(idToken);

    req.user = {
      uid: decoded.user_id || decoded.sub,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };

    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
