import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
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

// Health check & Info endpoint
app.get(["/api", "/api/"], (req, res) => {
  res.json({
    status: "ok",
    message: "SIPELITA Purwantoro API Backend aktif.",
    info: "Untuk membuka tampilan web SIPELITA, silakan buka http://localhost:8090/",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth/login",
      surveys: "/api/surveys",
      users: "/api/users",
      rtrw: "/api/rtrw",
      backup: "/api/backup"
    }
  });
});

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

// Integrasi Frontend (Mode Development: API mandiri di port 8000 / Mode Production: Statis dist)
export async function setupFrontend(expressApp) {
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.resolve(__dirname, "../dist");
  const hasDist = fs.existsSync(path.resolve(distPath, "index.html"));

  if (isProd && hasDist) {
    // Mode Production (Server/Hosting): Sajikan build frontend Vite
    expressApp.use(express.static(distPath));
    expressApp.get("{*splat}", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    // Mode Development (Lokal): Backend mandiri di port 8000, Frontend terpisah di port 5173
    expressApp.get("/", (req, res) => {
      res.json({
        status: "ok",
        system: "SIPELITA Purwantoro - Backend API Server",
        api_port: process.env.PORT || 8000,
        frontend_url: "http://localhost:5173",
        message: "Backend API aktif. Untuk membuka tampilan website, silakan buka http://localhost:5173"
      });
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
