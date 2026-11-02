import { storage } from "../utils/storage.js";
import { icons } from "../utils/icons.js";

let activeMemberSubTab = "semua"; // "semua" | "pegawai" | "petugas" | "pending"
let memberSearchQuery = "";
let memberStatusFilter = "ALL"; // "ALL" | "PENDING" | "APPROVED" | "REJECTED"

export function renderMemberManagement() {
  const users = storage.getUsers();
  const counts = storage.getPendingCounts();

  const totalUsers = users.length;
  const isApproved = (u) => (u.status || "").toUpperCase() === "APPROVED" || (u.status || "").toLowerCase() === "active";

  const approvedPetugas = users.filter(u => u.role === "petugas" && isApproved(u)).length;
  const totalPetugas = users.filter(u => u.role === "petugas").length;

  const approvedPegawai = users.filter(u => u.role === "pegawai" && isApproved(u)).length;
  const totalPegawai = users.filter(u => u.role === "pegawai").length;

  return `
    <div class="member-management-wrapper" style="display:flex; flex-direction:column; gap:1.25rem;">
      <!-- Page Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-members">
            ${icons.refresh('w-4 h-4')} Refresh
          </button>
          <button class="btn btn-primary btn-sm" id="btn-open-modal-add-member">
            ${icons.plusCircle('w-4 h-4')} Tambah Anggota
          </button>
        </div>
      </div>

      <!-- Clean KPI Metric Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Anggota</span>
            <div class="kpi-icon-wrap">${icons.users('w-4 h-4')}</div>
          </div>
          <div class="kpi-value">${totalUsers}</div>
        </div>

        <div class="kpi-card ${counts.total > 0 ? 'kpi-pending-alert' : ''}">
          <div class="kpi-header">
            <span class="kpi-title">Menunggu Persetujuan</span>
            <div class="kpi-icon-wrap" style="color:var(--accent-600);">${icons.clipboard('w-4 h-4')}</div>
          </div>
          <div class="kpi-value" style="color:${counts.total > 0 ? 'var(--accent-600)' : 'inherit'};">
            ${counts.total}
          </div>
          <div class="kpi-subtext">
${counts.total > 0 ? `${counts.petugas || 0} Petugas, ${counts.pegawai || 0} Pegawai butuh aksi` : 'Tidak ada antrean'}          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid var(--info);">
          <div class="kpi-header">
            <span class="kpi-title">Petugas Lapangan</span>
            <div class="kpi-icon-wrap" style="color:var(--info);">${icons.mapPin('w-4 h-4')}</div>
          </div>
          <div class="kpi-value" style="color:var(--info);">${approvedPetugas} <span style="font-size:1rem; font-weight:600; color:var(--dark-600);">/ ${totalPetugas}</span></div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid var(--primary-700);">
          <div class="kpi-header">
            <span class="kpi-title">Pegawai Kelurahan</span>
            <div class="kpi-icon-wrap" style="color:var(--primary-700);">${icons.home('w-4 h-4')}</div>
          </div>
          <div class="kpi-value" style="color:var(--primary-700);">${approvedPegawai} <span style="font-size:1rem; font-weight:600; color:var(--dark-600);">/ ${totalPegawai}</span></div>
        </div>
      </div>

      <!-- Main Member Card Container -->
      <div class="card" style="padding:0; overflow:hidden;">
        <!-- Clean Subtabs -->
        <div class="member-subtabs-bar">
          <button type="button" class="member-subtab-btn ${activeMemberSubTab === 'semua' ? 'active' : ''}" data-subtab="semua">
            <span>Semua Anggota</span>
            <span class="subtab-count-badge badge-all">${totalUsers}</span>
          </button>

          <button type="button" class="member-subtab-btn ${activeMemberSubTab === 'pegawai' ? 'active' : ''}" data-subtab="pegawai">
            <span>Pegawai Kelurahan</span>
            <span class="subtab-count-badge badge-pegawai">${totalPegawai}</span>
            ${(counts.pegawai || 0) > 0 ? `<span class="badge badge-warning" style="font-size:0.7rem; padding:2px 6px;">${counts.pegawai} Pending</span>` : ''}
          </button>

          <button type="button" class="member-subtab-btn ${activeMemberSubTab === 'petugas' ? 'active' : ''}" data-subtab="petugas">
            <span>Petugas Lapangan</span>
            <span class="subtab-count-badge badge-petugas">${totalPetugas}</span>
            ${(counts.petugas || 0) > 0 ? `<span class="badge badge-warning" style="font-size:0.7rem; padding:2px 6px;">${counts.petugas} Pending</span>` : ''}
          </button>

          <button type="button" class="member-subtab-btn ${activeMemberSubTab === 'pending' ? 'active' : ''}" data-subtab="pending">
            <span>Antrean Persetujuan</span>
            <span class="badge ${counts.total > 0 ? 'badge-warning' : 'badge-secondary'}" style="font-size:0.7rem; padding:2px 6px;">
              ${counts.total} Akun
            </span>
          </button>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="member-toolbar" style="padding:1rem 1.25rem; background:white; border-bottom:1px solid var(--gray-200); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem;">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; flex:1; max-width:650px;">
            <div class="search-input-wrap" style="flex:1; min-width:240px;">
              <span class="search-icon-inside">${icons.search('w-4 h-4')}</span>
              <input type="text" class="search-input-field" id="member-search-input" placeholder="Cari nama, NIP, ID, username, atau HP..." value="${memberSearchQuery}">
            </div>

            <select class="form-select" id="member-filter-status" style="width:auto; padding:0.55rem 0.85rem; font-size:0.85rem;">
              <option value="ALL" ${memberStatusFilter === 'ALL' ? 'selected' : ''}>Semua Status</option>
              <option value="PENDING" ${memberStatusFilter === 'PENDING' ? 'selected' : ''}>Menunggu Persetujuan</option>
              <option value="APPROVED" ${memberStatusFilter === 'APPROVED' ? 'selected' : ''}>Aktif / Disetujui</option>
              <option value="REJECTED" ${memberStatusFilter === 'REJECTED' ? 'selected' : ''}>Ditolak</option>
            </select>
          </div>

          <div style="font-size:0.8rem; font-weight:700; color:var(--dark-700);" id="member-row-count-info">
            Memuat data...
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-responsive" style="border:none; border-radius:0; box-shadow:none;">
          <table class="custom-table" id="members-table">
            <thead id="members-table-head">
            </thead>
            <tbody id="members-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals Container -->
    <div id="member-modals-root"></div>
  `;
}

export function initMemberManagementEvents(container, { showToast, onStateChange }) {
  const searchInput = container.querySelector("#member-search-input");
  const filterStatus = container.querySelector("#member-filter-status");
  const tableHead = container.querySelector("#members-table-head");
  const tableBody = container.querySelector("#members-table-body");
  const rowCountInfo = container.querySelector("#member-row-count-info");
  const modalsRoot = container.querySelector("#member-modals-root");
  const btnRefresh = container.querySelector("#btn-refresh-members");
  const btnAddManual = container.querySelector("#btn-open-modal-add-member");

  container.querySelectorAll(".member-subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeMemberSubTab = btn.dataset.subtab;
      container.querySelectorAll(".member-subtab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTable();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      memberSearchQuery = e.target.value.toLowerCase().trim();
      renderTable();
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", (e) => {
      memberStatusFilter = e.target.value;
      renderTable();
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.disabled = true;
      if (typeof storage.syncUsersFromDB === "function") {
        await storage.syncUsersFromDB();
      }
      btnRefresh.disabled = false;
      renderTable();
      updateTopCounters();
      if (typeof showToast === "function") {
        showToast("Data anggota telah disinkronkan dengan database.");
      }
    });
  }

  if (btnAddManual) {
    btnAddManual.addEventListener("click", () => {
      openAddMemberModal();
    });
  }

  function formatDate(isoStr) {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return isoStr;
    }
  }

  function normalizeStatus(st) {
    const val = (st || "").toUpperCase();
    if (val === "ACTIVE" || val === "APPROVED") return "APPROVED";
    if (val === "REJECTED") return "REJECTED";
    return "PENDING";
  }

  function renderTableHead() {
    if (!tableHead) return;

    if (activeMemberSubTab === "petugas") {
      tableHead.innerHTML = `
        <tr>
          <th>Petugas Lapangan</th>
          <th>ID Petugas</th>
          <th>Wilayah Penugasan</th>
          <th>No. WhatsApp / HP</th>
          <th>Tanggal Daftar</th>
          <th>Status</th>
          <th style="text-align:right;">Aksi Persetujuan</th>
        </tr>
      `;
    } else if (activeMemberSubTab === "pegawai") {
      tableHead.innerHTML = `
        <tr>
          <th>Pegawai Kelurahan</th>
          <th>NIP / Identitas</th>
          <th>Jabatan Kelurahan</th>
          <th>No. WhatsApp / HP</th>
          <th>Tanggal Daftar</th>
          <th>Status</th>
          <th style="text-align:right;">Aksi Persetujuan</th>
        </tr>
      `;
    } else {
      tableHead.innerHTML = `
        <tr>
          <th>Nama Anggota</th>
          <th>Peran</th>
          <th>Identitas (NIP/ID)</th>
          <th>Jabatan / Wilayah</th>
          <th>No. WhatsApp / HP</th>
          <th>Tanggal Daftar</th>
          <th>Status</th>
          <th style="text-align:right;">Aksi Persetujuan</th>
        </tr>
      `;
    }
  }

  async function renderTable() {
    renderTableHead();
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;">Memuat data dari database...</td></tr>`;
    }

    let users = [];
    try {
      const res = await fetch("/src/data/api/get_users.php");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        users = json.data;
        // Simpan ke storage lokal agar sinkron
        storage.saveUsers(users);
      } else {
        users = storage.getUsers();
      }
    } catch (e) {
      console.warn("Gagal fetch dari API, fallback ke local storage", e);
      users = storage.getUsers();
    }

    let filtered = users.filter(u => {
      if (activeMemberSubTab === "semua") {
        return true;
      } else if (activeMemberSubTab === "pegawai") {
        return u.role === "pegawai" || (u.role === "admin" && u.username !== "admin");
      } else if (activeMemberSubTab === "petugas") {
        return u.role === "petugas";
      } else if (activeMemberSubTab === "pending") {
        return normalizeStatus(u.status) === "PENDING";
      }
      return true;
    });

    if (memberStatusFilter !== "ALL") {
      filtered = filtered.filter(u => normalizeStatus(u.status) === memberStatusFilter);
    }

    if (memberSearchQuery) {
      filtered = filtered.filter(u => {
        const name = (u.nama || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const nip = (u.nip || "").toLowerCase();
        const idPetugas = (u.id_petugas || "").toLowerCase();
        const telp = (u.telepon || u.no_hp || "").toLowerCase();
        const jabatan = (u.jabatan || "").toLowerCase();
        const wilayah = (u.wilayah_tugas || "").toLowerCase();

        return name.includes(memberSearchQuery) ||
          username.includes(memberSearchQuery) ||
          nip.includes(memberSearchQuery) ||
          idPetugas.includes(memberSearchQuery) ||
          telp.includes(memberSearchQuery) ||
          jabatan.includes(memberSearchQuery) ||
          wilayah.includes(memberSearchQuery);
      });
    }

    if (rowCountInfo) {
      rowCountInfo.textContent = `Menampilkan ${filtered.length} anggota`;
    }

    if (!tableBody) return;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2.5rem 1rem; color:var(--dark-600);">
            <div style="font-weight:700; font-size:0.95rem; color:var(--dark-800);">Tidak ada data anggota</div>
            <p style="font-size:0.8rem; margin-top:0.25rem;">
              ${activeMemberSubTab === 'pending' ? 'Tidak ada akun yang sedang menunggu persetujuan.' : 'Coba sesuaikan kata kunci pencarian atau filter status.'}
            </p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(u => {
      const currentNormStatus = normalizeStatus(u.status);

      let statusBadge = "";
      if (currentNormStatus === "PENDING") {
        statusBadge = `<span class="badge badge-warning" style="font-weight:700;">Menunggu Persetujuan</span>`;
      } else if (currentNormStatus === "APPROVED") {
        statusBadge = `<span class="badge badge-success" style="font-weight:700;">Aktif</span>`;
      } else if (currentNormStatus === "REJECTED") {
        statusBadge = `<span class="badge badge-danger" style="font-weight:700;">Ditolak</span>`;
      }

      let actionButtons = "";
      if (currentNormStatus === "PENDING") {
        actionButtons = `
          <div style="display:flex; justify-content:flex-end; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-sm btn-approve-user" data-id="${u.id}" data-name="${u.nama}" style="background:#10b981; color:white; border-color:#059669; padding:0.35rem 0.75rem; font-size:0.78rem;">
              Setujui
            </button>
            <button class="btn btn-sm btn-reject-user" data-id="${u.id}" data-name="${u.nama}" style="background:#fff; color:#ef4444; border-color:#fca5a5; padding:0.35rem 0.65rem; font-size:0.78rem;">
              Tolak
            </button>
            <button class="btn btn-sm btn-secondary btn-detail-user" data-id="${u.id}" style="padding:0.35rem 0.55rem; font-size:0.78rem;" title="Detail">
              Detail
            </button>
          </div>
        `;
      } else if (currentNormStatus === "APPROVED") {
        actionButtons = `
          <div style="display:flex; justify-content:flex-end; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary btn-detail-user" data-id="${u.id}" style="padding:0.35rem 0.65rem; font-size:0.78rem;">
              Detail
            </button>
            ${u.role === 'petugas' ? `
              <button class="btn btn-sm btn-rotate-rw-user" data-id="${u.id}" data-name="${u.nama}" data-rw="${u.rw || ''}" style="background:#f0f9ff; color:#0284c7; border-color:#bae6fd; padding:0.35rem 0.65rem; font-size:0.78rem; font-weight:700;" title="Rotasi / Pindah Wilayah Tugas RW">
                Rotasi RW
              </button>
            ` : ''}
            ${u.username !== 'admin' ? `
              <button class="btn btn-sm btn-reset-password-user" data-id="${u.id}" data-name="${u.nama}" style="background:#fff; color:#0284c7; border-color:#bae6fd; padding:0.35rem 0.55rem; font-size:0.78rem;" title="Reset Kata Sandi ke default (password123)">
                Reset Sandi
              </button>
              <button class="btn btn-sm btn-reject-user" data-id="${u.id}" data-name="${u.nama}" style="background:#fff; color:#d97706; border-color:#fcd34d; padding:0.35rem 0.55rem; font-size:0.78rem;">
                Tangguhkan
              </button>
              <button class="btn btn-sm btn-delete-user" data-id="${u.id}" data-name="${u.nama}" style="background:#fff; color:#ef4444; border-color:#fca5a5; padding:0.35rem 0.55rem; font-size:0.78rem;" title="Hapus">
                Hapus
              </button>
            ` : `
              <span class="badge badge-secondary" style="font-size:0.7rem;">Akun Utama</span>
            `}
          </div>
        `;
      } else {
        actionButtons = `
          <div style="display:flex; justify-content:flex-end; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-sm btn-approve-user" data-id="${u.id}" data-name="${u.nama}" style="background:#10b981; color:white; border-color:#059669; padding:0.35rem 0.65rem; font-size:0.78rem;">
              Setujui Ulang
            </button>
            <button class="btn btn-sm btn-delete-user" data-id="${u.id}" data-name="${u.nama}" style="background:#fff; color:#ef4444; border-color:#fca5a5; padding:0.35rem 0.55rem; font-size:0.78rem;">
              Hapus
            </button>
          </div>
        `;
      }

      const regDate = u.registered_at || u.created_at;
      const phoneNum = u.telepon || u.no_hp || '-';
      const displayWilayah = u.wilayah_tugas || (u.rw ? `RW ${String(u.rw).padStart(2, '0')} (Seluruh RT)` : 'Belum Ditugaskan');

      if (activeMemberSubTab === "petugas") {
        return `
          <tr class="${currentNormStatus === 'PENDING' ? 'row-pending-highlight' : ''}">
            <td>
              <div>
                <div style="font-weight:700; color:var(--dark-900); font-size:0.9rem;">${u.nama}</div>
                <div style="font-size:0.75rem; color:#64748b;">@${u.username}</div>
              </div>
            </td>
            <td>
              <span class="badge badge-info" style="font-family:monospace; font-weight:700;">
                ${u.id_petugas || '-'}
              </span>
            </td>
            <td>
              <div style="font-weight:600; color:var(--dark-800); font-size:0.82rem;">${displayWilayah}</div>
            </td>
            <td>
              <span style="font-size:0.84rem; font-weight:600;">${phoneNum}</span>
            </td>
            <td>
              <span style="font-size:0.78rem; color:var(--dark-700);">${formatDate(regDate)}</span>
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              ${actionButtons}
            </td>
          </tr>
        `;
      } else if (activeMemberSubTab === "pegawai") {
        return `
          <tr class="${currentNormStatus === 'PENDING' ? 'row-pending-highlight' : ''}">
            <td>
              <div>
                <div style="font-weight:700; color:var(--dark-900); font-size:0.9rem;">${u.nama}</div>
                <div style="font-size:0.75rem; color:#64748b;">@${u.username}</div>
              </div>
            </td>
            <td>
              <span class="badge badge-secondary" style="font-family:monospace; font-weight:600; font-size:0.75rem;">
                ${u.nip || '-'}
              </span>
            </td>
            <td>
              <div style="font-weight:600; color:var(--dark-800); font-size:0.82rem;">${u.jabatan || 'Pegawai Kelurahan'}</div>
            </td>
            <td>
              <span style="font-size:0.84rem; font-weight:600;">${phoneNum}</span>
            </td>
            <td>
              <span style="font-size:0.78rem; color:var(--dark-700);">${formatDate(regDate)}</span>
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              ${actionButtons}
            </td>
          </tr>
        `;
      } else {
        return `
          <tr class="${currentNormStatus === 'PENDING' ? 'row-pending-highlight' : ''}">
            <td>
              <div>
                <div style="font-weight:700; color:var(--dark-900); font-size:0.9rem;">${u.nama}</div>
                <div style="font-size:0.75rem; color:#64748b;">@${u.username}</div>
              </div>
            </td>
            <td>
              <span class="badge ${u.role === 'petugas' ? 'tag-petugas' : 'tag-pegawai'}" style="font-weight:700; font-size:0.72rem;">
                ${u.role === 'petugas' ? 'Petugas Lapangan' : (u.role === 'admin' ? 'Admin Kelurahan' : 'Pegawai Kelurahan')}
              </span>
            </td>
            <td>
              <span style="font-family:monospace; font-size:0.8rem; font-weight:600; color:var(--dark-700);">
                ${u.role === 'petugas' ? (u.id_petugas || '-') : (u.nip || '-')}
              </span>
            </td>
            <td>
              <div style="font-size:0.82rem; font-weight:600; color:var(--dark-800);">
                ${u.role === 'petugas' ? displayWilayah : (u.jabatan || 'Kantor Kelurahan')}
              </div>
            </td>
            <td>
              <span style="font-size:0.84rem; font-weight:600;">${phoneNum}</span>
            </td>
            <td>
              <span style="font-size:0.78rem; color:var(--dark-700);">${formatDate(regDate)}</span>
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              ${actionButtons}
            </td>
          </tr>
        `;
      }
    }).join("");

    bindTableActionEvents();
    updateTopCounters();
  }

  function bindTableActionEvents() {
    tableBody.querySelectorAll(".btn-approve-user").forEach(btn => {
      btn.addEventListener("click", () => {
        handleApproveUser(btn.dataset.id, btn.dataset.name);
      });
    });

    tableBody.querySelectorAll(".btn-reject-user").forEach(btn => {
      btn.addEventListener("click", () => {
        handleRejectUser(btn.dataset.id, btn.dataset.name);
      });
    });

    tableBody.querySelectorAll(".btn-rotate-rw-user").forEach(btn => {
      btn.addEventListener("click", () => {
        openRotateWilayahModal(btn.dataset.id, btn.dataset.name, btn.dataset.rw);
      });
    });

    tableBody.querySelectorAll(".btn-detail-user").forEach(btn => {
      btn.addEventListener("click", () => {
        handleDetailUser(btn.dataset.id);
      });
    });

    tableBody.querySelectorAll(".btn-reset-password-user").forEach(btn => {
      btn.addEventListener("click", () => {
        handleResetPassword(btn.dataset.id, btn.dataset.name);
      });
    });

    tableBody.querySelectorAll(".btn-delete-user").forEach(btn => {
      btn.addEventListener("click", () => {
        handleDeleteUser(btn.dataset.id, btn.dataset.name);
      });
    });
  }

  async function handleResetPassword(id, name) {
    if (confirm(`Reset kata sandi akun "${name}" ke default (password123)?`)) {
      await storage.resetUserPassword(id, "password123");
      if (typeof showToast === "function") {
        showToast(`Kata sandi akun ${name} berhasil direset ke: password123`);
      }
      renderTable();
      if (typeof onStateChange === "function") {
        onStateChange();
      }
    }
  }

  async function handleApproveUser(id, name) {
    const currentUser = storage.getCurrentUser();
    if (typeof storage.updateUserStatus === "function") {
      await storage.updateUserStatus(id, "approve", { actorName: currentUser?.nama });
    } else {
      storage.approveUser(id, currentUser.nama);
    }

    if (typeof showToast === "function") {
      showToast(`Akun ${name} berhasil disetujui.`);
    }
    renderTable();
    updateTopCounters();
    if (typeof onStateChange === "function") {
      onStateChange();
    }
  }

  function handleRejectUser(id, name) {
    const user = storage.getUserById(id);
    if (!user) return;

    modalsRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialog" style="max-width:440px;">
          <div class="modal-header">
            <div style="font-weight:700; font-size:1.05rem; color:#b91c1c;">
              Tolak Pendaftaran Akun
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-close-reject-modal">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size:0.85rem; color:var(--dark-800); margin-bottom:1rem;">
              Tolak pendaftaran akun untuk <strong>${user.nama}</strong>. Pengguna tidak akan dapat login.
            </p>
            <div class="form-group-auth">
              <label class="auth-label">Alasan Penolakan (Opsional)</label>
              <textarea id="reject-reason-input" class="auth-input" rows="3" placeholder="Masukkan alasan penolakan..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="btn-cancel-reject">Batal</button>
            <button class="btn btn-danger btn-sm" id="btn-confirm-reject">
              Konfirmasi Tolak
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalsRoot.querySelector("#btn-close-reject-modal");
    const cancelBtn = modalsRoot.querySelector("#btn-cancel-reject");
    const confirmBtn = modalsRoot.querySelector("#btn-confirm-reject");

    const closeModal = () => { modalsRoot.innerHTML = ""; };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const reason = modalsRoot.querySelector("#reject-reason-input")?.value.trim() || "";
        confirmBtn.disabled = true;

        const currentUser = storage.getCurrentUser();
        if (typeof storage.updateUserStatus === "function") {
          await storage.updateUserStatus(id, "reject", { reason, actorName: currentUser?.nama });
        } else {
          storage.rejectUser(id, reason, currentUser.nama);
        }

        closeModal();
        if (typeof showToast === "function") {
          showToast(`Pendaftaran akun ${name} telah ditolak.`, "danger");
        }
        renderTable();
        updateTopCounters();
        if (typeof onStateChange === "function") {
          onStateChange();
        }
      });
    }
  }

  async function handleDeleteUser(id, name) {
    if (confirm(`Hapus data akun "${name}" dari sistem secara permanen?`)) {
      if (typeof storage.updateUserStatus === "function") {
        await storage.updateUserStatus(id, "delete");
      } else {
        storage.deleteUser(id);
      }

      if (typeof showToast === "function") {
        showToast(`Akun ${name} telah dihapus.`);
      }
      renderTable();
      updateTopCounters();
      if (typeof onStateChange === "function") {
        onStateChange();
      }
    }
  }

  // Modal Rotasi / Pindah Wilayah Tugas RW Petugas
  function openRotateWilayahModal(userId, userName, currentRw) {
    const users = storage.getUsers();
    const curRwPad = String(currentRw || "").replace(/\D/g, "").padStart(2, "0");
    const activePetugasList = users.filter(u => u.role === "petugas" && u.status !== "REJECTED" && u.id !== userId);
    const takenRwMap = {};
    activePetugasList.forEach(u => {
      if (u.rw) {
        const rwNum = String(u.rw).replace(/\D/g, "").padStart(2, "0");
        takenRwMap[rwNum] = u.nama;
      }
    });

    modalsRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialog" style="max-width:480px;">
          <div class="modal-header">
            <div style="font-weight:800; font-size:1.05rem; color:var(--dark-900);">
               Rotasi / Pindah Wilayah Tugas RW
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-close-rotate-modal">✕</button>
          </div>
          <div class="modal-body" style="padding:1.25rem;">
            <div style="margin-bottom:1.15rem; padding:0.75rem 1rem; background:#f0f9ff; border:1px solid #bae6fd; border-radius:var(--radius-md);">
              <div style="font-size:0.85rem; color:#0369a1; font-weight:800;">Petugas: ${userName}</div>
              <div style="font-size:0.78rem; color:var(--dark-600); margin-top:3px;">
                Wilayah Tugas Saat Ini: <strong>${curRwPad ? `RW ${curRwPad} (Seluruh RT)` : 'Belum Ditugaskan'}</strong>
              </div>
            </div>

            <form id="form-rotate-wilayah">
              <div class="form-group-auth" style="margin-bottom:1.25rem;">
                <label class="auth-label">Pilih Wilayah RW Baru (Kebijakan 1 RW 1 Petugas) <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <select id="select-rotate-rw" class="auth-input" style="width:100%; padding:0.65rem 0.85rem;" required>
                    <option value="">-- Pilih RW Tujuan --</option>
                    ${Array.from({ length: 24 }, (_, i) => {
      const rwNum = String(i + 1).padStart(2, '0');
      const assignedTo = takenRwMap[rwNum];
      const isCurrent = rwNum === curRwPad;
      if (isCurrent) {
        return `<option value="${rwNum}" selected>RW ${rwNum} (Wilayah Tugas Saat Ini)</option>`;
      } else if (assignedTo) {
        return `<option value="${rwNum}">RW ${rwNum} (Termasuk: ${assignedTo})</option>`;
      } else {
        return `<option value="${rwNum}">RW ${rwNum} (Tersedia)</option>`;
      }
    }).join('')}
                  </select>
                </div>
                <small style="font-size:0.72rem; color:var(--dark-500); display:block; margin-top:0.35rem;">
                  ℹ️ Petugas dapat ditugaskan ke wilayah RW yang sama untuk mencakup RT binaan yang berbeda.
                </small>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-rotate">Batal</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-rotate" style="background:#0284c7; border-color:#0284c7; font-weight:700;">
                  Simpan Wilayah Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalsRoot.querySelector("#btn-close-rotate-modal");
    const cancelBtn = modalsRoot.querySelector("#btn-cancel-rotate");
    const closeModal = () => { modalsRoot.innerHTML = ""; };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    const formRotate = modalsRoot.querySelector("#form-rotate-wilayah");
    if (formRotate) {
      formRotate.addEventListener("submit", async (e) => {
        e.preventDefault();
        const selectedRw = modalsRoot.querySelector("#select-rotate-rw")?.value;
        if (!selectedRw) {
          alert("Silakan pilih wilayah RW tujuan terlebih dahulu.");
          return;
        }

        const submitBtn = modalsRoot.querySelector("#btn-submit-rotate");
        submitBtn.disabled = true;
        submitBtn.textContent = "Menyimpan...";

        try {
          const res = await storage.rotatePetugasWilayah(userId, selectedRw);
          closeModal();
          if (typeof showToast === "function") {
            showToast(res.message || `Wilayah tugas ${userName} berhasil diubah ke RW ${selectedRw}.`);
          }
          renderTable();
          updateTopCounters();
          if (typeof onStateChange === "function") {
            onStateChange();
          }
        } catch (err) {
          alert("Gagal mengubah wilayah tugas:\n" + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.textContent = "Simpan Wilayah Baru";
        }
      });
    }
  }

  function handleDetailUser(id) {
    const u = storage.getUserById(id);
    if (!u) return;

    const normStatus = normalizeStatus(u.status);
    const regDate = u.registered_at || u.created_at;
    const phoneNum = u.telepon || u.no_hp || '-';

    modalsRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialog" style="max-width:520px;">
          <div class="modal-header">
            <div style="font-weight:800; font-size:1.1rem; color:var(--dark-900);">
              Detail Anggota: ${u.nama}
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-close-detail-modal">✕</button>
          </div>
          <div class="modal-body" style="padding:1.25rem;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; font-size:0.84rem;">
              <div class="breakdown-box">
                <div class="breakdown-title">Nama Lengkap</div>
                <div style="font-weight:700; color:var(--dark-900); margin-top:2px;">${u.nama}</div>
              </div>

              <div class="breakdown-box">
                <div class="breakdown-title">Peran Akun</div>
                <div style="font-weight:700; color:var(--dark-900); margin-top:2px;">
                  ${u.role === 'petugas' ? 'Petugas Lapangan' : (u.role === 'admin' ? 'Admin Kelurahan' : 'Pegawai Kelurahan')}
                </div>
              </div>

              <div class="breakdown-box">
                <div class="breakdown-title">${u.role === 'petugas' ? 'ID Petugas' : 'NIP'}</div>
                <div style="font-weight:700; color:var(--dark-900); font-family:monospace; margin-top:2px;">
                  ${u.role === 'petugas' ? (u.id_petugas || '-') : (u.nip || '-')}
                </div>
              </div>

              <div class="breakdown-box">
                <div class="breakdown-title">No. HP / WhatsApp</div>
                <div style="font-weight:700; color:var(--dark-900); margin-top:2px;">${phoneNum}</div>
              </div>

              <div class="breakdown-box" style="grid-column: span 2;">
                <div class="breakdown-title">${u.role === 'petugas' ? 'Wilayah Tugas Penugasan (1 RW 1 Petugas)' : 'Jabatan di Kantor Kelurahan'}</div>
                <div style="font-weight:700; color:var(--dark-900); margin-top:2px;">
                  ${u.role === 'petugas' ? (u.wilayah_tugas || (u.rw ? `RW ${String(u.rw).padStart(2, '0')} (Seluruh RT)` : 'Seluruh Wilayah')) : (u.jabatan || 'Pegawai Kelurahan')}
                </div>
              </div>

              <div class="breakdown-box">
                <div class="breakdown-title">Username Akun</div>
                <div style="font-weight:600; color:var(--dark-900); margin-top:2px;">@${u.username}</div>
              </div>

              <div class="breakdown-box">
                <div class="breakdown-title">Status Akun</div>
                <div style="font-weight:700; margin-top:2px;">
                  ${normStatus === 'APPROVED' ? '<span style="color:#10b981;">Aktif (Disetujui)</span>' : (normStatus === 'PENDING' ? '<span style="color:#f59e0b;">Menunggu Persetujuan</span>' : '<span style="color:#ef4444;">Ditolak</span>')}
                </div>
              </div>

              <div class="breakdown-box" style="grid-column: span 2;">
                <div class="breakdown-title">Waktu Mendaftar</div>
                <div style="font-weight:600; color:var(--dark-900); margin-top:2px;">
                  ${formatDate(regDate)}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            ${normStatus === 'PENDING' ? `
              <button class="btn btn-sm btn-reject-user-detail" style="background:#fff; color:#ef4444; border-color:#fca5a5;">
                Tolak Pendaftaran
              </button>
              <button class="btn btn-sm btn-primary btn-approve-user-detail" style="background:#10b981; border-color:#059669;">
                Setujui Akun
              </button>
            ` : (normStatus === 'REJECTED' ? `
              <button class="btn btn-sm btn-primary btn-approve-user-detail" style="background:#10b981; border-color:#059669;">
                Setujui Ulang
              </button>
            ` : '')}
            <button class="btn btn-secondary btn-sm" id="btn-close-detail-modal-btn">Tutup</button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalsRoot.querySelector("#btn-close-detail-modal");
    const closeBtn2 = modalsRoot.querySelector("#btn-close-detail-modal-btn");
    const closeModal = () => { modalsRoot.innerHTML = ""; };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeBtn2) closeBtn2.addEventListener("click", closeModal);

    const approveDetailBtn = modalsRoot.querySelector(".btn-approve-user-detail");
    if (approveDetailBtn) {
      approveDetailBtn.addEventListener("click", () => {
        closeModal();
        handleApproveUser(u.id, u.nama);
      });
    }

    const rejectDetailBtn = modalsRoot.querySelector(".btn-reject-user-detail");
    if (rejectDetailBtn) {
      rejectDetailBtn.addEventListener("click", () => {
        closeModal();
        handleRejectUser(u.id, u.nama);
      });
    }
  }

  function openAddMemberModal() {
    const users = storage.getUsers();
    const nextPetugasNum = users.filter(u => u.role === "petugas").length + 1;
    const suggestedPetugasId = `PETUGAS-0${nextPetugasNum}`;

    const activePetugasList = users.filter(u => u.role === 'petugas' && u.status !== 'REJECTED');
    const takenRwMap = {};
    activePetugasList.forEach(u => {
      if (u.rw) {
        const rwNum = String(u.rw).replace(/\D/g, '').padStart(2, '0');
        takenRwMap[rwNum] = u.nama;
      }
    });

    modalsRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialog" style="max-width:500px;">
          <div class="modal-header">
            <div style="font-weight:800; font-size:1.1rem; color:var(--dark-900);">
              Tambah Anggota Manual
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-close-add-modal">✕</button>
          </div>
          <div class="modal-body" style="padding:1.25rem;">
            <form id="form-manual-add-member" class="auth-custom-form">
              <div class="form-group-auth">
                <label class="auth-label">Peran Anggota <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <select id="modal-add-role" class="auth-input">
                    <option value="petugas">Petugas Lapangan</option>
                    <option value="pegawai">Pegawai Kelurahan (Staf Verifikator)</option>
                    <option value="admin">Admin Kelurahan</option>
                  </select>
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Nama Lengkap & Gelar <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="text" id="modal-add-nama" class="auth-input" placeholder="Contoh: Rina Novitasari, S.T" required>
                </div>
              </div>

              <!-- Petugas Field -->
              <div id="modal-fields-petugas">
                <div class="form-group-auth">
                  <label class="auth-label">ID Petugas <span class="required">*</span></label>
                  <div class="auth-input-wrapper">
                    <input type="text" id="modal-add-id-petugas" class="auth-input" value="${suggestedPetugasId}">
                  </div>
                </div>

                <div class="form-group-auth">
                  <div class="auth-input-wrapper">
                    <select id="modal-add-wilayah" class="auth-input">
                      ${Array.from({ length: 24 }, (_, i) => {
      const rwNum = String(i + 1).padStart(2, '0');
      const assignedTo = takenRwMap[rwNum];
      if (assignedTo) {
        return `<option value="RW ${rwNum} (Seluruh RT)" disabled style="color:#9ca3af; background:#f9fafb;">RW ${rwNum} — [Sudah Ditugaskan: ${assignedTo}]</option>`;
      } else {
        return `<option value="RW ${rwNum} (Seluruh RT)">RW ${rwNum} (Tersedia - 1 RW 1 Petugas)</option>`;
      }
    }).join('')}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Pegawai Field -->
              <div id="modal-fields-pegawai" style="display:none;">
                <div class="form-group-auth">
                  <label class="auth-label">NIP / Nomor Identitas Pegawai <span class="required">*</span></label>
                  <div class="auth-input-wrapper">
                    <input type="text" id="modal-add-nip" class="auth-input" placeholder="Contoh: 19910515 201702 2 005">
                  </div>
                </div>

                <div class="form-group-auth">
                  <label class="auth-label">Jabatan di Kantor Kelurahan <span class="required">*</span></label>
                  <div class="auth-input-wrapper">
                    <select id="modal-add-jabatan" class="auth-input">
                      <option value="Kasi Pemberdayaan Masyarakat & Kesra">Kasi Pemberdayaan Masyarakat & Kesra</option>
                      <option value="Sekretaris Kelurahan">Sekretaris Kelurahan</option>
                      <option value="Kasi Pemerintahan, Trantib & Linmas">Kasi Pemerintahan, Trantib & Linmas</option>
                      <option value="Kasi Prasarana & Sarana Kelurahan">Kasi Prasarana & Sarana Kelurahan</option>
                      <option value="Kasi Pelayanan Umum">Kasi Pelayanan Umum</option>
                      <option value="Staf Administrasi Kelurahan">Staf Administrasi Kelurahan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
                <div class="form-group-auth">
                  <label class="auth-label">No. WhatsApp / HP <span class="required">*</span></label>
                  <div class="auth-input-wrapper">
                    <input type="tel" id="modal-add-telp" class="auth-input" placeholder="081234567890" required>
                  </div>
                </div>

                <div class="form-group-auth">
                  <label class="auth-label">Username <span class="required">*</span></label>
                  <div class="auth-input-wrapper">
                    <input type="text" id="modal-add-username" class="auth-input" placeholder="username" required>
                  </div>
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Kata Sandi Akun <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="text" id="modal-add-password" class="auth-input" value="password123" required>
                </div>
              </div>

              <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-add-modal">Batal</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-manual-member">
                  Simpan & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalsRoot.querySelector("#btn-close-add-modal");
    const cancelBtn = modalsRoot.querySelector("#btn-cancel-add-modal");
    const roleSelect = modalsRoot.querySelector("#modal-add-role");
    const fieldsPetugas = modalsRoot.querySelector("#modal-fields-petugas");
    const fieldsPegawai = modalsRoot.querySelector("#modal-fields-pegawai");
    const formAdd = modalsRoot.querySelector("#form-manual-add-member");

    const closeModal = () => { modalsRoot.innerHTML = ""; };
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        if (e.target.value === "admin" || e.target.value === "pegawai") {
          fieldsPegawai.style.display = "";
          fieldsPetugas.style.display = "none";
        } else {
          fieldsPetugas.style.display = "";
          fieldsPegawai.style.display = "none";
        }
      });
    }

    if (formAdd) {
      formAdd.addEventListener("submit", async (e) => {
        e.preventDefault();
        const role = roleSelect.value;
        const nama = modalsRoot.querySelector("#modal-add-nama")?.value.trim();
        const telepon = modalsRoot.querySelector("#modal-add-telp")?.value.trim();
        const username = modalsRoot.querySelector("#modal-add-username")?.value.trim();
        const password = modalsRoot.querySelector("#modal-add-password")?.value.trim();

        let roleData = {};
        if (role === "admin" || role === "pegawai") {
          const nip = modalsRoot.querySelector("#modal-add-nip")?.value.trim() || "-";
          const jabatan = modalsRoot.querySelector("#modal-add-jabatan")?.value;
          roleData = { nip, jabatan };
        } else {
          const id_petugas = modalsRoot.querySelector("#modal-add-id-petugas")?.value.trim() || suggestedPetugasId;
          const wilayah_tugas = modalsRoot.querySelector("#modal-add-wilayah")?.value;
          const matchRw = wilayah_tugas.match(/RW\s*(\d+)/i);
          const rw = matchRw ? matchRw[1].padStart(2, '0') : '';
          roleData = { id_petugas, rw, rt: "Semua", wilayah_tugas, jabatan: "Petugas Surveyor Lapangan" };
        }

        const submitBtn = formAdd.querySelector("#btn-submit-manual-member");
        submitBtn.disabled = true;
        submitBtn.textContent = "Menyimpan...";

        try {
          // Kirim ke API pendaftaran
          const response = await fetch("/src/data/api/register_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role,
              nama,
              no_hp: telepon,
              username,
              password,
              ...roleData
            })
          });
          const res = await response.json();

          if (!res.success) {
            throw new Error(res.message || "Gagal mendaftarkan akun di server.");
          }

          // Sinkronisasi data user dari MySQL
          if (typeof storage.syncUsersFromDB === "function") {
            const freshUsers = await storage.syncUsersFromDB();
            const addedUser = freshUsers.find(u => u.username === username);
            if (addedUser) {
              await storage.updateUserStatus(addedUser.id, "approve");
            }
          }

          closeModal();
          if (typeof showToast === "function") {
            showToast(`Anggota ${nama} berhasil ditambahkan ke database.`);
          }
          renderTable();
          updateTopCounters();
          if (typeof onStateChange === "function") {
            onStateChange();
          }
        } catch (err) {
          alert(err.message || "Gagal menambahkan anggota.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Simpan & Aktifkan";
        }
      });
    }
  }

  function updateTopCounters() {
    const users = storage.getUsers();
    const counts = storage.getPendingCounts();
    const isApproved = (u) => (u.status || "").toUpperCase() === "APPROVED" || (u.status || "").toLowerCase() === "active";

    const totalUsers = users.length;
    const approvedPetugas = users.filter(u => u.role === "petugas" && isApproved(u)).length;
    const totalPetugas = users.filter(u => u.role === "petugas").length;
    const approvedPegawai = users.filter(u => u.role === "pegawai" && isApproved(u)).length;
    const totalPegawai = users.filter(u => u.role === "pegawai").length;

    // Update Angka KPI Atas
    const kpiValues = container.querySelectorAll(".kpi-value");
    if (kpiValues.length >= 4) {
      kpiValues[0].textContent = totalUsers;
      kpiValues[1].textContent = counts.total;
      kpiValues[1].style.color = counts.total > 0 ? "var(--accent-600)" : "inherit";
      kpiValues[2].innerHTML = `${approvedPetugas} <span style="font-size:1rem; font-weight:600; color:var(--dark-600);">/ ${totalPetugas}</span>`;
      kpiValues[3].innerHTML = `${approvedPegawai} <span style="font-size:1rem; font-weight:600; color:var(--dark-600);">/ ${totalPegawai}</span>`;
    }

    // Update Badge Tab Antrean
    const pendingSubTabPill = container.querySelector(".member-subtab-btn[data-subtab='pending'] .badge");
    if (pendingSubTabPill) {
      pendingSubTabPill.textContent = `${counts.total} Akun`;
      pendingSubTabPill.className = `badge ${counts.total > 0 ? 'badge-warning' : 'badge-secondary'}`;
    }

    // Update Counter di Tombol Tab Submenu
    const badgeAll = container.querySelector(".subtab-count-badge.badge-all");
    const badgePegawai = container.querySelector(".subtab-count-badge.badge-pegawai");
    const badgePetugas = container.querySelector(".subtab-count-badge.badge-petugas");
    if (badgeAll) badgeAll.textContent = totalUsers;
    if (badgePegawai) badgePegawai.textContent = totalPegawai;
    if (badgePetugas) badgePetugas.textContent = totalPetugas;

    const pendingPegawaiBadge = container.querySelector(".member-subtab-btn[data-subtab='pegawai'] .badge-warning");
    if (pendingPegawaiBadge) {
      if ((counts.pegawai || 0) > 0) {
        pendingPegawaiBadge.textContent = `${counts.pegawai} Pending`;
        pendingPegawaiBadge.style.display = "";
      } else {
        pendingPegawaiBadge.style.display = "none";
      }
    }
    const pendingPetugasBadge = container.querySelector(".member-subtab-btn[data-subtab='petugas'] .badge-warning");
    if (pendingPetugasBadge) {
      if ((counts.petugas || 0) > 0) {
        pendingPetugasBadge.textContent = `${counts.petugas} Pending`;
        pendingPetugasBadge.style.display = "";
      } else {
        pendingPetugasBadge.style.display = "none";
      }
    }
  }
  (async () => {
    if (typeof storage.syncUsersFromDB === "function") {
      await storage.syncUsersFromDB();
    }
    renderTable();
    updateTopCounters();
  })();
}