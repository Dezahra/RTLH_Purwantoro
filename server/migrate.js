import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const sqlPath = path.resolve(__dirname, "../src/data/config/sipelita_purwantoro_relasional.sql");

  if (!fs.existsSync(sqlPath)) {
    console.error("❌ File SQL tidak ditemukan di:", sqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf-8");
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";
  const dbName = process.env.DB_NAME || "sipelita_desa";

  console.log(" Menjalankan Migrasi Database SIPELITA");
  console.log(`Host     : ${host}:${port}`);
  console.log(`User     : ${user}`);
  console.log(` Database : ${dbName}`);

  try {
    // 1. Hubungkan ke MySQL Server terlebih dahulu (tanpa memilih database)
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    // 2. Buat database jika belum ada
    console.log(` Memastikan database '${dbName}' tersedia...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.query(`USE \`${dbName}\`;`);

    // 3. Eksekusi seluruh skema tabel & data awal
    console.log(" Mengeksekusi skema tabel relasional dan data awal...");
    await conn.query(sqlContent);

    console.log(" MIGRASI SUKSES!");
    console.log(` Database '${dbName}' siap digunakan.`);
    console.log(" Akun Default: Username: 'admin' | Password: 'password123'");

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("\n Gagal migrasi database:", err.message);
    console.error("\n Tips Solusi:");
    console.error("1. Pastikan service MySQL sudah aktif (misal: tombol Start MySQL di XAMPP).");
    console.error("2. Pastikan port, user, dan password di file .env sesuai dengan MySQL lokal Anda.");
    console.error(`   (Contoh XAMPP: DB_HOST=localhost, DB_PORT=3306, DB_USER=root, DB_PASSWORD=)`);
    process.exit(1);
  }
}

runMigration();
