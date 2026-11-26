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

// Otomatis sinkronkan survei lama ke activity_logs jika belum tercatat agar riwayat lengkap dari awal
export async function backfillLegacyActivityLogs() {
  try {
    const [surveysTable] = await pool.query("SHOW TABLES LIKE 'surveys'");
    const [logsTable] = await pool.query("SHOW TABLES LIKE 'activity_logs'");
    if (surveysTable.length === 0 || logsTable.length === 0) return;

    // Masukkan riwayat survei lama yang belum ada di activity_logs dengan tanggal aslinya
    const [res] = await pool.query(`
      INSERT INTO activity_logs (
        timestamp, user_id, user_nama, user_role, action, 
        survey_id, nik, nama_kk, rw, rt, status, message
      )
      SELECT 
        COALESCE(s.created_at, s.tanggal_survey, NOW()) AS timestamp,
        s.created_by AS user_id,
        COALESCE(s.petugas_nama, u.nama, 'Petugas Surveyor') AS user_nama,
        'petugas' AS user_role,
        'INPUT_SURVEY' AS action,
        s.id AS survey_id,
        s.nik,
        s.nama_kk,
        s.rw,
        s.rt,
        'SUCCESS' AS status,
        CONCAT('Data survei awal tercatat (BNBA: ', COALESCE(s.no_urut_bnba, '-'), ')') AS message
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id NOT IN (
        SELECT DISTINCT survey_id FROM activity_logs WHERE survey_id IS NOT NULL
      )
    `);
    if (res && res.affectedRows > 0) {
      console.log(`[MySQL] ✅ Berhasil menyinkronkan ${res.affectedRows} riwayat survei lama ke activity_logs.`);
    }
  } catch (err) {
    console.warn("[MySQL] Lewati backfill riwayat survei lama:", err.message);
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

// Otomatis pastikan kolom status_verifikasi fleksibel menampung status baru tanpa batasan enum kaku
export async function ensureStatusVerifikasiColumn() {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'surveys'");
    if (tables.length === 0) return;

    const [colRows] = await pool.query(`
      SELECT DATA_TYPE, COLUMN_TYPE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'surveys' AND COLUMN_NAME = 'status_verifikasi'
    `);

    if (colRows.length > 0 && colRows[0].DATA_TYPE === 'enum') {
      console.log("[MySQL] Menyesuaikan kolom status_verifikasi ke VARCHAR(50)...");
      await pool.query("ALTER TABLE surveys MODIFY status_verifikasi VARCHAR(50) NOT NULL DEFAULT 'MENUNGGU_VALIDASI'");
      try {
        await pool.query("ALTER TABLE survey_verifications MODIFY status_baru VARCHAR(50) NOT NULL");
        await pool.query("ALTER TABLE survey_verifications MODIFY status_sebelumnya VARCHAR(50) NULL");
      } catch (_) {}
      console.log("[MySQL] ✅ Kolom status_verifikasi berhasil disesuaikan!");
    }
  } catch (err) {
    console.warn("[MySQL] Lewati penyesuaian kolom status_verifikasi:", err.message);
  }
}

// Otomatis standarkan format ID survei ke format resmi SRV-YYYY-XXXX (4 digit berurutan)
export async function standardizeAllSurveyIds(targetPool = pool) {
  try {
    const [tables] = await targetPool.query("SHOW TABLES LIKE 'surveys'");
    if (tables.length === 0) return { count: 0, updated: 0 };

    // Ambil seluruh data survei
    const [surveys] = await targetPool.query(`
      SELECT id, no_urut_bnba, created_at, tanggal_survey 
      FROM surveys 
      ORDER BY COALESCE(created_at, tanggal_survey, id) ASC, id ASC
    `);

    if (surveys.length === 0) return { count: 0, updated: 0 };

    const year = new Date().getFullYear();
    const updates = [];
    let needsMigration = false;

    for (let i = 0; i < surveys.length; i++) {
      const s = surveys[i];
      const seq = i + 1;
      const targetId = `SRV-${year}-${String(seq).padStart(4, "0")}`;

      let targetBnba = s.no_urut_bnba;
      if (!targetBnba || targetBnba.includes("null") || targetBnba.includes("undefined")) {
        targetBnba = `BNBA-${year}-${String(seq).padStart(4, "0")}`;
      } else {
        const bnbaMatch = targetBnba.match(/(\d+)$/);
        if (bnbaMatch) {
          const bNum = parseInt(bnbaMatch[1], 10);
          targetBnba = `BNBA-${year}-${String(bNum).padStart(4, "0")}`;
        }
      }

      if (s.id !== targetId || s.no_urut_bnba !== targetBnba) {
        needsMigration = true;
      }
      updates.push({ oldId: s.id, newId: targetId, newBnba: targetBnba });
    }

    if (!needsMigration) {
      console.log("[Migrasi ID] ✅ Seluruh ID survei sudah berformat standar rapi (SRV-YYYY-XXXX).");
      return { count: surveys.length, updated: 0 };
    }

    console.log(`[Migrasi ID] Memulai normalisasi ${updates.length} ID survei ke format resmi SRV-${year}-XXXX...`);
    await targetPool.query("SET FOREIGN_KEY_CHECKS = 0");

    try {
      // Tahap 1: Rename ke ID sementara untuk mencegah tabrakan unique key
      for (const u of updates) {
        if (u.oldId !== u.newId) {
          const tempId = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await targetPool.query("UPDATE surveys SET id = ? WHERE id = ?", [tempId, u.oldId]);
          await targetPool.query("UPDATE survey_photos SET survey_id = ? WHERE survey_id = ?", [tempId, u.oldId]);
          await targetPool.query("UPDATE survey_verifications SET survey_id = ? WHERE survey_id = ?", [tempId, u.oldId]);
          try { await targetPool.query("UPDATE survey_parameter_scores SET survey_id = ? WHERE survey_id = ?", [tempId, u.oldId]); } catch (_) {}
          try { await targetPool.query("UPDATE activity_logs SET survey_id = ? WHERE survey_id = ?", [tempId, u.oldId]); } catch (_) {}
          u.tempId = tempId;
        } else {
          u.tempId = u.oldId;
        }
      }

      // Tahap 2: Update ke target ID resmi SRV-YYYY-XXXX
      let updatedCount = 0;
      for (const u of updates) {
        await targetPool.query("UPDATE surveys SET id = ?, no_urut_bnba = ? WHERE id = ?", [u.newId, u.newBnba, u.tempId]);
        await targetPool.query("UPDATE survey_photos SET survey_id = ? WHERE survey_id = ?", [u.newId, u.tempId]);
        await targetPool.query("UPDATE survey_verifications SET survey_id = ? WHERE survey_id = ?", [u.newId, u.tempId]);
        try { await targetPool.query("UPDATE survey_parameter_scores SET survey_id = ? WHERE survey_id = ?", [u.newId, u.tempId]); } catch (_) {}
        try { await targetPool.query("UPDATE activity_logs SET survey_id = ? WHERE survey_id = ?", [u.newId, u.tempId]); } catch (_) {}
        updatedCount++;
      }

      console.log(`[Migrasi ID] ✅ Sukses menstandarkan ${updatedCount} ID survei ke format SRV-${year}-XXXX.`);
      return { count: surveys.length, updated: updatedCount };
    } finally {
      await targetPool.query("SET FOREIGN_KEY_CHECKS = 1");
    }
  } catch (err) {
    console.warn("[Migrasi ID] Lewati normalisasi ID survei:", err.message);
    return { count: 0, updated: 0, error: err.message };
  }
}

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("[MySQL] Berhasil terhubung ke basis data:", process.env.DB_NAME || "sipelita_desa");
    conn.release();

    // Otomatis cek & tanam akun admin dan 24 petugas saat server menyala
    await ensureDefaultUsers();
    await ensureActivityLogsTable();
    await ensureIdColumnsVarchar64();
    await ensureStatusVerifikasiColumn();
    await standardizeAllSurveyIds(pool);
    await backfillLegacyActivityLogs();
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
