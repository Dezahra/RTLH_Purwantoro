import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori berkas fisik foto survei
const UPLOADS_DIR = path.resolve(__dirname, "../../public/uploads/surveys");
const DIST_UPLOADS_DIR = path.resolve(__dirname, "../../dist/uploads/surveys");

// Pastikan direktori fisik selalu tersedia di disk
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Gagal membuat direktori public/uploads/surveys:", e.message);
}

/**
 * Menyimpan base64 image ke berkas fisik .jpg di disk /uploads/surveys/
 * Mengembalikan string URL ringkas seperti '/uploads/surveys/SRV-2026-xxx_depan_123456.jpg'
 * Jika sudah berupa URL (misal '/uploads/...'), kembalikan as-is.
 */
export function saveBase64PhotoToDisk(surveyId, slot, photoStr) {
  if (!photoStr || typeof photoStr !== "string") return null;
  const trimmed = photoStr.trim();

  // Jika sudah berupa URL berkas atau link web
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Cek apakah data URI base64
  const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let base64Data = null;
  let ext = "jpg";

  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    base64Data = matches[2];
    if (mimeType.includes("png")) ext = "png";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
  } else if (trimmed.length > 500 && !trimmed.includes(" ") && !trimmed.includes("<")) {
    base64Data = trimmed;
  } else {
    // String biasa (misal path lokal lainnya atau placeholder)
    return trimmed;
  }

  try {
    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer || buffer.length === 0) return null;

    const cleanId = String(surveyId || "tmp").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${cleanId}_${slot}_${Date.now()}.${ext}`;

    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    // Salin juga ke dist/uploads/surveys jika dist sudah dibuild agar sinkron di hosting cPanel
    try {
      if (fs.existsSync(path.resolve(__dirname, "../../dist"))) {
        if (!fs.existsSync(DIST_UPLOADS_DIR)) {
          fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DIST_UPLOADS_DIR, filename), buffer);
      }
    } catch (_) {}

    return `/uploads/surveys/${filename}`;
  } catch (err) {
    console.error(`Gagal menulis foto slot ${slot} ke disk:`, err.message);
    return null;
  }
}

/**
 * Mencatat setiap aksi ke tabel activity_logs untuk audit trail & pemulihan data 1-klik
 */
export async function logActivity({
  action,
  survey_id = null,
  nik = null,
  nama_kk = null,
  user_id = null,
  user_nama = null,
  user_role = "petugas",
  rw = null,
  rt = null,
  status = "SUCCESS",
  ip_address = null,
  user_agent = null,
  message = null,
  payload_backup = null
}) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    let backupStr = null;
    if (payload_backup) {
      try {
        backupStr = typeof payload_backup === "string" ? payload_backup : JSON.stringify(payload_backup);
      } catch (_) {}
    }

    const shortUserAgent = user_agent ? String(user_agent).slice(0, 250) : null;
    const shortIp = ip_address ? String(ip_address).slice(0, 48) : null;

    await pool.query(
      `INSERT INTO activity_logs (
        action, survey_id, nik, nama_kk, user_id, user_nama, user_role, rw, rt,
        status, ip_address, user_agent, message, payload_backup, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        action, survey_id, nik, nama_kk, user_id, user_nama, user_role, rw, rt,
        status, shortIp, shortUserAgent, message, backupStr, now
      ]
    );
  } catch (err) {
    console.warn("[ActivityLog] Gagal mencatat log aktivitas:", err.message);
  }
}

/**
 * Auto-Migrasi foto base64 lama yang ada di tabel surveys/survey_photos ke berkas fisik disk.
 * Menurunkan penggunaan RAM hosting dari 80%+ kembali normal.
 */
export async function migrateExistingBase64Photos() {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'surveys'");
    if (tables.length === 0) return;

    const [rows] = await pool.query(`
      SELECT id, foto_depan, foto_dalam, foto_atap, foto_sanitasi 
      FROM surveys 
      WHERE foto_depan LIKE 'data:image%' 
         OR foto_dalam LIKE 'data:image%' 
         OR foto_atap LIKE 'data:image%' 
         OR foto_sanitasi LIKE 'data:image%'
      LIMIT 100
    `);

    if (rows.length > 0) {
      console.log(`[PhotoMigration] Menemukan ${rows.length} survei berisi foto base64 di basis data. Mengonversi ke disk file...`);
      for (const r of rows) {
        const updates = [];
        const params = [];
        for (const slot of ["depan", "dalam", "atap", "sanitasi"]) {
          const key = `foto_${slot}`;
          if (r[key] && typeof r[key] === "string" && r[key].startsWith("data:image")) {
            const fileUrl = saveBase64PhotoToDisk(r.id, slot, r[key]);
            if (fileUrl) {
              updates.push(`${key} = ?`);
              params.push(fileUrl);
            }
          }
        }
        if (updates.length > 0) {
          params.push(r.id);
          await pool.query(`UPDATE surveys SET ${updates.join(", ")} WHERE id = ?`, params);
        }
      }
      console.log(`[PhotoMigration] ✅ Berhasil migrasi batch foto survei ke disk. RAM basis data berhasil dihemat!`);
    }

    // Bersihkan juga survey_photos jika ada yang menyimpan base64
    try {
      const [photoRows] = await pool.query(`
        SELECT id, survey_id, slot, file_url 
        FROM survey_photos 
        WHERE file_url LIKE 'data:image%' 
        LIMIT 100
      `);
      if (photoRows.length > 0) {
        for (const p of photoRows) {
          const fileUrl = saveBase64PhotoToDisk(p.survey_id, p.slot || "depan", p.file_url);
          if (fileUrl) {
            await pool.query("UPDATE survey_photos SET file_url = ? WHERE id = ?", [fileUrl, p.id]);
          }
        }
      }
    } catch (_) {}
  } catch (err) {
    console.warn("[PhotoMigration] Lewati auto-migrasi foto base64:", err.message);
  }
}

// Jalankan auto migrasi foto di latar belakang saat modul dimuat
setTimeout(() => {
  migrateExistingBase64Photos().catch(() => {});
}, 3000);

// ==========================================
// 1. GET ALL SURVEYS
// ==========================================
async function handleGetSurveys(req, res) {
  try {
    const [surveys] = await pool.query(`
      SELECT s.*, 
             r.label AS rtrw_label, 
             u.nama AS surveyor_nama,
             u.jabatan AS surveyor_jabatan,
             COALESCE(u.id_petugas, s.created_by) AS petugas_id
      FROM surveys s
      LEFT JOIN rt_rws r ON s.rt_rw_id = r.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `);

    // Ambil foto dari tabel relasi survey_photos jika ada kolom foto yang belum lengkap
    let allPhotos = [];
    try {
      const [photoRows] = await pool.query("SELECT survey_id, slot, file_url FROM survey_photos");
      allPhotos = photoRows;
    } catch (e) {
      // Abaikan jika tabel survey_photos belum ada
    }

    const photosBySurvey = {};
    for (const ph of allPhotos) {
      if (!photosBySurvey[ph.survey_id]) {
        photosBySurvey[ph.survey_id] = {};
      }
      photosBySurvey[ph.survey_id]["foto_" + ph.slot] = ph.file_url;
    }

    for (const item of surveys) {
      if (item.skor_total !== undefined && item.skor_total !== null) item.skor_total = Number(item.skor_total);
      if (item.usia !== undefined && item.usia !== null) item.usia = parseInt(item.usia, 10);
      if (item.jumlah_jiwa !== undefined && item.jumlah_jiwa !== null) item.jumlah_jiwa = parseInt(item.jumlah_jiwa, 10);
      if (item.jumlah_lansia_balita !== undefined && item.jumlah_lansia_balita !== null) item.jumlah_lansia_balita = parseInt(item.jumlah_lansia_balita, 10);
      if (item.lama_tinggal !== undefined && item.lama_tinggal !== null) item.lama_tinggal = parseInt(item.lama_tinggal, 10);
      if (item.luas_bangunan !== undefined && item.luas_bangunan !== null) item.luas_bangunan = Number(item.luas_bangunan);
      if (item.luas_per_jiwa !== undefined && item.luas_per_jiwa !== null) item.luas_per_jiwa = Number(item.luas_per_jiwa);
      if (item.latitude !== undefined && item.latitude !== null) item.latitude = Number(item.latitude);
      if (item.longitude !== undefined && item.longitude !== null) item.longitude = Number(item.longitude);
      if (!item.akurasi_gps) item.akurasi_gps = "0";

      // Lengkapi foto dari survey_photos jika kolom foto di survey masih kosong
      if (photosBySurvey[item.id]) {
        for (const [k, v] of Object.entries(photosBySurvey[item.id])) {
          if (!item[k]) item[k] = v;
        }
      }

      // Decode JSON breakdown jika berupa string
      if (typeof item.breakdown === "string" && item.breakdown.trim().startsWith("{")) {
        try {
          item.breakdown = JSON.parse(item.breakdown);
        } catch (_) {}
      }
    }

    res.json({
      success: true,
      data: surveys
    });
  } catch (err) {
    console.error("Gagal mengambil data survei:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data survei: " + err.message
    });
  }
}

// ==========================================
// 2. SAVE / UPSERT SURVEY
// ==========================================
async function handleSaveSurvey(req, res) {
  const data = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
  const userAgent = req.headers["user-agent"] || null;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ success: false, message: "Data JSON tidak valid atau kosong." });
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    let isNew = !data.id;
    let oldRows = [];

    if (data.id) {
      [oldRows] = await pool.query("SELECT id, nik, status_verifikasi, catatan_admin FROM surveys WHERE id = ? LIMIT 1", [data.id]);
      if (oldRows.length === 0) {
        isNew = true;
      } else {
        // Cek tabrakan ID: jika ID sudah ada tapi NIK berbeda, jangan timpa data warga lain! Buat ID baru!
        const existingNik = (oldRows[0].nik || "").trim();
        const incomingNik = (data.nik || "").trim();
        if (incomingNik && existingNik && incomingNik !== existingNik) {
          console.warn(`[Collision Prevented] ID ${data.id} sudah ada untuk NIK ${existingNik}. Data baru dengan NIK ${incomingNik} dialokasikan UUID baru.`);
          isNew = true;
          data.id = "SRV-" + new Date().getFullYear() + "-" + crypto.randomUUID();
        }
      }
    }

    if (isNew) {
      if (!data.id) {
        data.id = "SRV-" + new Date().getFullYear() + "-" + crypto.randomUUID();
      }
      data.status_verifikasi = data.status_verifikasi || "MENUNGGU_VALIDASI";
      data.created_at = now;
    } else {
      // Auto-transition dari BUTUH_REVISI ke MENUNGGU_VALIDASI saat diperbaiki
      if (oldRows.length > 0 && oldRows[0].status_verifikasi === "BUTUH_REVISI") {
        data.status_verifikasi = "MENUNGGU_VALIDASI";
        data.revision_at = now;
        const existingNote = oldRows[0].catatan_admin || "";
        const stamp = new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        data.catatan_admin = `[Diperbaiki Petugas ${stamp}] ${existingNote}`;
      } else if (!data.status_verifikasi && oldRows.length > 0) {
        data.status_verifikasi = oldRows[0].status_verifikasi;
      }
    }

    data.status_verifikasi = data.status_verifikasi || "MENUNGGU_VALIDASI";

    // Validasi NIK & Resolusi Pembaruan / Perbaikan Data Warga
    const nik = (data.nik || "").trim();
    if (nik) {
      let queryCheck = "SELECT id, no_urut_bnba, nama_kk, rw, rt, status_verifikasi, catatan_admin FROM surveys WHERE nik = ? LIMIT 1";
      let paramsCheck = [nik];
      if (!isNew && data.id) {
        queryCheck = "SELECT id, no_urut_bnba, nama_kk, rw, rt, status_verifikasi, catatan_admin FROM surveys WHERE nik = ? AND id != ? LIMIT 1";
        paramsCheck = [nik, data.id];
      }
      const [dupRows] = await pool.query(queryCheck, paramsCheck);
      if (dupRows.length > 0) {
        const existing = dupRows[0];
        const incomingName = (data.nama_kk || "").toLowerCase().trim();
        const existingName = (existing.nama_kk || "").toLowerCase().trim();
        const isSameCitizen = !incomingName || !existingName ||
                              incomingName.includes(existingName) ||
                              existingName.includes(incomingName) ||
                              (data.rw && existing.rw && String(data.rw).padStart(2, "0") === String(existing.rw).padStart(2, "0"));

        if (isSameCitizen) {
          // INI ADALAH PERBAIKAN / PEMBARUAN (UPDATE) DATA UNTUK WARGA YANG SUDAH TERDAFTAR
          console.log(`[Update/Revisi] Menerima perbaikan data warga NIK ${nik} (${existing.nama_kk}). Mengupdate ID ${existing.id}...`);
          isNew = false;
          data.id = existing.id; // Hubungkan ke ID survei yang sudah ada di database
          data.no_urut_bnba = existing.no_urut_bnba; // Pertahankan nomor BNBA resmi warga ini

          // Jika status sebelumnya BUTUH_REVISI, otomatis alihkan ke MENUNGGU_VALIDASI
          if (existing.status_verifikasi === "BUTUH_REVISI") {
            data.status_verifikasi = "MENUNGGU_VALIDASI";
            data.revision_at = now;
            const existingNote = existing.catatan_admin || "";
            const stamp = new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            data.catatan_admin = `[Diperbaiki Petugas ${stamp}] ${existingNote}`;
          } else if (!data.status_verifikasi) {
            data.status_verifikasi = existing.status_verifikasi;
          }
        } else {
          // Jika NIK sama persis namun nama warga dan wilayahnya berbeda jauh, tolak duplikasi bantuan
          const rejectMsg = `Warga dengan NIK ${nik} sudah terdata sebelumnya atas nama ${existing.nama_kk} di RT ${existing.rt}/RW ${existing.rw} (No. BNBA: ${existing.no_urut_bnba}). Setiap warga hanya dapat didata 1 kali untuk mencegah duplikasi bantuan RTLH.`;
          
          await logActivity({
            action: "REJECTED_DUPLICATE",
            survey_id: data.id,
            nik: nik,
            nama_kk: data.nama_kk,
            user_id: data.created_by,
            user_nama: data.petugas_nama,
            rw: data.rw,
            rt: data.rt,
            status: "FAILED",
            ip_address: ip,
            user_agent: userAgent,
            message: rejectMsg,
            payload_backup: data
          });

          return res.status(409).json({
            success: false,
            message: rejectMsg
          });
        }
      }
    }

    // Resolusi No. Urut BNBA yang unik di basis data
    let needNewBnba = !data.no_urut_bnba;
    if (data.no_urut_bnba) {
      const [existingBnba] = await pool.query(
        "SELECT id FROM surveys WHERE no_urut_bnba = ? AND id != ? LIMIT 1",
        [data.no_urut_bnba, data.id || ""]
      );
      if (existingBnba.length > 0) {
        needNewBnba = true;
      }
    }

    if (needNewBnba) {
      const [[maxRow]] = await pool.query("SELECT MAX(CAST(SUBSTRING(no_urut_bnba, 11) AS UNSIGNED)) AS maxNum FROM surveys WHERE no_urut_bnba LIKE 'BNBA-%'");
      const nextCount = (maxRow.maxNum || 0) + 1;
      data.no_urut_bnba = `BNBA-${new Date().getFullYear()}-${String(nextCount).padStart(3, "0")}`;
    }
    data.updated_at = now;

    // Resolusi Identitas Surveyor
    const creatorRaw = data.created_by || data.user_id || data.petugas_id || null;
    const namaPetugas = data.petugas_nama || data.nama_petugas || null;
    let validUserId = null;

    if (creatorRaw) {
      const [userRows] = await pool.query(
        "SELECT id FROM users WHERE id = ? OR username = ? OR id_petugas = ? OR nip = ? LIMIT 1",
        [creatorRaw, creatorRaw, creatorRaw, creatorRaw]
      );
      if (userRows.length > 0) {
        validUserId = userRows[0].id;
      }
    }

    if (!validUserId && namaPetugas) {
      const [userRows] = await pool.query(
        "SELECT id FROM users WHERE LOWER(TRIM(nama)) = LOWER(TRIM(?)) OR nama LIKE ? LIMIT 1",
        [namaPetugas, `%${namaPetugas}%`]
      );
      if (userRows.length > 0) {
        validUserId = userRows[0].id;
      }
    }

    if (!validUserId && !isNew) {
      const [oldCreatorRows] = await pool.query("SELECT created_by FROM surveys WHERE id = ? LIMIT 1", [data.id]);
      if (oldCreatorRows.length > 0 && oldCreatorRows[0].created_by) {
        validUserId = oldCreatorRows[0].created_by;
      }
    }

    data.created_by = validUserId || creatorRaw || null;
    if (!data.petugas_nama) {
      data.petugas_nama = namaPetugas || data.nama || "Petugas Lapangan";
    }

    if (!data.tanggal_survey) {
      data.tanggal_survey = now.slice(0, 10);
    } else {
      data.tanggal_survey = String(data.tanggal_survey).slice(0, 10);
    }

    // Sanitasi UMK & Nominal
    if (!data.nilai_umk) {
      data.nilai_umk = 3736101;
    } else {
      data.nilai_umk = Number(String(data.nilai_umk).replace(/[^\d.]/g, "")) || 3736101;
    }

    if (data.penghasilan_nominal !== undefined && data.penghasilan_nominal !== "") {
      data.penghasilan_nominal = Number(String(data.penghasilan_nominal).replace(/[^\d.]/g, "")) || 0;
      if (!data.penghasilan) {
        data.penghasilan = "Rp " + data.penghasilan_nominal.toLocaleString("id-ID");
      }
    }

    data.aset_rumah_lain = data.aset_rumah_lain || "Tidak";
    data.lama_tinggal = parseInt(data.lama_tinggal || 1, 10);
    data.alamat_lengkap = data.alamat_lengkap || data.dusun || null;
    data.jumlah_lansia_balita = parseInt(data.jumlah_lansia_balita || 0, 10);
    data.bansos_diterima = data.bansos_diterima || "Belum Pernah";
    data.jenis_kloset = data.jenis_kloset || "1. Leher angsa";
    data.tpa_tinja = data.tpa_tinja || "1. Tangki septik";
    data.sempadan_sungai = data.sempadan_sungai || "Tidak (≥ 6 meter / Aman)";

    // Resolusi rt_rw_id
    let rtRwId = null;
    const rwVal = data.rw ? String(data.rw).padStart(2, "0") : null;
    const rtVal = data.rt ? String(data.rt).padStart(2, "0") : null;
    if (rwVal && rtVal) {
      const [rtRwRows] = await pool.query("SELECT id FROM rt_rws WHERE rw = ? AND rt = ? LIMIT 1", [rwVal, rtVal]);
      if (rtRwRows.length > 0) {
        rtRwId = rtRwRows[0].id;
      }
    }
    data.rt_rw_id = rtRwId;
    if (!data.akurasi_gps) data.akurasi_gps = "0";

    // =========================================================================
    // OPTIMASI KRITIS FOTO: SIMPAN BASE64 KE BERKAS FISIK (.JPG) DI DISK
    // Hanya simpan URL ringan (misal '/uploads/surveys/...') ke kolom basis data
    // =========================================================================
    for (const slot of ["depan", "dalam", "atap", "sanitasi"]) {
      const key = `foto_${slot}`;
      if (data[key] && typeof data[key] === "string" && (data[key].startsWith("data:image") || data[key].length > 500)) {
        const fileUrl = saveBase64PhotoToDisk(data.id, slot, data[key]);
        if (fileUrl) {
          data[key] = fileUrl; // Ganti base64 megabyte menjadi string URL ringan
        }
      }
    }

    // Kolom-kolom potensial tabel surveys
    const candidateColumns = [
      "id", "no_urut_bnba", "tanggal_survey", "created_by", "petugas_nama", "nik", "no_kk", "nama_kk",
      "jenis_kelamin", "usia", "lama_tinggal", "alamat_lengkap", "rt", "rw", "rt_rw_id", "jumlah_jiwa", "jumlah_lansia_balita",
      "pekerjaan", "penghasilan", "penghasilan_nominal", "nilai_umk",
      "status_rumah", "aset_rumah_lain", "status_tanah", "bansos_diterima", "pondasi", "sloof", "kolom",
      "ring_balok", "rangka_atap", "dinding", "lantai", "atap", "sanitasi", "jenis_kloset", "tpa_tinja",
      "sumber_air", "pencahayaan", "penghawaan", "spal", "sumber_listrik",
      "luas_bangunan", "latitude", "longitude", "akurasi_gps", "skor_total", "kategori_kelayakan",
      "kategori_label", "luas_per_jiwa", "sempadan_sungai", "rekomendasi_sistem", "status_verifikasi",
      "catatan_admin", "catatan_surveyor", "program_bantuan", "verified_at", "revision_at",
      "foto_depan", "foto_dalam", "foto_atap", "foto_sanitasi"
    ];

    // Deteksi kolom yang benar-benar ada di tabel surveys MySQL secara dinamis
    const [dbCols] = await pool.query("DESCRIBE surveys");
    const actualDbCols = new Set(dbCols.map(c => c.Field));

    const insertCols = [];
    const placeholders = [];
    const updateClauses = [];
    const values = [];

    for (const col of candidateColumns) {
      if (!actualDbCols.has(col)) continue;
      insertCols.push(col);
      placeholders.push("?");
      values.push(data[col] !== undefined ? data[col] : null);

      if (col !== "id") {
        updateClauses.push(`${col} = VALUES(${col})`);
      }
    }

    const sql = `
      INSERT INTO surveys (${insertCols.join(", ")})
      VALUES (${placeholders.join(", ")})
      ON DUPLICATE KEY UPDATE ${updateClauses.join(", ")}
    `;

    await pool.query(sql, values);

    // Sinkronisasi survey_photos (simpan URL path berkas, bukan base64)
    const photoMap = {
      depan: data.foto_depan,
      dalam: data.foto_dalam,
      atap: data.foto_atap,
      sanitasi: data.foto_sanitasi
    };

    for (const [slot, url] of Object.entries(photoMap)) {
      if (url) {
        try {
          await pool.query(
            `INSERT INTO survey_photos (survey_id, slot, file_url, caption)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE file_url = VALUES(file_url)`,
            [data.id, slot, url, `Foto ${slot} ${data.nama_kk || ""}`]
          );
        } catch (_) {}
      }
    }

    // Catat log verifikasi awal jika survei baru
    if (isNew) {
      try {
        await pool.query(
          `INSERT INTO survey_verifications (survey_id, verifier_id, verifier_nama, status_sebelumnya, status_baru, catatan)
           VALUES (?, ?, ?, NULL, ?, 'Pendaftaran survei baru di lapangan.')`,
          [data.id, validUserId, data.petugas_nama, data.status_verifikasi]
        );
      } catch (_) {}
    }

    // Catat ke activity_logs untuk audit trail & pemulihan
    await logActivity({
      action: isNew ? "INPUT_SURVEY" : "UPDATE_SURVEY",
      survey_id: data.id,
      nik: data.nik || null,
      nama_kk: data.nama_kk || null,
      user_id: validUserId,
      user_nama: data.petugas_nama,
      rw: data.rw,
      rt: data.rt,
      status: "SUCCESS",
      ip_address: ip,
      user_agent: userAgent,
      message: isNew ? `Data baru berhasil disimpan (BNBA: ${data.no_urut_bnba})` : `Data berhasil diperbarui (BNBA: ${data.no_urut_bnba})`,
      payload_backup: data
    });

    res.json({
      success: true,
      message: isNew ? "Data survei berhasil disimpan ke basis data." : "Data survei berhasil diperbarui.",
      id: data.id,
      survey: data
    });
  } catch (err) {
    console.error("Gagal menyimpan survei:", err);

    await logActivity({
      action: "SAVE_ERROR",
      survey_id: data?.id,
      nik: data?.nik,
      nama_kk: data?.nama_kk,
      user_id: data?.created_by,
      user_nama: data?.petugas_nama,
      rw: data?.rw,
      rt: data?.rt,
      status: "FAILED",
      ip_address: ip,
      user_agent: userAgent,
      message: err.message,
      payload_backup: data
    });

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan survei: " + err.message
    });
  }
}

// ==========================================
// 3. DELETE SURVEY (DENGAN CADANGAN KE LOG)
// ==========================================
async function handleDeleteSurvey(req, res) {
  const id = req.body?.id || req.params?.id;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
  const userAgent = req.headers["user-agent"] || null;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID survei tidak valid." });
  }

  try {
    // Ambil data survei sebelum dihapus untuk cadangan pemulihan di activity_logs
    let oldSurvey = null;
    try {
      const [survRows] = await pool.query("SELECT * FROM surveys WHERE id = ? LIMIT 1", [id]);
      if (survRows.length > 0) oldSurvey = survRows[0];
    } catch (_) {}

    // Hapus data relasi terlebih dahulu
    try { await pool.query("DELETE FROM survey_photos WHERE survey_id = ?", [id]); } catch (_) {}
    try { await pool.query("DELETE FROM survey_verifications WHERE survey_id = ?", [id]); } catch (_) {}
    try { await pool.query("DELETE FROM survey_parameter_scores WHERE survey_id = ?", [id]); } catch (_) {}

    await pool.query("DELETE FROM surveys WHERE id = ?", [id]);

    if (oldSurvey) {
      await logActivity({
        action: "DELETE_SURVEY",
        survey_id: id,
        nik: oldSurvey.nik,
        nama_kk: oldSurvey.nama_kk,
        user_nama: req.body?.petugas_nama || "Admin/Petugas",
        rw: oldSurvey.rw,
        rt: oldSurvey.rt,
        status: "SUCCESS",
        ip_address: ip,
        user_agent: userAgent,
        message: `Survei warga ${oldSurvey.nama_kk} (NIK: ${oldSurvey.nik}) dihapus. Cadangan data tersimpan untuk pemulihan sewaktu-waktu.`,
        payload_backup: oldSurvey
      });
    }

    res.json({
      success: true,
      message: "Data survei berhasil dihapus dari database (tersimpan cadangan di riwayat log aktivitas)."
    });
  } catch (err) {
    console.error("Gagal menghapus survei:", err);
    res.status(500).json({
      success: false,
      message: "SQL Error: " + err.message
    });
  }
}

// ==========================================
// 4. UPDATE VERIFICATION STATUS
// ==========================================
async function handleUpdateVerification(req, res) {
  const data = req.body || {};
  const id = data.id || req.params?.id;
  const status = data.status;
  const catatanAdmin = data.catatanAdmin || "";
  const programBantuan = data.programBantuan || null;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
  const userAgent = req.headers["user-agent"] || null;

  if (!id || !status) {
    return res.status(400).json({ success: false, message: "ID survei dan status verifikasi wajib diisi." });
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const verifiedAt = status === "TERVERIFIKASI" ? now : null;
    const revisionAt = status === "BUTUH_REVISI" ? now : null;

    const [prevRows] = await pool.query("SELECT * FROM surveys WHERE id = ?", [id]);
    const prevStatus = prevRows[0]?.status_verifikasi || "MENUNGGU_VALIDASI";

    let sql = `
      UPDATE surveys SET 
        status_verifikasi = ?,
        catatan_admin = ?,
        verified_at = ?,
        revision_at = ?,
        updated_at = ?
    `;
    const params = [status, catatanAdmin, verifiedAt, revisionAt, now];

    if (programBantuan !== null && programBantuan !== undefined) {
      sql += ", program_bantuan = ?";
      params.push(programBantuan);
    }
    sql += " WHERE id = ?";
    params.push(id);

    await pool.query(sql, params);

    // Catat ke riwayat verifikasi
    try {
      await pool.query(
        `INSERT INTO survey_verifications (survey_id, status_sebelumnya, status_baru, catatan, program_bantuan)
         VALUES (?, ?, ?, ?, ?)`,
        [id, prevStatus, status, catatanAdmin, programBantuan]
      );
    } catch (_) {}

    // Catat ke activity_logs
    await logActivity({
      action: "VERIFY_SURVEY",
      survey_id: id,
      nik: prevRows[0]?.nik || null,
      nama_kk: prevRows[0]?.nama_kk || null,
      user_nama: data.petugas_nama || "Admin Verifikator",
      rw: prevRows[0]?.rw || null,
      rt: prevRows[0]?.rt || null,
      status: "SUCCESS",
      ip_address: ip,
      user_agent: userAgent,
      message: `Status verifikasi diubah dari ${prevStatus} menjadi ${status}`,
      payload_backup: prevRows[0] || null
    });

    res.json({
      success: true,
      message: "Status verifikasi berhasil diperbarui dan tercatat di riwayat verifikasi database."
    });
  } catch (err) {
    console.error("Gagal memperbarui verifikasi:", err);
    res.status(500).json({
      success: false,
      message: "SQL Error: " + err.message
    });
  }
}

// ==========================================
// 5. GET ACTIVITY LOGS (AUDIT TRAIL)
// ==========================================
async function handleGetActivityLogs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || 100, 10), 500);
    const nik = (req.query.nik || "").trim();
    const status = (req.query.status || "").trim();
    const petugas = (req.query.petugas || "").trim();
    const action = (req.query.action || "").trim();

    let sql = `
      SELECT id, timestamp, user_id, user_nama, user_role, action, survey_id, nik, nama_kk, rw, rt,
             status, message, ip_address,
             CASE WHEN payload_backup IS NOT NULL AND payload_backup != '' THEN 1 ELSE 0 END AS has_backup
      FROM activity_logs
    `;
    const conditions = [];
    const params = [];

    if (nik) {
      conditions.push("nik LIKE ?");
      params.push(`%${nik}%`);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (petugas) {
      conditions.push("user_nama LIKE ?");
      params.push(`%${petugas}%`);
    }
    if (action) {
      conditions.push("action = ?");
      params.push(action);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY timestamp DESC, id DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error("Gagal mengambil activity logs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ==========================================
// 6. RESTORE SURVEY FROM LOG (PEMULIHAN 1-KLIK)
// ==========================================
async function handleRestoreFromLog(req, res) {
  const logId = req.body?.log_id || req.body?.id;
  if (!logId) {
    return res.status(400).json({ success: false, message: "ID log wajib disertakan." });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM activity_logs WHERE id = ? LIMIT 1", [logId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Data log aktivitas tidak ditemukan." });
    }
    const entry = rows[0];
    if (!entry.payload_backup) {
      return res.status(400).json({ success: false, message: "Catatan log ini tidak menyimpan cadangan data (payload_backup kosong)." });
    }

    let surveyData;
    try {
      surveyData = typeof entry.payload_backup === "string" ? JSON.parse(entry.payload_backup) : entry.payload_backup;
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: "Gagal memproses JSON cadangan: " + parseErr.message });
    }

    // Panggil handleSaveSurvey dengan data yang dipulihkan
    req.body = surveyData;
    return handleSaveSurvey(req, res);
  } catch (err) {
    console.error("Gagal memulihkan survei dari log:", err);
    res.status(500).json({ success: false, message: "Gagal memulihkan survei: " + err.message });
  }
}

// Route mapping (mendukung REST modern & alias PHP)
router.get("/", handleGetSurveys);
router.get("/get_surveys.php", handleGetSurveys);

router.post("/", handleSaveSurvey);
router.post("/save_survey.php", handleSaveSurvey);

router.post("/delete", handleDeleteSurvey);
router.post("/delete_survey.php", handleDeleteSurvey);
router.delete("/:id", handleDeleteSurvey);

router.post("/verify", handleUpdateVerification);
router.post("/update_verification.php", handleUpdateVerification);
router.put("/:id/verify", handleUpdateVerification);

// Rute Log Aktivitas & Pemulihan Data
router.get("/logs", handleGetActivityLogs);
router.get("/get_logs.php", handleGetActivityLogs);

router.post("/restore-from-log", handleRestoreFromLog);
router.post("/restore_survey.php", handleRestoreFromLog);

export default router;
