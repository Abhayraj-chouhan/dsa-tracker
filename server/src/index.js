/**
 * DSA Tracker Backend — Express Server Entry Point
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import platformsRoutes from "./routes/platforms.routes.js";
import proxyRoutes from "./routes/proxy.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

// ─── Health Check (no auth required) ────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Proxy Routes (no auth — these are used by connected profile features) ──

app.use("/api/proxy", proxyRoutes);

// ─── Authenticated Routes ───────────────────────────────────────────────

app.use("/api/auth", requireAuth, authRoutes);
app.use("/api/progress", requireAuth, progressRoutes);
app.use("/api/platforms", requireAuth, platformsRoutes);

// ─── Global Error Handler ───────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error("❌ Server error:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

// ─── Start Server ───────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 DSA Tracker Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
