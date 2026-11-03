import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
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
    console.error("❌ [MySQL] Gagal terhubung ke basis data:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error(`💡 Tips: MySQL belum aktif di ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}. Pastikan MySQL sudah dijalankan (misal: di XAMPP).`);
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(`💡 Tips: User/password MySQL salah di file .env. Di XAMPP biasanya user: 'root' dan password kosong.`);
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error(`💡 Tips: Database '${process.env.DB_NAME}' belum ada. Silakan jalankan: npm run migrate`);
    }
  }
})();

export default pool;
