import { storage } from "../utils/storage.js";
import { icons } from "../utils/icons.js";

export function renderProfile() {
  const currentUser = storage.getCurrentUser();
  const currentRole = storage.getCurrentRole();

  if (!currentUser) {
    return `
      <div class="profile-page">
        <div class="profile-empty">
          <h2>Data pengguna tidak ditemukan</h2>
          <p>Silakan login kembali ke dalam sistem.</p>
        </div>
      </div>
    `;
  }

  const isAdmin = currentRole === "admin";

  const nama = currentUser.nama || "";
  const nip = currentUser.nip || "-";
  const idPetugas = currentUser.id_petugas || "-";
  const jabatan = currentUser.jabatan || "";
  const wilayah = currentUser.wilayah_tugas || (currentUser.rw ? `RW ${String(currentUser.rw).padStart(2, '0')} (Seluruh RT)` : "-");
  const desa = currentUser.desa && !currentUser.desa.includes("Sukamaju") && !currentUser.desa.includes("Desa") ? currentUser.desa : "Kelurahan Purwantoro";
  const kecamatan = currentUser.kecamatan && !currentUser.kecamatan.includes("Cilongok") ? currentUser.kecamatan : "Kecamatan Blimbing";
  const kabupaten = currentUser.kabupaten && !currentUser.kabupaten.includes("Banyumas") ? currentUser.kabupaten : "Kota Malang";
  const telepon = currentUser.telepon || "";
  const email = currentUser.email || "";
  const username = currentUser.username || "-";

  const identifier = isAdmin ? nip : idPetugas;

  return `
    <div class="profile-page">

      <!-- CONTENT -->
      <div class="profile-layout">

        <!-- =========================================
             KARTU IDENTITAS
             ========================================= -->

        <div class="profile-card profile-identity-card">

          <div class="profile-avatar-large">
            ${nama.charAt(0).toUpperCase() || "U"}
          </div>

          <h3 class="profile-name">
            ${nama || "Pengguna"}
          </h3>

          <span class="profile-role-badge ${isAdmin ? "admin" : "petugas"}">
            ${isAdmin
      ? "Pegawai / Admin Kelurahan"
      : "Petugas Lapangan"
    }
          </span>


          <div class="profile-identity-info">

            <!-- ID -->
            <div class="profile-info-row">

              <span class="profile-info-label">
                ${isAdmin ? "NIP" : "ID Petugas"}
              </span>

              <strong>
                ${identifier}
              </strong>

            </div>


            <!-- Jabatan -->
            <div class="profile-info-row">

              <span class="profile-info-label">
                Jabatan
              </span>

              <strong>
                ${jabatan || "-"}
              </strong>

            </div>


            <!-- Wilayah -->
            ${!isAdmin
      ? `
                  <div class="profile-info-row">

                    <span class="profile-info-label">
                      Wilayah Tugas
                    </span>

                    <strong>
                      ${wilayah || "-"}
                    </strong>

                  </div>
                `
      : ""
    }


            <!-- Kelurahan -->
            <div class="profile-info-row">

              <span class="profile-info-label">
                Kelurahan
              </span>

              <strong>
                ${desa}
              </strong>

            </div>

          </div>

        </div>


        <!-- =========================================
             FORM EDIT PROFILE
             ========================================= -->

        <div class="profile-card">

          <div class="profile-card-header">

            <div class="profile-card-icon">
              ${icons.user
      ? icons.user("w-5 h-5")
      : ""
    }
            </div>

            <div>

              <h3>
                Edit Profil
              </h3>
            </div>

          </div>


          <form
            id="profile-edit-form"
            class="profile-edit-form"
          >
            <div class="profile-photo-upload">
            <div class="profile-avatar-preview" id="profile-avatar-preview">
                ${currentUser.avatar && currentUser.avatar.startsWith("data:image")
      ? `<img src="${currentUser.avatar}" alt="Foto Profil">`
      : `<span>${(currentUser.nama || "U").charAt(0).toUpperCase()}</span>`
    }
            </div>

            <div class="profile-photo-actions">
                <label for="profile-photo-input" class="btn-profile-upload">
                ${icons.upload ? icons.upload(16) : ""}
                <span>Ubah Foto</span>
                </label>

                <input
                type="file"
                id="profile-photo-input"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                hidden
                >

                <small>Format JPG, PNG, atau WEBP. Maksimal 2 MB.</small>
            </div>
            </div>

            <!-- NAMA -->
            <div class="profile-form-group">

              <label for="profile-nama">
                Nama Lengkap
              </label>

              <input
                type="text"
                id="profile-nama"
                class="profile-input"
                value="${nama}"
                placeholder="Masukkan nama lengkap"
                required
              >

            </div>


            <!-- USERNAME -->
            <div class="profile-form-group">

              <label>
                Username
              </label>

              <input
                type="text"
                class="profile-input profile-input-disabled"
                value="${username}"
                disabled
              >
            </div>


            <!-- NIP / ID PETUGAS -->
            <div class="profile-form-group">

              <label>
                ${isAdmin ? "NIP" : "ID Petugas"}
              </label>

              <input
                type="text"
                class="profile-input profile-input-disabled"
                value="${identifier}"
                disabled
              >
            </div>


            <!-- JABATAN -->
            <div class="profile-form-group">

              <label for="profile-jabatan">
                Jabatan
              </label>

              <input
                type="text"
                id="profile-jabatan"
                class="profile-input"
                value="${jabatan}"
                placeholder="Masukkan jabatan"
              >
            </div>

            <!-- WILAYAH PETUGAS -->
            ${!isAdmin
      ? `
                  <div class="profile-form-group">

                    <label for="profile-wilayah">
                      Wilayah Tugas
                    </label>

                    <input
                      type="text"
                      id="profile-wilayah"
                      class="profile-input"
                      value="${wilayah}"
                      placeholder="Contoh: RT 01 / RW 01"
                    >

                  </div>
                `
      : ""
    }


            <!-- TELEPON -->
            <div class="profile-form-group">

              <label for="profile-telepon">
                Nomor Telepon
              </label>

              <input
                type="tel"
                id="profile-telepon"
                class="profile-input"
                value="${telepon}"
                placeholder="Contoh: 081234567890"
              >

            </div>


            <!-- EMAIL -->
            <div class="profile-form-group">

              <label for="profile-email">
                Email
              </label>

              <input
                type="email"
                id="profile-email"
                class="profile-input"
                value="${email}"
                placeholder="Contoh: nama@email.com"
              >

            </div>


            <!-- TOMBOL -->
            <div class="profile-form-actions">

              <button
                type="button"
                class="btn-profile-reset"
                id="btn-profile-reset"
              >
                Batal
              </button>


              <button
                type="submit"
                class="btn-profile-save"
                id="btn-profile-save"
              >

                ${icons.checkCircle
      ? icons.checkCircle("w-4 h-4")
      : ""
    }

                Simpan Perubahan

              </button>

            </div>

          </form>

        </div>

      </div>

      
      <!-- =========================================
           KEAMANAN
           ========================================= -->

      <div class="profile-card profile-security-card">

        <div class="profile-card-header">

          <div class="profile-card-icon security">

            ${icons.shield
      ? icons.shield("w-5 h-5")
      : ""
    }

          </div>

          <div>

            <h3>
              Status Akun
            </h3>
          </div>

        </div>


        <div class="profile-security-status">

          <div class="status-indicator">

            <span class="status-dot"></span>

            <div>

              <strong>
                Akun Aktif
              </strong>

            </div>

          </div>

        </div>

        <!-- =========================================
             KARTU GANTI KATA SANDI (SECURITY)
             ========================================= -->
        <div class="profile-card profile-security-card" style="margin-top: 1.5rem;">
          <div class="profile-card-header">
            <div>
              <h3>Keamanan & Kata Sandi</h3>
            </div>
          </div>

          <form id="profile-password-form" style="margin-top: 1rem;">
            <div class="profile-form-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="profile-form-group">
                <label class="profile-label" for="profile-old-pass">Kata Sandi Lama <span style="color:var(--danger)">*</span></label>
                <input type="password" id="profile-old-pass" class="profile-input" placeholder="Masukkan kata sandi lama" required autocomplete="current-password">
              </div>

              <div class="profile-form-group">
                <label class="profile-label" for="profile-new-pass">Kata Sandi Baru <span style="color:var(--danger)">*</span></label>
                <input type="password" id="profile-new-pass" class="profile-input" placeholder="Minimal 6 karakter" required autocomplete="new-password">
              </div>

              <div class="profile-form-group">
                <label class="profile-label" for="profile-confirm-pass">Konfirmasi Sandi Baru <span style="color:var(--danger)">*</span></label>
                <input type="password" id="profile-confirm-pass" class="profile-input" placeholder="Ulangi sandi baru" required autocomplete="new-password">
              </div>
            </div>

            <div style="margin-top: 1.25rem; display:flex; justify-content:flex-end;">
              <button type="submit" class="btn btn-primary" id="btn-submit-password">
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   PROFILE EVENTS
   ========================================================= */

export function initProfileEvents(
  container,
  { showToast, onStateChange } = {}
) {

  const form = container.querySelector(
    "#profile-edit-form"
  );

  const resetBtn = container.querySelector(
    "#btn-profile-reset"
  );
  const photoInput = container.querySelector("#profile-photo-input");
  const avatarPreview = container.querySelector("#profile-avatar-preview");

  if (photoInput) {
    photoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];

      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Ukuran foto maksimal 2 MB.", "error");
        photoInput.value = "";
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (!allowedTypes.includes(file.type)) {
        showToast("Format foto harus JPG, PNG, atau WEBP.", "error");
        photoInput.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const imageBase64 = e.target.result;

        avatarPreview.innerHTML = `
            <img src="${imageBase64}" alt="Foto Profil">
        `;

        container.dataset.profileAvatar = imageBase64;
      };

      reader.readAsDataURL(file);
    });
  }


  if (!form) return;


  /* =========================================
     BATAL
     ========================================= */

  if (resetBtn) {

    resetBtn.addEventListener(
      "click",
      () => {

        if (onStateChange) {
          onStateChange();
        }

      }
    );

  }


  /* =========================================
     SIMPAN PERUBAHAN
     ========================================= */

  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const currentUser =
        storage.getCurrentUser();

      if (!currentUser) {

        showToast?.(
          "Data pengguna tidak ditemukan.",
          "danger"
        );

        return;
      }


      /* Ambil input */

      const nama =
        container
          .querySelector("#profile-nama")
          ?.value
          .trim() || "";

      const jabatan =
        container
          .querySelector("#profile-jabatan")
          ?.value
          .trim() || "";

      const wilayah =
        container
          .querySelector("#profile-wilayah")
          ?.value
          .trim() || "";

      const telepon =
        container
          .querySelector("#profile-telepon")
          ?.value
          .trim() || "";

      const email =
        container
          .querySelector("#profile-email")
          ?.value
          .trim() || "";


      /* =========================================
         VALIDASI
         ========================================= */

      if (!nama) {

        showToast?.(
          "Nama lengkap wajib diisi.",
          "danger"
        );

        container
          .querySelector("#profile-nama")
          ?.focus();

        return;
      }


      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {

        showToast?.(
          "Format email tidak valid.",
          "danger"
        );

        container
          .querySelector("#profile-email")
          ?.focus();

        return;
      }


      /* =========================================
         BUAT DATA USER BARU
         ========================================= */

      const updatedUser = {
        ...currentUser,

        nama,
        jabatan,
        telepon,
        email
      };


      if (
        storage.getCurrentRole() === "petugas"
      ) {
        updatedUser.wilayah_tugas =
          wilayah;
      }


      /* =========================================
         SIMPAN KE STORAGE & DATABASE MYSQL
         ========================================= */

      const uploadedAvatar = container.dataset.profileAvatar;
      const finalUserData = {
        ...updatedUser,
        avatar: uploadedAvatar || currentUser.avatar || "👤"
      };

      try {
        await storage.updateUserProfile(currentUser.id, finalUserData);
        showToast?.("Profil berhasil diperbarui dan tersimpan ke database.");
      } catch (err) {
        showToast?.("Profil berhasil diperbarui di penyimpanan lokal.");
      }

      if (onStateChange) {
        onStateChange();
      }

    }
  );

  // Handle Ganti Kata Sandi
  const passwordForm = container.querySelector("#profile-password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPass = container.querySelector("#profile-old-pass").value;
      const newPass = container.querySelector("#profile-new-pass").value;
      const confirmPass = container.querySelector("#profile-confirm-pass").value;

      if (!oldPass || !newPass || !confirmPass) {
        showToast?.("Semua kolom kata sandi wajib diisi.", "danger");
        return;
      }

      if (newPass.length < 6) {
        showToast?.("Kata sandi baru minimal 6 karakter.", "danger");
        return;
      }

      if (newPass !== confirmPass) {
        showToast?.("Konfirmasi kata sandi baru tidak cocok.", "danger");
        return;
      }

      const submitBtn = container.querySelector("#btn-submit-password");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await storage.changeUserPassword(currentUser.id, oldPass, newPass);
        if (res.status === "success") {
          showToast?.("Kata sandi Anda berhasil diperbarui!");
          passwordForm.reset();
        } else {
          showToast?.(res.message || "Gagal memperbarui kata sandi.", "danger");
        }
      } catch (err) {
        showToast?.("Gagal menghubungi server untuk update password.", "danger");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}