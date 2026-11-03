import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";
  const database = process.env.DB_NAME || "sipelita_desa";

  console.log("=========================================");
  console.log("👤 INJEKSI AKUN ADMIN SIPELITA");
  console.log(`🌐 Target: ${user}@${host}:${port}/${database}`);
  console.log("=========================================");

  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    const hash = bcrypt.hashSync("password123", 10);

    const query = `
      INSERT INTO users (
        id, role, username, password, nama, nip, id_petugas, 
        jabatan, desa, kecamatan, kabupaten, telepon, email, 
        status, avatar, registered_at, approved_at, approved_by
      ) VALUES (
        'USR-PGW-001', 'admin', 'admin', ?, 'Administrator SIPELITA', 
        '19880415 201201 1 002', 'ADM-001', 'Admin Kelurahan', 
        'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 
        '081234567890', 'admin@purwantoro.malangkota.go.id', 
        'APPROVED', '👤', NOW(), NOW(), 'Sistem'
      )
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password),
        status = 'APPROVED';
    `;

    await conn.execute(query, [hash]);

    console.log("✅ BERHASIL! Akun admin aktif & siap login:");
    console.log("👤 Username : admin");
    console.log("🔑 Password : password123");
    console.log("🟢 Status   : APPROVED");
    console.log("=========================================");

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal membuat akun admin:", err.message);
    process.exit(1);
  }
}

seedAdmin();

