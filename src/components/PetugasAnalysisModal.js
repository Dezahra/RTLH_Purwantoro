import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { formatDateIndo } from "../utils/dateHelper.js";

/**
 * Render modal analisis & rekapitulasi data per petugas surveyor
 */
export function renderPetugasAnalysisModal() {
  const pStats = storage.getPetugasStats();
  const { petugasList, totalPetugasCount, activePetugasCount, topPetugas, totalSurveys } = pStats;

  return `
    <div class="modal-backdrop" id="petugas-analysis-backdrop" style="position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.2s ease;">
      <div class="modal-dialog card" style="max-width:980px; width:100%; max-height:92vh; display:flex; flex-direction:column; border-radius:var(--radius-lg); box-shadow:0 20px 25px -5px rgba(0,0,0,0.25); border:1px solid #cbd5e1; padding:0; background:white; overflow:hidden;">
        
        <!-- Modal Header -->
        <div style="padding:1.25rem 1.75rem; background:linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color:white; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <div style="width:42px; height:42px; border-radius:10px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${icons.chart('w-5 h-5 text-white')}
            </div>
            <div>
              <div style="font-weight:800; font-size:1.15rem; line-height:1.2;">Analisis & Rekap Kinerja Petugas Surveyor</div>
              <div style="font-size:0.78rem; opacity:0.9; margin-top:2px;">Pemantauan hasil input survei RTLH per petugas di Kelurahan Purwantoro</div>
            </div>
          </div>
          <button type="button" id="btn-close-petugas-analysis" style="background:transparent; border:none; color:white; opacity:0.85; cursor:pointer; padding:6px; border-radius:6px; font-size:1.2rem; line-height:1;" title="Tutup">
            ✕
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div style="padding:1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1.25rem;">
          
          <!-- Quick KPI Cards -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem;">
            
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #2563eb; padding:0.9rem 1.1rem; border-radius:8px;">
              <div style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Total Data Terinput</div>
              <div style="font-size:1.6rem; font-weight:800; color:#1e293b; margin-top:0.2rem;">
                ${totalSurveys} <span style="font-size:0.85rem; font-weight:600; color:#64748b;">Berkas</span>
              </div>
              <div style="font-size:0.72rem; color:#64748b; margin-top:0.15rem;">Dari seluruh wilayah Purwantoro</div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #10b981; padding:0.9rem 1.1rem; border-radius:8px;">
              <div style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Petugas Aktif Menginput</div>
              <div style="font-size:1.6rem; font-weight:800; color:#059669; margin-top:0.2rem;">
                ${activePetugasCount} <span style="font-size:0.85rem; font-weight:600; color:#64748b;">/ ${totalPetugasCount} Petugas</span>
              </div>
              <div style="font-size:0.72rem; color:#64748b; margin-top:0.15rem;">
                ${totalPetugasCount ? Math.round((activePetugasCount / totalPetugasCount) * 100) : 0}% petugas sudah mengirim data
              </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #f59e0b; padding:0.9rem 1.1rem; border-radius:8px;">
              <div style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Kontributor Terbanyak</div>
              <div style="font-size:1.15rem; font-weight:800; color:#b45309; margin-top:0.35rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${topPetugas ? topPetugas.nama : '-'}">
                ${topPetugas ? topPetugas.nama : 'Belum Ada'}
              </div>
              <div style="font-size:0.72rem; color:#64748b; margin-top:0.15rem;">
                ${topPetugas ? `${topPetugas.total_survei} survei (${topPetugas.wilayah_tugas})` : 'Belum ada data terinput'}
              </div>
            </div>

          </div>

          <!-- Filter & Search Toolbar in Modal -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:0.5rem; flex:1; min-width:240px;">
              <input 
                type="text" 
                id="search-petugas-input" 
                class="form-control" 
                placeholder="Cari nama petugas, RW, atau ID..."
                style="padding:0.5rem 0.85rem; font-size:0.85rem; border:1px solid #cbd5e1; border-radius:6px; width:100%;"
              />
            </div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <select id="filter-petugas-status" class="form-select" style="padding:0.45rem 0.75rem; font-size:0.82rem; width:auto;">
                <option value="ALL">Semua Petugas (${petugasList.length})</option>
                <option value="ACTIVE">Hanya Petugas yang Sudah Input (${activePetugasCount})</option>
                <option value="ZERO">Belum Menginput Data (${totalPetugasCount - activePetugasCount})</option>
              </select>
            </div>
          </div>

          <!-- Petugas Table -->
          <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div class="table-responsive" style="max-height:420px; overflow-y:auto;">
              <table class="custom-table" style="width:100%; margin:0; font-size:0.85rem;">
                <thead style="position:sticky; top:0; background:#f1f5f9; z-index:2;">
                  <tr>
                    <th style="width:40px; text-align:center;">No</th>
                    <th>Petugas Surveyor</th>
                    <th>Wilayah Tugas</th>
                    <th style="text-align:center;">Total Input</th>
                    <th>Rincian Status Berkas</th>
                    <th>Terakhir Input</th>
                    <th style="text-align:center; width:110px;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="petugas-table-body">
                  <!-- Dynamic rows rendered by JS -->
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div style="padding:1rem 1.5rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
          <div style="font-size:0.75rem; color:#64748b;">
            💡 Klik tombol <strong>"Lihat Data"</strong> untuk langsung menyaring daftar Data Rumah per petugas.
          </div>
          <button type="button" class="btn btn-secondary" id="btn-close-petugas-bottom" style="padding:0.45rem 1rem;">
            Tutup
          </button>
        </div>

      </div>
    </div>
  `;
}

/**
 * Inisialisasi event listener modal analisis petugas
 */
export function initPetugasAnalysisEvents(container, { onSelectPetugas }) {
  const modalBackdrop = container.querySelector("#petugas-analysis-backdrop");
  if (!modalBackdrop) return;

  const btnClose = container.querySelector("#btn-close-petugas-analysis");
  const btnCloseBottom = container.querySelector("#btn-close-petugas-bottom");
  const searchInput = container.querySelector("#search-petugas-input");
  const statusFilter = container.querySelector("#filter-petugas-status");
  const tbody = container.querySelector("#petugas-table-body");

  const closeModal = () => {
    modalBackdrop.remove();
  };

  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCloseBottom) btnCloseBottom.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  const renderTableRows = () => {
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

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:#64748b;">
            Tidak ditemukan petugas yang sesuai dengan pencarian atau filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((p, idx) => {
      const percentOfTotal = totalSurveys > 0 ? Math.round((p.total_survei / totalSurveys) * 100) : 0;
      const isTop = idx === 0 && p.total_survei > 0;

      return `
        <tr style="${isTop ? 'background:#f0fdf4;' : ''}">
          <td style="text-align:center; font-weight:700; color:#64748b;">${idx + 1}</td>
          
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div style="width:34px; height:34px; border-radius:50%; background:${isTop ? '#dcfce7' : '#e0e7ff'}; color:${isTop ? '#15803d' : '#3730a3'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">
                ${p.avatar || (p.nama ? p.nama.charAt(0) : 'P')}
              </div>
              <div>
                <div style="font-weight:700; color:#1e293b; display:flex; align-items:center; gap:0.35rem;">
                  ${p.nama}
                  ${isTop ? '<span style="font-size:0.65rem; background:#16a34a; color:white; padding:1px 6px; border-radius:999px; font-weight:800;">TOP 1</span>' : ''}
                </div>
                <div style="font-size:0.72rem; color:#64748b;">
                  ID: <span style="font-family:monospace; font-weight:600;">${p.id_petugas || p.id}</span> • @${p.username}
                </div>
              </div>
            </div>
          </td>

          <td>
            <div style="font-weight:600; color:#334155;">${p.wilayah_tugas || '-'}</div>
            ${p.telepon && p.telepon !== '-' ? `<div style="font-size:0.72rem; color:#64748b;">📞 ${p.telepon}</div>` : ''}
          </td>

          <td style="text-align:center;">
            <div style="font-weight:800; font-size:1.05rem; color:${p.total_survei > 0 ? '#1e293b' : '#94a3b8'};">
              ${p.total_survei}
            </div>
            ${p.total_survei > 0 ? `
              <div style="width:75px; height:5px; background:#e2e8f0; border-radius:999px; margin:4px auto 0 auto; overflow:hidden;">
                <div style="width:${Math.min(100, percentOfTotal * 2)}%; height:100%; background:#2563eb; border-radius:999px;"></div>
              </div>
              <div style="font-size:0.65rem; color:#64748b; margin-top:2px;">${percentOfTotal}% dari total</div>
            ` : '<div style="font-size:0.65rem; color:#94a3b8;">Belum input</div>'}
          </td>

          <td>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <span class="badge" style="background:#10b981; color:white; font-size:0.68rem; padding:2px 6px;" title="Terverifikasi">
                ✓ ${p.terverifikasi}
              </span>
              <span class="badge" style="background:#f59e0b; color:white; font-size:0.68rem; padding:2px 6px;" title="Menunggu Validasi">
                ⏳ ${p.pending}
              </span>
              <span class="badge" style="background:#ef4444; color:white; font-size:0.68rem; padding:2px 6px;" title="Butuh Revisi">
                ⚠️ ${p.revisi}
              </span>
            </div>
          </td>

          <td>
            <div style="font-size:0.75rem; color:#475569; font-weight:500;">
              ${p.terakhir_input ? formatDateIndo(p.terakhir_input, 'short') : '-'}
            </div>
          </td>

          <td style="text-align:center;">
            ${p.total_survei > 0 ? `
              <button 
                type="button" 
                class="btn btn-primary btn-sm btn-select-petugas-filter" 
                data-id="${p.id}"
                data-nama="${p.nama}"
                style="padding:0.3rem 0.65rem; font-size:0.74rem; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;"
                title="Saring daftar data rumah untuk hanya menampilkan data milik ${p.nama}"
              >
                ${icons.search('w-3 h-3')} Lihat Data
              </button>
            ` : `
              <span style="font-size:0.72rem; color:#94a3b8; font-style:italic;">Belum ada</span>
            `}
          </td>
        </tr>
      `;
    }).join("");

    // Attach event listener ke tombol "Lihat Data" per petugas
    tbody.querySelectorAll(".btn-select-petugas-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-id");
        const pNama = btn.getAttribute("data-nama");
        closeModal();
        if (typeof onSelectPetugas === "function") {
          onSelectPetugas(pId, pNama);
        }
      });
    });
  };

  renderTableRows();

  if (searchInput) {
    searchInput.addEventListener("input", renderTableRows);
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", renderTableRows);
  }
}
