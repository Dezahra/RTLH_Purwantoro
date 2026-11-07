import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const PETUGAS_PURWANTORO = [
  { no: 1, id_petugas: "PETUGAS-01", nama: "ISMA HARIANTI", username: "isma.harianti", rw: "04", rt: "01, 02, 03", wilayah_tugas: "RW 04 (RT 01, 02, 03)" },
  { no: 2, id_petugas: "PETUGAS-02", nama: "AGUSTIN SULIYATI", username: "agustin.suliyati", rw: "06", rt: "01, 02, 06", wilayah_tugas: "RW 06 (RT 01, 02, 06)" },
  { no: 3, id_petugas: "PETUGAS-03", nama: "RATNA INDAH SRI NING WULAN", username: "ratna.indah", rw: "06", rt: "03, 04, 05", wilayah_tugas: "RW 06 (RT 03, 04, 05)" },
  { no: 4, id_petugas: "PETUGAS-04", nama: "SRI HASTINI", username: "sri.hastini", rw: "07", rt: "01, 02, 03", wilayah_tugas: "RW 07 (RT 01, 02, 03)" },
  { no: 5, id_petugas: "PETUGAS-05", nama: "WIWIEK ISTY RAHAJU", username: "wiwiek.isty", rw: "07", rt: "04, 05, 06", wilayah_tugas: "RW 07 (RT 04, 05, 06)" },
  { no: 6, id_petugas: "PETUGAS-06", nama: "SUMIARTI", username: "sumiarti", rw: "07", rt: "07, 08, 09", wilayah_tugas: "RW 07 (RT 07, 08, 09)" },
  { no: 7, id_petugas: "PETUGAS-07", nama: "SRI UTAMI", username: "sri.utami", rw: "07", rt: "10, 11, 12", wilayah_tugas: "RW 07 (RT 10, 11, 12)" },
  { no: 8, id_petugas: "PETUGAS-08", nama: "INDRAWATI", username: "indrawati", rw: "07", rt: "13, 14, 15", wilayah_tugas: "RW 07 (RT 13, 14, 15)" },
  { no: 9, id_petugas: "PETUGAS-09", nama: "UMMU MAHDAH", username: "ummu.mahdah", rw: "09", rt: "01, 02, 03", wilayah_tugas: "RW 09 (RT 01, 02, 03)" },
  { no: 10, id_petugas: "PETUGAS-10", nama: "NIS ROTUL IAILAH", username: "nisrotul.iailah", rw: "09", rt: "04, 05, 06", wilayah_tugas: "RW 09 (RT 04, 05, 06)" },
  { no: 11, id_petugas: "PETUGAS-11", nama: "MUSTOFA", username: "mustofa", rw: "10", rt: "01, 05, 06", wilayah_tugas: "RW 10 (RT 01, 05, 06)" },
  { no: 12, id_petugas: "PETUGAS-12", nama: "ILHAM OCTAVIA", username: "ilham.octavia", rw: "10", rt: "02, 03, 04", wilayah_tugas: "RW 10 (RT 02, 03, 04)" },
  { no: 13, id_petugas: "PETUGAS-13", nama: "HERDYAN APRIANTO", username: "herdyan.aprianto", rw: "10", rt: "07, 08", wilayah_tugas: "RW 10 (RT 07, 08)" },
  { no: 14, id_petugas: "PETUGAS-14", nama: "NANIK NURHIDAYATI", username: "nanik.nurhidayati", rw: "11", rt: "01, 02, 03", wilayah_tugas: "RW 11 (RT 01, 02, 03)" },
  { no: 15, id_petugas: "PETUGAS-15", nama: "SUWARSIH", username: "suwarsih", rw: "11", rt: "04, 05", wilayah_tugas: "RW 11 (RT 04, 05)" },
  { no: 16, id_petugas: "PETUGAS-16", nama: "ACHMAD NADZIE", username: "achmad.nadzie", rw: "15", rt: "01, 02", wilayah_tugas: "RW 15 (RT 01, 02)" },
  { no: 17, id_petugas: "PETUGAS-17", nama: "FARISYATUL MUFRODAH", username: "farisyatul.mufrodah", rw: "15", rt: "03, 04, 10", wilayah_tugas: "RW 15 (RT 03, 04, 10)" },
  { no: 18, id_petugas: "PETUGAS-18", nama: "SILVI MUYASAROH", username: "silvi.muyasaroh", rw: "15", rt: "05, 06", wilayah_tugas: "RW 15 (RT 05, 06)" },
  { no: 19, id_petugas: "PETUGAS-19", nama: "VEGA YUSRIL", username: "vega.yusril", rw: "15", rt: "07, 08, 09", wilayah_tugas: "RW 15 (RT 07, 08, 09)" },
  { no: 20, id_petugas: "PETUGAS-20", nama: "VICKY WAHYU", username: "vicky.wahyu", rw: "16", rt: "01, 02, 03", wilayah_tugas: "RW 16 (RT 01, 02, 03)" },
  { no: 21, id_petugas: "PETUGAS-21", nama: "MUHAMMAD NIZAR", username: "muhammad.nizar", rw: "16", rt: "04, 05, 09", wilayah_tugas: "RW 16 (RT 04, 05, 09)" },
  { no: 22, id_petugas: "PETUGAS-22", nama: "MOCH. HASANUDIN", username: "moch.hasanudin", rw: "16", rt: "06, 07, 08", wilayah_tugas: "RW 16 (RT 06, 07, 08)" },
  { no: 23, id_petugas: "PETUGAS-23", nama: "ENDAH SETYORINI", username: "endah.setyorini", rw: "18", rt: "01, 02, 03", wilayah_tugas: "RW 18 (RT 01, 02, 03)" },
  { no: 24, id_petugas: "PETUGAS-24", nama: "SULISTIO RINI", username: "sulistio.rini", rw: "18", rt: "04, 05, 06", wilayah_tugas: "RW 18 (RT 04, 05, 06)" }
];

export async function seedAllUsers(connection) {
  const hash = bcrypt.hashSync("password123", 10);

  // 1. Injeksi Akun Admin
  const adminQuery = `
    INSERT INTO users (
      id, role, username, password, nama, nip, id_petugas, 
      jabatan, desa, kecamatan, kabupaten, telepon, email, 
      status, avatar, registered_at, approved_at, approved_by
    ) VALUES (
      'USR-PGW-001', 'admin', 'admin', ?, 'Administrator SIPELITA', 
      '19880415 201201 1 002', 'ADM-001', 'Admin Kelurahan', 
      'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 
      '081234567890', 'admin@purwantoro.malangkota.go.id', 
      'APPROVED', '🏢', NOW(), NOW(), 'Sistem Otomatis'
    )
    ON DUPLICATE KEY UPDATE 
      password = VALUES(password),
      status = 'APPROVED';
  `;
  await connection.execute(adminQuery, [hash]);

  // 2. Injeksi 24 Petugas Purwantoro
  for (const p of PETUGAS_PURWANTORO) {
    const userId = `USR-PTG-${String(p.no).padStart(2, "0")}`;
    const email = `${p.username}@purwantoro.malangkota.go.id`;
    const noHp = "081234567890";

    const query = `
      INSERT INTO users (
        id, role, username, password, nama, id_petugas, 
        jabatan, rw, rt, wilayah_tugas, desa, kecamatan, kabupaten, 
        telepon, email, status, avatar, registered_at, approved_at, approved_by
      ) VALUES (
        ?, 'petugas', ?, ?, ?, ?, 
        'Petugas Surveyor Lapangan', ?, ?, ?, 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 
        ?, ?, 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'
      )
      ON DUPLICATE KEY UPDATE 
        nama = VALUES(nama),
        password = VALUES(password),
        rw = VALUES(rw),
        rt = VALUES(rt),
        wilayah_tugas = VALUES(wilayah_tugas),
        status = 'APPROVED';
    `;

    await connection.execute(query, [
      userId,
      p.username,
      hash,
      p.nama,
      p.id_petugas,
      p.rw,
      p.rt,
      p.wilayah_tugas,
      noHp,
      email
    ]);
  }
}

async function runStandalone() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";
  const database = process.env.DB_NAME || "sipelita_desa";

  console.log("=========================================");
  console.log("👥 INJEKSI 24 PETUGAS + ADMIN SIPELITA");
  console.log(`🌐 Target: ${user}@${host}:${port}/${database}`);
  console.log("=========================================");

  try {
    const conn = await mysql.createConnection({ host, port, user, password, database });
    await seedAllUsers(conn);
    console.log("✅ BERHASIL! 24 Petugas Lapangan + 1 Admin telah aktif & siap login.");
    console.log("🔑 Password default semua akun: password123");
    console.log("=========================================");
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal injeksi akun:", err.message);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("seedAdmin.js") || process.argv[1]?.endsWith("seedUsers.js")) {
  runStandalone();
}
