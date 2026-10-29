import express from "express";
import multer from "multer";
import { ZipArchive } from "archiver";
import AdmZip from "adm-zip";
import pool from "../db.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

function formatBytes(bytes, precision = 2) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  bytes = Math.max(bytes, 0);
  const pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024));
  const minPow = Math.min(pow, units.length - 1);
  bytes /= Math.pow(1024, minPow);
  return `${Number(bytes.toFixed(precision))} ${units[minPow]}`;
}

function formatDateReadable(d = new Date()) {
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  });
}

// -----------------------------------------------------------------------------
// 1. STATS: Mengembalikan info jumlah data & status database
// -----------------------------------------------------------------------------
async function handleStats(req, res) {
  try {
    const tables = ["surveys", "users", "rt_rws", "survey_photos", "survey_verifications", "kriteria_penilaian"];
    const counts = {};

    for (const tbl of tables) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\``);
        counts[tbl] = Number(rows[0]?.cnt || 0);
      } catch (err) {
        counts[tbl] = 0;
      }
    }

    const statsKelayakan = {
      rlh: 0,
      rtlh_ringan: 0,
      rtlh_sedang: 0,
      rtlh_berat: 0
    };

    try {
      const [rows] = await pool.query(`
        SELECT kategori_kelayakan, COUNT(*) as jml 
        FROM surveys 
        GROUP BY kategori_kelayakan
      `);
      for (const row of rows) {
        const k = String(row.kategori_kelayakan || "").toLowerCase();
        if (k.includes("rlh") && !k.includes("rtlh")) statsKelayakan.rlh = Number(row.jml);
        else if (k.includes("ringan")) statsKelayakan.rtlh_ringan = Number(row.jml);
        else if (k.includes("sedang")) statsKelayakan.rtlh_sedang = Number(row.jml);
        else if (k.includes("berat")) statsKelayakan.rtlh_berat = Number(row.jml);
      }
    } catch (err) {}

    let sizeBytes = 0;
    try {
      const [rows] = await pool.query(`
        SELECT SUM(data_length + index_length) AS size 
        FROM information_schema.TABLES 
        WHERE table_schema = DATABASE()
      `);
      sizeBytes = Number(rows[0]?.size || 0);
    } catch (err) {}

    const now = new Date();
    return res.json({
      success: true,
      database: process.env.DB_NAME || "sipelita_desa",
      kelurahan: "Kelurahan Purwantoro",
      kecamatan: "Kecamatan Blimbing",
      kota: "Kota Malang",
      counts,
      stats_kelayakan: statsKelayakan,
      size_bytes: sizeBytes,
      size_formatted: formatBytes(sizeBytes),
      zip_supported: true,
      server_time: now.toISOString().slice(0, 19).replace("T", " "),
      server_time_iso: now.toISOString()
    });
  } catch (error) {
    console.error("Backup stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// 2. DOWNLOAD ZIP: Membuat arsip ZIP cadangan
// -----------------------------------------------------------------------------
async function handleDownloadZip(req, res) {
  try {
    const actorName = req.query.actor_name || req.body?.actor_name || "Admin / Pegawai Kelurahan";
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, "_").slice(0, 15);
    const dateReadable = formatDateReadable(now);
    const zipFilename = `SIPELITA_PURWANTORO_BACKUP_${timestamp}.zip`;
    const dbname = process.env.DB_NAME || "sipelita_desa";

    const tablesToDump = ["rt_rws", "users", "kriteria_penilaian", "surveys", "survey_photos", "survey_verifications"];
    const existingTables = [];

    for (const t of tablesToDump) {
      const [chk] = await pool.query(`SHOW TABLES LIKE '${t}'`);
      if (chk.length > 0) existingTables.push(t);
    }

    // A. Generate SQL Dump
    let sqlDump = "-- ==========================================================================\n";
    sqlDump += "-- SIPELITA PURWANTORO - PENCADANGAN BASIS DATA LENGKAP (SQL DUMP)\n";
    sqlDump += "-- Wilayah       : Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang\n";
    sqlDump += `-- Database      : ${dbname}\n`;
    sqlDump += `-- Waktu Ekspor  : ${dateReadable}\n`;
    sqlDump += `-- Diekspor Oleh : ${actorName}\n`;
    sqlDump += `-- Node/Express  : v${process.version}\n`;
    sqlDump += "-- ==========================================================================\n\n";
    sqlDump += "SET FOREIGN_KEY_CHECKS=0;\n";
    sqlDump += "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
    sqlDump += "SET time_zone = '+07:00';\n";
    sqlDump += "SET NAMES utf8mb4;\n\n";

    const tableCounts = {};

    for (const table of existingTables) {
      const [createRes] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRes[0]?.["Create Table"] || "";

      sqlDump += "-- --------------------------------------------------------------------------\n";
      sqlDump += `-- Struktur tabel untuk \`${table}\`\n`;
      sqlDump += "-- --------------------------------------------------------------------------\n";
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      const [dataRows] = await pool.query(`SELECT * FROM \`${table}\``);
      tableCounts[table] = dataRows.length;

      if (dataRows.length > 0) {
        sqlDump += `-- Dumping data untuk tabel \`${table}\` (${dataRows.length} baris)\n`;
        const columns = Object.keys(dataRows[0]);
        const colNames = columns.join("`, `");

        const chunkSize = 50;
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const valuesArr = chunk.map((row) => {
            const escapedValues = columns.map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return "NULL";
              return pool.escape(val);
            });
            return `(${escapedValues.join(", ")})`;
          });

          sqlDump += `INSERT INTO \`${table}\` (\`${colNames}\`) VALUES\n${valuesArr.join(",\n")};\n`;
        }
        sqlDump += "\n";
      }
    }

    sqlDump += "SET FOREIGN_KEY_CHECKS=1;\n";
    sqlDump += "-- === AKHIR DARI SQL DUMP SIPELITA PURWANTORO ===\n";

    // B. Generate JSON Datasets
    // 1. Surveys JSON
    let surveys = [];
    try {
      const [surveyRows] = await pool.query(`
        SELECT s.*, 
               r.label AS rtrw_label, 
               u.nama AS surveyor_nama,
               u.jabatan AS surveyor_jabatan
        FROM surveys s
        LEFT JOIN rt_rws r ON s.rt_rw_id = r.id
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.id ASC
      `);
      surveys = surveyRows.map((s) => {
        if (s.breakdown && typeof s.breakdown === "string") {
          try {
            s.breakdown = JSON.parse(s.breakdown);
          } catch (e) {}
        }
        return s;
      });
    } catch (e) {
      console.warn("Surveys export error:", e);
    }

    // 2. Users JSON
    let users = [];
    try {
      const [userRows] = await pool.query(`
        SELECT id, role, username, password, nama, nip, id_petugas, jabatan, 
               rt_rw_id, rw, rt, wilayah_tugas, desa, kecamatan, kabupaten, 
               telepon, email, status, avatar, registered_at, approved_at, 
               approved_by, rejected_at, reject_reason, created_at, updated_at
        FROM users 
        ORDER BY role ASC, id ASC
      `);
      users = userRows;
    } catch (e) {
      console.warn("Users export error:", e);
    }

    // 3. RT/RW JSON
    let rtrws = [];
    try {
      const [rtrwRows] = await pool.query("SELECT * FROM rt_rws ORDER BY rw ASC, rt ASC");
      rtrws = rtrwRows;
    } catch (e) {
      console.warn("RT/RW export error:", e);
    }

    // C. CSV Content
    let csvContent = "\uFEFF"; // UTF-8 BOM
    const csvHeaders = [
      "ID Survey", "No Urut BNBA", "Tanggal Survey", "Petugas Lapangan",
      "NIK", "No KK", "Nama Kepala Keluarga", "Jenis Kelamin", "Usia",
      "Lama Huni (Thn)", "RW", "RT", "Jumlah Jiwa",
      "Pekerjaan", "Penghasilan", "Penghasilan Nominal", "Nilai UMK",
      "Status Rumah", "Aset Rumah Lain", "Status Tanah",
      "Skor Kelayakan", "Kategori Kelayakan",
      "1. Pondasi", "2. Sloof", "3. Kolom", "4. Ring Balok", "5. Rangka Atap",
      "6. Dinding", "7. Lantai", "8. Penutup Atap", "9. Fasilitas Sanitasi",
      "10. Sumber Air Minum", "11. Pencahayaan", "12. Penghawaan",
      "13. Luas Bangunan (m2)", "Luas Lantai per Jiwa (m2/jiwa)",
      "SPAL", "Sumber Listrik",
      "Latitude", "Longitude", "Akurasi GPS (m)",
      "Status Verifikasi", "Catatan Admin", "Program Bantuan"
    ];
    csvContent += csvHeaders.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(";") + "\n";

    for (const item of surveys) {
      const row = [
        item.id ?? "",
        item.no_urut_bnba ?? "",
        item.tanggal_survey ?? "",
        item.petugas_nama ?? "",
        `'${item.nik ?? ""}`,
        `'${item.no_kk ?? ""}`,
        item.nama_kk ?? "",
        item.jenis_kelamin ?? "",
        item.usia ?? "",
        item.lama_tinggal ?? "",
        item.rw ?? "",
        item.rt ?? "",
        item.jumlah_jiwa ?? "",
        item.pekerjaan ?? "",
        item.penghasilan ?? "",
        item.penghasilan_nominal ?? "",
        item.nilai_umk ?? "3736101",
        item.status_rumah ?? "",
        item.aset_rumah_lain ?? "Tidak",
        item.status_tanah ?? "",
        item.skor_total ?? "",
        item.kategori_label ?? "",
        item.pondasi ?? "",
        item.sloof ?? "",
        item.kolom ?? "",
        item.ring_balok ?? "",
        item.rangka_atap ?? "",
        item.dinding ?? "",
        item.lantai ?? "",
        item.atap ?? "",
        item.sanitasi ?? "",
        item.sumber_air ?? "",
        item.pencahayaan ?? "",
        item.penghawaan ?? "",
        item.luas_bangunan ?? "",
        item.luas_per_jiwa ?? "",
        item.spal ?? "",
        item.sumber_listrik ?? "",
        item.latitude ?? "",
        item.longitude ?? "",
        item.akurasi_gps ?? "0",
        item.status_verifikasi ?? "",
        item.catatan_admin ?? "",
        item.program_bantuan ?? ""
      ];
      csvContent += row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
    }

    // D. Manifest JSON
    const manifest = {
      aplikasi: "SIPELITA (Sistem Informasi Pendataan Kelayakan Rumah Tinggal)",
      entitas: "Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang",
      versi_sistem: "2.5.0-js",
      waktu_cadangan: now.toISOString(),
      waktu_cadangan_lokal: dateReadable,
      dibuat_oleh: actorName,
      total_tabel: existingTables.length,
      ringkasan_data: tableCounts,
      arsip_berkas: {
        "database_dump.sql": "Skema DDL & DML lengkap MySQL untuk impor phpMyAdmin / CLI",
        "data_survei_rtlh.json": "Seluruh berkas survei rumah beserta koordinat",
        "data_pengguna_sistem.json": "Daftar akun admin, pegawai, dan enumerator lapangan",
        "data_master_rtrw.json": "Daftar RT dan RW resmi Kelurahan Purwantoro",
        "data_survei_lengkap.csv": "Data tabular untuk pengolahan spreadsheet Microsoft Excel",
        "manifest_cadangan.json": "Metadata integritas dan rincian berkas pencadangan",
        "README_PANDUAN_PEMULIHAN.txt": "Instruksi cara memulihkan / sinkronisasi data"
      }
    };

    // E. README
    let readme = "===============================================================================\n";
    readme += "PANDUAN PEMULIHAN & SINKRONISASI DATA SIPELITA KELURAHAN PURWANTORO\n";
    readme += "===============================================================================\n\n";
    readme += "Berkas ini dihasilkan secara otomatis oleh fitur Pencadangan Database SIPELITA (Node.js Engine).\n";
    readme += `Tanggal Pencadangan: ${dateReadable}\n`;
    readme += `Oleh: ${actorName}\n\n`;
    readme += "CARA PEMULIHAN (RESTORE) DATA:\n";
    readme += "1. Melalui Menu Aplikasi SIPELITA:\n";
    readme += "   - Masuk sebagai Admin / Pegawai Kelurahan.\n";
    readme += "   - Buka menu 'Cadangkan Database'.\n";
    readme += "   - Pada bagian 'Pulihkan & Sinkronkan Data', unggah file ZIP ini.\n";
    readme += "   - Klik tombol 'Unggah & Sinkronkan Data'.\n\n";
    readme += "2. Melalui phpMyAdmin:\n";
    readme += `   - Buka phpMyAdmin (http://localhost/phpmyadmin).\n`;
    readme += `   - Pilih database '${dbname}'.\n`;
    readme += "   - Masuk ke tab 'Import'.\n";
    readme += "   - Pilih file 'database_dump.sql' dari dalam ZIP ini.\n";
    readme += "   - Klik 'Go' / 'Kirim'.\n\n";
    readme += "3. Melalui MySQL Command Line (CLI):\n";
    readme += `   mysql -u root -p ${dbname} < database_dump.sql\n\n`;
    readme += "PENTING: Simpan arsip ZIP ini di tempat yang aman (Flashdisk/Google Drive Dinas)\n";
    readme += "sebagai salinan cadangan berkala Kelurahan Purwantoro.\n";

    // F. Archive via ZipArchive
    res.attachment(zipFilename);
    res.setHeader("Content-Type", "application/zip");

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.append(sqlDump, { name: "database_dump.sql" });
    archive.append(JSON.stringify(surveys, null, 2), { name: "data_survei_rtlh.json" });
    archive.append(JSON.stringify(users, null, 2), { name: "data_pengguna_sistem.json" });
    archive.append(JSON.stringify(rtrws, null, 2), { name: "data_master_rtrw.json" });
    archive.append(csvContent, { name: "data_survei_lengkap.csv" });
    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest_cadangan.json" });
    archive.append(readme, { name: "README_PANDUAN_PEMULIHAN.txt" });

    await archive.finalize();
  } catch (error) {
    console.error("Download ZIP error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Gagal membuat cadangan ZIP: " + error.message });
    }
  }
}

// -----------------------------------------------------------------------------
// 3. RESTORE / SYNC: Memulihkan database dari ZIP / SQL / JSON
// -----------------------------------------------------------------------------
async function handleRestore(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Berkas cadangan tidak ditemukan atau gagal diunggah." });
  }

  const fileName = req.file.originalname || "";
  const ext = fileName.split(".").pop().toLowerCase();

  let sqlToExecute = null;
  let jsonData = null;

  try {
    if (ext === "zip") {
      const zip = new AdmZip(req.file.buffer);
      const sqlEntry = zip.getEntry("database_dump.sql");

      if (sqlEntry) {
        sqlToExecute = zip.readAsText(sqlEntry);
      } else {
        const surveysEntry = zip.getEntry("data_survei_rtlh.json");
        const usersEntry = zip.getEntry("data_pengguna_sistem.json");
        if (surveysEntry) {
          jsonData = {
            surveys: JSON.parse(zip.readAsText(surveysEntry)),
            users: usersEntry ? JSON.parse(zip.readAsText(usersEntry)) : []
          };
        }
      }
    } else if (ext === "sql") {
      sqlToExecute = req.file.buffer.toString("utf8");
    } else if (ext === "json") {
      const parsed = JSON.parse(req.file.buffer.toString("utf8"));
      if (Array.isArray(parsed)) {
        jsonData = { surveys: parsed };
      } else if (parsed && typeof parsed === "object") {
        jsonData = parsed.surveys ? parsed : { surveys: [parsed] };
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Format berkas tidak didukung. Harap unggah file .ZIP, .SQL, atau .JSON."
      });
    }

    if (sqlToExecute) {
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");

      const statements = sqlToExecute
        .split(";\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      let executedCount = 0;
      for (const stmt of statements) {
        if (stmt.length > 0) {
          await pool.query(stmt);
          executedCount++;
        }
      }

      await pool.query("SET FOREIGN_KEY_CHECKS = 1");

      const [survCount] = await pool.query("SELECT COUNT(*) as cnt FROM surveys");
      const [usrCount] = await pool.query("SELECT COUNT(*) as cnt FROM users");

      return res.json({
        success: true,
        message: "Basis data berhasil dipulihkan dari SQL dump.",
        total_queries: executedCount,
        surveys_count: survCount[0]?.cnt || 0,
        users_count: usrCount[0]?.cnt || 0
      });
    } else if (jsonData && Array.isArray(jsonData.surveys) && jsonData.surveys.length > 0) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        let surveyCount = 0;

        const cols = [
          "id", "no_urut_bnba", "created_by", "petugas_nama", "petugas_id", "tanggal_survey",
          "nik", "no_kk", "nama_kk", "jenis_kelamin", "usia", "lama_tinggal",
          "rw", "rt", "rt_rw_id", "alamat_lengkap", "jumlah_jiwa", "jumlah_lansia_balita",
          "pekerjaan", "penghasilan", "penghasilan_nominal", "nilai_umk", "bansos_diterima",
          "status_rumah", "aset_rumah_lain", "status_tanah", "skor_total", "kategori_kelayakan",
          "kategori_label", "status_color", "rekomendasi_sistem", "pondasi", "sloof", "kolom",
          "ring_balok", "rangka_atap", "atap", "dinding", "lantai", "ventilasi", "sanitasi",
          "sumber_air", "sumber_listrik", "spal", "luas_bangunan", "luas_per_jiwa", "catatan_surveyor",
          "status_verifikasi", "catatan_admin", "program_bantuan", "latitude", "longitude", "akurasi_gps"
        ];

        for (const s of jsonData.surveys) {
          if (!s || !s.id) continue;
          const fields = [];
          const values = [];
          const updates = [];

          for (const c of cols) {
            if (Object.prototype.hasOwnProperty.call(s, c)) {
              fields.push(`\`${c}\``);
              values.push(typeof s[c] === "object" && s[c] !== null ? JSON.stringify(s[c]) : s[c]);
              updates.push(`\`${c}\` = VALUES(\`${c}\`)`);
            }
          }

          if (fields.length > 0) {
            const placeholders = fields.map(() => "?").join(", ");
            const sql = `INSERT INTO surveys (${fields.join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates.join(", ")}`;
            await connection.query(sql, values);
            surveyCount++;
          }
        }

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: `Berhasil menyinkronkan ${surveyCount} data survei ke basis data MySQL.`,
          surveys_count: surveyCount
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Tidak ditemukan data SQL atau JSON yang valid di dalam berkas cadangan."
      });
    }
  } catch (error) {
    console.error("Restore error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memulihkan cadangan: " + error.message
    });
  }
}

// Router dispatcher (supports query string action and direct paths)
function getDispatcher(req, res) {
  const action = req.query.action || "stats";
  if (action === "download_zip" || action === "download") {
    return handleDownloadZip(req, res);
  }
  return handleStats(req, res);
}

function postDispatcher(req, res) {
  const action = req.body?.action || req.query.action || "restore";
  if (action === "restore" || action === "sync") {
    return handleRestore(req, res);
  }
  return res.status(400).json({ success: false, message: `Action '${action}' tidak dikenali.` });
}

router.get("/", getDispatcher);
router.get("/backup_database.php", getDispatcher);

router.post("/", upload.single("backup_file"), postDispatcher);
router.post("/backup_database.php", upload.single("backup_file"), postDispatcher);

router.get("/stats", handleStats);
router.get("/download_zip", handleDownloadZip);
router.post("/restore", upload.single("backup_file"), handleRestore);

export default router;

