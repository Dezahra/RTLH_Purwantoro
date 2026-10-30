import "./style.css";
import { storage } from "./utils/storage.js";
import { icons } from "./utils/icons.js";
import { renderSidebar, renderTopbar, renderNavbar, bindNavbarEvents } from "./components/Navbar.js";
import { renderDashboard, initDashboardCharts } from "./components/AdminDashboard.js";
import { renderGisMap, initGisMap } from "./components/GisMap.js";
import { renderSurveyList, initSurveyListEvents } from "./components/SurveyList.js";
import { renderSurveyForm, initSurveyFormEvents } from "./components/SurveyForm.js";
import { renderDetailModal, initDetailModalEvents } from "./components/DetailModal.js";
import { renderPrintReport, initPrintReportEvents } from "./components/PrintReport.js";
import { renderPrintRekapBnba, initPrintRekapBnbaEvents } from "./components/PrintRekapBnba.js";
import { renderTechnicalGuide } from "./components/TechnicalGuide.js";
import { renderLoginFasih, bindLoginFasihEvents } from "./components/LoginFasih.js";
import { renderMemberManagement, initMemberManagementEvents } from "./components/MemberManagement.js";
import { renderProfile, initProfileEvents } from "./components/Profile.js";
import { renderDatabaseBackup, initDatabaseBackupEvents } from "./components/DatabaseBackup.js";

// Global App State
let state = {
  currentRole: storage.getCurrentRole(),
  activeTab: storage.getCurrentRole() === "admin" ? "dashboard" : "new-survey",
  editingSurveyId: null,
  activeModal: null, // 'detail' | 'print' | 'rekap_bnba' | null
  modalSurveyId: null,
  rekapSelectedRw: "ALL"
};

// Toast notification helper
export function showToast(message, type = "success") {
  const container = document.getElementById("toast-root");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span style="color:${type === 'danger' ? '#ef4444' : '#10b981'};">
      ${type === 'danger' ? icons.xCircle('w-5 h-5') : icons.checkCircle('w-5 h-5')}
    </span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Render the application
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  // 1. Check if user is authenticated with FASIH SE SSO
  if (!storage.isAuthenticated()) {
    app.innerHTML = renderLoginFasih();
    bindLoginFasihEvents(app, {
      onLoginSuccess: handleLoginSuccess
    });
    return;
  }

  const currentRole = storage.getCurrentRole();
  const currentUser = storage.getCurrentUser();

  // Render Left Sidebar, Modern Topbar & Main Content
  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(state.activeTab)}
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <div class="app-main-wrapper">
        ${renderTopbar(state.activeTab)}
        <main class="main-content">
          <div id="tab-content-container"></div>
        </main>
      </div>
    </div>
  `;

  // Bind Navbar Events
  bindNavbarEvents(app, {
    onTabChange: handleTabChange,
    onRoleChange: handleRoleChange,
    onNewSurvey: handleNewSurvey,
    onLogout: handleLogout
  });

  // Render Active Tab Content
  const contentContainer = document.getElementById("tab-content-container");

  if (state.activeTab === "dashboard" && (currentRole === "admin" || currentRole === "pegawai")) {
    contentContainer.innerHTML = renderDashboard();
    initDashboardCharts(contentContainer);
  } else if (state.activeTab === "map") {
    contentContainer.innerHTML = renderGisMap();
    initGisMap(contentContainer, {
      onSelectSurvey: handleViewDetail,
      onNewSurvey: handleNewSurvey
    });
  } else if (state.activeTab === "surveys") {
    contentContainer.innerHTML = renderSurveyList();
    initSurveyListEvents(contentContainer, {
      onSelectSurvey: handleViewDetail,
      onEditSurvey: handleEditSurvey,
      onPrintSurvey: handlePrintSurvey,
      onPrintRekap: handlePrintRekap,
      onNewSurvey: handleNewSurvey,
      showToast
    });
  } else if (state.activeTab === "new-survey") {
    const editData = state.editingSurveyId ? storage.getSurveyById(state.editingSurveyId) : null;
    contentContainer.innerHTML = renderSurveyForm(editData);
    initSurveyFormEvents(contentContainer, {
      onSaveSuccess: (saved) => {
        showToast(`Data survey rumah Bapak/Ibu ${saved.nama_kk || ''} berhasil disimpan ke database!`);
        state.editingSurveyId = null;
        state.activeTab = "surveys";
        storage.syncSurveysFromDB().then(() => render());
      },
      onCancel: () => {
        state.editingSurveyId = null;
        state.activeTab = currentRole === "admin" ? "surveys" : "surveys";
        render();
      }
    });
  } else if (state.activeTab === "guide") {
    contentContainer.innerHTML = renderTechnicalGuide();
  } else if (state.activeTab === "members" && currentRole === "admin") {
    contentContainer.innerHTML = renderMemberManagement();
    initMemberManagementEvents(contentContainer, {
      showToast,
      onStateChange: () => {
        render();
      }
    });

  } else if (state.activeTab === "backup") {
    contentContainer.innerHTML = renderDatabaseBackup();
    initDatabaseBackupEvents(contentContainer, {
      showToast,
      onStateChange: () => {
        render();
      }
    });
  } else if (state.activeTab === "profile") {
    contentContainer.innerHTML = renderProfile();
    initProfileEvents(contentContainer, {
      showToast,
      onStateChange: () => {
        render();
      }
    });
  } else {
    // Fallback if role is not admin/pegawai but on dashboard
    state.activeTab = (currentRole === "admin" || currentRole === "pegawai") ? "dashboard" : "new-survey";
    render();
  }

  // Render Modals if active
  renderModals();
}

function renderModals() {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;
  modalRoot.innerHTML = "";

  if (state.activeModal === "detail" && state.modalSurveyId) {
    const survey = storage.getSurveyById(state.modalSurveyId);
    if (survey) {
      modalRoot.innerHTML = renderDetailModal(survey);
      initDetailModalEvents(modalRoot, survey, {
        onClose: () => {
          state.activeModal = null;
          state.modalSurveyId = null;
          modalRoot.innerHTML = "";
        },
        onPrint: (id) => {
          state.activeModal = "print";
          state.modalSurveyId = id;
          renderModals();
        },
        onEdit: (id) => {
          handleEditSurvey(id);
        },
        onUpdateSuccess: () => {
          render();
        },
        showToast
      });
    }
  } else if (state.activeModal === "print" && state.modalSurveyId) {
    const survey = storage.getSurveyById(state.modalSurveyId);
    if (survey) {
      modalRoot.innerHTML = renderPrintReport(survey);
      initPrintReportEvents(modalRoot, {
        onClose: () => {
          state.activeModal = null;
          state.modalSurveyId = null;
          modalRoot.innerHTML = "";
        }
      });
    }
  } else if (state.activeModal === "rekap_bnba") {
    modalRoot.innerHTML = renderPrintRekapBnba(state.rekapSelectedRw || "ALL");
    initPrintRekapBnbaEvents(modalRoot, {
      onClose: () => {
        state.activeModal = null;
        modalRoot.innerHTML = "";
      }
    });
  }
}

// Handlers
function handleTabChange(newTab) {
  state.activeTab = newTab;
  state.editingSurveyId = null;
  render();
}

function handleRoleChange(newRole) {
  storage.setCurrentRole(newRole);
  state.currentRole = newRole;
  if (newRole === "petugas" && state.activeTab === "dashboard") {
    state.activeTab = "surveys";
  }
  showToast(`Beralih ke peran: ${newRole === 'admin' ? 'Pegawai / Admin Kelurahan' : 'Petugas Lapangan'}`);
  render();
}

function handleNewSurvey() {
  state.editingSurveyId = null;
  state.activeTab = "new-survey";
  render();
}

function handleEditSurvey(id) {
  state.editingSurveyId = id;
  state.activeTab = "new-survey";
  render();
}

function handleViewDetail(id) {
  state.activeModal = "detail";
  state.modalSurveyId = id;
  renderModals();
}

function handlePrintSurvey(id) {
  state.activeModal = "print";
  state.modalSurveyId = id;
  renderModals();
}

function handlePrintRekap(rw = "ALL") {
  state.activeModal = "rekap_bnba";
  state.rekapSelectedRw = rw;
  renderModals();
}

function handleLoginSuccess(role) {
  state.currentRole = role;
  state.activeTab = role === "admin" ? "dashboard" : "new-survey";
  const user = storage.getCurrentUser();
  showToast(`Selamat datang, ${user.nama}! Masuk sebagai ${role === 'admin' ? 'Pegawai / Admin Kelurahan' : 'Petugas Lapangan'}`);
  render();
}

function handleLogout() {
  storage.logout();
  showToast("Anda telah berhasil keluar dari sistem.");
  render();
}


document.addEventListener("DOMContentLoaded", () => {
  // Pulihkan status sidebar dari localStorage saat halaman pertama dimuat
  if (localStorage.getItem("sipelita_sidebar_collapsed") === "true") {
    document.body.classList.add("sidebar-collapsed");
  }
  // Sinkronisasi otomatis data pengguna & survei dari database
  storage.syncUsersFromDB().then(() => render());
  storage.syncSurveysFromDB().then(() => render());
  render();
});

document.addEventListener("click", (e) => {
  // 1. Toggle & Close Sidebar
  const toggleBtn = e.target.closest("#sidebar-toggle-btn, .topbar-toggle-btn");
  const closeBtn = e.target.closest(".sidebar-close-btn");

  if (toggleBtn) {
    e.preventDefault();
    document.body.classList.toggle("sidebar-collapsed");
    const isCollapsed = document.body.classList.contains("sidebar-collapsed");
    localStorage.setItem("sipelita_sidebar_collapsed", isCollapsed);
    return;
  }

  if (closeBtn) {
    e.preventDefault();
    document.body.classList.add("sidebar-collapsed");
    localStorage.setItem("sipelita_sidebar_collapsed", "true");
    return;
  }

  // 2. Tombol Tambah Survey
  const targetBtn = e.target.closest(
    "#btn-list-add-survey, .btn-action-add-survey"
  );

  if (targetBtn) {
    e.preventDefault();
    console.log("--> Tombol Tambah Survey Terdeteksi Diklik via Global Listener!");
    handleNewSurvey();
  }
});

// Initial boot
render();
storage.syncUsersFromDB().then(() => render());
storage.syncSurveysFromDB().then(() => render());