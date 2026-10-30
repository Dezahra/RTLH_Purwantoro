/**
 * Export Helper SIPELITA Purwantoro
 * Menghasilkan file Excel (.xls) dan CSV (.csv) terstruktur lengkap dengan KOP / Judul Dokumen Resmi
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

export function generateKopMetadata(meta = {}) {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeFormatted = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }) + " WIB";

  const rw = meta.rwFilter === "ALL" || !meta.rwFilter ? "Semua RW" : `RW ${String(meta.rwFilter).padStart(2, "0")}`;
  const rt = meta.rtFilter === "ALL" || !meta.rtFilter ? "Semua RT" : `RT ${String(meta.rtFilter).padStart(2, "0")}`;
  const verif = meta.verifFilter === "ALL" || !meta.verifFilter ? "Semua Status" : meta.verifFilter.replace(/_/g, " ");

  return {
    instansi: "PEMERINTAH KOTA MALANG",
    kecamatan: "KECAMATAN BLIMBING - KELURAHAN PURWANTORO",
    aplikasi: "SISTEM INFORMASI PENDATAAN KELAYAKAN RUMAH TINGGAL (SIPELITA)",
    judul: "LAPORAN REKAPITULASI DATA SURVEI KELAYAKAN RUMAH TINGGAL (RTLH)",
    waktu: `${dateFormatted}, ${timeFormatted}`,
    pencetak: `${meta.actorName || "Admin Kelurahan"} (${meta.actorRole || "Staf"})`,
    cakupan: `${rw}, ${rt} | Verifikasi: ${verif}`,
    total: `${meta.totalCount || 0} Data Rumah Tangga`
  };
}

/**
 * Ekspor Data ke File CSV dengan KOP Dokumen Resmi
 * Mendukung pemisah titik koma (;) untuk Excel Indonesia atau koma (,) untuk Google Sheets
 */
export function exportSurveysToCSV(surveys, meta = {}, delimiter = ";") {
  const kop = generateKopMetadata({ ...meta, totalCount: surveys.length });
  const sep = delimiter;

  // 1. KOP / Judul Dokumen di Baris Atas
  const lines = [
    `"${kop.instansi}"`,
    `"${kop.kecamatan}"`,
    `"${kop.aplikasi}"`,
    `"${kop.judul}"`,
    `""`,
    `"Cakupan Wilayah"${sep}"${kop.cakupan}"${sep}""${sep}"Jumlah Data"${sep}"${kop.total}"`,
    `""` // Baris kosong sebelum tabel
  ];

  // 2. Header Kolom
  const headers = [
    "NO",
    "NO. URUT BNBA",
    "ID SURVEI",
    "TANGGAL SURVEI",
    "PETUGAS SURVEYOR",
    "NIK KEPALA KELUARGA",
    "NO. KARTU KELUARGA",
    "NAMA KEPALA KELUARGA",
    "JENIS KELAMIN",
    "USIA (THN)",
    "RW",
    "RT",
    "ALAMAT LENGKAP",
    "JUMLAH ANGGOTA JIWA",
    "ANGGOTA RENTAN (LANSIA/BALITA)",
    "LAMA TINGGAL (THN)",
    "PEKERJAAN UTAMA",
    "PENGHASILAN BULANAN",
    "NOMINAL PENGHASILAN (RP)",
    "STATUS KEPEMILIKAN RUMAH",
    "ASET RUMAH DI TEMPAT LAIN",
    "STATUS PENGUASAAN TANAH",
    "KONDISI PONDASI",
    "KONDISI SLOOF",
    "KONDISI KOLOM",
    "KONDISI RING BALOK",
    "KONDISI RANGKA ATAP",
    "KONDISI PENUTUP ATAP",
    "KONDISI DINDING",
    "KONDISI LANTAI",
    "FASILITAS SANITASI",
    "SUMBER AIR MINUM",
    "PENCAHAYAAN ALAMI",
    "PENGHAWAAN VENTILASI",
    "LUAS BANGUNAN (M2)",
    "LUAS LANTAI PER JIWA (M2)",
    "KECUKUPAN RUANG",
    "SPAL",
    "SUMBER LISTRIK",
    "KOORDINAT LATITUDE",
    "KOORDINAT LONGITUDE",
    "AKURASI GPS (M)",
    "STATUS VERIFIKASI",
    "CATATAN ADMIN / VERIFIKATOR"
  ];

  lines.push(headers.map(h => `"${h}"`).join(sep));

  // 3. Baris Data Rumah
  surveys.forEach((item, idx) => {
    const luas = Number(item.luas_bangunan) || 0;
    const jiwa = Number(item.jumlah_jiwa) || 1;
    const perJiwa = (luas / jiwa).toFixed(1);
    const kecukupan = Number(perJiwa) >= 7.2 ? "Memenuhi (>= 7.2 m2)" : "Tidak Memenuhi (< 7.2 m2)";

    const row = [
      idx + 1,
      item.no_urut_bnba || "-",
      item.id || "-",
      item.tanggal_survey || (item.created_at ? item.created_at.slice(0, 10) : "-"),
      item.petugas_nama || "-",
      `'${item.nik || ""}`,
      `'${item.no_kk || ""}`,
      item.nama_kk || "-",
      item.jenis_kelamin || "-",
      item.usia || 0,
      String(item.rw || "").padStart(2, "0"),
      String(item.rt || "").padStart(2, "0"),
      item.alamat_lengkap || item.dusun || "-",
      jiwa,
      item.jumlah_lansia_balita || 0,
      item.lama_tinggal ?? 0,
      item.pekerjaan || "-",
      item.penghasilan || "-",
      item.penghasilan_nominal || 0,
      item.status_rumah || "-",
      item.aset_rumah_lain || "Tidak",
      item.status_tanah || "-",
      item.pondasi || "-",
      item.sloof || "-",
      item.kolom || "-",
      item.ring_balok || "-",
      item.rangka_atap || "-",
      item.atap || "-",
      item.dinding || "-",
      item.lantai || "-",
      item.sanitasi || "-",
      item.sumber_air || "-",
      item.pencahayaan || "-",
      item.penghawaan || "-",
      luas,
      perJiwa,
      kecukupan,
      item.spal || "-",
      item.sumber_listrik || "PLN",
      item.latitude || "",
      item.longitude || "",
      item.akurasi_gps || "0",
      item.status_verifikasi || "MENUNGGU_VALIDASI",
      item.catatan_admin || "-"
    ];

    lines.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(sep));
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const rwTag = meta.rwFilter === "ALL" || !meta.rwFilter ? "SEMUA_RW" : `RW_${String(meta.rwFilter).padStart(2, "0")}`;
  const filename = `SIPELITA_DATA_RUMAH_${rwTag}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(blob, filename);
}

/**
 * Ekspor Data ke File Microsoft Excel (.xls) dengan KOP Resmi & Tabel Bergaris Rapi
 */
export function exportSurveysToExcel(surveys, meta = {}) {
  const kop = generateKopMetadata({ ...meta, totalCount: surveys.length });
  const colCount = 44;

  const headers = [
    "NO", "NO. BNBA", "ID SURVEI", "TANGGAL SURVEI", "PETUGAS SURVEYOR",
    "NIK KEPALA KELUARGA", "NO. KARTU KELUARGA", "NAMA KEPALA KELUARGA",
    "JENIS KELAMIN", "USIA (THN)", "RW", "RT", "ALAMAT LENGKAP",
    "JUMLAH JIWA", "LANSIA / BALITA", "LAMA TINGGAL",
    "PEKERJAAN UTAMA", "PENGHASILAN", "NOMINAL PENGHASILAN (RP)",
    "STATUS RUMAH", "ASET RUMAH LAIN", "STATUS TANAH",
    "PONDASI", "SLOOF", "KOLOM", "RING BALOK", "RANGKA ATAP", "PENUTUP ATAP",
    "DINDING", "LANTAI", "SANITASI", "SUMBER AIR", "PENCAHAYAAN", "PENGHAWAAN",
    "LUAS BGN (M2)", "LUAS/JIWA (M2)", "KECUKUPAN RUANG",
    "SPAL", "LISTRIK", "LATITUDE", "LONGITUDE", "AKURASI GPS (M)",
    "STATUS VERIFIKASI", "CATATAN ADMIN / VERIFIKATOR"
  ];

  let rowsHtml = "";
  surveys.forEach((item, idx) => {
    const luas = Number(item.luas_bangunan) || 0;
    const jiwa = Number(item.jumlah_jiwa) || 1;
    const perJiwa = (luas / jiwa).toFixed(1);
    const kecukupan = Number(perJiwa) >= 7.2 ? "Memenuhi" : "Tidak Memenuhi (<7.2 m2)";
    const bgRow = idx % 2 === 1 ? 'style="background-color: #f8fafc;"' : '';

    let badgeColor = "#0284c7";
    if (item.status_verifikasi === "TERVERIFIKASI") badgeColor = "#059669";
    else if (item.status_verifikasi === "BUTUH_REVISI") badgeColor = "#dc2626";

    rowsHtml += `
      <tr ${bgRow}>
        <td class="td-center">${idx + 1}</td>
        <td class="td-center"><strong>${escapeHtml(item.no_urut_bnba || "-")}</strong></td>
        <td class="td-center">${escapeHtml(item.id || "-")}</td>
        <td class="td-center">${escapeHtml(item.tanggal_survey || (item.created_at ? item.created_at.slice(0, 10) : "-"))}</td>
        <td class="td-cell">${escapeHtml(item.petugas_nama || "-")}</td>
        <td class="td-text-code">${item.nik || ""}</td>
        <td class="td-text-code">${item.no_kk || ""}</td>
        <td class="td-cell"><strong>${escapeHtml(item.nama_kk || "-")}</strong></td>
        <td class="td-center">${escapeHtml(item.jenis_kelamin || "-")}</td>
        <td class="td-center">${item.usia || 0}</td>
        <td class="td-text-code">${String(item.rw || "").padStart(2, "0")}</td>
        <td class="td-text-code">${String(item.rt || "").padStart(2, "0")}</td>
        <td class="td-cell">${escapeHtml(item.alamat_lengkap || item.dusun || "-")}</td>
        <td class="td-center">${jiwa}</td>
        <td class="td-center">${item.jumlah_lansia_balita || 0}</td>
        <td class="td-center">${item.lama_tinggal ?? 0} thn</td>
        <td class="td-cell">${escapeHtml(item.pekerjaan || "-")}</td>
        <td class="td-cell">${escapeHtml(item.penghasilan || "-")}</td>
        <td class="td-number">${Number(item.penghasilan_nominal || 0).toLocaleString("id-ID")}</td>
        <td class="td-cell">${escapeHtml(item.status_rumah || "-")}</td>
        <td class="td-center">${escapeHtml(item.aset_rumah_lain || "Tidak")}</td>
        <td class="td-cell">${escapeHtml(item.status_tanah || "-")}</td>
        <td class="td-cell">${escapeHtml(item.pondasi || "-")}</td>
        <td class="td-cell">${escapeHtml(item.sloof || "-")}</td>
        <td class="td-cell">${escapeHtml(item.kolom || "-")}</td>
        <td class="td-cell">${escapeHtml(item.ring_balok || "-")}</td>
        <td class="td-cell">${escapeHtml(item.rangka_atap || "-")}</td>
        <td class="td-cell">${escapeHtml(item.atap || "-")}</td>
        <td class="td-cell">${escapeHtml(item.dinding || "-")}</td>
        <td class="td-cell">${escapeHtml(item.lantai || "-")}</td>
        <td class="td-cell">${escapeHtml(item.sanitasi || "-")}</td>
        <td class="td-cell">${escapeHtml(item.sumber_air || "-")}</td>
        <td class="td-cell">${escapeHtml(item.pencahayaan || "-")}</td>
        <td class="td-cell">${escapeHtml(item.penghawaan || "-")}</td>
        <td class="td-number">${luas}</td>
        <td class="td-number">${perJiwa}</td>
        <td class="td-center">${escapeHtml(kecukupan)}</td>
        <td class="td-cell">${escapeHtml(item.spal || "-")}</td>
        <td class="td-cell">${escapeHtml(item.sumber_listrik || "PLN")}</td>
        <td class="td-number">${item.latitude || ""}</td>
        <td class="td-number">${item.longitude || ""}</td>
        <td class="td-center">${item.akurasi_gps || "0"}</td>
        <td class="td-center" style="color:${badgeColor}; font-weight:bold;">${escapeHtml(item.status_verifikasi || "MENUNGGU_VALIDASI")}</td>
        <td class="td-cell">${escapeHtml(item.catatan_admin || "-")}</td>
      </tr>
    `;
  });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data Survei RTLH</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        .kop-instansi { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14pt; font-weight: bold; text-align: center; }
        .kop-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5pt; font-weight: bold; text-align: center; }
        .kop-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13pt; font-weight: 900; text-align: center; color: #047857; }
        .kop-meta { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; color: #334155; }
        .th-header { background-color: #047857; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; text-align: center; vertical-align: middle; border: 1px solid #065f46; padding: 7px 5px; }
        .td-cell { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; vertical-align: middle; border: 1px solid #cbd5e1; padding: 5px; }
        .td-center { text-align: center; font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; vertical-align: middle; border: 1px solid #cbd5e1; padding: 5px; }
        .td-number { text-align: right; font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; vertical-align: middle; border: 1px solid #cbd5e1; padding: 5px; }
        .td-text-code { mso-number-format:"\\@"; text-align: center; font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; border: 1px solid #cbd5e1; padding: 5px; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="${colCount}" class="kop-instansi">${escapeHtml(kop.instansi)}</td></tr>
        <tr><td colspan="${colCount}" class="kop-sub">${escapeHtml(kop.kecamatan)}</td></tr>
        <tr><td colspan="${colCount}" class="kop-title">${escapeHtml(kop.judul)}</td></tr>
        <tr><td colspan="${colCount}" class="kop-meta" style="text-align:center;">${escapeHtml(kop.aplikasi)}</td></tr>
        <tr><td colspan="${colCount}" style="border-bottom: 2.5px solid #047857; height: 10px;"></td></tr>
        <tr><td colspan="${colCount}" style="height: 10px;"></td></tr>
        <tr>
          <td colspan="24" class="kop-meta" style="text-align: right;"><strong>Petugas / Pencetak:</strong> ${escapeHtml(kop.pencetak)}</td>
        </tr>
        <tr>
          <td colspan="20" class="kop-meta"><strong>Cakupan Wilayah:</strong> ${escapeHtml(kop.cakupan)}</td>
          <td colspan="24" class="kop-meta" style="text-align: right;"><strong>Jumlah Data:</strong> ${escapeHtml(kop.total)}</td>
        </tr>
        <tr><td colspan="${colCount}" style="height: 12px;"></td></tr>
        <thead>
          <tr>
            ${headers.map(h => `<th class="th-header">${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const rwTag = meta.rwFilter === "ALL" || !meta.rwFilter ? "SEMUA_RW" : `RW_${String(meta.rwFilter).padStart(2, "0")}`;
  const filename = `SIPELITA_DATA_RUMAH_${rwTag}_${new Date().toISOString().slice(0, 10)}.xls`;
  downloadBlob(blob, filename);
}

