import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { exportSurveysToExcel, exportSurveysToCSV, generateKopMetadata } from "../utils/exportHelper.js";

export function renderExportModal({ filteredSurveys = [], currentFilters = {} }) {
  const currentUser = storage.getCurrentUser();
  const currentRole = storage.getCurrentRole();
  const allSurveys = storage.getSurveys();
  const isPetugas = currentRole === "petugas" || currentUser?.role === "petugas";

  const surveysToUse = filteredSurveys && filteredSurveys.length > 0 ? filteredSurveys : allSurveys;
  const filteredCount = filteredSurveys.length;
  const allCount = allSurveys.length;

  const kop = generateKopMetadata({
    actorName: currentUser?.nama || (isPetugas ? "Petugas Lapangan" : "Admin Kelurahan"),
    actorRole: isPetugas ? "Petugas Lapangan" : (currentRole === "admin" ? "Admin Sistem" : "Pegawai Kelurahan"),
    rwFilter: currentFilters.rw || "ALL",
    rtFilter: currentFilters.rt || "ALL",
    verifFilter: currentFilters.verif || "ALL",
    totalCount: filteredCount
  });

  return `
    <div class="modal-backdrop" id="export-modal-backdrop" style="position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.2s ease;">
      <div class="modal-dialog card" style="max-width:640px; width:100%; max-height:92vh; overflow-y:auto; border-radius:var(--radius-lg); box-shadow:0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1); border:1px solid #cbd5e1; padding:0;">
        
        <!-- Modal Header -->
        <div style="padding:1.25rem 1.5rem; background:linear-gradient(135deg, #065f46 0%, #047857 100%); color:white; display:flex; justify-content:space-between; align-items:center; border-radius:var(--radius-lg) var(--radius-lg) 0 0;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${icons.download('w-5 h-5 text-white')}
            </div>
            <div>
              <div style="font-weight:800; font-size:1.1rem; line-height:1.2;">Ekspor Data</div>
              <div style="font-size:0.75rem; opacity:0.9; margin-top:2px;">Format resmi lengkap dengan Kop Dokumen Kelurahan Purwantoro</div>
            </div>
          </div>
          <button type="button" id="btn-close-export-modal" style="background:transparent; border:none; color:white; opacity:0.8; cursor:pointer; padding:4px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:all 0.2s;" title="Tutup">
            ${icons.xCircle ? icons.xCircle('w-6 h-6') : '✕'}
          </button>
        </div>

        <div style="padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem;">
          <!-- Pilihan Format Berkas -->
          <div>
            <label style="display:block; font-size:0.82rem; font-weight:800; color:#1e293b; margin-bottom:0.6rem;">
              1. Pilih Format Berkas Ekspor:
            </label>
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              
              <label style="display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem 1rem; border:2px solid #047857; background:#f0fdf4; border-radius:var(--radius-md); cursor:pointer; transition:all 0.2s;">
                <input type="radio" name="export-file-format" value="xls" checked style="margin-top:0.25rem; accent-color:#047857;">
                <div>
                  <div style="font-weight:800; font-size:0.88rem; color:#065f46; display:flex; align-items:center; gap:0.4rem;">
                    Microsoft Excel (.XLS)
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Pilihan Cakupan Data -->
          <div>
            <label style="display:block; font-size:0.82rem; font-weight:800; color:#1e293b; margin-bottom:0.6rem;">
              2. Pilih Cakupan Data:
            </label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              
              <label style="display:flex; align-items:center; gap:0.6rem; padding:0.75rem 0.9rem; border:1.5px solid #047857; background:#f0fdf4; border-radius:var(--radius-md); cursor:pointer;">
                <input type="radio" name="export-data-scope" value="filtered" checked style="accent-color:#047857;">
                <span style="font-size:0.82rem; font-weight:700; color:#065f46;">
                  Sesuai Filter Aktif (${filteredCount} Data)
                </span>
              </label>

              <label style="display:flex; align-items:center; gap:0.6rem; padding:0.75rem 0.9rem; border:1.5px solid #cbd5e1; background:white; border-radius:var(--radius-md); cursor:pointer;">
                <input type="radio" name="export-data-scope" value="all" style="accent-color:#047857;">
                <span style="font-size:0.82rem; font-weight:700; color:#334155;">
                  Semua Data (${allCount} Rumah)
                </span>
              </label>

            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div style="padding:1rem 1.5rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:0.75rem; align-items:center; border-radius:0 0 var(--radius-lg) var(--radius-lg);">
          <button type="button" class="btn btn-secondary" id="btn-cancel-export-modal" style="font-weight:700; padding:0.6rem 1.15rem; font-size:0.85rem; cursor:pointer;">
            Batal
          </button>
          <button type="button" class="btn btn-primary" id="btn-confirm-export" style="background:#047857; border-color:#047857; font-weight:800; padding:0.6rem 1.35rem; font-size:0.88rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer; box-shadow:0 2px 8px rgba(4,120,87,0.25);">
            ${icons.download('w-4 h-4')} Unduh Berkas Sekarang
          </button>
        </div>

      </div>
    </div>
  `;
}

export function initExportModalEvents({ filteredSurveys = [], currentFilters = {}, onClose, showToast }) {
  const backdrop = document.getElementById("export-modal-backdrop");
  const btnClose = document.getElementById("btn-close-export-modal");
  const btnCancel = document.getElementById("btn-cancel-export-modal");
  const btnConfirm = document.getElementById("btn-confirm-export");
  const scopeRadios = document.querySelectorAll('input[name="export-data-scope"]');
  const previewCount = document.getElementById("label-export-preview-count");

  const allSurveys = storage.getSurveys();
  const currentUser = storage.getCurrentUser();
  const currentRole = storage.getCurrentRole();
  const isPetugas = currentRole === "petugas" || currentUser?.role === "petugas";

  function closeModal() {
    if (backdrop) {
      backdrop.style.opacity = "0";
      backdrop.style.transition = "opacity 0.15s ease";
      setTimeout(() => {
        backdrop.remove();
        if (typeof onClose === "function") onClose();
      }, 150);
    }
  }

  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Handle Radio Scope Change (update preview count)
  scopeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (previewCount) {
        if (radio.value === "all") {
          previewCount.textContent = `${allSurveys.length} Rumah (Seluruh Wilayah)`;
        } else {
          previewCount.textContent = `${filteredSurveys.length} Rumah (Sesuai Filter)`;
        }
      }
    });
  });

  // Handle Download Confirmation
  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      const selectedFormat = document.querySelector('input[name="export-file-format"]:checked')?.value || "xls";
      const selectedScope = document.querySelector('input[name="export-data-scope"]:checked')?.value || "filtered";

      let surveysToExport = selectedScope === "all" ? allSurveys : filteredSurveys;
      if (surveysToExport.length === 0) {
        surveysToExport = allSurveys;
      }

      const meta = {
        actorName: currentUser?.nama || (isPetugas ? "Petugas Lapangan" : "Admin Kelurahan"),
        actorRole: isPetugas ? "Petugas Lapangan" : (currentRole === "admin" ? "Admin Sistem" : "Pegawai Kelurahan"),
        rwFilter: selectedScope === "all" ? "ALL" : (currentFilters.rw || "ALL"),
        rtFilter: selectedScope === "all" ? "ALL" : (currentFilters.rt || "ALL"),
        verifFilter: selectedScope === "all" ? "ALL" : (currentFilters.verif || "ALL")
      };

      if (selectedFormat === "xls") {
        exportSurveysToExcel(surveysToExport, meta);
      } else if (selectedFormat === "csv_semicolon") {
        exportSurveysToCSV(surveysToExport, meta, ";");
      } else {
        exportSurveysToCSV(surveysToExport, meta, ",");
      }

      if (typeof showToast === "function") {
        showToast(`Berhasil mengekspor ${surveysToExport.length} data rumah ke berkas ${selectedFormat.toUpperCase()}!`);
      }

      closeModal();
    });
  }
}

