import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";

export function renderPrintRekapBnba(selectedRw = "ALL") {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const allSurveys = storage.getSurveys();
  const surveys = selectedRw === "ALL" 
    ? allSurveys 
    : allSurveys.filter(s => String(s.rw || "").padStart(2, "0") === selectedRw);

  // Sorting berdasarkan No. BNBA
  const sortedList = [...surveys].sort((a, b) => {
    return (a.no_urut_bnba || '').localeCompare(b.no_urut_bnba || '');
  });

  let countValid = 0, countPending = 0, countRevisi = 0;
  sortedList.forEach(s => {
    if (s.status_verifikasi === "TERVERIFIKASI") countValid++;
    else if (s.status_verifikasi === "BUTUH_REVISI") countRevisi++;
    else countPending++;
  });

  return `
    <div class="modal-backdrop" id="print-rekap-modal-backdrop">
      <div class="modal-dialog" style="max-width: 980px; width: 95%;">
        <div class="modal-header no-print">
          <div style="font-weight:700; display:flex; align-items:center; gap:0.5rem;">
            ${icons.printer('w-5 h-5 text-emerald-600')}
            <span>Pratinjau Laporan Rekapitulasi BNBA Kelurahan Purwantoro</span>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button class="btn btn-primary" id="btn-trigger-print-rekap" style="background:#047857; border-color:#047857;">
              ${icons.printer('w-4 h-4')} Cetak Dokumen / Simpan PDF
            </button>
            <button class="btn btn-secondary" id="btn-close-print-rekap">
              ${icons.cross('w-4 h-4')}
            </button>
          </div>
        </div>

        <div class="modal-body" style="background:white; padding: 2.25rem 2.85rem; font-family: 'Times New Roman', Times, serif; color: black; line-height: 1.3;">
          <!-- Kop Surat Resmi Kota Malang -->
          <div class="official-kop" style="display: flex; align-items: center; gap: 16px; margin-bottom: 2px;">
            <div style="width: 76px; text-align: center; flex-shrink: 0;">
              <svg width="70" height="84" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,4 96,24 82,98 50,116 18,98 4,24" fill="#0284c7" stroke="#1e293b" stroke-width="2.5"/>
                <polygon points="50,10 90,27 77,93 50,110 23,93 10,27" fill="#0369a1" stroke="#f59e0b" stroke-width="2"/>
                <path d="M23,93 L50,110 L77,93 L79,66 L21,66 Z" fill="#15803d"/>
                <path d="M22,78 Q50,70 78,78 Q50,86 22,78 Z" fill="#38bdf8" opacity="0.85"/>
                <path d="M50,22 L55,30 L53,68 L47,68 L45,30 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
                <polygon points="50,18 53,24 47,24" fill="#f59e0b"/>
                <rect x="44" y="68" width="12" height="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
                <rect x="41" y="74" width="18" height="5" fill="#94a3b8" stroke="#0f172a" stroke-width="1"/>
                <polygon points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/>
              </svg>
            </div>

            <div style="flex: 1; text-align: center; line-height: 1.15;">
              <div style="font-size: 13pt; font-weight: bold; letter-spacing: 0.5px;">PEMERINTAH KOTA MALANG</div>
              <div style="font-size: 12pt; font-weight: bold; letter-spacing: 0.5px;">KECAMATAN BLIMBING</div>
              <div style="font-size: 15pt; font-weight: bold; letter-spacing: 1px; margin: 2px 0;">KELURAHAN PURWANTORO</div>
              <div style="font-size: 8.5pt; font-family: Arial, Helvetica, sans-serif; color: #111;">
                Jl. Tembaga No. 1, Telp. (0341) 491196, Email: kel-purwantoro@malangkota.go.id, Kode Pos 65122
              </div>
            </div>
          </div>

          <!-- Garis Pemisah Kop -->
          <div style="border-top: 3px solid black; margin-top: 6px; margin-bottom: 2px;"></div>
          <div style="border-top: 1px solid black; margin-bottom: 14px;"></div>

          <!-- Judul Laporan -->
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">
              DAFTAR NOMINATIF REKAPITULASI CALON PENERIMA BANTUAN
            </div>
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">
              RUMAH TIDAK LAYAK HUNI (RTLH) KELURAHAN PURWANTORO
            </div>
            <div style="font-size: 9.5pt; margin-top: 2px;">
              Wilayah: <strong>${selectedRw === "ALL" ? "Seluruh Rukun Warga (RW 01 – RW 24)" : `Rukun Warga (RW) ${selectedRw}`}</strong> • Tahun Anggaran 2026 / 2027
            </div>
          </div>

          <!-- Ringkasan Statistik -->
          <div style="margin-bottom: 12px; font-size: 9pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; border: 1px solid #333; padding: 6px 10px; background: #fafafa;">
            <div>Total Terdaftar: <strong>${sortedList.length} Unit</strong></div>
            <div>Terverifikasi Valid: <strong>${countValid} Unit</strong></div>
            <div>Menunggu Validasi: <strong>${countPending} Unit</strong></div>
            <div>Butuh Revisi: <strong>${countRevisi} Unit</strong></div>
          </div>

          <!-- Tabel Rekapitulasi BNBA -->
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 16px;">
            <thead>
              <tr style="background: #e5e7eb; text-align: center;">
                <th style="border: 1px solid #000; padding: 5px 3px; width: 28px;">No</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 85px;">No. BNBA</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 110px;">NIK / No. KK</th>
                <th style="border: 1px solid #000; padding: 5px 6px;">Nama Kepala Keluarga</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 65px;">RW / RT</th>
                <th style="border: 1px solid #000; padding: 5px 6px; width: 130px;">Luas & Status Kepemilikan</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 85px;">Validasi</th>
              </tr>
            </thead>
            <tbody>
              ${sortedList.length === 0 ? `
                <tr>
                  <td colspan="7" style="border: 1px solid #000; padding: 1.5rem; text-align: center; color: #666;">
                    Belum ada data warga terdaftar untuk kriteria wilayah yang dipilih.
                  </td>
                </tr>
              ` : sortedList.map((item, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 4px 3px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center; font-family: monospace; font-weight: bold;">
                    ${item.no_urut_bnba || '-'}
                  </td>
                  <td style="border: 1px solid #000; padding: 4px; line-height: 1.2;">
                    <div>${item.nik || '-'}</div>
                    <div style="font-size: 7.5pt; color: #444;">KK: ${item.no_kk || '-'}</div>
                  </td>
                  <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">
                    ${item.nama_kk || '-'}
                  </td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center;">
                    RW ${item.rw ? String(item.rw).padStart(2, '0') : '-'}<br/>RT ${item.rt ? String(item.rt).padStart(2, '0') : '-'}
                  </td>
                  <td style="border: 1px solid #000; padding: 4px 6px; line-height: 1.15;">
                    ${item.luas_bangunan || '-'} m² (${item.status_rumah || '-'})
                  </td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8pt; font-weight: bold;">
                    ${item.status_verifikasi === 'TERVERIFIKASI' ? '✓ VALID' : (item.status_verifikasi === 'BUTUH_REVISI' ? 'REVISI' : 'MENUNGGU')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Tanda Tangan Pengesahan -->
          <div style="margin-top: 18px; font-size: 9.5pt; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 20px;">
              <div style="width: 44%;">
                <div>Mengetahui / Memverifikasi,</div>
                <div style="font-weight: bold; margin-top: 1px;">Kasi Pemberdayaan Masyarakat & Kesra</div>
                <div style="height: 55px;"></div>
                <div style="font-weight: bold; text-decoration: underline;">DEVI ZAHRA SAFRIDA</div>
                <div style="font-size: 8pt; color: #333;">NIP. 19880415 201201 1 002</div>
              </div>

              <div style="width: 44%;">
                <div>Malang, ${currentDate}</div>
                <div style="font-weight: bold; margin-top: 1px;">Lurah Purwantoro</div>
                <div style="height: 55px;"></div>
                <div style="font-weight: bold; text-decoration: underline;">DWI CAHYONO, ST., MMT.</div>
                <div style="font-size: 8pt; color: #333;">Pembina</div>
                <div style="font-size: 8pt; color: #333;">NIP. 19780918 200501 1 009</div>
              </div>
            </div>

            <!-- Bagian Bawah: Menyetujui Kepala Dinas -->
            <div style="text-align: center; margin: 0 auto; width: 65%;">
              <div>Menyetujui,</div>
              <div style="font-weight: bold; margin-top: 1px; line-height: 1.25;">
                Kepala Dinas Pekerjaan Umum, Penataan Ruang,<br/>
                Perumahan dan Kawasan Permukiman Kota Malang
              </div>
              <div style="height: 50px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">Drs. R. DANDUNG DJULHARJANTO, MT</div>
              <div style="font-size: 8pt; color: #333;">Pembina Utama Muda</div>
              <div style="font-size: 8pt; color: #333;">NIP. 19680713 198903 1 008</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initPrintRekapBnbaEvents(container, { onClose }) {
  const backdrop = container.querySelector("#print-rekap-modal-backdrop");
  if (!backdrop) return;

  const closeBtn = container.querySelector("#btn-close-print-rekap");
  const printTrigger = container.querySelector("#btn-trigger-print-rekap");

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
