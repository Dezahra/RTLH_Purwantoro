import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

// ==========================================
// 1. LOGIN
// ==========================================
async function handleLogin(req, res) {
  const { username, password } = req.body || {};

  const cleanUser = (username || "").trim();
  const cleanPass = password || "";

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({
      success: false,
      code: "EMPTY_FIELDS",
      message: "Username dan kata sandi wajib diisi."
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM users
       WHERE username = ?
          OR email = ?
          OR nip = ?
          OR id_petugas = ?
       LIMIT 1`,
      [cleanUser, cleanUser, cleanUser, cleanUser]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: "NOT_FOUND",
        message: "Akun tidak ditemukan di sistem SIPELITA."
      });
    }

    const user = rows[0];

    // Verifikasi kata sandi (mendukung bcrypt hash PHP $2y$, $2a$, $2b$ dan plain text fallback)
    let isPasswordMatch = false;
    if (user.password) {
      const normalizedHash = user.password.startsWith("$2y$")
        ? user.password.replace(/^\$2y\$/, "$2a$")
        : user.password;

      try {
        isPasswordMatch = bcrypt.compareSync(cleanPass, normalizedHash);
      } catch (_) {
        isPasswordMatch = false;
      }

      if (!isPasswordMatch && cleanPass === user.password) {
        isPasswordMatch = true;
      }
    }

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        code: "WRONG_PASSWORD",
        message: "Kata sandi yang Anda masukkan salah."
      });
    }

    // Status Verifikasi Akun
    const status = (user.status || "PENDING").toUpperCase();
    if (status === "PENDING") {
      return res.status(403).json({
        success: false,
        code: "PENDING",
        message: "Akun Anda sedang menunggu persetujuan Admin Kelurahan."
      });
    }

    if (status === "REJECTED") {
      return res.status(403).json({
        success: false,
        code: "REJECTED",
        message: "Pendaftaran akun Anda ditolak oleh Admin Kelurahan."
      });
    }

    // Buang password sebelum dikirim ke frontend
    delete user.password;

    res.json({
      success: true,
      message: "Login berhasil.",
      user
    });
  } catch (err) {
    console.error("Gagal login:", err);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Terjadi kesalahan server database.",
      error: err.message
    });
  }
}

// ==========================================
// 2. REGISTER USER
// ==========================================
async function handleRegister(req, res) {
  const input = req.body || {};

  const role = (input.role || "petugas").trim();
  const nama = (input.nama || "").trim();
  const no_hp = (input.no_hp || input.telepon || "").trim();
  const username = (input.username || "").trim();
  const email = (input.email || "").trim();
  const password = input.password || "";
  let rw = (input.rw || "").trim();
  const rt = (input.rt || "").trim();
  let wilayah_tugas = (input.wilayah_tugas || "").trim();
  let id_petugas = (input.id_petugas || "").trim();
  let nip = (input.nip || "").trim();
  const jabatan = (input.jabatan || (role === "pegawai" ? "Pegawai Kelurahan" : "Petugas Surveyor Lapangan")).trim();

  if (!nama || !username || !password) {
    return res.status(400).json({
      success: false,
      message: "Nama, username, dan password wajib diisi."
    });
  }

  try {
    // 1. Cek duplikasi username / email
    const [dupUser] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR (email = ? AND email != '') LIMIT 1",
      [username, email]
    );
    if (dupUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username atau Email sudah terdaftar."
      });
    }

    // 2. Format RW dan Wilayah Tugas
    if (role === "petugas" && rw) {
      const rwPad = String(rw).padStart(2, "0");
      rw = rwPad;
      if (!wilayah_tugas) {
        wilayah_tugas = rt ? `RW ${rwPad} (RT ${rt})` : `RW ${rwPad}`;
      }
    }

    // 3. Resolusi rt_rw_id
    let rtRwId = null;
    if (rw) {
      const rwPad = String(rw).padStart(2, "0");
      const rtPad = rt ? String(rt).padStart(2, "0") : "01";
      const [rtrwRows] = await pool.query("SELECT id FROM rt_rws WHERE rw = ? AND rt = ? LIMIT 1", [rwPad, rtPad]);
      if (rtrwRows.length > 0) {
        rtRwId = rtrwRows[0].id;
      }
    }

    // 4. Generate ID User unik
    const randId = String(Math.floor(Math.random() * 900) + 100);
    const userId = role === "pegawai" ? `USR-PGW-${randId}` : `USR-PTG-${randId}`;

    if (role === "petugas") {
      if (!id_petugas) {
        const [[maxRow]] = await pool.query(
          "SELECT MAX(CAST(SUBSTRING(id_petugas, 9) AS UNSIGNED)) AS maxNum FROM users WHERE id_petugas LIKE 'PETUGAS-%'"
        );
        const nextNum = (maxRow.maxNum || 0) + 1;
        id_petugas = `PETUGAS-${String(nextNum).padStart(2, "0")}`;
      }
      nip = null;
    } else {
      id_petugas = null;
      if (!nip) nip = null;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await pool.query(
      `INSERT INTO users (
        id, role, username, password, nama, nip, id_petugas,
        telepon, email, jabatan, rt_rw_id, rw, rt, wilayah_tugas,
        desa, kecamatan, kabupaten, status, registered_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 'PENDING', NOW()
      )`,
      [
        userId, role, username, hashedPassword, nama, nip, id_petugas,
        no_hp, email, jabatan, rtRwId, rw, rt, wilayah_tugas
      ]
    );

    res.json({
      success: true,
      message: "Pendaftaran akun berhasil diajukan.",
      user_id: userId
    });
  } catch (err) {
    console.error("Gagal registrasi:", err);
    res.status(500).json({
      success: false,
      message: "Kesalahan database: " + err.message
    });
  }
}

router.post("/login", handleLogin);
router.post("/login.php", handleLogin);

router.post("/register", handleRegister);
router.post("/register_user.php", handleRegister);

export default router;

