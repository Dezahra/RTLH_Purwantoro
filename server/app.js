import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import surveysRouter from "./routes/surveys.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import rtrwRouter from "./routes/rtrw.js";
import backupRouter from "./routes/backup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logger (hanya mencatat panggilan API agar terminal tetap rapi)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/src/data/api")) {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    system: "SIPELITA Purwantoro Unified Server",
    engine: "Node.js / Express.js + Vite",
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

// Modern REST Endpoints
app.use("/api/surveys", surveysRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/rtrw", rtrwRouter);
app.use("/api/backup", backupRouter);

// Legacy PHP Compatibility Routes (/src/data/api/*)
app.use("/src/data/api", surveysRouter);
app.use("/src/data/api", authRouter);
app.use("/src/data/api", usersRouter);
app.use("/src/data/api", rtrwRouter);
app.use("/src/data/api", backupRouter);

// 404 handler khusus untuk API yang tidak ditemukan
app.use(["/api", "/src/data/api"], (req, res) => {
  res.status(404).json({
    status: "error",
    message: `API endpoint '${req.method} ${req.originalUrl}' tidak ditemukan di server SIPELITA.`
  });
});

// Integrasi Frontend (Vite Middleware untuk Development / Static dist untuk Production)
export async function setupFrontend(expressApp) {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../dist");
    expressApp.use(express.static(distPath));
    expressApp.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Terjadi kesalahan pada server internal."
  });
});

export default app;
