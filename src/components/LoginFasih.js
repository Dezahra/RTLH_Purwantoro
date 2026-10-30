import { storage } from "../utils/storage.js";

let currentAuthTab = "login"; // "login" | "register"
let selectedLoginRole = null; // null | "admin" | "petugas"
let selectedRegisterRole = "petugas"; // "pegawai" | "petugas"

export function renderLogin() {
  const users = storage.getUsers();

  const petugasNumbers = users
    .filter(u => u.role === "petugas" && u.id_petugas)
    .map(u => {
      const match = u.id_petugas.match(/PETUGAS-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextPetugasNum = petugasNumbers.length > 0
    ? Math.max(...petugasNumbers) + 1
    : 1;

  const suggestedPetugasId = `PETUGAS-${String(nextPetugasNum).padStart(2, "0")}`;
  return `
    <div class="simple-login-wrapper">
      <div class="simple-login-card">
        <!-- Brand Header -->
        <div class="login-header">
          <div class="login-badge-pill">
            <span>KOTA MALANG • KELURAHAN PURWANTORO</span>
          </div>

          <div class="login-brand">
            <div class="login-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="login-brand-text">
              <h1 class="login-brand-title">SIPELITA RTLH</h1>
              <p class="login-brand-subtitle">Sistem Informasi Kelayakan Rumah Warga</p>
            </div>
          </div>
        </div>

        <!-- Alert Notification Box -->
        <div id="auth-alert-box" style="display:none; margin-bottom: 1.25rem;"></div>

        <!-- VIEW 1: LOGIN (PILIH PERAN ATAU FORM LOGIN)    -->
        <div id="auth-view-login" style="${currentAuthTab === 'login' ? '' : 'display:none;'}">
          
          <!-- STEP 1: PILIH PERAN -->
          <div id="login-role-selection" style="${selectedLoginRole === null ? '' : 'display:none;'}">
            <div style="margin-bottom: 1.25rem; text-align:center;">
              <h2 class="login-main-heading">Silakan Masuk</h2>
            </div>

            <div class="clean-role-list">
              <!-- Button Pegawai Desa -->
              <button type="button" class="clean-role-card" id="btn-role-pegawai">
                <div class="clean-role-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h.01"/>
                    <path d="M16 6h.01"/>
                    <path d="M12 6h.01"/>
                    <path d="M12 10h.01"/>
                    <path d="M12 14h.01"/>
                    <path d="M16 10h.01"/>
                    <path d="M16 14h.01"/>
                    <path d="M8 10h.01"/>
                    <path d="M8 14h.01"/>
                  </svg>
                </div>
                <div class="clean-role-info">
                  <div class="clean-role-name">Login Pegawai Kelurahan</div>
                  <div class="clean-role-desc">Administrator & Staf Kelurahan Purwantoro</div>
                </div>
                <div class="clean-role-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>

              <!-- Button Petugas Lapangan -->
              <button type="button" class="clean-role-card" id="btn-role-petugas">
                <div class="clean-role-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <path d="m9 14 2 2 4-4"/>
                  </svg>
                </div>
                <div class="clean-role-info">
                  <div class="clean-role-name">Login Petugas Lapangan</div>
                  <div class="clean-role-desc">Surveyor Pendataan Lapangan</div>
                </div>
                <div class="clean-role-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>
            </div>

            <div class="auth-switch-link" style="margin-top: 1.5rem;">
              <span>Belum memiliki akun?</span>
              <button type="button" class="btn-link-text" id="link-role-register">Daftar Akun Baru</button>
            </div>
          </div>

          <!-- STEP 2: FORM USERNAME & PASSWORD -->
          <div id="login-role-form-container" style="${selectedLoginRole !== null ? '' : 'display:none;'}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.25rem;">
              <div>
                <h2 class="login-main-heading" id="login-form-heading">
                  ${selectedLoginRole === 'admin' ? 'Login Pegawai Kelurahan' : 'Login Petugas Lapangan'}
                </h2>
                <p class="login-subheading" id="login-form-subheading">
                  ${selectedLoginRole === 'admin' ? 'Masukkan username atau NIP dan kata sandi Anda' : 'Masukkan username atau ID Petugas dan kata sandi Anda'}
                </p>
              </div>

              <button type="button" class="btn-back-role" id="btn-back-to-roles" title="Kembali ke pilihan peran">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Kembali</span>
              </button>
            </div>

            <form id="form-role-login" class="auth-custom-form">
              <div class="form-group-auth">
                <label class="auth-label" id="label-role-identifier">
                  ${selectedLoginRole === 'admin' ? 'Username atau NIP Pegawai' : 'Username atau ID Petugas'}
                </label>
                <div class="auth-input-wrapper">
                  <input type="text" id="role-login-identifier" class="auth-input" placeholder="${selectedLoginRole === 'admin' ? 'Masukkan username' : 'Masukkan username'}" required autocomplete="username">
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Kata Sandi</label>
                <div class="auth-input-wrapper">
                  <input type="password" id="role-login-password" class="auth-input" placeholder="Masukkan kata sandi" required autocomplete="current-password">
                </div>
              </div>

              <button type="submit" class="btn btn-primary auth-btn-submit" id="btn-submit-role-login">
                Masuk ke Sistem
              </button>
            </form>

            <div class="auth-switch-link" style="margin-top: 1rem;">
              <span>Belum memiliki akun?</span>
              <button type="button" class="btn-link-text" id="link-form-register">Daftar Akun Baru</button>
            </div>
          </div>
        </div>

        <!-- VIEW 2: DAFTAR AKUN BARU                       -->
        <div id="auth-view-register" style="${currentAuthTab === 'register' ? '' : 'display:none;'}">
          <div style="margin-bottom: 1.25rem; text-align:center;">
            <h2 class="login-main-heading">Pendaftaran Akun</h2>
            <p class="login-subheading">Pilih jenis akun yang didaftarkan. Akun akan diverifikasi oleh Admin Kelurahan.</p>
          </div>

          <!-- Role Toggle (Petugas vs Pegawai) -->
          <div class="role-selector-toggle">
            <button type="button" class="role-toggle-btn ${selectedRegisterRole === 'petugas' ? 'selected' : ''}" id="reg-toggle-petugas">
              <div class="toggle-text">
                <div class="toggle-title">Petugas Lapangan</div>
                <div class="toggle-desc">Surveyor / Mitra CAPI</div>
              </div>
            </button>

            <button type="button" class="role-toggle-btn ${selectedRegisterRole === 'pegawai' ? 'selected' : ''}" id="reg-toggle-pegawai">
              <div class="toggle-text">
                <div class="toggle-title">Pegawai Kelurahan</div>
                <div class="toggle-desc">Aparatur / Staf Kantor Kelurahan</div>
              </div>
            </button>
          </div>

          <!-- Notice about Approval Requirement -->
          <div class="approval-info-banner">
            <div class="approval-info-text">
              <strong>Pemberitahuan Persetujuan Akun:</strong>
              <div>Setelah pendaftaran diajukan, status akun adalah <strong>Menunggu Persetujuan (Pending)</strong>. Akun harus disetujui (approve) oleh Admin Kelurahan sebelum dapat digunakan untuk login.</div>
            </div>
          </div>

          <!-- Registration Form -->
          <form id="form-register-account" class="auth-custom-form">
            <div class="form-group-auth">
              <label class="auth-label">Nama Lengkap<span class="required">*</span></label>
              <div class="auth-input-wrapper">
                <input type="text" id="reg-nama" class="auth-input" placeholder="Masukkan Nama Lengkap" required>
              </div>
            </div>

            <!-- Role Specific Fields: Pegawai -->
            <div id="fields-pegawai" style="${selectedRegisterRole === 'pegawai' ? '' : 'display:none;'}">
              <div class="form-group-auth">
                <label class="auth-label">NIP / Nomor Identitas Pegawai <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="text" id="reg-nip" class="auth-input" placeholder="Contoh: 19930412 201902 1 003">
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Jabatan di Kantor Kelurahan <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <select id="reg-jabatan-pegawai" class="auth-input">
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

            <!-- Role Specific Fields: Petugas -->
            <div id="fields-petugas" style="${selectedRegisterRole === 'petugas' ? '' : 'display:none;'}">
              <div class="form-group-auth">
                <label class="auth-label">ID Petugas Lapangan <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="text" id="reg-id-petugas" class="auth-input" value="${suggestedPetugasId}" readonly>
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Wilayah Penugasan RW <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <select id="reg-rw" class="auth-input" required>
                    <!-- Diisi otomatis oleh JavaScript -->
                  </select>
                </div>
                <div style="font-size:0.75rem; color:#0369a1; margin-top:5px; line-height:1.4;">
                  ℹ️ <strong>Kebijakan 1 RW 1 Petugas:</strong> Anda akan bertanggung jawab mendata seluruh RT di wilayah RW ini.
                </div>
              </div>              
            </div>

            <!-- Kontak & Username -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
              <div class="form-group-auth">
                <label class="auth-label">No. WhatsApp / HP <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="tel" id="reg-telepon" class="auth-input" placeholder="081234567890" required>
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Username Akun <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="text" id="reg-username" class="auth-input" placeholder="username" required autocomplete="username">
                </div>
              </div>
            </div>

            <div class="form-group-auth">
              <label class="auth-label">Email</label>
              <div class="auth-input-wrapper">
                <input type="email" id="reg-email" class="auth-input" placeholder="nama@email.com">
              </div>
            </div>

            <!-- Password & Konfirmasi -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
              <div class="form-group-auth">
                <label class="auth-label">Kata Sandi <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="password" id="reg-password" class="auth-input" placeholder="Min. 6 karakter" required minlength="6" autocomplete="new-password">
                </div>
              </div>

              <div class="form-group-auth">
                <label class="auth-label">Konfirmasi Sandi <span class="required">*</span></label>
                <div class="auth-input-wrapper">
                  <input type="password" id="reg-password-confirm" class="auth-input" placeholder="Ulangi kata sandi" required minlength="6" autocomplete="new-password">
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary auth-btn-submit" id="btn-submit-register">
              Kirim Pendaftaran Akun
            </button>
          </form>

          <div class="auth-switch-link" style="margin-top: 1.25rem;">
            <span>Sudah memiliki akun terdaftar?</span>
            <button type="button" class="btn-link-text" id="link-goto-login">Kembali ke Halaman Masuk</button>
          </div>
        </div>

        <!-- Footer Notice -->
        <div class="login-card-footer">
          <div class="login-footer-info">
            <span>Developed by Z JTI Polije 2026</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindLoginEvents(container, { onLoginSuccess }) {
  const alertBox = container.querySelector("#auth-alert-box");
  const viewLogin = container.querySelector("#auth-view-login");
  const viewRegister = container.querySelector("#auth-view-register");

  const loginRoleSelection = container.querySelector("#login-role-selection");
  const loginRoleFormContainer = container.querySelector("#login-role-form-container");

  const btnRolePegawai = container.querySelector("#btn-role-pegawai");
  const btnRolePetugas = container.querySelector("#btn-role-petugas");
  const btnBackToRoles = container.querySelector("#btn-back-to-roles");

  const formRoleLogin = container.querySelector("#form-role-login");
  const roleLoginIdentifier = container.querySelector("#role-login-identifier");
  const roleLoginPassword = container.querySelector("#role-login-password");
  const loginFormHeading = container.querySelector("#login-form-heading");
  const loginFormSubheading = container.querySelector("#login-form-subheading");
  const labelRoleIdentifier = container.querySelector("#label-role-identifier");
  const demoAccountHint = container.querySelector("#demo-account-hint");

  function showAlert(html, type = "danger") {
    if (!alertBox) return;
    alertBox.style.display = "block";
    alertBox.className = `auth-alert-box alert-${type}`;
    alertBox.innerHTML = html;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = "none";
    alertBox.innerHTML = "";
  }

  function switchAuthTab(tab) {
    currentAuthTab = tab;
    hideAlert();

    if (tab === "login") {
      viewLogin.style.display = "";
      viewRegister.style.display = "none";
    } else {
      viewLogin.style.display = "none";
      viewRegister.style.display = "";
    }
  }

  const linkGotoLogin = container.querySelector("#link-goto-login");
  if (linkGotoLogin) linkGotoLogin.addEventListener("click", () => switchAuthTab("login"));

  const linkRoleRegister = container.querySelector("#link-role-register");
  if (linkRoleRegister) linkRoleRegister.addEventListener("click", () => switchAuthTab("register"));

  const linkFormRegister = container.querySelector("#link-form-register");
  if (linkFormRegister) linkFormRegister.addEventListener("click", () => switchAuthTab("register"));

  function selectRoleForLogin(role) {
    selectedLoginRole = role;
    hideAlert();
    loginRoleSelection.style.display = "none";
    loginRoleFormContainer.style.display = "";

    if (role === "admin") {
      loginFormHeading.textContent = "Login Pegawai Kelurahan";
      loginFormSubheading.textContent = "";
      labelRoleIdentifier.textContent = "Username atau NIP Pegawai";
      roleLoginIdentifier.placeholder = "Masukkan username";
    } else {
      loginFormHeading.textContent = "Login Petugas Lapangan";
      loginFormSubheading.textContent = "";
      labelRoleIdentifier.textContent = "Username atau ID Petugas";
      roleLoginIdentifier.placeholder = "Masukkan username";
    }

    roleLoginIdentifier.value = "";
    roleLoginPassword.value = "";
    roleLoginIdentifier.focus();
  }

  if (btnRolePegawai) {
    btnRolePegawai.addEventListener("click", () => selectRoleForLogin("admin"));
  }

  if (btnRolePetugas) {
    btnRolePetugas.addEventListener("click", () => selectRoleForLogin("petugas"));
  }

  if (btnBackToRoles) {
    btnBackToRoles.addEventListener("click", () => {
      selectedLoginRole = null;
      hideAlert();
      loginRoleFormContainer.style.display = "none";
      loginRoleSelection.style.display = "";
    });
  }

  // Submit Login
  if (formRoleLogin) {
    formRoleLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const identifier = roleLoginIdentifier.value.trim();
      const password = roleLoginPassword.value;

      if (!identifier) {
        showAlert("Silakan masukkan username atau nomor identitas Anda.", "warning");
        return;
      }

      const submitBtn = container.querySelector("#btn-submit-role-login");
      const originalBtnText = submitBtn.innerHTML;

      try {
        submitBtn.innerHTML = "Memeriksa Akun...";
        submitBtn.disabled = true;

        const response = await fetch("/src/data/api/login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier, password })
        });

        const result = await response.json();

        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        if (result.success) {
          const userRole = result.user.role;

          // Role matching check (Admin & Pegawai satu grup tombol)
          const isPegawaiGroup = userRole === "admin" || userRole === "pegawai";
          if (selectedLoginRole === "admin" && !isPegawaiGroup) {
            showAlert("Akun Anda terdaftar sebagai <strong>Petugas Lapangan</strong>. Silakan kembali dan pilih menu Login Petugas Lapangan.", "warning");
            return;
          }
          if (selectedLoginRole === "petugas" && userRole !== "petugas") {
            showAlert("Akun Anda terdaftar sebagai <strong>Pegawai/Admin Kelurahan</strong>. Silakan kembali dan pilih menu Login Pegawai Kelurahan.", "warning");
            return;
          }

          storage.loginWithUser(result.user);
          if (typeof onLoginSuccess === "function") {
            onLoginSuccess(result.user.role);
          }
        } else {
          if (result.code === "PENDING") {
            showAlert(`
              <div style="line-height:1.45;">
                <div style="font-weight:700; margin-bottom:0.25rem;">Akun Masih Menunggu Persetujuan</div>
                <div>Akun <strong>${identifier}</strong> masih dalam status <strong>Menunggu Persetujuan (Pending)</strong> oleh Admin Kelurahan.</div>
                <div style="margin-top:0.35rem; font-size:0.78rem;">Silakan hubungi Admin Kelurahan untuk menyetujui akun Anda di menu <strong>Data Anggota</strong>.</div>
              </div>
            `, "warning");
          } else if (result.code === "REJECTED") {
            showAlert(`
              <div style="line-height:1.45;">
                <div style="font-weight:700; margin-bottom:0.25rem;">Pendaftaran Akun Ditolak</div>
                <div>Pendaftaran akun Anda ditolak oleh Admin Kelurahan.</div>
              </div>
            `, "danger");
          } else {
            showAlert(result.message || "Username atau kata sandi salah.", "danger");
          }
        }
      } catch (err) {
        console.error("Login Error:", err);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        showAlert("Gagal terhubung ke database", "danger");
      }
    });
  }

  // Register Role Toggle
  const regTogglePetugas = container.querySelector("#reg-toggle-petugas");
  const regTogglePegawai = container.querySelector("#reg-toggle-pegawai");
  const fieldsPegawai = container.querySelector("#fields-pegawai");
  const fieldsPetugas = container.querySelector("#fields-petugas");

  function setRegisterRole(role) {
    selectedRegisterRole = role;
    if (role === "pegawai") {
      if (regTogglePegawai) regTogglePegawai.classList.add("selected");
      if (regTogglePetugas) regTogglePetugas.classList.remove("selected");
      if (fieldsPegawai) fieldsPegawai.style.display = "";
      if (fieldsPetugas) fieldsPetugas.style.display = "none";
    } else {
      if (regTogglePetugas) regTogglePetugas.classList.add("selected");
      if (regTogglePegawai) regTogglePegawai.classList.remove("selected");
      if (fieldsPetugas) fieldsPetugas.style.display = "";
      if (fieldsPegawai) fieldsPegawai.style.display = "none";
    }
  }

  if (regTogglePetugas) regTogglePetugas.addEventListener("click", () => setRegisterRole("petugas"));
  if (regTogglePegawai) regTogglePegawai.addEventListener("click", () => setRegisterRole("pegawai"));

  // --- INJEKSI PEMETAAN RW PURWANTORO (1 RW 1 PETUGAS) ---
  const PURWANTORO_RW_RT_MAP = {
    "01": 4, "02": 5, "03": 4, "04": 3, "05": 5, "06": 6,
    "07": 15, "08": 10, "09": 6, "10": 8, "11": 5, "12": 7,
    "13": 12, "14": 5, "15": 10, "16": 9, "17": 3, "18": 8,
    "19": 10, "20": 8, "21": 10, "22": 5, "23": 4, "24": 5
  };

  const regRwSelect = container.querySelector("#reg-rw");

  if (regRwSelect) {
    regRwSelect.innerHTML = "";

    // Cek petugas yang sudah bertugas di RW tersebut (Kebijakan 1 RW 1 Petugas)
    const users = storage.getUsers();
    const activePetugas = (users || []).filter(u => u.role === "petugas" && u.status !== "REJECTED");
    const takenRwMap = {};
    activePetugas.forEach(u => {
      if (u.rw) {
        const rwNum = String(u.rw).replace(/\D/g, "").padStart(2, "0");
        takenRwMap[rwNum] = u.nama;
      }
    });

    let firstAvailableRw = "";

    // Isi pilihan 24 RW Kelurahan Purwantoro beserta status keterisian
    for (let i = 1; i <= 24; i++) {
      const rwVal = String(i).padStart(2, "0");
      const totalRt = PURWANTORO_RW_RT_MAP[rwVal] || 1;
      const option = document.createElement("option");
      option.value = rwVal;
      const assignedTo = takenRwMap[rwVal];
      if (assignedTo) {
        option.textContent = `RW ${rwVal} (${totalRt} RT) — [Petugas Terdaftar: ${assignedTo}]`;
      } else {
        option.textContent = `RW ${rwVal} (Mencakup ${totalRt} RT) — Tersedia`;
      }
      if (!firstAvailableRw) firstAvailableRw = rwVal;
      regRwSelect.appendChild(option);
    }

    if (firstAvailableRw) {
      regRwSelect.value = firstAvailableRw;
    }
  }

  // Submit Register Form via MySQL API
  const formRegister = container.querySelector("#form-register-account");
  if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const nama = container.querySelector("#reg-nama")?.value.trim();
      const telepon = container.querySelector("#reg-telepon")?.value.trim();
      const username = container.querySelector("#reg-username")?.value.trim();
      const email = container.querySelector("#reg-email")?.value.trim();
      const password = container.querySelector("#reg-password")?.value;
      const passwordConfirm = container.querySelector("#reg-password-confirm")?.value;

      if (!nama || !telepon || !username || !password) {
        showAlert("Silakan lengkapi semua kolom yang bertanda bintang (*).", "danger");
        return;
      }

      if (password.length < 6) {
        showAlert("Kata sandi minimal 6 karakter.", "danger");
        return;
      }

      if (password !== passwordConfirm) {
        showAlert("Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.", "danger");
        return;
      }

      let roleSpecificData = {};
      if (selectedRegisterRole === "pegawai") {
        const nip = container.querySelector("#reg-nip")?.value.trim();
        const jabatan = container.querySelector("#reg-jabatan-pegawai")?.value;
        if (!nip) {
          showAlert("NIP / Nomor Identitas Pegawai wajib diisi untuk Pegawai Kelurahan.", "danger");
          return;
        }
        roleSpecificData = { nip, jabatan };
      } else {
        const id_petugas = container.querySelector("#reg-id-petugas")?.value.trim();
        const selectedRw = container.querySelector("#reg-rw")?.value || "01";
        const wilayah_tugas = `RW ${selectedRw} (Seluruh RT)`;

        roleSpecificData = {
          id_petugas,
          rw: selectedRw,
          rt: "Semua",
          wilayah_tugas,
          jabatan: "Petugas Surveyor Lapangan"
        };
      }
      const submitRegBtn = container.querySelector("#btn-submit-register");
      const originalRegBtnText = submitRegBtn.innerHTML;

      try {
        submitRegBtn.disabled = true;
        submitRegBtn.innerHTML = "Mendaftarkan...";

        const response = await fetch("/src/data/api/register_user.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: selectedRegisterRole,
            nama,
            no_hp: telepon,
            username,
            email,
            password,
            ...roleSpecificData
          })
        });

        const resData = await response.json();

        submitRegBtn.disabled = false;
        submitRegBtn.innerHTML = originalRegBtnText;

        if (!resData.success) {
          showAlert(resData.message || "Gagal melakukan pendaftaran akun.", "danger");
          return;
        }

        // Segera sinkronkan database ke localStorage agar akun baru langsung muncul di Data Anggota
        if (typeof storage.syncUsersFromDB === "function") {
          try {
            await storage.syncUsersFromDB();
          } catch (syncErr) {
            console.warn("Sinkronisasi otomatis user setelah registrasi:", syncErr);
          }
        }

        showAlert(`
          <div style="line-height:1.45;">
            <div style="font-weight:700; margin-bottom:0.25rem; color:#166534;">Pendaftaran Berhasil Diajukan</div>
            <div style="color:#14532d;">
              Akun <strong>${nama}</strong> (${selectedRegisterRole === 'pegawai' ? 'Pegawai Kelurahan' : 'Petugas Lapangan'}) telah didaftarkan dengan status: <strong>Menunggu Persetujuan (Pending)</strong>.
            </div>
            <div style="margin-top:0.4rem; font-size:0.8rem; color:#166534;">
              Admin Kelurahan akan memverifikasi akun Anda di menu <strong>Data Anggota</strong> sebelum akun dapat digunakan untuk login.
            </div>
            <div style="margin-top:0.65rem;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-success-goto-login" style="background:#ffffff; border-color:#86efac; color:#166534; font-weight:700;">
                Kembali ke Halaman Masuk
              </button>
            </div>
          </div>
        `, "success");

        formRegister.reset();

        const btnGotoLogin = container.querySelector("#btn-success-goto-login");
        if (btnGotoLogin) {
          btnGotoLogin.addEventListener("click", () => {
            switchAuthTab("login");
            selectRoleForLogin(selectedRegisterRole === "pegawai" ? "admin" : "petugas");
            roleLoginIdentifier.value = username;
          });
        }
      } catch (err) {
        console.error("Register Error:", err);
        submitRegBtn.disabled = false;
        submitRegBtn.innerHTML = originalRegBtnText;
        showAlert("Terjadi kendala saat menghubungi server database.", "danger");
      }
    });
  }
}

// Aliases for compatibility
export const renderLoginFasih = renderLogin;
export const bindLoginFasihEvents = bindLoginEvents;