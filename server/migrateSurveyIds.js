import { pool, standardizeAllSurveyIds } from "./db.js";

async function run() {
  console.log("\n========================================================");
  console.log(" MIGRASI PENYERAGAMAN ID DATA SURVEI RTLH PURWANTORO");
  console.log(" Standar Format: SRV-YYYY-XXXX (4-digit, urut rapi)");
  console.log("========================================================\n");

  try {
    const res = await standardizeAllSurveyIds(pool);
    console.log("\n--------------------------------------------------------");
    console.log(`✅ HASIL MIGRASI:`);
    console.log(`   - Total Berkas Diperiksa : ${res.count} data`);
    console.log(`   - Data Berhasil Diupdate : ${res.updated} data`);
    console.log("--------------------------------------------------------\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal menjalankan migrasi ID:", err.message);
    process.exit(1);
  }
}

run();
