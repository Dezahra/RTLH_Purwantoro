import { icons } from "../utils/icons.js";

function formatStructure(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("kondisi baik") || s.includes("kokoh")) return "Ada, kondisi baik, kokoh";
  if (s === "rapuh_sebagian" || s === "sedang" || s.includes("sebagian")) return "Ada, sebagian rapuh, tidak kokoh";
  if (s === "rapuh_seluruhnya" || s === "buruk" || s.includes("seluruhnya") || s.includes("tidak ada")) return "Tidak ada, seluruhnya rapuh";
  return val;
}

function formatDinding(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("tembok") || s.includes("kokoh")) return "Tembok diplester / kokoh";
  if (s === "sedang" || s.includes("retak")) return "Retak / tidak kedap air";
  if (s === "buruk" || s.includes("bambu") || s.includes("triplek")) return "Bambu tipis / triplek rapuh";
  return val;
}

function formatLantai(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("ubin") || s.includes("keramik") || s.includes("plester baik")) return "Plester / ubin / keramik baik";
  if (s === "sedang" || s.includes("pecah")) return "Plester pecah-pecah";
  if (s === "buruk" || s.includes("tanah")) return "Tanah / rapuh";
  return val;
}

function formatAtap(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("genteng") || s.includes("seng baik")) return "Genteng / seng kondisi baik";
  if (s === "sedang" || s.includes("bocor") || s.includes("rusak")) return "Sebagian rusak / bocor";
  if (s === "buruk" || s.includes("asbes") || s.includes("runtuh")) return "Asbes pecah / rawan runtuh";
  return val;
}

function formatSanitasi(val) {
  if (!val) return "-";
  const s = String(val).trim();
  const map = {
    "1": "Ada, digunakan sendiri dalam satu rumah",
    "2": "Ada, digunakan bersama beberapa rumah",
    "3": "Ada, di MCK komunal",
    "4": "Ada, di MCK umum",
    "5": "Ada, anggota keluarga tidak menggunakan",
    "6": "Tidak ada fasilitas jamban"
  };
  return map[s] || val;
}

function formatSumberAir(val) {
  if (!val) return "-";
  const s = String(val).trim();
  const map = {
    "1": "Air kemasan bermerek",
    "2": "Air isi ulang",
    "3": "Leding / PDAM",
    "4": "Sumur bor / pompa",
    "5": "Sumur terlindung",
    "6": "Sumur tak terlindung",
    "7": "Mata air terlindungi",
    "8": "Mata air tidak terlindungi",
    "9": "Air permukaan (sungai / danau)",
    "10": "Air hujan",
    "11": "Lainnya"
  };
  return map[s] || val;
}

function formatPencahayaan(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("terang")) return "Terang normal pada siang hari";
  if (s === "sedang" || s.includes("kurang")) return "Kurang terang";
  if (s === "buruk" || s.includes("gelap")) return "Gelap / perlu lampu di siang hari";
  return val;
}

function formatPenghawaan(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("cukup") || s.includes("sirkulasi")) return "Cukup ventilasi / sirkulasi baik";
  if (s === "sedang" || s.includes("kurang") || s.includes("agak")) return "Ventilasi kurang / agak pengap";
  if (s === "buruk" || s.includes("pengap") || s.includes("lembab")) return "Pengap / lembab / tanpa ventilasi";
  return val;
}

export function renderPrintReport(survey) {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const rwFormatted = survey.rw ? String(survey.rw).padStart(2, "0") : "-";
  const rtFormatted = survey.rt ? String(survey.rt).padStart(2, "0") : "-";

  // Evaluasi rekomendasi bansos RTLH
  const isRecommended = survey.status_verifikasi === "TERVERIFIKASI";

  // Penentuan alasan jika tidak direkomendasikan
  const isNoKKSendiri = !survey.no_kk || survey.no_kk === "-" || String(survey.no_kk).trim() === "";
  const isTanahSengketa = String(survey.status_tanah || "").toLowerCase().includes("sengketa");
  const isRumahLayak = survey.status_verifikasi !== "TERVERIFIKASI" && !isTanahSengketa && !isNoKKSendiri;
  const isRumahLebihDari1 = String(survey.aset_rumah_lain || "").toLowerCase() === "ya";
  const isGajiTinggi = Number(survey.penghasilan_nominal || 0) > Number(survey.nilai_umk || 3736101);

  return `
    <div class="modal-backdrop" id="print-modal-backdrop">
      <div class="modal-dialog" style="max-width: 860px;">
        <div class="modal-header no-print">
          <div style="font-weight:700;">Pratinjau Cetak Lembar Penilaian Calon Penerima Bantuan</div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary" id="btn-trigger-print">
              ${icons.printer('w-4 h-4')} Cetak Sekarang / Simpan PDF
            </button>
            <button class="btn btn-secondary" id="btn-close-print">
              ${icons.cross('w-4 h-4')}
            </button>
          </div>
        </div>

        <div class="modal-body" style="background:white; padding: 2.25rem 2.85rem; font-family: 'Times New Roman', Times, serif; color: black; line-height: 1.35;">
          <!-- Official Kop Surat Pemerintah Kota Malang -->
          <div class="official-kop" style="display: flex; align-items: center; gap: 16px; margin-bottom: 2px;">
            <div style="width: 80px; text-align: center; flex-shrink: 0;">
              <!-- Lambang Resmi Kota Malang Vector SVG -->
              <svg width="74" height="88" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Perisai Segi Lima Luar -->
                <polygon points="50,4 96,24 82,98 50,116 18,98 4,24" fill="#0284c7" stroke="#1e293b" stroke-width="2.5"/>
                <!-- Garis Emas Bingkai Dalam -->
                <polygon points="50,10 90,27 77,93 50,110 23,93 10,27" fill="#0369a1" stroke="#f59e0b" stroke-width="2"/>
                <!-- Bidang Hijau Bawah -->
                <path d="M23,93 L50,110 L77,93 L79,66 L21,66 Z" fill="#15803d"/>
                <!-- Sungai Brantas (Gelombang Biru Muda) -->
                <path d="M22,78 Q50,70 78,78 Q50,86 22,78 Z" fill="#38bdf8" opacity="0.85"/>
                <!-- Tugu Kota Malang (Monumen Tengah) -->
                <path d="M50,22 L55,30 L53,68 L47,68 L45,30 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
                <polygon points="50,18 53,24 47,24" fill="#f59e0b"/>
                <rect x="44" y="68" width="12" height="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
                <rect x="41" y="74" width="18" height="5" fill="#94a3b8" stroke="#0f172a" stroke-width="1"/>
                <!-- Bintang Kuning Emas di Puncak -->
                <polygon points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/>
                <!-- Untaian Padi (Kanan) & Kapas (Kiri) Simbolik -->
                <path d="M24,34 Q18,60 25,84" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M76,34 Q82,60 75,84" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none"/>
                <!-- Pita Semboyan Bawah -->
                <rect x="14" y="99" width="72" height="11" rx="3" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
                <text x="50" y="107.5" font-family="'Times New Roman', serif" font-size="6.8" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="0.5">MALANGKUÇEÇWARA</text>
              </svg>
            </div>
            <div class="kop-text" style="flex: 1; text-align: center;">
              <h3 style="font-size: 13.5pt; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
                PEMERINTAH KOTA MALANG
              </h3>
              <h2 style="font-size: 15pt; margin: 1px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
                KECAMATAN BLIMBING
              </h2>
              <h1 style="font-size: 17.5pt; margin: 1px 0; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000;">
                KELURAHAN PURWANTORO
              </h1>
              <p style="font-size: 8.5pt; margin: 2px 0 0 0; line-height: 1.35; color: #000;">
                Jl. Tembaga No. 3, Purwantoro, Kec. Blimbing, Kota Malang, Jawa Timur 65122<br/>
                Telepon: (0341) 491141 • Pos-el: kel-purwantoro@malangkota.go.id • Laman: kelpurwantoro.malangkota.go.id
              </p>
            </div>
          </div>

          <!-- Garis Ganda Resmi Kop Dinas (Tebal & Tipis) -->
          <div style="border-top: 2.5px solid #000; border-bottom: 1px solid #000; height: 3px; margin: 8px 0 12px 0;"></div>

          <div style="margin-bottom: 6px; font-size: 9.5pt;">
            <div style="font-weight: bold;">
              No. Urut BNBA: <span style="font-family: monospace; font-size: 10.5pt; border-bottom: 1.5px dotted #000; padding: 0 8px;">${survey.no_urut_bnba || '-'}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 8px 0 14px 0;">
            <h4 style="font-size: 12.5pt; text-decoration: underline; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              LEMBAR PENILAIAN CALON PENERIMA BANTUAN
            </h4>
          </div>

          <p style="font-size: 9.5pt; text-align: justify; margin-bottom: 8px; text-indent: 2rem;">
            Berdasarkan hasil survei verifikasi faktual dan penilaian teknis di lapangan oleh Petugas Surveyor Lapangan Tim Pendataan RTLH Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang pada tanggal <strong>${survey.tanggal_survey || currentDate}</strong>, dengan ini menerangkan data kepemilikan dan kondisi fisik rumah warga sebagai berikut:
          </p>

          <!-- Demographic Table (Nomor 1 s/d 11 Berurutan) -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt;">
            <tr>
              <td style="width: 32%; padding: 2px 0;">1. Nama</td>
              <td style="width: 2%;">:</td>
              <td style="font-weight: bold;">${survey.nama_kk || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">2. NIK</td>
              <td>:</td>
              <td style="font-weight: bold; font-family: monospace; font-size: 9.5pt;">${survey.nik || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">3. Nomor KK</td>
              <td>:</td>
              <td style="font-family: monospace; font-size: 9.5pt;">${survey.no_kk || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">4. Jenis Kelamin</td>
              <td>:</td>
              <td>${survey.jenis_kelamin || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">5. Umur</td>
              <td>:</td>
              <td>${survey.usia ? survey.usia + ' Tahun' : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">6. Alamat Lokasi Rumah</td>
              <td>:</td>
              <td>${survey.alamat_lengkap ? survey.alamat_lengkap + ', ' : ''}RT ${rtFormatted} / RW ${rwFormatted}, Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">7. Lama Huni</td>
              <td>:</td>
              <td>${survey.lama_tinggal ? survey.lama_tinggal + ' Tahun' : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">8. Jumlah Penghuni (Jiwa)</td>
              <td>:</td>
              <td>${survey.jumlah_jiwa || 1} Jiwa</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">9. Memiliki Aset Rumah Lainnya</td>
              <td>:</td>
              <td><strong>${survey.aset_rumah_lain || 'Tidak'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">10. Status Penguasaan Lahan</td>
              <td>:</td>
              <td>${survey.status_tanah || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">11. Titik Koordinat</td>
              <td>:</td>
              <td>Latitude: ${survey.latitude || '-'}, Longitude: ${survey.longitude || '-'} (Akurasi: ${(survey.akurasi_gps !== undefined && survey.akurasi_gps !== null && survey.akurasi_gps !== '') ? (String(survey.akurasi_gps) === '0' ? '0 / Pas' : (isNaN(survey.akurasi_gps) ? survey.akurasi_gps : `± ${survey.akurasi_gps} m`)) : '0 / Pas'})</td>
            </tr>
          </table>

          <!-- Evaluation Matrix (13 Parameter Teknis Lengkap Sesuai Standar PUPR) -->
          <div style="font-weight: bold; font-size: 9pt; margin-bottom: 3px;">
            HASIL EVALUASI PARAMETER KELAYAKAN HUNIAN (STANDAR KEMENTERIAN PUPR):
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8.5pt; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #000; padding: 2.5px 5px; width: 5%; text-align: center;">No</th>
                <th style="border: 1px solid #000; padding: 2.5px 8px; width: 38%;">Parameter Teknis</th>
                <th style="border: 1px solid #000; padding: 2.5px 8px; width: 57%;">Kondisi Eksisting Lapangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">1</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Pondasi</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatStructure(survey.pondasi)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">2</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Sloof</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatStructure(survey.sloof)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">3</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Kolom</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatStructure(survey.kolom || survey.kolom_balok)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">4</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Ring Balok</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatStructure(survey.ring_balok)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">5</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Rangka Atap</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatStructure(survey.rangka_atap)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">6</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Dinding</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatDinding(survey.dinding)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">7</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Lantai</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatLantai(survey.lantai)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">8</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Penutup Atap</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatAtap(survey.atap)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">9</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Fasilitas Jamban & Sanitasi</td>
                <td style="border: 1px solid #000; padding: 2px 8px;"><strong>${formatSanitasi(survey.sanitasi)}</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">10</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Sumber Air Minum Utama</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatSumberAir(survey.sumber_air)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">11</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Pencahayaan</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatPencahayaan(survey.pencahayaan)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">12</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Penghawaan</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${formatPenghawaan(survey.penghawaan || survey.ventilasi)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px 5px; text-align: center;">13</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">Luas Lantai / Kecukupan Ruang</td>
                <td style="border: 1px solid #000; padding: 2px 8px;">${survey.luas_bangunan || '-'} m² (${survey.luas_per_jiwa || '-'} m²/jiwa)</td>
              </tr>
            </tbody>
          </table>

          <!-- KESIMPULAN (PENGGANTI TOTAL SKOR) SESUAI FORMAT ACUAN GAMBAR -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt; border: 1.5px solid #000;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th colspan="2" style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; text-transform: uppercase; font-size: 9pt;">
                  KESIMPULAN
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <!-- Kolom Kiri: Direkomendasikan -->
                <td style="border: 1px solid #000; padding: 8px 10px; vertical-align: top; width: 33%;">
                  <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; font-size: 9pt;">
                    <span style="display: inline-block; width: 13px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 11px; font-size: 10px; font-weight: bold; flex-shrink: 0;">${isRecommended ? '✓' : ''}</span>
                    <span>Direkomendasikan Bansos RTLH</span>
                  </div>
                </td>

                <!-- Kolom Kanan: Tidak Direkomendasikan + Alasan (3 Kolom Sub-grid) -->
                <td style="border: 1px solid #000; padding: 8px 10px; vertical-align: top; width: 67%;">
                  <div style="font-weight: bold; font-size: 9pt; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 13px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 11px; font-size: 10px; font-weight: bold; flex-shrink: 0;">${!isRecommended ? '✓' : ''}</span>
                    <span>Tidak direkomendasikan Bansos RTLH, Alasan :</span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1.15fr 0.95fr 0.9fr; gap: 5px 10px; font-size: 8pt; line-height: 1.25;">
                    <!-- Sub-kolom 1 -->
                    <div>
                      <div style="display: flex; gap: 5px; align-items: flex-start; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;">${isNoKKSendiri ? '✓' : ''}</span>
                        <span>Belum memiliki KK Sendiri</span>
                      </div>
                      <div style="display: flex; gap: 5px; align-items: flex-start; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;">${isTanahSengketa ? '✓' : ''}</span>
                        <span>Tanah Bersengketa / tanpa bukti sah kepemilikan</span>
                      </div>
                      <div style="display: flex; gap: 5px; align-items: flex-start;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;">${isRumahLayak ? '✓' : ''}</span>
                        <span>Rumah layak huni/ rusak ringan</span>
                      </div>
                    </div>

                    <!-- Sub-kolom 2 -->
                    <div>
                      <div style="display: flex; gap: 5px; align-items: flex-start; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;">${isRumahLebihDari1 ? '✓' : ''}</span>
                        <span>Memiliki rumah &gt;1</span>
                      </div>
                      <div style="display: flex; gap: 5px; align-items: flex-start; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;"></span>
                        <span>Pernah Mendapat Bansos</span>
                      </div>
                      <div style="display: flex; gap: 5px; align-items: flex-start;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;">${isGajiTinggi ? '✓' : ''}</span>
                        <span>Penghasilan &gt;UMP/UMK</span>
                      </div>
                    </div>

                    <!-- Sub-kolom 3 -->
                    <div>
                      <div style="display: flex; gap: 5px; align-items: flex-start; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;"></span>
                        <span>Memilih bantuan lain</span>
                      </div>
                      <div style="display: flex; gap: 5px; align-items: flex-start;">
                        <span style="display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 9px; font-weight: bold; flex-shrink: 0; margin-top: 1px;"></span>
                        <span>Lainnya sebutkan...</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Attachments: 2 key photos -->
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1; text-align: center; border: 1px solid #999; padding: 3px;">
              ${survey.foto_depan && !survey.foto_depan.includes('sample-images') ? `
                <img src="${survey.foto_depan}" style="width: 100%; height: 95px; object-fit: cover; display:block;" alt="Foto Depan" />
              ` : `
                <div style="width: 100%; height: 95px; display:flex; align-items:center; justify-content:center; background:#f8fafc; color:#64748b; font-size:7.5pt; border:1px dashed #cbd5e1;">
                  [Belum Ada Foto Tampak Depan]
                </div>
              `}
              <div style="font-size: 7.5pt; margin-top: 2px; font-weight: bold;">Dokumentasi 1: Tampak Depan Bangunan Rumah</div>
            </div>
            <div style="flex: 1; text-align: center; border: 1px solid #999; padding: 3px;">
              ${(survey.foto_atap || survey.foto_dalam) && !(survey.foto_atap || survey.foto_dalam).includes('sample-images') ? `
                <img src="${survey.foto_atap || survey.foto_dalam}" style="width: 100%; height: 95px; object-fit: cover; display:block;" alt="Foto Kerusakan" />
              ` : `
                <div style="width: 100%; height: 95px; display:flex; align-items:center; justify-content:center; background:#f8fafc; color:#64748b; font-size:7.5pt; border:1px dashed #cbd5e1;">
                  [Belum Ada Foto Kerusakan / Atap]
                </div>
              `}
              <div style="font-size: 7.5pt; margin-top: 2px; font-weight: bold;">Dokumentasi 2: Kondisi Struktur / Atap / Sanitasi</div>
            </div>
          </div>

          <!-- SIGNATURES (TANDA TANGAN PENGESAHAN) -->
          <div style="margin-top: 14px; font-size: 9pt; page-break-inside: avoid;">
            <div style="text-align: right; margin-bottom: 8px; font-size: 9pt;">
              Malang, ${currentDate}
            </div>

            <!-- BARIS 1: CALON PENERIMA BANTUAN, SURVEYOR LAPANGAN, LURAH PURWANTORO SEJAJAR -->
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 18px;">
              <!-- 1. Calon Penerima Bantuan -->
              <div style="width: 31%;">
                <div>Diketahui oleh,</div>
                <div style="font-weight: bold; margin-top: 1px;">Calon Penerima Bantuan</div>
                <div style="height: 50px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 9.5pt;">${survey.nama_kk || 'Calon Penerima'}</div>
                <div style="font-size: 8pt; color: #333;">NIK: ${survey.nik || '-'}</div>
              </div>

              <!-- 2. Surveyor Lapangan -->
              <div style="width: 31%;">
                <div>Dilakukan oleh,</div>
                <div style="font-weight: bold; margin-top: 1px;">Surveyor Lapangan</div>
                <div style="height: 50px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 9.5pt;">${survey.petugas_nama || 'Petugas Surveyor'}</div>
                <div style="font-size: 8pt; color: #333;">ID Petugas: ${survey.petugas_id || 'PETUGAS-01'}</div>
              </div>

              <!-- 3. Lurah Purwantoro -->
              <div style="width: 32%;">
                <div>Mengetahui,</div>
                <div style="font-weight: bold; margin-top: 1px;">Lurah Purwantoro</div>
                <div style="height: 50px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 9.5pt;">DWI CAHYONO, ST., MMT.</div>
                <div style="font-size: 8pt; color: #333;">Pembina</div>
                <div style="font-size: 8pt; color: #333;">NIP. 19780918 200501 1 009</div>
              </div>
            </div>

            <!-- BARIS 2: KEPALA DINAS DI BAWAH (TENGAH) -->
            <div style="text-align: center; margin: 0 auto; width: 62%;">
              <div>Diperiksa oleh,</div>
              <div style="font-weight: bold; margin-top: 1px; line-height: 1.25;">
                Kepala Dinas Pekerjaan Umum, Penataan Ruang,<br/>
                Perumahan dan Kawasan Permukiman Kota Malang
              </div>
              <div style="height: 48px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 9.5pt;">Drs. R. DANDUNG DJULHARJANTO, MT</div>
              <div style="font-size: 8pt; color: #333;">Pembina Utama Muda</div>
              <div style="font-size: 8pt; color: #333;">NIP. 19680713 198903 1 008</div>
            </div>
          </div>
        </div>
    </div>
  `;
}

export function initPrintReportEvents(container, { onClose }) {
  const backdrop = container.querySelector("#print-modal-backdrop");
  if (!backdrop) return;

  const closeBtn = container.querySelector("#btn-close-print");
  const printTrigger = container.querySelector("#btn-trigger-print");

  function close() {
    backdrop.remove();
    onClose();
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  if (printTrigger) {
    printTrigger.addEventListener("click", () => {
      window.print();
    });
  }
}

