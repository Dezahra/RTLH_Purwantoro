import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "sipelita_desa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("[MySQL] Berhasil terhubung ke basis data:", process.env.DB_NAME || "sipelita_desa");
    conn.release();
  } catch (err) {
    console.error("[MySQL] Gagal terhubung ke basis data:", err.message);
  }
})();

export default pool;
