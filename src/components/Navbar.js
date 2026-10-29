import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";

// Helper function to get tab title metadata
export function getTabMetadata(activeTab, role) {
  const isPetugas = role === "petugas";
  switch (activeTab) {
    case "dashboard":
      return {
        title: "Dashboard Statistik & Analitik",
        breadcrumb: "Statistik RTLH",
        category: "Monitoring"
      };
    case "surveys":
      return {
        title: isPetugas ? "Riwayat Survey Lapangan" : "Data Rumah",
        breadcrumb: isPetugas ? "Riwayat" : "Kelayakan Rumah",
        category: "Data Survey"
      };
    case "map":
      return {
        title: isPetugas ? "Peta Sebaran Wilayah RT/RW" : "Peta",
        breadcrumb: "Peta Tematik",
        category: "Geospasial"
      };
    case "new-survey":
      return {
        title: isPetugas ? "Form Survey" : "Form Entri Data Survey Baru",
        breadcrumb: "Entri RTLH",
        category: "Formulir"
      };
    case "members":
      return {
        title: "Manajemen Akun & Anggota",
        breadcrumb: "Data Pengguna",
        category: "Administrasi"
      };
    case "backup":
      return {
        title: "Pencadangan & Sinkronisasi Basis Data",
        breadcrumb: "Backup Data",
        category: "Pemeliharaan"
      };
    case "guide":
      return {
        title: "Panduan Teknis Standar PUPR & BPS",
        breadcrumb: "Pedoman Teknis",
        category: "Informasi"
      };
    case "profile":
      return {
        title: "Profil Pengguna",
        breadcrumb: "Akun Saya",
        category: "Pengaturan"
      };
    default:
      return {
        title: "SIPELITA Kelurahan Purwantoro",
        breadcrumb: "Beranda",
        category: "Utama"
      };
  }
}

// Render vertical sidebar on the left
export function renderSidebar(activeTab) {
  const currentRole = storage.getCurrentRole();
  const currentUser = storage.getCurrentUser();
  const pendingCounts = storage.getPendingCounts();

  let roleLabel = "Petugas Lapangan";
  let roleBadgeClass = "sidebar-badge-petugas";

  if (currentRole === "admin") {
    roleLabel = "Admin Sistem";
    roleBadgeClass = "sidebar-badge-admin";
  } else if (currentRole === "pegawai") {
    roleLabel = "Pegawai Kelurahan";
    roleBadgeClass = "sidebar-badge-admin";
  }

  const isPetugas = currentRole === "petugas";
  const revisionCount = isPetugas ? storage.getRevisionCount(currentUser) : 0;

  return `
    <aside class="app-sidebar" id="app-sidebar">
      <!-- Sidebar Brand Header -->
      <div class="sidebar-brand-container">
        <a href="#" class="sidebar-brand-link" id="nav-brand-click" title="Ke Beranda SIPELITA">
          <div class="sidebar-brand-text">
            <div class="sidebar-brand-title-row">
              <span class="sidebar-brand-title">SIPELITA</span>
              <span class="sidebar-brand-pill">RTLH</span>
            </div>
            <p class="sidebar-brand-subtitle">Kelurahan Purwantoro</p>
          </div>
        </a>

        <!-- Mobile close button -->
        <button class="sidebar-close-btn" id="sidebar-close-btn" type="button" aria-label="Tutup Navigasi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Quick Action / New Survey Button in Sidebar -->
      <div class="sidebar-cta-wrapper">
        <button class="sidebar-cta-btn quick-action-btn" id="btn-quick-new-survey" type="button">
          ${icons.plusCircle('w-4 h-4')}
          <span>${isPetugas ? 'Tambah Survey' : 'Entri Data Baru'}</span>
        </button>
      </div>

      <!-- Navigation Links Container -->
      <div class="sidebar-menu-scroll">
        <!-- Section: MENU UTAMA -->
        <div class="sidebar-section-header">
          <span>NAVIGASI UTAMA</span>
        </div>
        <div class="sidebar-nav-group">
          ${!isPetugas ? `
            <button class="nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <span class="nav-btn-icon">${icons.chart('w-5 h-5')}</span>
              <span class="nav-btn-text">Dashboard</span>
            </button>
            <button class="nav-btn ${activeTab === 'surveys' ? 'active' : ''}" data-tab="surveys">
              <span class="nav-btn-icon">${icons.clipboard('w-5 h-5')}</span>
              <span class="nav-btn-text">Data Rumah</span>
            </button>
            <button class="nav-btn ${activeTab === 'map' ? 'active' : ''}" data-tab="map">
              <span class="nav-btn-icon">${icons.map('w-5 h-5')}</span>
              <span class="nav-btn-text">Peta</span>
            </button>
          ` : `
            <button class="nav-btn ${activeTab === 'new-survey' ? 'active' : ''}" data-tab="new-survey">
              <span class="nav-btn-icon">${icons.plusCircle('w-5 h-5')}</span>
              <span class="nav-btn-text">Form Input</span>
            </button>
            <button class="nav-btn ${activeTab === 'surveys' ? 'active' : ''}" data-tab="surveys" style="position:relative; display:flex; align-items:center;">
              <span class="nav-btn-icon">${icons.clipboard('w-5 h-5')}</span>
              <span class="nav-btn-text">Riwayat Lapangan</span>
              ${revisionCount > 0 ? `
                <span class="nav-pending-badge" style="background:#dc2626; color:white; font-weight:800; font-size:0.68rem; padding:2px 7px; border-radius:999px; margin-left:auto; box-shadow:0 0 8px rgba(220,38,38,0.5);" title="${revisionCount} data survei Anda memerlukan perbaikan / revisi dari Admin">
                  ${revisionCount} Revisi
                </span>
              ` : ''}
            </button>
            <button class="nav-btn ${activeTab === 'map' ? 'active' : ''}" data-tab="map">
              <span class="nav-btn-icon">${icons.map('w-5 h-5')}</span>
              <span class="nav-btn-text">Peta Sebaran RT/RW</span>
            </button>
          `}
        </div>

        <!-- Section: KELOLA & BANTUAN -->
        <div class="sidebar-section-header">
          <span>MANAJEMEN & INFORMASI</span>
        </div>
        <div class="sidebar-nav-group">
          ${currentRole === 'admin' ? `
            <button class="nav-btn ${activeTab === 'members' ? 'active' : ''}" data-tab="members">
              <span class="nav-btn-icon">${icons.users('w-5 h-5')}</span>
              <span class="nav-btn-text">Data Anggota</span>
              ${pendingCounts.total > 0 ? `
                <span class="nav-pending-badge" title="${pendingCounts.total} akun pendaftar butuh persetujuan">
                  ${pendingCounts.total}
                </span>
              ` : ''}
            </button>
          ` : ''}

          <button class="nav-btn ${activeTab === 'backup' ? 'active' : ''}" data-tab="backup">
            <span class="nav-btn-icon">${icons.database('w-5 h-5')}</span>
            <span class="nav-btn-text">Pencadangan Database</span>
          </button>

          <button class="nav-btn ${activeTab === 'guide' ? 'active' : ''}" data-tab="guide">
            <span class="nav-btn-icon">${icons.info('w-5 h-5')}</span>
            <span class="nav-btn-text">Panduan PUPR</span>
          </button>

          <button class="nav-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
            <span class="nav-btn-icon">${icons.user('w-5 h-5')}</span>
            <span class="nav-btn-text">Profil Saya</span>
          </button>
        </div>
      </div>

      <!-- Sidebar Footer (User Info & Logout) -->
      <div class="sidebar-footer">
        <!-- User Profile Card -->
        <div class="sidebar-user-card" id="btn-user-profile" role="button" tabindex="0" title="Klik untuk membuka profil">
          <div class="sidebar-user-avatar">
            ${(currentUser.nama || 'U').charAt(0)}
          </div>
          <div class="sidebar-user-details">
            <span class="sidebar-user-name">${currentUser.nama || 'Pengguna'}</span>
            <span class="sidebar-user-role-label ${roleBadgeClass}">
              <span class="sidebar-status-dot"></span>
              ${roleLabel}
            </span>
          </div>
          <svg class="sidebar-user-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <!-- Logout Button -->
        <button class="sidebar-logout-btn btn-navbar-logout" id="btn-navbar-logout" type="button" title="Keluar dari akun">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Keluar</span>
        </button>

        <div class="sidebar-compliance-tag">
          Developed by Z JTI POLIJE
        </div>
      </div>
    </aside>
  `;
}

// Render slim modern topbar on the right side
export function renderTopbar(activeTab) {
  const currentRole = storage.getCurrentRole();
  const currentUser = storage.getCurrentUser();
  const meta = getTabMetadata(activeTab, currentRole);

  let roleLabel = "Mode Petugas Lapangan";
  let roleIndicatorClass = "indicator-petugas";
  let roleSubtext = `ID: ${currentUser.id_petugas || '-'}`;

  if (currentRole === "admin") {
    roleLabel = "Mode Admin Sistem";
    roleIndicatorClass = "indicator-admin";
    roleSubtext = `NIP: ${currentUser.nip || '-'}`;
  } else if (currentRole === "pegawai") {
    roleLabel = "Mode Pegawai Kelurahan";
    roleIndicatorClass = "indicator-admin";
    roleSubtext = `NIP: ${currentUser.nip || '-'}`;
  }

  return `
    <header class="app-topbar">
      <div class="topbar-left">
        <!-- Mobile/Tablet Hamburger Toggle -->
        <button class="topbar-toggle-btn" id="sidebar-toggle-btn" type="button" aria-label="Buka Navigasi">
          ${icons.menu('w-5 h-5')}
        </button>

        <!-- Breadcrumb & Active Page Title -->
        <div class="topbar-heading-wrap">
          <div class="topbar-breadcrumb">
            <span class="topbar-crumb-app">SIPELITA PURWANTORO</span>
            <span class="topbar-crumb-sep">/</span>
            <span class="topbar-crumb-category">${meta.category}</span>
          </div>
          <h2 class="topbar-page-title">${meta.title}</h2>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Active Role Indicator -->
        <div class="current-role-indicator ${roleIndicatorClass}">
          <span class="role-dot"></span>
          <span class="role-text-label">${roleLabel}</span>
        </div>

        <!-- Quick Profile Chip -->
        <button class="user-profile-chip topbar-user-chip" id="topbar-btn-profile" type="button" title="Buka Profil">
          <span class="user-profile-avatar" style="font-weight:700; font-size:0.8rem; background:rgba(6,78,59,0.12); color:#064e3b; border-radius:50%; width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; text-transform:uppercase;">
            ${(currentUser.nama || 'U').charAt(0)}
          </span>
          <div class="topbar-profile-texts">
            <div style="font-weight:700; line-height:1.2; color:var(--dark-900);">
              ${currentUser.nama}
            </div>
            <div style="font-size:0.7rem; color:var(--dark-600);">
              ${roleSubtext}
            </div>
          </div>
        </button>

        <!-- Topbar Logout Button -->
        <button class="btn-navbar-logout topbar-logout-btn" id="topbar-btn-logout" type="button" title="Keluar / Ganti Akun">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Keluar</span>
        </button>
      </div>
    </header>
  `;
}

// Backwards compatibility helper
export function renderNavbar(activeTab) {
  return renderSidebar(activeTab);
}

export function bindNavbarEvents(container, { onTabChange, onRoleChange, onNewSurvey, onLogout }) {
  // Mobile / Tablet Sidebar Drawer Toggle
  const sidebar = container.querySelector("#app-sidebar");
  const backdrop = container.querySelector("#sidebar-backdrop");
  const toggleBtn = container.querySelector("#sidebar-toggle-btn");
  const closeBtn = container.querySelector("#sidebar-close-btn");

  const openSidebar = () => {
    if (sidebar) sidebar.classList.add("sidebar-open");
    if (backdrop) backdrop.classList.add("active");
    document.body.classList.add("sidebar-drawer-active");
  };

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove("sidebar-open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-drawer-active");
  };

  if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);

  // Brand click -> dashboard (admin/pegawai) atau form survey (petugas)
  const brand = container.querySelector("#nav-brand-click");
  if (brand) {
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
      const currentRole = storage.getCurrentRole();
      onTabChange(currentRole !== "petugas" ? "dashboard" : "new-survey");
    });
  }

  // User Profile (sidebar card and topbar chip)
  const profileBtns = container.querySelectorAll("#btn-user-profile, #topbar-btn-profile");
  profileBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      closeSidebar();
      onTabChange("profile");
    });
  });

  // Logout buttons (sidebar and topbar)
  const logoutBtns = container.querySelectorAll("#btn-navbar-logout, #topbar-btn-logout");
  logoutBtns.forEach(btn => {
    if (onLogout) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeSidebar();
        onLogout();
      });
    }
  });

  // Tab navigation buttons
  container.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      closeSidebar();
      const tab = btn.dataset.tab;
      if (tab) onTabChange(tab);
    });
  });

  // Quick Action Button
  const quickBtns = container.querySelectorAll("#btn-quick-new-survey");
  quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      closeSidebar();
      onNewSurvey();
    });
  });
}