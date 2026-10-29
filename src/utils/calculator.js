// Kalkulator Penilaian Kelayakan Rumah Berdasarkan Standar Teknis BPS & Kementerian PUPR

export function calculateHousingEligibility(data) {
  const scoreABC = (value) => {
    if (value === "baik") return 100;
    if (value === "sedang") return 50;
    if (value === "buruk") return 0;

    return 0;
  };

  // 1. Aspek Keselamatan (Bobot 40%)
  const scorePondasi = scoreABC(data.pondasi);
  const scoreSloof = scoreABC(data.sloof);
  const scoreKolom = scoreABC(data.kolom);
  const scoreRingBalok = scoreABC(data.ring_balok);
  const scoreRangkaAtap = scoreABC(data.rangka_atap);

  const scoreKeselamatan = (
    scorePondasi +
    scoreSloof +
    scoreKolom +
    scoreRingBalok +
    scoreRangkaAtap
  ) / 5;

  // 2. Aspek Kesehatan & Sanitasi (Bobot 30%)
  let scoreSanitasi = 0;

  switch (String(data.sanitasi)) {

    case "1":
      scoreSanitasi = 100;
      break;

    case "2":
      scoreSanitasi = 80;
      break;

    case "3":
      scoreSanitasi = 60;
      break;

    case "4":
      scoreSanitasi = 40;
      break;

    case "5":
      scoreSanitasi = 20;
      break;

    case "6":
      scoreSanitasi = 0;
      break;

    default:
      scoreSanitasi = 0;
  }

  let scoreAir = 0;

  switch (String(data.sumber_air)) {

    case "1":
      scoreAir = 100;
      break;

    case "2":
      scoreAir = 100;
      break;

    case "3":
      scoreAir = 100;
      break;

    case "4":
      scoreAir = 90;
      break;

    case "5":
      scoreAir = 80;
      break;

    case "6":
      scoreAir = 50;
      break;

    case "7":
      scoreAir = 80;
      break;

    case "8":
      scoreAir = 50;
      break;

    case "9":
      scoreAir = 20;
      break;

    case "10":
      scoreAir = 60;
      break;

    case "11":
      scoreAir = 40;
      break;

    default:
      scoreAir = 0;
  }

  const scorePencahayaan = scoreABC(data.pencahayaan);
  const scorePenghawaan = scoreABC(data.penghawaan);
  const scoreKesehatan = (
    scoreSanitasi +
    scoreAir +
    scorePencahayaan +
    scorePenghawaan
  ) / 4;

  // 3. Aspek Bahan Bangunan (Bobot 20%)
  const scoreAtap = scoreABC(data.atap);
  const scoreDinding = scoreABC(data.dinding);
  const scoreLantai = scoreABC(data.lantai);

  const scoreBahan = (
    scoreAtap +
    scoreDinding +
    scoreLantai
  ) / 3;

  // 4. Aspek Kecukupan Ruang (Bobot 10%)
  const luasBangunan = Number(data.luas_bangunan) || 0;

  const jumlahJiwa = Math.max(
    1,
    Number(data.jumlah_jiwa) || 1
  );

  const luasPerJiwa = Number(
    (luasBangunan / jumlahJiwa).toFixed(1)
  );

  let scoreKecukupan = 0;

  if (luasPerJiwa >= 7.2) {
    scoreKecukupan = 100;
  } else {
    scoreKecukupan = 0;
  }
  // Kalkulasi Skor Total Tertimbang (0 - 100)
  const totalScore = Number((
    (scoreKeselamatan * 0.40) +
    (scoreKesehatan * 0.30) +
    (scoreBahan * 0.20) +
    (scoreKecukupan * 0.10)
  ).toFixed(1));

  // Klasifikasi kategori bertingkat telah dihilangkan sesuai kebijakan kelurahan
  let kategori = "";
  let kategoriLabel = "";
  let colorBadge = "badge-info";
  let statusColor = "#0284c7";
  let rekomendasi = "";
  // Validasi Kriteria Sosial Ekonomi (UMK Kota Malang & Aset Rumah)
  const nominalPenghasilan = Number(data.penghasilan_nominal) || 0;
  const umkAcuan = Number(data.nilai_umk) || 3736101;
  const isMelebihiUmk = nominalPenghasilan > umkAcuan;
  const memilikiAsetLain = data.aset_rumah_lain === "Ya";

  let statusKelayakanSosial = "MEMENUHI_SYARAT_MBR";
  let catatanKelayakanSosial = "Penghasilan memenuhi kriteria MBR (≤ UMK Kota Malang Rp 3.736.101)";

  if (isMelebihiUmk) {
    statusKelayakanSosial = "MELEBIHI_UMK";
    catatanKelayakanSosial = `Penghasilan (Rp ${nominalPenghasilan.toLocaleString('id-ID')}) melebihi UMK Kota Malang (Rp ${umkAcuan.toLocaleString('id-ID')})`;
  } else if (memilikiAsetLain) {
    statusKelayakanSosial = "MEMILIKI_RUMAH_LAIN";
    catatanKelayakanSosial = "Calon penerima terdata memiliki aset rumah lain (> 1 unit)";
  }

  return {

    totalScore,

    kategori,

    kategoriLabel,

    colorBadge,

    statusColor,

    rekomendasi,

    luasPerJiwa,

    statusKelayakanSosial,

    catatanKelayakanSosial,

    isMelebihiUmk,

    memilikiAsetLain,

    breakdown: {

      keselamatan: Math.round(scoreKeselamatan),

      kesehatan: Math.round(scoreKesehatan),

      bahan: Math.round(scoreBahan),

      kecukupan: Math.round(scoreKecukupan)
    },

    detail: {

      pondasi: scorePondasi,

      sloof: scoreSloof,

      kolom: scoreKolom,

      ring_balok: scoreRingBalok,

      rangka_atap: scoreRangkaAtap,

      sanitasi: scoreSanitasi,

      sumber_air: scoreAir,

      pencahayaan: scorePencahayaan,

      penghawaan: scorePenghawaan,

      atap: scoreAtap,

      dinding: scoreDinding,

      lantai: scoreLantai,

      luas_per_jiwa: luasPerJiwa
    }
  };
}