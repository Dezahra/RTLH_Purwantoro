import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { seedAllUsers } from "./seedAdmin.js";

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

// Otomatis menanam akun admin & 24 petugas ke dalam database Docker jika belum ada
export async function ensureDefaultUsers() {
  try {
    // Cek apakah tabel users sudah ada
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) return;

    // Injeksi atau pastikan admin dan 24 petugas aktif
    await seedAllUsers(pool);
    console.log("[Docker/MySQL] ✅ Akun Admin & 24 Petugas Purwantoro aktif (APPROVED) & siap login!");
  } catch (err) {
    console.warn("[Docker/MySQL] Lewati auto-seed users:", err.message);
  }
}

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("[MySQL] Berhasil terhubung ke basis data:", process.env.DB_NAME || "sipelita_desa");
    conn.release();

    // Otomatis cek & tanam akun admin dan 24 petugas saat server Docker menyala
    await ensureDefaultUsers();
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
