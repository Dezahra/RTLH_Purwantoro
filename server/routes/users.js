import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

// ==========================================
// 1. GET ALL USERS
// ==========================================
async function handleGetUsers(req, res) {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.nama, u.role, u.nip, u.id_petugas, 
             u.rt_rw_id, u.rw, u.rt, r.label AS rtrw_label, u.wilayah_tugas, 
             u.desa, u.kecamatan, u.kabupaten, u.jabatan, 
             u.telepon, u.telepon AS no_hp, u.email, u.avatar, u.status, 
             COALESCE(u.registered_at, u.created_at, NOW()) AS registered_at,
             COALESCE(u.created_at, u.registered_at, NOW()) AS created_at,
             u.approved_at, u.approved_by, 
             u.rejected_at, u.reject_reason, u.rejected_by
      FROM users u
      LEFT JOIN rt_rws r ON u.rt_rw_id = r.id
      ORDER BY u.id DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error("Gagal mengambil users:", err);
    res.status(500).json({ success: false, message: "SQL Error: " + err.message });
  }
}

// ==========================================
// 2. DELETE USER
// ==========================================
async function handleDeleteUser(req, res) {
  const id = req.body?.id || req.params?.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "ID user wajib disertakan." });
  }

  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({
      success: true,
      message: "Akun berhasil dihapus."
    });
  } catch (err) {
    console.error("Gagal menghapus user:", err);
    res.status(500).json({ success: false, message: "SQL Error: " + err.message });
  }
}

// ==========================================
// 3. UPDATE USER STATUS (APPROVE / REJECT / ROTATE / RESET)
// ==========================================
async function handleUpdateStatus(req, res) {
  const data = req.body || {};
  const id = data.id;
  const action = data.action;
  const actorName = data.actor_name || "Admin Kelurahan";
  const reason = data.reason || "";

  if (!id || !action) {
    return res.status(400).json({ success: false, message: "ID user dan aksi wajib disertakan." });
  }

  try {
    let msg = "";

    if (action === "approve") {
      await pool.query(
        "UPDATE users SET status = 'APPROVED', approved_at = NOW(), approved_by = ? WHERE id = ?",
        [actorName, id]
      );
      msg = "Akun berhasil disetujui dan diaktifkan.";
    } else if (action === "reject") {
      await pool.query(
        "UPDATE users SET status = 'REJECTED', rejected_at = NOW(), reject_reason = ?, rejected_by = ? WHERE id = ?",
        [reason, actorName, id]
      );
      msg = "Pendaftaran akun telah ditolak.";
    } else if (action === "delete") {
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      msg = "Akun berhasil dihapus dari sistem.";
    } else if (action === "reset_password") {
      const defaultPass = data.new_password || "password123";
      const hashed = bcrypt.hashSync(defaultPass, 10);
      await pool.query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [hashed, id]);
      msg = "Kata sandi akun berhasil direset menjadi: " + defaultPass;
    } else if (action === "rotate_wilayah") {
      const newRw = (data.rw || "").trim();
      if (!newRw) {
        return res.status(400).json({ success: false, message: "Wilayah RW tujuan wajib dipilih." });
      }
      const rwPad = String(newRw).padStart(2, "0");

      // Cek apakah RW sudah ditugaskan ke petugas lain yang aktif
      const [existing] = await pool.query(
        "SELECT id, nama FROM users WHERE role = 'petugas' AND LPAD(TRIM(rw), 2, '0') = ? AND id != ? AND status != 'REJECTED' LIMIT 1",
        [rwPad, id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Wilayah RW ${rwPad} sudah ditugaskan kepada petugas ${existing[0].nama}. Berdasarkan aturan 1 RW 1 Petugas, silakan pilih RW yang masih tersedia.`
        });
      }

      await pool.query(
        "UPDATE users SET rw = ?, rt = 'Semua', wilayah_tugas = ?, updated_at = NOW() WHERE id = ?",
        [rwPad, `RW ${rwPad} (Seluruh RT)`, id]
      );
      msg = `Wilayah penugasan petugas berhasil diubah ke RW ${rwPad} (Seluruh RT).`;
    } else {
      return res.status(400).json({ success: false, message: "Aksi tidak dikenali." });
    }

    res.json({
      success: true,
      message: msg
    });
  } catch (err) {
    console.error("Gagal update status user:", err);
    res.status(500).json({ success: false, message: "SQL Error: " + err.message });
  }
}

// ==========================================
// 4. UPDATE PROFILE
// ==========================================
async function handleUpdateProfile(req, res) {
  const data = req.body || {};
  const id = data.id;

  if (!id) {
    return res.status(400).json({ status: "error", message: "ID pengguna wajib disertakan." });
  }

  try {
    await pool.query(
      `UPDATE users 
       SET nama = COALESCE(?, nama),
           telepon = COALESCE(?, telepon),
           email = COALESCE(?, email),
           jabatan = COALESCE(?, jabatan),
           wilayah_tugas = COALESCE(?, wilayah_tugas),
           avatar = COALESCE(?, avatar),
           updated_at = NOW()
       WHERE id = ?`,
      [
        data.nama ?? null,
        data.telepon ?? null,
        data.email ?? null,
        data.jabatan ?? null,
        data.wilayah_tugas ?? null,
        data.avatar ?? null,
        id
      ]
    );

    const [userRows] = await pool.query(
      `SELECT id, role, username, nama, nip, id_petugas, jabatan, rw, rt, wilayah_tugas, 
              desa, kecamatan, kabupaten, telepon, email, status, avatar 
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      status: "success",
      success: true,
      message: "Profil berhasil diperbarui di database.",
      user: userRows[0]
    });
  } catch (err) {
    console.error("Gagal update profile:", err);
    res.status(500).json({ status: "error", success: false, message: "Gagal memperbarui database: " + err.message });
  }
}

// ==========================================
// 5. CHANGE PASSWORD
// ==========================================
async function handleChangePassword(req, res) {
  const { id, old_password, new_password } = req.body || {};

  if (!id || !old_password || !new_password) {
    return res.status(400).json({
      status: "error",
      message: "ID pengguna, kata sandi lama, dan kata sandi baru wajib diisi."
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      status: "error",
      message: "Kata sandi baru minimal 6 karakter."
    });
  }

  try {
    const [rows] = await pool.query("SELECT id, password FROM users WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
    }

    const user = rows[0];
    const normalizedHash = user.password.startsWith("$2y$")
      ? user.password.replace(/^\$2y\$/, "$2a$")
      : user.password;

    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(old_password, normalizedHash);
    } catch (_) {
      isMatch = false;
    }
    if (!isMatch && old_password === user.password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Kata sandi lama yang Anda masukkan tidak sesuai."
      });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await pool.query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [newHash, id]);

    res.json({
      status: "success",
      success: true,
      message: "Kata sandi berhasil diperbarui."
    });
  } catch (err) {
    console.error("Gagal ubah password:", err);
    res.status(500).json({ status: "error", success: false, message: "Kesalahan basis data: " + err.message });
  }
}

// Route mapping
router.get("/", handleGetUsers);
router.get("/get_users.php", handleGetUsers);

router.post("/delete", handleDeleteUser);
router.post("/delete_user.php", handleDeleteUser);
router.delete("/:id", handleDeleteUser);

router.post("/status", handleUpdateStatus);
router.post("/update_user_status.php", handleUpdateStatus);

router.post("/profile", handleUpdateProfile);
router.post("/update_profile.php", handleUpdateProfile);

router.post("/change-password", handleChangePassword);
router.post("/change_password.php", handleChangePassword);

export default router;
