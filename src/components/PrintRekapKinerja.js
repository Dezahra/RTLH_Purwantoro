import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { formatDateIndo } from "../utils/dateHelper.js";

export function renderPrintRekapKinerja() {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const pStats = storage.getPetugasStats();
  const { totalPetugasCount, activePetugasCount, totalSurveys, petugasList } = pStats;

  let totalValid = 0, totalPending = 0, totalRevisi = 0;
  petugasList.forEach(p => {
    totalValid += p.terverifikasi || 0;
    totalPending += p.pending || 0;
    totalRevisi += p.revisi || 0;
  });

  return `
    <div class="modal-backdrop" id="print-modal-backdrop">
      <div class="modal-dialog" style="max-width: 980px; width: 95%;">
        <div class="modal-header no-print">
          <div style="font-weight:700; display:flex; align-items:center; gap:0.5rem;">
            ${icons.printer('w-5 h-5 text-emerald-600')}
            <span>Pratinjau Laporan Rekapitulasi Capaian Kinerja Petugas Surveyor RTLH</span>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button class="btn btn-primary" id="btn-trigger-print-kinerja" style="background:#047857; border-color:#047857;">
              ${icons.printer('w-4 h-4')} Cetak Dokumen / Simpan PDF
            </button>
            <button class="btn btn-secondary" id="btn-close-print-kinerja">
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
              LAPORAN REKAPITULASI HASIL KINERJA PETUGAS SURVEYOR LAPANGAN
            </div>
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">
              PROGRAM PENDATAAN RUMAH TIDAK LAYAK HUNI (RTLH) TAHUN 2026
            </div>
            <div style="font-size: 9.5pt; margin-top: 2px;">
              Wilayah: <strong>Kelurahan Purwantoro (RW 01 s/d RW 24)</strong> • Periode Pemutakhiran: ${currentDate}
            </div>
          </div>

          <!-- Ringkasan Statistik -->
          <div style="margin-bottom: 12px; font-size: 9pt; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; border: 1px solid #333; padding: 6px 10px; background: #fafafa;">
            <div>Total Berkas Masuk: <strong>${totalSurveys} Unit</strong></div>
            <div>Petugas Aktif: <strong>${activePetugasCount} / ${totalPetugasCount} Orang</strong></div>
            <div>Terverifikasi Valid: <strong>${totalValid} Unit</strong></div>
            <div>Menunggu Validasi: <strong>${totalPending} Unit</strong></div>
            <div>Butuh Revisi: <strong>${totalRevisi} Unit</strong></div>
          </div>

          <!-- Tabel Rekapitulasi Kinerja -->
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 16px;">
            <thead>
              <tr style="background: #e5e7eb; text-align: center;">
                <th style="border: 1px solid #000; padding: 5px 3px; width: 28px;">No</th>
                <th style="border: 1px solid #000; padding: 5px 6px;">Petugas Surveyor</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 110px;">Wilayah Tugas</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 90px;">Total Input</th>
                <th style="border: 1px solid #000; padding: 5px 6px; width: 180px;">Rincian Status Berkas</th>
                <th style="border: 1px solid #000; padding: 5px 4px; width: 100px;">Survei Terakhir</th>
              </tr>
            </thead>
            <tbody>
              ${petugasList.length === 0 ? `
                <tr>
                  <td colspan="6" style="border: 1px solid #000; padding: 1.5rem; text-align: center; color: #666;">
                    Belum ada data petugas terdaftar.
                  </td>
                </tr>
              ` : petugasList.map((p, idx) => {
                const pct = totalSurveys > 0 ? Math.round((p.total_survei / totalSurveys) * 100) : 0;
                return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px 3px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px 6px;">
                      <div style="font-weight: bold;">${p.nama}</div>
                      <div style="font-size: 7.5pt; color: #444;">ID: ${p.id_petugas || p.id} • @${p.username}</div>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center;">
                      <div>${p.wilayah_tugas || '-'}</div>
                      ${p.telepon && p.telepon !== '-' ? `<div style="font-size: 7.5pt; color: #444;">${p.telepon}</div>` : ''}
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">
                      <div>${p.total_survei} Rumah</div>
                      <div style="font-size: 7.5pt; font-weight: normal; color: #444;">(${pct}% kontribusi)</div>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8pt;">
                      <div>• Valid: <strong>${p.terverifikasi}</strong> unit</div>
                      <div>• Menunggu: <strong>${p.pending}</strong> unit</div>
                      <div>• Revisi: <strong>${p.revisi}</strong> unit</div>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8pt;">
                      ${p.terakhir_input ? formatDateIndo(p.terakhir_input, 'short') : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Lembar Pengesahan Resmi (Tanda Tangan) -->
          <div style="display: flex; justify-content: space-between; font-size: 9pt; margin-top: 24px; page-break-inside: avoid;">
            <div style="width: 44%; text-align: center;">
              <div>Mengetahui / Memeriksa,</div>
              <div style="font-weight: bold; margin-top: 1px;">Kasi Pemberdayaan Masyarakat & Kesra</div>
              <div style="height: 55px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">admin</div>
              <div style="font-size: 8pt; color: #333;">NIP. 19880415 201201 1 002</div>
            </div>

            <div style="width: 44%; text-align: center;">
              <div>Malang, ${currentDate}</div>
              <div style="font-weight: bold; margin-top: 1px;">Lurah Purwantoro</div>
              <div style="height: 55px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">DWI CAHYONO, ST., MMT.</div>
              <div style="font-size: 8pt; color: #333;">Pembina</div>
              <div style="font-size: 8pt; color: #333;">NIP. 19780918 200501 1 009</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function initPrintRekapKinerjaEvents(container, { onClose }) {
  const backdrop = container.querySelector("#print-modal-backdrop");
  if (!backdrop) return;

  const closeBtn = container.querySelector("#btn-close-print-kinerja");
  const printTrigger = container.querySelector("#btn-trigger-print-kinerja");

  function close() {
    backdrop.remove();
    if (typeof onClose === "function") onClose();
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
