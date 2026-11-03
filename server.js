import dotenv from "dotenv";
dotenv.config();

import app, { setupFrontend } from "./server/app.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
  // Hubungkan route frontend/API
  await setupFrontend(app);

  const server = app.listen(PORT, () => {
    console.log(`Backend API    : http://localhost:${PORT}`);
    console.log(`Web Frontend   : http://localhost:5173`);
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
