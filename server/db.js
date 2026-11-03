import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
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

// Otomatis menanam akun admin ke dalam database Docker jika belum ada
export async function ensureAdminUser() {
  try {
    const username = process.env.ADMIN_USERNAME || "admin";
    const plainPassword = process.env.ADMIN_PASSWORD || "password123";
    const hash = bcrypt.hashSync(plainPassword, 10);

    // Cek apakah tabel users sudah ada
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) return;

    // Cek apakah akun admin sudah terdaftar
    const [rows] = await pool.query("SELECT id, status FROM users WHERE username = ? LIMIT 1", [username]);
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO users (
          id, role, username, password, nama, nip, id_petugas, 
          jabatan, desa, kecamatan, kabupaten, status, avatar, 
          registered_at, approved_at, approved_by
        ) VALUES (
          'USR-ADM-001', 'admin', ?, ?, 'Administrator SIPELITA', 
          '19880415 201201 1 002', 'ADM-001', 'Admin Kelurahan', 
          'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 
          'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'
        )`,
        [username, hash]
      );
      console.log(`[Docker/MySQL] ✅ Akun admin default '${username}' otomatis ditanam ke database!`);
    } else {
      // Pastikan statusnya APPROVED dan password di-update ke hash yang valid
      await pool.query(
        "UPDATE users SET status = 'APPROVED', password = ? WHERE username = ?",
        [hash, username]
      );
      console.log(`[Docker/MySQL] ✅ Akun admin '${username}' aktif & password disinkronkan.`);
    }
  } catch (err) {
    console.warn("[Docker/MySQL] Lewati auto-seed admin:", err.message);
  }
}

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("[MySQL] Berhasil terhubung ke basis data:", process.env.DB_NAME || "sipelita_desa");
    conn.release();

    // Otomatis cek & buatkan akun admin saat server Docker menyala
    await ensureAdminUser();
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
