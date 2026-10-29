import dotenv from "dotenv";
dotenv.config();

import app, { setupFrontend } from "./server/app.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
  // Hubungkan Vite Frontend ke server Express (Unified 1 Port)
  await setupFrontend(app);

  const server = app.listen(PORT, () => {
    console.log("=================================================");
    console.log("🚀 SIPELITA UNIFIED SERVER AKTIF (1 PORT SAJA)");
    console.log(`🌐 Buka di Browser : http://localhost:${PORT}`);
    console.log(`📡 API Backend     : http://localhost:${PORT}/api/ & /src/data/api/`);
    console.log(`🗄️  Database MySQL  : ${process.env.DB_NAME || "sipelita_desa"}`);
    console.log("=================================================");
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nMenutup server SIPELITA...");
    server.close(() => {
      console.log("Server berhenti.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("Gagal memulai server:", err);
  process.exit(1);
});
