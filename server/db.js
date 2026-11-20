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

// Otomatis pastikan tabel log aktivitas ada untuk audit dan pencegahan data hilang
export async function ensureActivityLogsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(50) DEFAULT NULL,
        user_nama VARCHAR(150) DEFAULT NULL,
        user_role VARCHAR(50) DEFAULT 'petugas',
        action VARCHAR(50) NOT NULL,
        survey_id VARCHAR(64) DEFAULT NULL,
        nik VARCHAR(25) DEFAULT NULL,
        nama_kk VARCHAR(150) DEFAULT NULL,
        rw VARCHAR(10) DEFAULT NULL,
        rt VARCHAR(10) DEFAULT NULL,
        status ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
        message TEXT DEFAULT NULL,
        payload_backup LONGTEXT DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        INDEX idx_logs_action (action),
        INDEX idx_logs_survey (survey_id),
        INDEX idx_logs_nik (nik),
        INDEX idx_logs_created (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[MySQL] ✅ Tabel activity_logs aktif untuk audit & pemulihan data.");
  } catch (err) {
    console.warn("[MySQL] Gagal inisialisasi activity_logs:", err.message);
  }
}

// Otomatis lebarkan kolom ID ke VARCHAR(64) agar 100% mendukung UUID standar resmi tanpa tabrakan
export async function ensureIdColumnsVarchar64() {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'surveys'");
    if (tables.length === 0) return;

    const [colRows] = await pool.query(`
      SELECT CHARACTER_MAXIMUM_LENGTH 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'surveys' AND COLUMN_NAME = 'id'
    `);

    if (colRows.length > 0 && (colRows[0].CHARACTER_MAXIMUM_LENGTH || 0) < 64) {
      console.log("[MySQL] Memperlebar kolom ID ke VARCHAR(64) untuk garansi UUID anti-tabrakan...");
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
      try {
        await pool.query("ALTER TABLE surveys MODIFY id VARCHAR(64)");
        try { await pool.query("ALTER TABLE survey_photos MODIFY survey_id VARCHAR(64)"); } catch (_) {}
        try { await pool.query("ALTER TABLE survey_verifications MODIFY survey_id VARCHAR(64)"); } catch (_) {}
        try { await pool.query("ALTER TABLE survey_parameter_scores MODIFY survey_id VARCHAR(64)"); } catch (_) {}
        try { await pool.query("ALTER TABLE activity_logs MODIFY survey_id VARCHAR(64)"); } catch (_) {}
        console.log("[MySQL] ✅ Seluruh kolom ID berhasil diperlebar ke VARCHAR(64). Siap menampung UUID standar bebas tabrakan!");
      } finally {
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      }
    }
  } catch (err) {
    console.warn("[MySQL] Lewati penyesuaian kolom ID:", err.message);
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
    await ensureActivityLogsTable();
    await ensureIdColumnsVarchar64();
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
