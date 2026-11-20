import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";

export function renderDatabaseBackup() {
  const currentUser = storage.getCurrentUser();
  const currentRole = storage.getCurrentRole();
  const isPetugas = currentRole === "petugas" || currentUser?.role === "petugas";
  const lastBackupStr = localStorage.getItem("sipelita_last_backup_time");

  return `
    <div class="database-backup-container" style="max-width: ${isPetugas ? '720px' : '1080px'}; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">

      <!-- BANNER SINKRONISASI DATA LOKAL KE SERVER DATABASE -->
      <div class="card" style="padding: 1.25rem 1.5rem; border: 1.5px solid #38bdf8; background: #f0f9ff; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="font-weight: 800; font-size: 0.95rem; color: #0369a1; display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: #0284c7; display: inline-flex; align-items: center;">${icons.refresh('w-5 h-5')}</span> Sinkronkan Seluruh Data Lokal
          </div>
        </div>
        <button type="button" class="btn btn-primary" id="btn-push-local-to-db" style="background: #0284c7; border-color: #0284c7; font-weight: 800; padding: 0.65rem 1.35rem; font-size: 0.88rem; cursor: pointer; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25); display: inline-flex; align-items: center; gap: 0.4rem;">
          ${icons.refresh('w-4 h-4')} Kirim Data Lokal ke Server Sekarang
        </button>
      </div>

      ${!isPetugas ? `
        <!-- STATISTIK RINGKASAN DATABASE (HANYA ADMIN & PEGAWAI) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          
          <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #10b981;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${icons.home('w-6 h-6')}
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--dark-500); font-weight: 700; text-transform: uppercase;">Total Data Rumah</div>
              <div style="font-size: 1.6rem; font-weight: 900; color: var(--dark-900); line-height: 1.2;" id="stat-total-surveys">-</div>
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #0284c7;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #f0f9ff; color: #0284c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${icons.users('w-6 h-6')}
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--dark-500); font-weight: 700; text-transform: uppercase;">Pengguna & Petugas</div>
              <div style="font-size: 1.6rem; font-weight: 900; color: var(--dark-900); line-height: 1.2;" id="stat-total-users">-</div>
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${icons.mapPin('w-6 h-6')}
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--dark-500); font-weight: 700; text-transform: uppercase;">Cakupan Wilayah</div>
              <div style="font-size: 1.6rem; font-weight: 900; color: var(--dark-900); line-height: 1.2;" id="stat-total-rtrw">24 RW</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- MAIN SECTION: 1 KOLOM UNTUK PETUGAS ATAU 2 KOLOM UNTUK ADMIN/PEGAWAI -->
      <div style="display: grid; grid-template-columns: ${isPetugas ? '1fr' : 'repeat(auto-fit, minmax(460px, 1fr))'}; gap: 1.5rem;">
        
        <!-- =========================================================
             KARTU 1: PENCADANGAN DATABASE (.ZIP) (DITAMPILKAN SEMUA ROLE)
             ========================================================= -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); padding: 1.5rem;">
          <div>
            <!-- INFO TERAKHIR CADANGAN -->
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: var(--dark-600); margin-bottom: 0.5rem;">
              <span>🕒 Terakhir dicadangkan:</span>
              <strong id="label-last-backup-time" style="color: var(--dark-800);">
                ${lastBackupStr ? lastBackupStr : 'Belum pernah dicadangkan di peramban ini'}
              </strong>
            </div>
          </div>

          <!-- TOMBOL DOWNLOAD CADANGAN -->
          <div style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-primary" id="btn-trigger-backup-zip" style="width: 100%; padding: 0.85rem 1.25rem; font-size: 0.95rem; font-weight: 800; background: #047857; border-color: #047857; display: flex; align-items: center; justify-content: center; gap: 0.6rem; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25); cursor: pointer;">
              ${icons.download('w-5 h-5')}
              <span id="btn-backup-label">Unduh Cadangan Database (.ZIP)</span>
            </button>
            <div id="backup-progress-msg" style="display: none; font-size: 0.78rem; color: #047857; font-weight: 700; text-align: center; margin-top: 0.5rem;">
               Mengemas berkas ZIP dari server... Harap tunggu sebentar.
            </div>
          </div>
        </div>

        ${!isPetugas ? `
          <!-- =========================================================
               KARTU 2: PEMULIHAN & SINKRONISASI (RESTORE / SYNC) (HANYA ADMIN & PEGAWAI)
               ========================================================= -->
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); padding: 1.5rem;">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--dark-900); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;">
                ${icons.upload ? icons.upload('w-5 h-5') : icons.refresh('w-5 h-5')} Unggah & Sinkronkan Data
              </div>

              <!-- DROPZONE FILE UPLOAD -->
              <div id="dropzone-restore-area" style="border: 2px dashed #cbd5e1; border-radius: var(--radius-md); padding: 1.5rem 1rem; text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s ease;">
                <input type="file" id="input-backup-file" accept=".zip,.sql,.json" style="display: none;">
                <div style="font-size: 2.2rem; margin-bottom: 0.4rem;">📦</div>
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--dark-800);">
                  Klik untuk Memilih Berkas Cadangan
                </div>
                <div style="font-size: 0.75rem; color: var(--dark-500); margin-top: 0.25rem;">
                  Format berkas yang didukung: <strong>.ZIP</strong>, <strong>.SQL</strong>, atau <strong>.JSON</strong>
                </div>
              </div>

              <!-- INFO BERKAS TERPILIH -->
              <div id="selected-file-info" style="display: none; margin-top: 1rem; padding: 0.75rem 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
                    <span style="font-size: 1.2rem; flex-shrink: 0;">📄</span>
                    <div style="overflow: hidden;">
                      <strong id="selected-file-name" style="font-size: 0.82rem; color: #0369a1; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</strong>
                      <span id="selected-file-size" style="font-size: 0.72rem; color: var(--dark-500);">-</span>
                    </div>
                  </div>
                  <span class="badge" style="background: #0284c7; color: white; font-size: 0.7rem; padding: 3px 8px; flex-shrink: 0;">Siap Sinkron</span>
                </div>
              </div>
            </div>

            <!-- TOMBOL RESTORE -->
            <div style="margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" id="btn-trigger-restore" style="width: 100%; padding: 0.85rem 1.25rem; font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.6rem; border-radius: var(--radius-md); cursor: pointer;">
                ${icons.refresh('w-5 h-5')}
                <span id="btn-restore-label">Pilih Berkas & Unggah Sinkronisasi</span>
              </button>
              <div id="restore-progress-msg" style="display: none; font-size: 0.78rem; color: #0284c7; font-weight: 700; text-align: center; margin-top: 0.5rem;">
                Memproses sinkronisasi dan memulihkan basis data... Harap tidak menutup jendela browser.
              </div>
            </div>
          </div>
        ` : ''}

      </div>

      <!-- SECTION LOG AKTIVITAS PETUGAS & AUDIT TRAIL (UNTUK CEK GAGAL INPUT / PULIHKAN DATA HILANG) -->
      <div class="card" style="border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); padding: 1.5rem; margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <div style="font-weight: 800; font-size: 1.05rem; color: var(--dark-900); display: flex; align-items: center; gap: 0.5rem;">
              <span>📜</span> Log Aktivitas Lapangan & Pemulihan Data
            </div>
            <div style="font-size: 0.78rem; color: var(--dark-600); margin-top: 2px;">
              Mencatat seluruh rekaman submit, update, hapus, dan kegagalan jaringan petugas. Data yang terhapus atau gagal submit dapat dipulihkan sewaktu-waktu.
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="filter-log-nik" placeholder="Cari NIK / Nama..." style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border: 1px solid var(--gray-300); border-radius: var(--radius-sm); max-width: 180px;">
            <button type="button" class="btn btn-secondary" id="btn-refresh-logs" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; cursor: pointer;">
              ${icons.refresh('w-3.5 h-3.5')} Segarkan Log
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid var(--gray-200); text-align: left; color: var(--dark-700);">
                <th style="padding: 0.65rem 0.75rem;">Waktu</th>
                <th style="padding: 0.65rem 0.75rem;">Petugas</th>
                <th style="padding: 0.65rem 0.75rem;">Aksi</th>
                <th style="padding: 0.65rem 0.75rem;">Warga (NIK / RW)</th>
                <th style="padding: 0.65rem 0.75rem;">Status / Pesan</th>
                <th style="padding: 0.65rem 0.75rem; text-align: center;">Tindakan</th>
              </tr>
            </thead>
            <tbody id="table-activity-logs-body">
              <tr>
                <td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--dark-400);">Memuat log aktivitas...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

export function initDatabaseBackupEvents(container, { showToast, onStateChange } = {}) {
  const statSurveys = container.querySelector("#stat-total-surveys");
  const statUsers = container.querySelector("#stat-total-users");
  const statRtrw = container.querySelector("#stat-total-rtrw");

  const btnBackupZip = container.querySelector("#btn-trigger-backup-zip");
  const backupProgress = container.querySelector("#backup-progress-msg");
  const backupLabel = container.querySelector("#btn-backup-label");
  const labelLastBackup = container.querySelector("#label-last-backup-time");

  const dropzone = container.querySelector("#dropzone-restore-area");
  const fileInput = container.querySelector("#input-backup-file");
  const fileInfo = container.querySelector("#selected-file-info");
  const fileNameDisplay = container.querySelector("#selected-file-name");
  const fileSizeDisplay = container.querySelector("#selected-file-size");
  const btnRestore = container.querySelector("#btn-trigger-restore");
  const restoreProgress = container.querySelector("#restore-progress-msg");
  const restoreLabel = container.querySelector("#btn-restore-label");

  let selectedFile = null;

  // 1. Muat Statistik Terkini dari API (hanya jika elemen statistik ada di DOM)
  async function loadDatabaseStats() {
    if (!statSurveys && !statUsers && !statRtrw) return;
    try {
      const stats = await storage.getDatabaseBackupStats();
      if (stats && stats.counts) {
        if (statSurveys) statSurveys.textContent = `${stats.counts.surveys || 0} Rumah`;
        if (statUsers) statUsers.textContent = `${stats.counts.users || 0} Akun`;
        if (statRtrw) statRtrw.textContent = `24 RW (${stats.counts.rt_rws || 158} RT)`;
      }
    } catch (e) {
      console.warn("Gagal memuat statistik database:", e);
    }
  }
  loadDatabaseStats();

  // 1b. Event Tombol Kirim Data Lokal ke Server Database
  const btnPushLocal = container.querySelector("#btn-push-local-to-db");
  if (btnPushLocal) {
    btnPushLocal.addEventListener("click", async () => {
      const localList = storage.getSurveys();
      if (!localList || localList.length === 0) {
        alert("Tidak ada data survei lokal di browser ini.");
        return;
      }
      if (!confirm(`Apakah Anda ingin mengirim ${localList.length} data survei lokal dari browser ini ke basis data server MySQL?`)) {
        return;
      }
      btnPushLocal.disabled = true;
      const originalText = btnPushLocal.innerHTML;
      btnPushLocal.innerHTML = " Mengirim data ke server...";
      try {
        const res = await storage.pushLocalSurveysToDB();
        if (res.successCount > 0) {
          alert(`Berhasil! ${res.successCount} dari ${res.total} data survei berhasil dikirim dan tersimpan di database server MySQL.\n\nSekarang data ini sudah dapat diakses oleh perangkat lain (HP dan petugas).`);
          if (typeof showToast === "function") {
            showToast(`${res.successCount} data berhasil disinkronkan ke server!`);
          }
          await loadDatabaseStats();
        } else {
          alert(`Gagal mengirim data ke server:\n${res.errors.join('\n') || 'Server tidak merespons.'}\n\nPastikan server backend di https://sipelita.bpskotamalang.id/ sedang aktif dan Nginx reverse proxy mengarah ke port 8000.`);
        }
      } catch (err) {
        alert("Error sinkronisasi: " + err.message);
      } finally {
        btnPushLocal.disabled = false;
        btnPushLocal.innerHTML = originalText;
      }
    });
  }

  // 2. Event Tombol Unduh Cadangan Database ZIP via Fetch Blob
  if (btnBackupZip) {
    btnBackupZip.addEventListener("click", async () => {
      btnBackupZip.disabled = true;
      if (backupProgress) backupProgress.style.display = "block";
      if (backupLabel) backupLabel.textContent = "Mengemas Berkas ZIP...";

      try {
        const downloadUrl = storage.getBackupZipDownloadUrl();
        const response = await fetch(downloadUrl);

        if (!response.ok) {
          throw new Error(`Server merespons status ${response.status} (${response.statusText || 'Error'})`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Berkas cadangan kosong dari server.");
        }

        // Buat blob object URL untuk trigger unduh aman tanpa navigasi keluar halaman
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = objectUrl;
        a.download = `SIPELITA_PURWANTORO_BACKUP_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
        }, 500);

        // Simpan waktu cadangan terakhir
        const nowFormatted = new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }) + " WIB";

        localStorage.setItem("sipelita_last_backup_time", nowFormatted);
        if (labelLastBackup) labelLastBackup.textContent = nowFormatted;

        if (typeof showToast === "function") {
          showToast("Berkas arsip ZIP cadangan basis data berhasil diunduh.");
        }
      } catch (err) {
        console.error("Gagal mengunduh cadangan:", err);
        alert(`Gagal mengunduh cadangan basis data:\n${err.message || err}\n\nPastikan server backend SIPELITA aktif dan dapat terhubung ke MySQL.`);
      } finally {
        btnBackupZip.disabled = false;
        if (backupProgress) backupProgress.style.display = "none";
        if (backupLabel) backupLabel.textContent = "Unduh Cadangan Database (.ZIP)";
      }
    });
  }

  // 3. Penanganan Pemilihan File Dropzone & File Input (Hanya jika elemen tersedia)
  function handleFileSelection(file) {
    if (!file) return;
    selectedFile = file;
    const name = file.name;
    const sizeKb = (file.size / 1024).toFixed(1);

    if (fileNameDisplay) fileNameDisplay.textContent = name;
    if (fileSizeDisplay) fileSizeDisplay.textContent = `${sizeKb} KB`;
    if (fileInfo) fileInfo.style.display = "block";

    if (btnRestore) {
      btnRestore.classList.remove("btn-secondary");
      btnRestore.classList.add("btn-primary");
      btnRestore.style.background = "#0284c7";
      btnRestore.style.borderColor = "#0284c7";
      if (restoreLabel) restoreLabel.textContent = "Unggah & Sinkronkan Sekarang";
    }
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "#0284c7";
      dropzone.style.background = "#eff6ff";
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.style.borderColor = "#cbd5e1";
      dropzone.style.background = "#f8fafc";
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "#cbd5e1";
      dropzone.style.background = "#f8fafc";
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  // 4. Event Tombol Pulihkan & Sinkronkan (Hanya jika tombol tersedia)
  if (btnRestore) {
    btnRestore.addEventListener("click", async () => {
      // Jika belum ada file yang dipilih, buka file picker
      if (!selectedFile) {
        if (fileInput) {
          fileInput.click();
        }
        return;
      }

      const confirmMsg = `Konfirmasi Pemulihan & Sinkronisasi:\n\nApakah Anda yakin ingin memulihkan / menyinkronkan data dari berkas:\n"${selectedFile.name}"?\n\nData yang ada di dalam berkas akan diperbarui ke basis data MySQL SIPELITA.`;

      if (!confirm(confirmMsg)) return;

      btnRestore.disabled = true;
      if (restoreProgress) restoreProgress.style.display = "block";
      if (restoreLabel) restoreLabel.textContent = "Menyinkronkan Basis Data...";

      try {
        const result = await storage.restoreDatabaseBackup(selectedFile);

        if (typeof showToast === "function") {
          showToast(result.message || "Pemulihan dan sinkronisasi basis data berhasil!");
        }

        // Muat ulang statistik
        await loadDatabaseStats();

        // Bersihkan input
        selectedFile = null;
        if (fileInput) fileInput.value = "";
        if (fileInfo) fileInfo.style.display = "none";
        btnRestore.disabled = false;
        btnRestore.classList.remove("btn-primary");
        btnRestore.classList.add("btn-secondary");
        btnRestore.style.background = "";
        btnRestore.style.borderColor = "";
        if (restoreLabel) restoreLabel.textContent = "Pilih Berkas & Unggah Sinkronisasi";

        if (typeof onStateChange === "function") {
          onStateChange();
        }
      } catch (err) {
        console.error("Gagal memulihkan cadangan:", err);
        alert("Gagal memulihkan cadangan:\n" + (err.message || err) + "\n\nPastikan format berkas sesuai (.ZIP, .SQL, atau .JSON) dan server PHP aktif.");
      } finally {
        btnRestore.disabled = false;
        if (restoreProgress) restoreProgress.style.display = "none";
        if (!selectedFile && restoreLabel) {
          restoreLabel.textContent = "Pilih Berkas & Unggah Sinkronisasi";
        }
      }
    });
  }

  // 5. Muat dan Tampilkan Log Aktivitas & Pemulihan Data Lapangan
  const logTableBody = container.querySelector("#table-activity-logs-body");
  const filterLogNik = container.querySelector("#filter-log-nik");
  const btnRefreshLogs = container.querySelector("#btn-refresh-logs");

  async function loadActivityLogs() {
    if (!logTableBody) return;
    try {
      const q = filterLogNik?.value?.trim() || "";
      const logs = await storage.getActivityLogs(q ? { nik: q } : {});
      if (!logs || logs.length === 0) {
        logTableBody.innerHTML = `<tr><td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--dark-400);">Belum ada catatan log aktivitas tersimpan.</td></tr>`;
        return;
      }

      logTableBody.innerHTML = logs.map(l => {
        const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleString("id-ID") : "-";
        const badgeColor = l.status === "SUCCESS" ? "#059669" : "#dc2626";
        const badgeBg = l.status === "SUCCESS" ? "#ecfdf5" : "#fef2f2";

        let actionLabel = l.action;
        if (l.action === "INPUT_SURVEY") actionLabel = "📝 Input Baru";
        else if (l.action === "UPDATE_SURVEY") actionLabel = "✏️ Pembaruan/Revisi";
        else if (l.action === "DELETE_SURVEY") actionLabel = "🗑️ Hapus Survei";
        else if (l.action === "REJECTED_DUPLICATE") actionLabel = "⚠️ Ditolak Duplikat";
        else if (l.action === "SAVE_ERROR") actionLabel = "❌ Gagal Simpan";
        else if (l.action === "VERIFY_SURVEY") actionLabel = "✅ Verifikasi";

        return `
          <tr style="border-bottom: 1px solid var(--gray-200);">
            <td style="padding: 0.6rem 0.75rem; white-space: nowrap; font-size: 0.75rem; color: var(--dark-600);">${timeStr}</td>
            <td style="padding: 0.6rem 0.75rem; font-weight: 700; color: var(--dark-800);">${l.user_nama || "Petugas Lapangan"}</td>
            <td style="padding: 0.6rem 0.75rem; font-weight: 600;">${actionLabel}</td>
            <td style="padding: 0.6rem 0.75rem;">
              <div style="font-weight: 700; color: var(--dark-900);">${l.nama_kk || "-"}</div>
              <div style="font-size: 0.72rem; color: var(--dark-500); font-family: monospace;">NIK: ${l.nik || "-"} ${l.rw ? `| RW ${l.rw}` : ""}</div>
            </td>
            <td style="padding: 0.6rem 0.75rem;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; margin-bottom: 2px;">
                ${l.status}
              </span>
              <div style="font-size: 0.72rem; color: var(--dark-500); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.message || ''}">
                ${l.message || "-"}
              </div>
            </td>
            <td style="padding: 0.6rem 0.75rem; text-align: center; white-space: nowrap;">
              ${l.has_backup ? `
                <button type="button" class="btn btn-sm btn-restore-from-log" data-log-id="${l.id}" data-warga="${l.nama_kk || l.nik || ''}" style="padding: 3px 8px; font-size: 0.72rem; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                  🔄 Pulihkan
                </button>
              ` : `
                <span style="font-size: 0.7rem; color: var(--dark-400);">-</span>
              `}
            </td>
          </tr>
        `;
      }).join("");

      // Bind tombol pulihkan dari log
      logTableBody.querySelectorAll(".btn-restore-from-log").forEach(btn => {
        btn.addEventListener("click", async () => {
          const logId = btn.dataset.logId;
          const warga = btn.dataset.warga || "data warga";
          if (!confirm(`Konfirmasi Pemulihan Data:\n\nApakah Anda yakin ingin memulihkan kembali data survei untuk:\n"${warga}"?\n\nData survei lengkap akan dipulihkan ke basis data sistem.`)) {
            return;
          }
          btn.disabled = true;
          btn.textContent = "Memulihkan...";
          try {
            const res = await storage.restoreSurveyFromLog(logId);
            if (typeof showToast === "function") {
              showToast(res.message || "Data survei berhasil dipulihkan!");
            } else {
              alert(res.message || "Data survei berhasil dipulihkan!");
            }
            if (typeof onStateChange === "function") {
              onStateChange();
            }
            await loadActivityLogs();
            await loadDatabaseStats();
          } catch (err) {
            alert("Gagal memulihkan survei: " + err.message);
            btn.disabled = false;
            btn.textContent = "🔄 Pulihkan";
          }
        });
      });

    } catch (e) {
      console.warn("Gagal memuat activity logs:", e);
      if (logTableBody) {
        logTableBody.innerHTML = `<tr><td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--dark-400);">Gagal memuat log aktivitas: ${e.message}</td></tr>`;
      }
    }
  }

  loadActivityLogs();

  if (btnRefreshLogs) {
    btnRefreshLogs.addEventListener("click", () => loadActivityLogs());
  }
  if (filterLogNik) {
    filterLogNik.addEventListener("keyup", (e) => {
      if (e.key === "Enter") loadActivityLogs();
    });
  }
}
