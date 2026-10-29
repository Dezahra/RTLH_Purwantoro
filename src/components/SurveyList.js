import { icons } from "../utils/icons.js";
import { storage, isSurveyOwnedByPetugas } from "../utils/storage.js";
import { masterRtRwPurwantoro } from "../utils/rtrw.js";

export function renderSurveyList() {
  const currentRole = storage.getCurrentRole();
  const currentUser = storage.getCurrentUser();
  const isPetugas = currentRole === 'petugas' || currentUser?.role === 'petugas';

  return `
    <div style="display:flex; flex-direction:column; gap:1.25rem;">

      <!-- BANNER DRAF OFFLINE (SAAT BLANK SPOT) -->
      <div id="offline-drafts-banner-container"></div>

      <!-- BANNER PERINGATAN BUTUH REVISI (KHUSUS PETUGAS) -->
      <div id="revision-alert-banner-container"></div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${!isPetugas ? `
            <button class="btn btn-secondary btn-sm" id="btn-list-rekap-bnba" style="background:#047857; color:white; border-color:#047857; font-weight:700;">
              ${icons.printer('w-4 h-4')} Cetak Rekap BNBA
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="toolbar-bar">
        <div class="toolbar-filters">
          <div class="search-input-wrap">
            <span class="search-icon-inside">${icons.search('w-4 h-4')}</span>
            <input type="text" class="search-input-field" id="list-search-input" placeholder="Cari NIK, No. KK, atau Nama Kepala Keluarga...">
          </div>

          <select class="form-select" id="list-filter-rw" style="width:auto; padding:0.55rem 0.85rem;">
            <option value="ALL">Semua RW</option>
          </select>

          <select class="form-select" id="list-filter-rt" style="width:auto; padding:0.55rem 0.85rem;">
            <option value="ALL">Semua RT</option>
          </select>


          <select class="form-select" id="list-filter-verif" style="width:auto; padding:0.55rem 0.85rem;">
            <option value="ALL">Semua Status Verifikasi</option>
            <option value="MENUNGGU_VALIDASI"> Menunggu Validasi</option>
            <option value="TERVERIFIKASI"> Terverifikasi</option>
            <option value="BUTUH_REVISI"> Butuh Revisi</option>
          </select>

          <!-- Filter Rentang Tanggal Survei -->
          <select class="form-select" id="list-filter-date" style="width:auto; padding:0.55rem 0.85rem;" title="Filter berdasarkan tanggal pelaksanaan survei">
            <option value="ALL">📅 Semua Tanggal</option>
            <option value="TODAY">Hari Ini</option>
            <option value="THIS_WEEK">7 Hari Terakhir</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="THIS_YEAR">Tahun Ini</option>
            <option value="CUSTOM">Rentang Khusus...</option>
          </select>

          <div id="list-custom-date-wrap" style="display:none; align-items:center; gap:0.35rem;">
            <input type="date" id="list-filter-start-date" class="form-select" style="width:auto; padding:0.45rem 0.65rem; font-size:0.8rem;" title="Dari Tanggal">
            <span style="font-size:0.75rem; color:var(--dark-500); font-weight:700;">s/d</span>
            <input type="date" id="list-filter-end-date" class="form-select" style="width:auto; padding:0.45rem 0.65rem; font-size:0.8rem;" title="Sampai Tanggal">
          </div>
        </div>

        <div style="font-size:0.8rem; font-weight:700; color:var(--dark-700);" id="list-count-info">
          Menampilkan data...
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-responsive">
        <table class="custom-table" id="survey-data-table">
          <thead>
            <tr>
              <th>Penerima</th>
              <th>Wilayah (RW / RT)</th>
              <th>Luas & Status Rumah</th>
              <th>Status Verifikasi</th>
              <th>Petugas</th>
              <th style="text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody id="survey-table-body">
            <!-- Dynamic rows -->
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="pagination-bar" id="survey-pagination-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding:0.75rem 1rem; background:white; border-radius:var(--radius-md); border:1px solid var(--gray-200);">
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--dark-700);">
          <span>Baris per halaman:</span>
          <select id="select-page-size" class="form-select" style="width:auto; padding:0.35rem 0.65rem; font-size:0.85rem;">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="ALL">Semua</option>
          </select>
          <span id="pagination-range-info" style="font-size:0.82rem; color:var(--dark-600); margin-left:0.5rem;"></span>
        </div>

        <div style="display:flex; align-items:center; gap:0.35rem;" id="pagination-nav-wrap">
          <button class="btn btn-secondary btn-sm" id="btn-page-first" title="Halaman Pertama" style="padding:0.35rem 0.65rem;">&laquo;</button>
          <button class="btn btn-secondary btn-sm" id="btn-page-prev" title="Halaman Sebelumnya" style="padding:0.35rem 0.65rem;">&lsaquo;</button>
          <span id="pagination-page-indicator" style="font-size:0.85rem; font-weight:700; padding:0 0.5rem; color:var(--dark-900);">Halaman 1 / 1</span>
          <button class="btn btn-secondary btn-sm" id="btn-page-next" title="Halaman Berikutnya" style="padding:0.35rem 0.65rem;">&rsaquo;</button>
          <button class="btn btn-secondary btn-sm" id="btn-page-last" title="Halaman Terakhir" style="padding:0.35rem 0.65rem;">&raquo;</button>
        </div>
      </div>
    </div>
  `;
}

export function initSurveyListEvents(container, { onSelectSurvey, onEditSurvey, onPrintSurvey, onPrintRekap, onNewSurvey, showToast }) {
  const currentRole = storage.getCurrentRole();
  const currentUser = storage.getCurrentUser();
  const isPetugas = currentRole === 'petugas' || currentUser?.role === 'petugas';

  const searchInput = container.querySelector("#list-search-input");
  const filterRw = container.querySelector("#list-filter-rw");
  const filterRt = container.querySelector("#list-filter-rt");
  const filterVerif = container.querySelector("#list-filter-verif");
  const filterDate = container.querySelector("#list-filter-date");
  const customDateWrap = container.querySelector("#list-custom-date-wrap");
  const filterStartDate = container.querySelector("#list-filter-start-date");
  const filterEndDate = container.querySelector("#list-filter-end-date");
  const tableBody = container.querySelector("#survey-table-body");
  const countInfo = container.querySelector("#list-count-info");

  // Inisialisasi Dropdown RW dan RT
  function populateRwOptions() {
    if (!filterRw) return;
    const rws = Object.keys(masterRtRwPurwantoro).sort((a, b) => Number(a) - Number(b));
    filterRw.innerHTML = '<option value="ALL">Semua RW</option>' +
      rws.map(rw => `<option value="${rw}">RW ${rw}</option>`).join("");
  }

  function updateRtOptions(selectedRw) {
    if (!filterRt) return;
    if (!selectedRw || selectedRw === "ALL") {
      filterRt.innerHTML = '<option value="ALL">Semua RT</option>';
      return;
    }
    const rts = masterRtRwPurwantoro[selectedRw] || [];
    filterRt.innerHTML = `<option value="ALL">Semua RT (RW ${selectedRw})</option>` +
      rts.map(rt => `<option value="${rt}">RT ${rt}</option>`).join("");
  }

  populateRwOptions();
  updateRtOptions("ALL");

  // Biarkan default awal "Semua RW" agar seluruh data survey yang pernah diinput langsung tampil,
  // namun dropdown RW/RT tetap siap digunakan jika petugas ingin memfilter.
  let lastFilteredSurveys = [];

  // Cetak Rekap BNBA
  const rekapBtn = container.querySelector("#btn-list-rekap-bnba");
  if (rekapBtn) {
    rekapBtn.addEventListener("click", () => {
      const selectedRw = filterRw ? filterRw.value : "ALL";
      if (typeof onPrintRekap === "function") {
        onPrintRekap(selectedRw);
      }
    });
  }

  // Banner Antrean Draf Offline (Khusus draf milik akun yang sedang login)
  function checkOfflineDraftsBanner() {
    const bannerContainer = container.querySelector("#offline-drafts-banner-container");
    if (!bannerContainer) return;
    const drafts = storage.getOfflineDrafts(currentUser);
    if (!drafts || drafts.length === 0) {
      bannerContainer.innerHTML = "";
      return;
    }

    bannerContainer.innerHTML = `
      <div style="background:#fffbeb; border:1.5px solid #fde68a; border-radius:var(--radius-md); padding:0.85rem 1.15rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <div>
            <div style="font-weight:800; font-size:0.88rem; color:#92400e;">
              Terdapat ${drafts.length} Data Survei Tersimpan Sebagai Draf Offline
            </div>
            <div style="font-size:0.75rem; color:#b45309;">
              Data ini disimpan di perangkat oleh akun Anda saat jaringan offline / blank spot dan belum terkirim ke basis data kelurahan.
            </div>
          </div>
        </div>
        <button class="btn btn-sm btn-primary" id="btn-sync-all-drafts" style="background:#d97706; border-color:#d97706; font-weight:800; padding:0.45rem 0.95rem; cursor:pointer;">
          ⚡ Sinkronkan Sekarang (${drafts.length})
        </button>
      </div>
    `;

    const btnSync = bannerContainer.querySelector("#btn-sync-all-drafts");
    if (btnSync) {
      btnSync.addEventListener("click", async () => {
        btnSync.disabled = true;
        btnSync.textContent = "Menyinkronkan...";
        const res = await storage.syncOfflineDrafts(currentUser);
        if (res.successCount > 0) {
          if (typeof showToast === "function") {
            showToast(`${res.successCount} berkas survei offline Anda berhasil disinkronkan ke server.`);
          }
          await storage.syncSurveysFromDB();
        }
        if (res.failedCount > 0) {
          alert(`Peringatan:\n${res.failedCount} draf belum berhasil disinkronkan karena kendala server:\n` + res.errors.join("\n"));
        }
        checkOfflineDraftsBanner();
        renderRows();
      });
    }
  }

  // Banner Peringatan Butuh Revisi (Khusus Petugas)
  function checkRevisionAlertBanner() {
    const revContainer = container.querySelector("#revision-alert-banner-container");
    if (!revContainer) return;
    if (!isPetugas) {
      revContainer.innerHTML = "";
      return;
    }
    const revCount = storage.getRevisionCount(currentUser);
    if (revCount === 0) {
      revContainer.innerHTML = "";
      return;
    }
    revContainer.innerHTML = `
      <div style="background:#fef2f2; border:1.5px solid #fca5a5; border-radius:var(--radius-md); padding:0.85rem 1.15rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; color:#991b1b; font-size:0.85rem; font-weight:700;">
          <span style="font-size:1.3rem;">⚠️</span>
          <span>Terdapat <strong>${revCount} data survei</strong> Anda yang dikembalikan oleh pihak Kelurahan karena <strong>Butuh Revisi</strong>. Harap periksa catatan admin dan perbaiki.</span>
        </div>
        <button class="btn btn-sm" id="btn-quick-filter-revision" style="background:#dc2626; color:white; border-color:#dc2626; font-size:0.78rem; font-weight:800; padding:0.45rem 0.95rem; cursor:pointer;">
          Lihat Data Butuh Revisi
        </button>
      </div>
    `;
    const btnQuickRev = revContainer.querySelector("#btn-quick-filter-revision");
    if (btnQuickRev) {
      btnQuickRev.addEventListener("click", () => {
        if (filterVerif) {
          filterVerif.value = "BUTUH_REVISI";
          currentPage = 1;
          renderRows();
        }
      });
    }
  }

  checkOfflineDraftsBanner();
  checkRevisionAlertBanner();

  let currentPage = 1;
  let pageSize = 10;

  function renderRows() {
    let list = storage.getSurveys();

    // ATURAN 1: Role Petugas HANYA melihat data yang diinputkan oleh akunnya sendiri
    if (isPetugas) {
      list = list.filter(item => isSurveyOwnedByPetugas(item, currentUser));
    }

    const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const rwVal = filterRw ? filterRw.value : "ALL";
    const rtVal = filterRt ? filterRt.value : "ALL";
    const v = filterVerif ? filterVerif.value : "ALL";

    const filtered = list.filter(item => {
      // Filter RW
      if (rwVal !== "ALL") {
        const itemRw = String(item.rw || "").padStart(2, "0");
        if (itemRw !== rwVal) {
          // Toleransi jika item.rw di database sempat kosong tapi petugas yang menginput ditugaskan di RW ini
          if ((!item.rw || item.rw === "") && isPetugas && currentUser?.rw && String(currentUser.rw).padStart(2, "0") === rwVal) {
            // Loloskan
          } else {
            return false;
          }
        }
      }
      // Filter RT
      if (rtVal !== "ALL") {
        const itemRt = String(item.rt || "").padStart(2, "0");
        if (itemRt !== rtVal) {
          // Toleransi jika item.rt di database sempat kosong tapi petugas yang menginput ditugaskan di RT ini
          if ((!item.rt || item.rt === "") && isPetugas && currentUser?.rt && String(currentUser.rt).padStart(2, "0") === rtVal) {
            // Loloskan
          } else {
            return false;
          }
        }
      }
      // Filter Verifikasi
      if (v !== "ALL" && item.status_verifikasi !== v) return false;

      // Filter Rentang Tanggal Survei
      if (filterDate && filterDate.value !== "ALL") {
        const dVal = filterDate.value;
        const itemDateStr = item.tanggal_survey || (item.created_at ? item.created_at.slice(0, 10) : "");
        if (!itemDateStr) return false;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        if (dVal === "TODAY") {
          if (itemDateStr !== todayStr) return false;
        } else if (dVal === "THIS_WEEK") {
          const pastWeek = new Date();
          pastWeek.setDate(pastWeek.getDate() - 7);
          const pastWeekStr = `${pastWeek.getFullYear()}-${String(pastWeek.getMonth() + 1).padStart(2, "0")}-${String(pastWeek.getDate()).padStart(2, "0")}`;
          if (itemDateStr < pastWeekStr || itemDateStr > todayStr) return false;
        } else if (dVal === "THIS_MONTH") {
          const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          if (!itemDateStr.startsWith(curMonth)) return false;
        } else if (dVal === "THIS_YEAR") {
          if (!itemDateStr.startsWith(String(now.getFullYear()))) return false;
        } else if (dVal === "CUSTOM") {
          const s = filterStartDate?.value;
          const e = filterEndDate?.value;
          if (s && itemDateStr < s) return false;
          if (e && itemDateStr > e) return false;
        }
      }

      // Filter Pencarian Teks
      if (q) {
        const matchName = (item.nama_kk || "").toLowerCase().includes(q);
        const matchNik = (item.nik || "").toLowerCase().includes(q);
        const matchKk = (item.no_kk || "").toLowerCase().includes(q);
        const matchId = (item.id || "").toLowerCase().includes(q);
        const matchBnba = (item.no_urut_bnba || "").toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchKk && !matchId && !matchBnba) return false;
      }
      return true;
    });

    lastFilteredSurveys = filtered;

    const totalItems = filtered.length;
    const effectivePageSize = pageSize === 'ALL' ? totalItems : (Number(pageSize) || 10);
    const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * effectivePageSize;
    const endIdx = Math.min(startIdx + effectivePageSize, totalItems);
    const pagedItems = filtered.slice(startIdx, endIdx);

    const rangeInfo = container.querySelector("#pagination-range-info");
    const pageIndicator = container.querySelector("#pagination-page-indicator");
    const btnFirst = container.querySelector("#btn-page-first");
    const btnPrev = container.querySelector("#btn-page-prev");
    const btnNext = container.querySelector("#btn-page-next");
    const btnLast = container.querySelector("#btn-page-last");
    const paginationBar = container.querySelector("#survey-pagination-bar");

    if (paginationBar) {
      paginationBar.style.display = totalItems === 0 ? "none" : "flex";
    }
    if (rangeInfo) {
      rangeInfo.textContent = totalItems === 0
        ? "0 data"
        : `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data`;
    }
    if (pageIndicator) {
      pageIndicator.textContent = `Halaman ${currentPage} / ${totalPages}`;
    }
    if (btnFirst) btnFirst.disabled = currentPage <= 1;
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = currentPage >= totalPages;
    if (btnLast) btnLast.disabled = currentPage >= totalPages;

    if (countInfo) {
      countInfo.textContent = isPetugas
        ? `Menampilkan ${filtered.length} dari ${list.length} data survey Anda`
        : `Menampilkan ${filtered.length} dari ${list.length} data rumah`;
    }

    if (!tableBody) return;

    if (filtered.length === 0) {
      const isTotallyEmpty = list.length === 0;
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:3rem; color:var(--dark-600);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">📂</div>
            <div style="font-weight:700;">
              ${isTotallyEmpty
          ? (isPetugas ? 'Belum ada data survey yang Anda inputkan.' : 'Tidak ada data survey.')
          : 'Tidak ada data yang cocok dengan filter yang dipilih.'}
            </div>
            <div style="font-size:0.8rem; margin-top:0.25rem;">
              ${isTotallyEmpty
          ? (isPetugas ? 'Silakan pilih menu "Form Input" pada bilah navigasi untuk mulai melakukan pendataan warga.' : 'Coba sesuaikan kata kunci pencarian.')
          : 'Coba ubah pilihan filter RW/RT menjadi "Semua RW" atau sesuaikan filter kelayakan/status.'}
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = pagedItems.map(item => {
      let verifBadge = '<span class="badge badge-warning"> Menunggu Validasi</span>';
      if (item.status_verifikasi === "TERVERIFIKASI") {
        verifBadge = '<span class="badge badge-success"> Terverifikasi</span>';
      } else if (item.status_verifikasi === "BUTUH_REVISI") {
        verifBadge = '<span class="badge badge-danger"> Butuh Revisi</span>';
      }

      return `
        <tr>
          <td>
            <div class="table-user-cell">
              ${item.foto_depan && !item.foto_depan.includes('sample-images') ? `
                <img src="${item.foto_depan}" 
                     class="table-avatar-img" 
                     alt="Foto ${item.nama_kk}"
                />
              ` : `
                <div style="width:40px; height:40px; border-radius:var(--radius-md); background:var(--gray-200); display:flex; align-items:center; justify-content:center; color:var(--dark-500); flex-shrink:0;">
                  ${icons.home('w-4 h-4')}
                </div>
              `}
              <div>
                <div style="font-weight:800; color:var(--dark-900); font-size:0.9rem;">${item.nama_kk}</div>
                <div style="font-size:0.75rem; color:var(--dark-600);">NIK: ${item.nik}</div>
                <div style="display:flex; align-items:center; gap:0.35rem; margin-top:2px;">
                  <span class="badge badge-info" style="font-size:0.68rem; font-family:monospace; padding:1px 6px;" title="No. Urut BNBA">
                    ${item.no_urut_bnba || '-'}
                  </span>
                  <span style="font-size:0.7rem; color:var(--dark-500); font-family:monospace;">${item.id}</span>
                </div>
              </div>
            </div>
          </td>

          <td>
            <div style="font-weight:700; color:var(--dark-800);">RW ${item.rw ? String(item.rw).padStart(2, '0') : '-'} / RT ${item.rt ? String(item.rt).padStart(2, '0') : '-'}</div>
            <div style="font-size:0.75rem; color:var(--dark-600);">Huni ${item.lama_tinggal || '-'} thn</div>
          </td>

          <td>
            <div style="font-weight:700; color:var(--dark-800); font-size:0.85rem;">
              ${item.luas_bangunan || '-'} m² <span style="font-size:0.75rem; font-weight:500; color:var(--dark-600);">(${item.status_rumah || '-'})</span>
            </div>
            <div style="font-size:0.72rem; color:var(--dark-600); margin-top:0.15rem;">
              ${item.luas_per_jiwa || '-'} m²/jiwa (${item.jumlah_jiwa || 1} jiwa)
            </div>
          </td>

          <td>
            ${verifBadge}
            ${item.catatan_admin ? `<div style="font-size:0.7rem; color:var(--dark-600); margin-top:0.2rem; font-style:italic;">"${item.catatan_admin}"</div>` : ''}
          </td>

          <td>
            <div style="font-weight:600; font-size:0.8rem;">${item.petugas_nama || 'Petugas'}</div>
            <div style="font-size:0.72rem; color:var(--dark-500);">${item.tanggal_survey || '-'}</div>
          </td>

          <td style="text-align:right;">
            <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">

              <button
                class="btn btn-secondary btn-action-view"
                data-id="${item.id}"
                title="Lihat Detail Lengkap"
                style="padding:0.4rem 0.6rem; font-size:0.75rem;">
                ${icons.eye('w-3.5 h-3.5')}
              </button>

              <button
                class="btn btn-secondary btn-action-print"
                data-id="${item.id}"
                title="Cetak Surat RTLH"
                style="padding:0.4rem 0.6rem; font-size:0.75rem;">
                ${icons.printer('w-3.5 h-3.5')}
              </button>

              ${(!isPetugas && item.status_verifikasi !== 'TERVERIFIKASI') ? `
                <button
                  class="btn btn-sm btn-action-verify"
                  data-id="${item.id}"
                  title="Verifikasi Langsung"
                  style="padding:0.4rem 0.55rem; font-size:0.75rem; background:#10b981; color:white; border-color:#059669;">
                  ${icons.check('w-3.5 h-3.5')}
                </button>
                <button
                  class="btn btn-sm btn-action-revision"
                  data-id="${item.id}"
                  title="Minta Revisi"
                  style="padding:0.4rem 0.55rem; font-size:0.75rem; background:#fff; color:#d97706; border-color:#fcd34d;">
                  ${icons.alertTriangle ? icons.alertTriangle('w-3.5 h-3.5') : '!'}
                </button>
              ` : ''}

              ${isPetugas && item.status_verifikasi === 'TERVERIFIKASI' ? `
                <button
                  class="btn btn-secondary"
                  disabled
                  title="Data telah diverifikasi oleh pihak Kelurahan (Terkunci)"
                  style="padding:0.4rem 0.6rem; font-size:0.75rem; opacity:0.45; cursor:not-allowed;">
                  ${icons.shield('w-3.5 h-3.5')}
                </button>
              ` : `
                <button
                  class="btn btn-secondary btn-action-edit"
                  data-id="${item.id}"
                  title="Edit Data"
                  style="padding:0.4rem 0.6rem; font-size:0.75rem;">
                  ${icons.edit('w-3.5 h-3.5')}
                </button>
              `}
             
              ${currentRole === 'admin' ? `
              <button
                class="btn btn-danger btn-action-delete"
                data-id="${item.id}"
                title="Hapus Data"
                style="padding:0.4rem 0.6rem; font-size:0.75rem;">
                ${icons.trash('w-3.5 h-3.5')}
              </button>
            ` : ''}

            </div>
          </td>        </tr>
      `;
    }).join("");

    // Bind action events on row buttons
    tableBody.querySelectorAll(".btn-action-view").forEach(btn => {
      btn.addEventListener("click", () => onSelectSurvey(btn.dataset.id));
    });

    tableBody.querySelectorAll(".btn-action-print").forEach(btn => {
      btn.addEventListener("click", () => onPrintSurvey(btn.dataset.id));
    });

    tableBody.querySelectorAll(".btn-action-edit").forEach(btn => {
      btn.addEventListener("click", () => onEditSurvey(btn.dataset.id));
    });

    // Konfirmasi verifikasi data survey
    tableBody.querySelectorAll(".btn-action-verify").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;

        // Hapus popup lama jika masih ada
        const existingPopup = document.querySelector("#verification-confirm-popup");
        if (existingPopup) {
          existingPopup.remove();
        }

        const popup = document.createElement("div");
        popup.id = "verification-confirm-popup";

        popup.innerHTML = `
          <div class="verification-popup-content">

            <div class="verification-popup-icon">
              ${icons.checkCircle('w-5 h-5')}
            </div>

            <div class="verification-popup-text">

              <div class="verification-popup-title">
                Konfirmasi Verifikasi
              </div>

              <div class="verification-popup-message">
                Apakah Anda yakin ingin memverifikasi data survey
                <strong>${id}</strong>?
              </div>

              <div class="verification-popup-info">
                <span>ℹ️</span>
                <span>
                  Setelah diverifikasi, status data menjadi
                  <strong>TERVERIFIKASI</strong>.
                </span>
              </div>

            </div>

            <div class="verification-popup-actions">

              <button
                type="button"
                class="verification-popup-cancel"
                id="btn-cancel-verification">
                Batal
              </button>

              <button
                type="button"
                class="verification-popup-confirm"
                id="btn-confirm-verification">
                ${icons.checkCircle('w-4 h-4')}
                Ya, Verifikasi
              </button>

            </div>

          </div>
        `;

        document.body.appendChild(popup);

        // TOMBOL BATAL
        const cancelBtn = popup.querySelector("#btn-cancel-verification");

        cancelBtn.addEventListener("click", () => {
          popup.classList.add("closing");

          setTimeout(() => {
            popup.remove();
          }, 200);
        });


        // TOMBOL YA, VERIFIKASI
        const confirmBtn = popup.querySelector("#btn-confirm-verification");
        confirmBtn.addEventListener("click", async () => {

          const updated = await storage.updateVerification(id, {
            status: "TERVERIFIKASI",
            catatanAdmin: ""
          });

          popup.classList.add("closing");

          setTimeout(() => {
            popup.remove();

            if (updated) {
              showToast(`Data survey ${id} berhasil diverifikasi.`);
              renderRows();
            }
          }, 200);
        });


        // KLIK BACKDROP
        popup.addEventListener("click", (e) => {
          if (e.target === popup) {
            popup.classList.add("closing");

            setTimeout(() => {
              popup.remove();
            }, 200);
          }
        });

      });
    });

    // Minta revisi data survey
    tableBody.querySelectorAll(".btn-action-revision").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        const catatan = prompt(
          "Masukkan catatan perbaikan untuk data survey:"
        );

        if (catatan === null) return;

        if (!catatan.trim()) {
          alert("Catatan perbaikan wajib diisi.");
          return;
        }

        const updated = await storage.updateVerification(id, {
          status: "BUTUH_REVISI",
          catatanAdmin: catatan.trim()
        });

        if (updated) {
          showToast(`Data survey ${id} ditandai perlu revisi.`);
          renderRows();
        }
      });
    });

    tableBody.querySelectorAll(".btn-action-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm(`Apakah Anda yakin ingin menghapus data survey ${id}?`)) {
          await storage.deleteSurvey(id);
          showToast(`Data survey ${id} berhasil dihapus.`);
          renderRows();
        }
      });
    });
  }

  // Bind filter inputs
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderRows();
    });
  }
  if (filterRw) {
    filterRw.addEventListener("change", () => {
      updateRtOptions(filterRw.value);
      currentPage = 1;
      renderRows();
    });
  }
  if (filterRt) {
    filterRt.addEventListener("change", () => {
      currentPage = 1;
      renderRows();
    });
  }

  if (filterVerif) {
    filterVerif.addEventListener("change", () => {
      currentPage = 1;
      renderRows();
    });
  }

  if (filterDate) {
    filterDate.addEventListener("change", () => {
      if (customDateWrap) {
        customDateWrap.style.display = filterDate.value === "CUSTOM" ? "inline-flex" : "none";
      }
      currentPage = 1;
      renderRows();
    });
  }
  if (filterStartDate) {
    filterStartDate.addEventListener("change", () => {
      currentPage = 1;
      renderRows();
    });
  }
  if (filterEndDate) {
    filterEndDate.addEventListener("change", () => {
      currentPage = 1;
      renderRows();
    });
  }

  // Bind pagination controls
  const pageSizeSelect = container.querySelector("#select-page-size");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      pageSize = pageSizeSelect.value === "ALL" ? "ALL" : Number(pageSizeSelect.value);
      currentPage = 1;
      renderRows();
    });
  }

  const pBtnFirst = container.querySelector("#btn-page-first");
  if (pBtnFirst) {
    pBtnFirst.addEventListener("click", () => {
      currentPage = 1;
      renderRows();
    });
  }

  const pBtnPrev = container.querySelector("#btn-page-prev");
  if (pBtnPrev) {
    pBtnPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderRows();
      }
    });
  }

  const pBtnNext = container.querySelector("#btn-page-next");
  if (pBtnNext) {
    pBtnNext.addEventListener("click", () => {
      const effectivePageSize = pageSize === 'ALL' ? lastFilteredSurveys.length : (Number(pageSize) || 10);
      const totalPages = Math.ceil(lastFilteredSurveys.length / effectivePageSize);
      if (currentPage < totalPages) {
        currentPage++;
        renderRows();
      }
    });
  }

  const pBtnLast = container.querySelector("#btn-page-last");
  if (pBtnLast) {
    pBtnLast.addEventListener("click", () => {
      const effectivePageSize = pageSize === 'ALL' ? lastFilteredSurveys.length : (Number(pageSize) || 10);
      const totalPages = Math.ceil(lastFilteredSurveys.length / effectivePageSize);
      currentPage = totalPages;
      renderRows();
    });
  }

  renderRows();

  // Sinkronisasi data survei terbaru dari server database
  (async () => {
    if (typeof storage.syncSurveysFromDB === "function") {
      await storage.syncSurveysFromDB();
      renderRows();
    }
  })();
}
