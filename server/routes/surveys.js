import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db.js";

const router = Router();

// ==========================================
// 1. GET ALL SURVEYS
// ==========================================
async function handleGetSurveys(req, res) {
  try {
    const [surveys] = await pool.query(`
      SELECT s.*, 
             r.label AS rtrw_label, 
             u.nama AS surveyor_nama,
             u.jabatan AS surveyor_jabatan
      FROM surveys s
      LEFT JOIN rt_rws r ON s.rt_rw_id = r.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `);

    // Ambil foto dari tabel relasi survey_photos jika ada
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
  if (!data || typeof data !== "object") {
    return res.status(400).json({ success: false, message: "Data JSON tidak valid atau kosong." });
  }

  try {
    const isNew = !data.id;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (isNew) {
      data.id = "SRV-" + new Date().getFullYear() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      data.status_verifikasi = data.status_verifikasi || "MENUNGGU_VALIDASI";
      data.created_at = now;
    } else {
      // Auto-transition dari BUTUH_REVISI ke MENUNGGU_VALIDASI saat diperbaiki
      const [oldRows] = await pool.query("SELECT status_verifikasi, catatan_admin FROM surveys WHERE id = ? LIMIT 1", [data.id]);
      if (oldRows.length > 0 && oldRows[0].status_verifikasi === "BUTUH_REVISI") {
        data.status_verifikasi = "MENUNGGU_VALIDASI";
        data.revision_at = now;
        const existingNote = oldRows[0].catatan_admin || "";
        const stamp = new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        data.catatan_admin = `[Diperbaiki Petugas ${stamp}] ${existingNote}`;
      }
    }

    // Validasi NIK & Duplikasi di Database
    const nik = (data.nik || "").trim();
    if (nik) {
      let queryCheck = "SELECT id, no_urut_bnba, nama_kk, rw, rt FROM surveys WHERE nik = ? LIMIT 1";
      let paramsCheck = [nik];
      if (!isNew) {
        queryCheck = "SELECT id, no_urut_bnba, nama_kk, rw, rt FROM surveys WHERE nik = ? AND id != ? LIMIT 1";
        paramsCheck = [nik, data.id];
      }
      const [dupRows] = await pool.query(queryCheck, paramsCheck);
      if (dupRows.length > 0) {
        const existing = dupRows[0];
        return res.status(409).json({
          success: false,
          message: isNew
            ? `Warga dengan NIK ${nik} sudah terdata sebelumnya atas nama ${existing.nama_kk} di RT ${existing.rt}/RW ${existing.rw} (No. BNBA: ${existing.no_urut_bnba}). Setiap warga hanya dapat didata 1 kali untuk mencegah duplikasi bantuan RTLH.`
            : `NIK ${nik} sudah digunakan pada data survei lain atas nama ${existing.nama_kk} (No. BNBA: ${existing.no_urut_bnba}).`
        });
      }
    }

    // Generate No. Urut BNBA jika kosong
    if (!data.no_urut_bnba) {
      const [[countRow]] = await pool.query("SELECT COUNT(*) AS total FROM surveys");
      const nextCount = (countRow.total || 0) + 1;
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
        "SELECT id FROM users WHERE LOWER(TRIM(nama)) = LOWER(TRIM(?)) LIMIT 1",
        [namaPetugas]
      );
      if (userRows.length > 0) {
        validUserId = userRows[0].id;
      }
    }

    data.created_by = validUserId;
    if (!data.petugas_nama) {
      data.petugas_nama = namaPetugas || data.nama || "Petugas Lapangan";
    }

    if (!data.tanggal_survey) {
      data.tanggal_survey = now.slice(0, 10);
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

    // Kolom-kolom tabel surveys
    const columns = [
      "id", "no_urut_bnba", "tanggal_survey", "created_by", "petugas_nama", "nik", "no_kk", "nama_kk",
      "jenis_kelamin", "usia", "lama_tinggal", "dusun", "rt", "rw", "rt_rw_id", "jumlah_jiwa", "pekerjaan",
      "penghasilan", "penghasilan_nominal", "nilai_umk", "status_rumah", "aset_rumah_lain", "status_tanah", "pondasi", "sloof", "kolom",
      "ring_balok", "rangka_atap", "dinding", "lantai", "atap", "sanitasi",
      "sumber_air", "pencahayaan", "penghawaan", "spal", "sumber_listrik",
      "luas_bangunan", "latitude", "longitude", "akurasi_gps", "skor_total", "kategori_kelayakan",
      "kategori_label", "luas_per_jiwa", "rekomendasi_sistem", "status_verifikasi",
      "catatan_admin", "program_bantuan", "verified_at", "revision_at",
      "foto_depan", "foto_dalam", "foto_atap", "foto_sanitasi"
    ];

    const insertCols = [];
    const placeholders = [];
    const updateClauses = [];
    const values = [];

    for (const col of columns) {
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

    // Sinkronisasi survey_photos
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

    res.json({
      success: true,
      message: isNew ? "Data survei berhasil disimpan ke basis data." : "Data survei berhasil diperbarui.",
      id: data.id,
      survey: data
    });
  } catch (err) {
    console.error("Gagal menyimpan survei:", err);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan survei: " + err.message
    });
  }
}

// ==========================================
// 3. DELETE SURVEY
// ==========================================
async function handleDeleteSurvey(req, res) {
  const id = req.body?.id || req.params?.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "ID survei tidak valid." });
  }

  try {
    // Hapus data relasi terlebih dahulu
    try { await pool.query("DELETE FROM survey_photos WHERE survey_id = ?", [id]); } catch (_) {}
    try { await pool.query("DELETE FROM survey_verifications WHERE survey_id = ?", [id]); } catch (_) {}
    try { await pool.query("DELETE FROM survey_parameter_scores WHERE survey_id = ?", [id]); } catch (_) {}

    await pool.query("DELETE FROM surveys WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Data survei berhasil dihapus dari database."
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

  if (!id || !status) {
    return res.status(400).json({ success: false, message: "ID survei dan status verifikasi wajib diisi." });
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const verifiedAt = status === "TERVERIFIKASI" ? now : null;
    const revisionAt = status === "BUTUH_REVISI" ? now : null;

    const [prevRows] = await pool.query("SELECT status_verifikasi FROM surveys WHERE id = ?", [id]);
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

// Route mapping (mendukung rute modern REST & alias format PHP)
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

export default router;

