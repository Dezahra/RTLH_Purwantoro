import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { formatDateIndo } from "../utils/dateHelper.js";

/**
 * Render Halaman Utama Menu Analisis Kinerja Petugas
 */
export function renderPetugasAnalysisPage() {
  const pStats = storage.getPetugasStats();
  const { totalPetugasCount, activePetugasCount, topPetugas, totalSurveys } = pStats;
  const avgSurveys = activePetugasCount > 0 ? (totalSurveys / activePetugasCount).toFixed(1) : 0;

  return `
    <div style="display:flex; flex-direction:column; gap:1.25rem;">
      
      <!-- KPI Overview Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        
        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
          <div class="kpi-header">
            <span class="kpi-title">Total Data Terinput</span>
            <div class="kpi-icon-wrap" style="color:#2563eb;">${icons.clipboard('w-5 h-5')}</div>
          </div>
          <div class="kpi-value" style="color:#1e3a8a;">
            ${totalSurveys} <span style="font-size:0.85rem; font-weight:600; color:#64748b;">Berkas</span>
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem;">
            Total survei warga yang masuk ke sistem
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #10b981;">
          <div class="kpi-header">
            <span class="kpi-title">Petugas Aktif Menginput</span>
            <div class="kpi-icon-wrap" style="color:#10b981;">${icons.users('w-5 h-5')}</div>
          </div>
          <div class="kpi-value" style="color:#059669;">
            ${activePetugasCount} <span style="font-size:0.85rem; font-weight:600; color:#64748b;">/ ${totalPetugasCount} Petugas</span>
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem;">
            ${totalPetugasCount > 0 ? Math.round((activePetugasCount / totalPetugasCount) * 100) : 0}% petugas sudah mengirim data
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
          <div class="kpi-header">
            <span class="kpi-title">Top Surveyor Terbanyak</span>
            <div class="kpi-icon-wrap" style="color:#f59e0b;">${icons.chart('w-5 h-5')}</div>
          </div>
          <div class="kpi-value" style="font-size:1.25rem; color:#b45309; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${topPetugas ? topPetugas.nama : '-'}">
            ${topPetugas ? topPetugas.nama : 'Belum Ada'}
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem;">
            ${topPetugas ? `${topPetugas.total_survei} berkas (${topPetugas.wilayah_tugas})` : 'Belum ada data'}
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #8b5cf6;">
          <div class="kpi-header">
            <span class="kpi-title">Rata-rata Input Petugas</span>
            <div class="kpi-icon-wrap" style="color:#8b5cf6;">${icons.home('w-5 h-5')}</div>
          </div>
          <div class="kpi-value" style="color:#6d28d9;">
            ${avgSurveys} <span style="font-size:0.85rem; font-weight:600; color:#64748b;">Berkas/Petugas</span>
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem;">
            Rerata produktivitas surveyor aktif
          </div>
        </div>

      </div>

      <!-- Main Analysis Table Card -->
      <div class="card" style="padding:1.5rem;">
        
        <!-- Header & Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:var(--dark-900); margin:0;">
              Rekapitulasi Hasil Kerja Seluruh Petugas
            </h3>
            <p style="font-size:0.8rem; color:var(--dark-600); margin:0.25rem 0 0 0;">
              Daftar seluruh petugas surveyor, jumlah berkas yang diinputkan, status validasi, dan wilayah penugasannya.
            </p>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="btn-print-rekap-petugas" style="background:#047857; color:white; border-color:#047857; font-weight:700; display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 0.85rem; border-radius:var(--radius-md);">
              ${icons.printer('w-4 h-4')} Cetak Rekap Kinerja
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="toolbar-bar" style="margin-bottom:1rem; padding:0.75rem 1rem;">
          <div class="toolbar-filters" style="width:100%; display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            
            <div class="search-input-wrap" style="flex:1; min-width:240px;">
              <span class="search-icon-inside">${icons.search('w-4 h-4')}</span>
              <input 
                type="text" 
                class="search-input-field" 
                id="search-petugas-input" 
                placeholder="Cari nama petugas, RW penugasan, atau ID akun..."
              />
            </div>

            <select class="form-select" id="filter-petugas-status" style="width:auto; padding:0.55rem 0.85rem;">
              <option value="ALL">Semua Petugas (${pStats.totalPetugasCount})</option>
              <option value="ACTIVE">Hanya yang Sudah Input (${pStats.activePetugasCount})</option>
              <option value="ZERO">Belum Ada Input (${pStats.totalPetugasCount - pStats.activePetugasCount})</option>
            </select>

            <div style="font-size:0.8rem; font-weight:700; color:var(--dark-700); margin-left:auto;" id="petugas-count-info">
              Menampilkan data...
            </div>

          </div>
        </div>

        <!-- Table Responsive -->
        <div class="table-responsive">
          <table class="custom-table" id="petugas-table">
            <thead>
              <tr>
                <th style="width:50px; text-align:center;">No</th>
                <th>Petugas Surveyor</th>
                <th>Wilayah Penugasan</th>
                <th style="text-align:center;">Total Input Data</th>
                <th>Rincian Status Berkas</th>
                <th>Survei Terakhir</th>
                <th style="text-align:right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="petugas-table-body">
              <!-- Baris dinamis -->
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `;
}

/**
 * Event Listener Halaman Analisis Kinerja Petugas
 */
export function initPetugasAnalysisPageEvents(container, { onViewSurveys }) {
  const searchInput = container.querySelector("#search-petugas-input");
  const statusFilter = container.querySelector("#filter-petugas-status");
  const tbody = container.querySelector("#petugas-table-body");
  const countInfo = container.querySelector("#petugas-count-info");
  const btnPrint = container.querySelector("#btn-print-rekap-petugas");

  function renderRows() {
    if (!tbody) return;
    const { petugasList, totalSurveys } = storage.getPetugasStats();

    const query = (searchInput?.value || "").toLowerCase().trim();
    const filterVal = statusFilter?.value || "ALL";

    const filtered = petugasList.filter(p => {
      if (filterVal === "ACTIVE" && p.total_survei === 0) return false;
      if (filterVal === "ZERO" && p.total_survei > 0) return false;

      if (query) {
        const matchNama = (p.nama || "").toLowerCase().includes(query);
        const matchUser = (p.username || "").toLowerCase().includes(query);
        const matchWil = (p.wilayah_tugas || "").toLowerCase().includes(query);
        const matchId = (p.id_petugas || p.id || "").toLowerCase().includes(query);
        if (!matchNama && !matchUser && !matchWil && !matchId) return false;
      }
      return true;
    });

    if (countInfo) {
      countInfo.textContent = `Menampilkan ${filtered.length} dari ${petugasList.length} petugas`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2.5rem; color:#64748b;">
            <div style="font-size:1.5rem; margin-bottom:0.5rem;">🔍</div>
            <div style="font-weight:700;">Tidak ada petugas yang cocok dengan kata kunci pencarian.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((p, idx) => {
      const pct = totalSurveys > 0 ? Math.round((p.total_survei / totalSurveys) * 100) : 0;
      const isTop = idx === 0 && p.total_survei > 0;

      return `
        <tr style="${isTop ? 'background:rgba(240, 253, 244, 0.6);' : ''}">
          <td style="text-align:center; font-weight:700; color:#64748b;">${idx + 1}</td>
          
          <td>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div style="width:38px; height:38px; border-radius:50%; background:${isTop ? '#dcfce7' : '#e0e7ff'}; color:${isTop ? '#15803d' : '#3730a3'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.95rem; flex-shrink:0;">
                ${p.avatar || (p.nama ? p.nama.charAt(0) : 'P')}
              </div>
              <div>
                <div style="font-weight:800; color:#1e293b; font-size:0.92rem; display:flex; align-items:center; gap:0.4rem;">
                  ${p.nama}
                  ${isTop ? '<span class="badge" style="background:#16a34a; color:white; font-size:0.65rem; padding:1px 7px;">TERBANYAK</span>' : ''}
                </div>
                <div style="font-size:0.75rem; color:#64748b; margin-top:1px;">
                  ID Petugas: <span style="font-family:monospace; font-weight:700; color:#2563eb;">${p.id_petugas || p.id}</span> • @${p.username}
                </div>
              </div>
            </div>
          </td>

          <td>
            <div style="font-weight:700; color:#334155; font-size:0.88rem;">${p.wilayah_tugas || '-'}</div>
            ${p.telepon && p.telepon !== '-' ? `<div style="font-size:0.75rem; color:#64748b;">Telp: ${p.telepon}</div>` : ''}
          </td>

          <td style="text-align:center;">
            <div style="font-weight:800; font-size:1.2rem; color:${p.total_survei > 0 ? '#1e293b' : '#94a3b8'};">
              ${p.total_survei} <span style="font-size:0.75rem; font-weight:600; color:#64748b;">Rumah</span>
            </div>
            ${p.total_survei > 0 ? `
              <div style="width:90px; height:5px; background:#e2e8f0; border-radius:999px; margin:4px auto 0 auto; overflow:hidden;">
                <div style="width:${Math.min(100, pct * 2)}%; height:100%; background:#2563eb; border-radius:999px;"></div>
              </div>
              <div style="font-size:0.68rem; color:#64748b; margin-top:2px;">${pct}% kontribusi</div>
            ` : '<div style="font-size:0.7rem; color:#94a3b8; font-style:italic;">Belum ada berkas</div>'}
          </td>

          <td>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <span class="badge" style="background:#10b981; color:white; font-size:0.72rem; padding:3px 8px;" title="Terverifikasi Valid">
                 ${p.terverifikasi} Valid
              </span>
              <span class="badge" style="background:#f59e0b; color:white; font-size:0.72rem; padding:3px 8px;" title="Menunggu Validasi Kelurahan">
                 ${p.pending} Menunggu
              </span>
              <span class="badge" style="background:#ef4444; color:white; font-size:0.72rem; padding:3px 8px;" title="Perlu Revisi Petugas">
                ${p.revisi} Revisi
              </span>
            </div>
          </td>

          <td>
            <div style="font-size:0.8rem; color:#475569; font-weight:600;">
              ${p.terakhir_input ? formatDateIndo(p.terakhir_input, 'short') : '-'}
            </div>
          </td>

          <td style="text-align:right;">
            ${p.total_survei > 0 ? `
              <button 
                type="button" 
                class="btn btn-primary btn-sm btn-view-petugas-surveys" 
                data-id="${p.id}"
                data-nama="${p.nama}"
                style="padding:0.4rem 0.8rem; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:0.35rem;"
                title="Buka daftar data rumah yang diinputkan oleh ${p.nama}"
              >
                ${icons.eye('w-3.5 h-3.5')} Lihat Data
              </button>
            ` : `
              <span style="font-size:0.75rem; color:#94a3b8; font-style:italic;">Tidak Ada Data</span>
            `}
          </td>
        </tr>
      `;
    }).join("");

    // Event tombol "Lihat Data" per petugas
    tbody.querySelectorAll(".btn-view-petugas-surveys").forEach(btn => {
      btn.addEventListener("click", () => {
        const pNama = btn.getAttribute("data-nama");
        const pId = btn.getAttribute("data-id");
        if (typeof onViewSurveys === "function") {
          onViewSurveys(pId, pNama);
        }
      });
    });
  }

  renderRows();

  if (searchInput) searchInput.addEventListener("input", renderRows);
  if (statusFilter) statusFilter.addEventListener("change", renderRows);

  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }
}

