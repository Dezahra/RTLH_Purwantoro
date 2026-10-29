import { calculateHousingEligibility } from "./calculator.js";

const API_BASE = "http://localhost:8000/src/data/api";
const STORAGE_KEY = "sipelita_desa_surveys_v1";
const ROLE_KEY = "sipelita_desa_role";
const REGISTERED_USERS_KEY = "sipelita_desa_registered_users_v2";
const ACTIVE_USER_KEY = "sipelita_desa_active_user_v2";

export const initialRegisteredUsers = [
  {
    id: "USR-PGW-001",
    role: "admin",
    username: "admin",
    password: "password123",
    nama: "Devi Zahra Safrida",
    nip: "19880415 201201 1 002",
    jabatan: "Kasi Kesejahteraan / Pegawai Kelurahan",
    desa: "Kelurahan Purwantoro",
    kecamatan: "Blimbing",
    kabupaten: "Kota Malang",
    telepon: "081234567890",
    email: "zahra@purwantoro.malangkota.go.id",
    status: "APPROVED",
    avatar: "🏢",
    registered_at: "2026-09-01T08:00:00.000Z",
    approved_at: "2026-09-01T08:00:00.000Z",
    approved_by: "Sistem Otomatis"
  }
];

export const USERS = {
  admin: initialRegisteredUsers[0],
  petugas: initialRegisteredUsers[0]
};

export function isSurveyOwnedByPetugas(surveyItem, user) {
  if (!user) return false;

  const uId = String(user.id || "").toLowerCase().trim();
  const uUsername = String(user.username || "").toLowerCase().trim();
  const uIdPetugas = String(user.id_petugas || "").toLowerCase().trim();
  const uNama = String(user.nama || "").toLowerCase().trim();

  const cBy = String(surveyItem.created_by || "").toLowerCase().trim();
  const pId = String(surveyItem.petugas_id || "").toLowerCase().trim();
  const pNama = String(surveyItem.petugas_nama || surveyItem.nama_petugas || "").toLowerCase().trim();

  // 1. Cek created_by terhadap id, username, id_petugas
  if (cBy) {
    if (uId && cBy === uId) return true;
    if (uUsername && cBy === uUsername) return true;
    if (uIdPetugas && cBy === uIdPetugas) return true;
  }

  // 2. Cek petugas_id terhadap id_petugas, id
  if (pId) {
    if (uIdPetugas && pId === uIdPetugas) return true;
    if (uId && pId === uId) return true;
  }

  // 3. Cek petugas_nama terhadap nama user
  if (pNama && uNama) {
    if (pNama === uNama) return true;
    if (pNama.includes(uNama) || uNama.includes(pNama)) return true;
  }

  // 4. Kebijakan 1 RW 1 Petugas: Survei pada RW penugasan petugas
  if (user.role === 'petugas' && user.rw && surveyItem.rw) {
    const uRw = String(user.rw).replace(/\D/g, '').padStart(2, '0');
    const sRw = String(surveyItem.rw).replace(/\D/g, '').padStart(2, '0');
    if (uRw && sRw && uRw === sRw) return true;
  }

  return false;
}

export function isDraftOwnedByUser(draft, user) {
  if (!draft || !user) return false;

  const uId = String(user.id || "").toLowerCase().trim();
  const uUsername = String(user.username || "").toLowerCase().trim();
  const uIdPetugas = String(user.id_petugas || "").toLowerCase().trim();
  const uNama = String(user.nama || "").toLowerCase().trim();

  // 1. Tag kepemilikan eksplisit akun saat penyimpanan draf
  const sId = String(draft.saved_by_id || draft.author_id || "").toLowerCase().trim();
  if (sId && uId && sId === uId) return true;

  const sUsername = String(draft.saved_by_username || draft.author_username || "").toLowerCase().trim();
  if (sUsername && uUsername && sUsername === uUsername) return true;

  const sNama = String(draft.saved_by_nama || "").toLowerCase().trim();
  if (sNama && uNama && (sNama === uNama || sNama.includes(uNama) || uNama.includes(sNama))) return true;

  // 2. Cek created_by terhadap id, username, id_petugas
  const cBy = String(draft.created_by || "").toLowerCase().trim();
  if (cBy) {
    if (uId && cBy === uId) return true;
    if (uUsername && cBy === uUsername) return true;
    if (uIdPetugas && cBy === uIdPetugas) return true;
  }

  // 3. Cek petugas_id terhadap id_petugas, id
  const pId = String(draft.petugas_id || "").toLowerCase().trim();
  if (pId) {
    if (uIdPetugas && pId === uIdPetugas) return true;
    if (uId && pId === uId) return true;
  }

  // 4. Cek petugas_nama / nama_petugas terhadap nama user
  const pNama = String(draft.petugas_nama || draft.nama_petugas || "").toLowerCase().trim();
  if (pNama && uNama) {
    if (pNama === uNama) return true;
    if (pNama.includes(uNama) || uNama.includes(pNama)) return true;
  }

  // 5. Kesesuaian RW Petugas (khusus role petugas dengan RW penugasan)
  if (user.role === 'petugas' && user.rw && draft.rw) {
    const uRw = String(user.rw).replace(/\D/g, '').padStart(2, '0');
    const dRw = String(draft.rw).replace(/\D/g, '').padStart(2, '0');
    if (uRw && dRw && uRw === dRw) return true;
  }

  return false;
}

export async function compressBase64Image(base64Str, maxWidth = 640, quality = 0.6) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  if (base64Str.length < 50000) return base64Str;

  return new Promise((resolve) => {
    try {
      if (typeof Image === 'undefined' || typeof document === 'undefined') {
        return resolve(base64Str);
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    } catch {
      resolve(base64Str);
    }
  });
}

export const storage = {
  isSurveyOwnedByPetugas,
  isDraftOwnedByUser,
  compressBase64Image,

  // 1. Data Survei
  getSurveys() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error("Gagal membaca survei dari localStorage:", e);
      return [];
    }
  },

  async syncSurveysFromDB() {
    try {
      const res = await fetch(`${API_BASE}/get_surveys.php`);
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data)) {
        this.saveSurveys(resData.data);
        return resData.data;
      }
    } catch (err) {
      console.warn("Gagal sinkronisasi survei dari MySQL:", err);
    }
    return this.getSurveys();
  },

  getNextBnbaNumber() {
    const list = this.getSurveys();
    const currentYear = new Date().getFullYear();
    let maxSeq = 0;
    list.forEach(s => {
      if (s.no_urut_bnba) {
        const match = s.no_urut_bnba.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });
    if (maxSeq === 0) maxSeq = list.length;
    return `BNBA-${currentYear}-${String(maxSeq + 1).padStart(3, "0")}`;
  },

  saveSurveys(surveys) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
    } catch (e) {
      console.error("Gagal menyimpan ke localStorage:", e);
    }
  },

  getSurveyById(id) {
    const list = this.getSurveys();
    return list.find(s => s.id === id);
  },

  async saveSurvey(data) {
    const list = this.getSurveys();
    const currentUser = this.getCurrentUser();

    data.lama_tinggal = Number(data.lama_tinggal) || 0;
    data.aset_rumah_lain = data.aset_rumah_lain || "Tidak";

    const result = calculateHousingEligibility(data);

    const enriched = {
      ...data,
      rw: data.rw || (currentUser?.role === 'petugas' && currentUser?.rw ? String(currentUser.rw).padStart(2, '0') : data.rw),
      rt: data.rt || (currentUser?.role === 'petugas' && currentUser?.rt ? String(currentUser.rt).padStart(2, '0') : data.rt),
      created_by: data.created_by || currentUser?.id,
      petugas_nama: data.petugas_nama || currentUser?.nama || "Petugas Lapangan",
      petugas_id: data.petugas_id || currentUser?.id_petugas || currentUser?.id || "PETUGAS-01",
      skor_total: 0,
      kategori_kelayakan: "",
      kategori_label: "",
      color_badge: "badge-info",
      status_color: "#0284c7",
      rekomendasi_sistem: "",
      program_bantuan: "",
      luas_per_jiwa: result.luasPerJiwa,
      breakdown: result.breakdown,
      status_kelayakan_sosial: result.statusKelayakanSosial,
      catatan_kelayakan_sosial: result.catatanKelayakanSosial,
      akurasi_gps: (data.akurasi_gps !== undefined && data.akurasi_gps !== null && data.akurasi_gps !== '') ? String(data.akurasi_gps) : "0",
      updated_at: new Date().toISOString()
    };

    if (!enriched.no_urut_bnba) {
      enriched.no_urut_bnba = this.getNextBnbaNumber();
    }

    if (!enriched.id) {
      const count = list.length + 1;
      enriched.id = `SRV-2026-${String(count).padStart(3, "0")}`;
      enriched.status_verifikasi = enriched.status_verifikasi || "MENUNGGU_VALIDASI";
      enriched.created_at = new Date().toISOString();
      list.unshift(enriched);
    } else {
      const index = list.findIndex(s => s.id === enriched.id);
      if (index !== -1) {
        // Poin 2: Jika status lama adalah BUTUH_REVISI, ubah otomatis kembali ke MENUNGGU_VALIDASI
        if (list[index].status_verifikasi === 'BUTUH_REVISI') {
          enriched.status_verifikasi = 'MENUNGGU_VALIDASI';
          enriched.revision_at = new Date().toISOString();
          const oldNote = enriched.catatan_admin || list[index].catatan_admin || '';
          enriched.catatan_admin = `[Diperbaiki Petugas] ${oldNote}`.trim();
        }
        list[index] = { ...list[index], ...enriched };
      } else {
        list.unshift(enriched);
      }
    }

    this.saveSurveys(list);

    try {
      const response = await fetch(`${API_BASE}/save_survey.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enriched)
      });
      const resData = await response.json();
      if (!resData.success) {
        console.warn("Peringatan MySQL save_survey:", resData.message);
        if (response.status === 409) {
          throw new Error(resData.message);
        }
      }
    } catch (err) {
      console.error("Gagal kirim survei ke MySQL:", err);
      // Jika terjadi duplikasi NIK, lemparkan error ke form
      if (err.message && err.message.includes("sudah terdata sebelumnya")) {
        throw err;
      }
      // Jika offline atau kegagalan jaringan, simpan ke antrean draft offline
      this.saveOfflineDraft(enriched);
      return { ...enriched, _is_offline: true };
    }

    return enriched;
  },

  async deleteSurvey(id) {
    let list = this.getSurveys();
    list = list.filter(s => s.id !== id);
    this.saveSurveys(list);

    try {
      await fetch(`${API_BASE}/delete_survey.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error("Gagal menghapus survei di database:", err);
    }
  },

  async updateVerification(id, { status, catatanAdmin, programBantuan }) {
    const list = this.getSurveys();
    const target = list.find(s => s.id === id);

    if (target) {
      if (status) {
        target.status_verifikasi = status;
        if (status === "TERVERIFIKASI") target.verified_at = new Date().toISOString();
        if (status === "BUTUH_REVISI") target.revision_at = new Date().toISOString();
      }
      if (catatanAdmin !== undefined) target.catatan_admin = catatanAdmin;
      if (programBantuan !== undefined) target.program_bantuan = programBantuan;

      this.saveSurveys(list);

      try {
        await fetch(`${API_BASE}/update_verification.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            status,
            catatanAdmin: catatanAdmin || "",
            programBantuan: programBantuan !== undefined ? programBantuan : target.program_bantuan
          })
        });
      } catch (err) {
        console.error("Gagal update verifikasi ke API:", err);
      }
      return target;
    }
    return null;
  },

  // 2. Data Pengguna & Petugas
  async syncUsersFromDB() {
    try {
      const res = await fetch(`${API_BASE}/get_users.php`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.saveUsers(json.data);
        return json.data;
      }
    } catch (err) {
      console.error("Gagal sinkron user dari DB:", err);
    }
    return this.getUsers();
  },

  getUsers() {
    try {
      let data = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!data) {
        data = localStorage.getItem("sipelita_users");
      }
      if (!data) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initialRegisteredUsers));
        localStorage.setItem("sipelita_users", JSON.stringify(initialRegisteredUsers));
        return initialRegisteredUsers;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialRegisteredUsers;
    } catch (e) {
      console.error("Gagal membaca users dari localStorage:", e);
      return initialRegisteredUsers;
    }
  },

  saveUsers(users) {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      localStorage.setItem("sipelita_users", JSON.stringify(users));
    } catch (e) {
      console.error("Gagal simpan users:", e);
    }
  },

  async updateUserProfile(userId, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      this.saveUsers(users);
    }
    const currentActive = this.getCurrentUser();
    if (currentActive && currentActive.id === userId) {
      const updatedActive = { ...currentActive, ...data };
      localStorage.setItem("sipelita_desa_active_user_v2", JSON.stringify(updatedActive));
    }

    try {
      const res = await fetch(`${API_BASE}/update_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...data })
      });
      return await res.json();
    } catch (err) {
      console.error("Gagal update profil ke API:", err);
      return { status: "local_only", message: "Profil tersimpan di peramban lokal." };
    }
  },

  async changeUserPassword(userId, oldPassword, newPassword) {
    try {
      const res = await fetch(`${API_BASE}/change_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, old_password: oldPassword, new_password: newPassword })
      });
      return await res.json();
    } catch (err) {
      console.error("Gagal ganti password:", err);
      throw err;
    }
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername(username) {
    if (!username) return null;
    const users = this.getUsers();
    const clean = username.trim().toLowerCase();
    return users.find(u =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.nip && u.nip.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) ||
      (u.id_petugas && u.id_petugas.toLowerCase() === clean)
    );
  },

  getPendingCounts() {
    const users = this.getUsers();
    const pendingUsers = users.filter(u => (u.status || "").toUpperCase() === "PENDING");
    return {
      total: pendingUsers.length,
      admin: pendingUsers.filter(u => u.role === "admin").length,
      pegawai: pendingUsers.filter(u => u.role === "pegawai").length,
      petugas: pendingUsers.filter(u => u.role === "petugas").length
    };
  },

  getRevisionCount(targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    if (!user) return 0;
    const list = this.getSurveys();
    const owned = list.filter(item => isSurveyOwnedByPetugas(item, user));
    return owned.filter(item => item.status_verifikasi === 'BUTUH_REVISI').length;
  },

  async registerUserAsync(userData) {
    try {
      const response = await fetch(`${API_BASE}/register_user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.message || "Gagal mendaftarkan akun.");
      }
      await this.syncUsersFromDB();
      return resData;
    } catch (err) {
      console.error("Gagal registrasi ke server:", err);
      throw err;
    }
  },

  async updateUserStatus(id, action, meta = {}) {
    try {
      await fetch(`${API_BASE}/update_user_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          actor_name: meta.actorName || this.getCurrentUser()?.nama || "Admin Kelurahan",
          reason: meta.reason || "",
          new_password: meta.new_password || "password123"
        })
      });
    } catch (err) {
      console.error("Gagal update status user di server:", err);
    }
    return await this.syncUsersFromDB();
  },

  async resetUserPassword(id, newPassword = "password123") {
    let users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx].password = newPassword;
      this.saveUsers(users);
    }
    try {
      const res = await fetch(`${API_BASE}/update_user_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "reset_password",
          actor_name: this.getCurrentUser()?.nama || "Admin Kelurahan",
          new_password: newPassword
        })
      });
      const data = await res.json();
      await this.syncUsersFromDB();
      return data;
    } catch (err) {
      console.error("Gagal reset password user di MySQL:", err);
      return { success: true, message: `Password lokal direset ke ${newPassword}` };
    }
  },

  async rotatePetugasWilayah(id, newRw) {
    const rwPad = String(newRw).replace(/\D/g, "").padStart(2, "0");
    const res = await fetch(`${API_BASE}/update_user_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: "rotate_wilayah",
        rw: rwPad,
        actor_name: this.getCurrentUser()?.nama || "Admin Kelurahan"
      })
    });
    const resData = await res.json();
    if (!resData.success) {
      throw new Error(resData.message || "Gagal mengubah wilayah tugas petugas.");
    }
    await this.syncUsersFromDB();
    return resData;
  },

  async deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    this.saveUsers(users);

    try {
      await fetch(`${API_BASE}/delete_user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error("Gagal delete user di MySQL:", err);
    }
  },

  // 3. Autentikasi
  async authenticateAsync(username, password) {
    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const resData = await response.json();
      if (!resData.success) {
        return {
          success: false,
          code: resData.code || "AUTH_FAILED",
          message: resData.message || "Gagal masuk ke sistem."
        };
      }
      this.loginWithUser(resData.user);
      return { success: true, user: resData.user };
    } catch (err) {
      console.error("Gagal login via server:", err);
      return this.authenticate(username, password);
    }
  },

  authenticate(usernameOrIdentifier, password) {
    const user = this.getUserByUsername(usernameOrIdentifier);
    if (!user) {
      return { success: false, code: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }
    if (user.password && password && user.password !== password) {
      return { success: false, code: "WRONG_PASSWORD", message: "Kata sandi salah." };
    }
    if (user.status === "PENDING") {
      return { success: false, code: "PENDING", user, message: "Akun menunggu persetujuan admin." };
    }
    this.loginWithUser(user);
    return { success: true, user };
  },

  loginWithUser(user) {
    localStorage.setItem("sipelita_desa_is_logged_in", "true");
    this.setCurrentRole(user.role);
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.setItem("sipelita_desa_is_logged_in", "false");
    localStorage.removeItem(ACTIVE_USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  isAuthenticated() {
    return localStorage.getItem("sipelita_desa_is_logged_in") === "true";
  },

  getCurrentRole() {
    return localStorage.getItem(ROLE_KEY) || "admin";
  },

  setCurrentRole(role) {
    localStorage.setItem(ROLE_KEY, role);
  },

  getCurrentUser() {
    try {
      const active = localStorage.getItem(ACTIVE_USER_KEY);
      if (active) return JSON.parse(active);
    } catch (e) {
      console.error("Gagal baca user aktif:", e);
    }
    const role = this.getCurrentRole();
    return USERS[role] || { nama: "Pengguna", role };
  },

  // 4. Statistik & Export
  getStats() {
    const list = this.getSurveys();
    const total = list.length;
    let pending = 0, terverifikasi = 0, revisi = 0;
    const rwMap = {};
    let pondasiSloofRusak = 0, kolomBalokRusak = 0, rangkaAtapRusak = 0, strukturRusak = 0;
    let atapRusak = 0, dindingRusak = 0, lantaiRusak = 0;
    let tanpaJamban = 0, airTidakLayak = 0, pencahayaanKurang = 0, penghawaanKurang = 0;
    let luasKurang = 0;

    list.forEach(item => {
      if (item.status_verifikasi === "MENUNGGU_VALIDASI") pending++;
      else if (item.status_verifikasi === "TERVERIFIKASI") terverifikasi++;
      else if (item.status_verifikasi === "BUTUH_REVISI") revisi++;
      else pending++;

      const rwVal = item.rw ? String(item.rw).padStart(2, "0") : "01";
      const rwKey = `RW ${rwVal}`;
      if (!rwMap[rwKey]) rwMap[rwKey] = { total: 0, terverifikasi: 0, pending: 0, revisi: 0 };
      rwMap[rwKey].total++;
      if (item.status_verifikasi === "TERVERIFIKASI") rwMap[rwKey].terverifikasi++;
      else if (item.status_verifikasi === "BUTUH_REVISI") rwMap[rwKey].revisi++;
      else rwMap[rwKey].pending++;

      // 1. Kerusakan Struktur (Pondasi, Sloof, Kolom, Ring Balok, Rangka Atap)
      const isDamaged = (val) => {
        if (!val) return false;
        const s = String(val).toLowerCase();
        return s === "rapuh_sebagian" || s === "rapuh_seluruhnya" || s === "sedang" || s === "buruk" || s.includes("rapuh") || s.includes("rusak") || s.includes("tidak ada");
      };

      const isPondasiSloof = isDamaged(item.pondasi) || isDamaged(item.sloof);
      const isKolomBalok = isDamaged(item.kolom || item.kolom_balok) || isDamaged(item.ring_balok);
      const isRangka = isDamaged(item.rangka_atap);

      if (isPondasiSloof) pondasiSloofRusak++;
      if (isKolomBalok) kolomBalokRusak++;
      if (isRangka) rangkaAtapRusak++;
      if (isPondasiSloof || isKolomBalok || isRangka) strukturRusak++;

      // 2. Atap Rusak / Bocor
      const atapVal = String(item.atap || "").toLowerCase();
      if (atapVal === "sedang" || atapVal === "buruk" || atapVal.includes("bocor") || atapVal.includes("rusak") || atapVal.includes("asbes pecah") || atapVal.includes("rumbia")) {
        atapRusak++;
      }

      // 3. Dinding Rusak / Tidak Kedap Air
      const dindingVal = String(item.dinding || "").toLowerCase();
      if (dindingVal === "sedang" || dindingVal === "buruk" || dindingVal.includes("retak") || dindingVal.includes("bambu") || dindingVal.includes("triplek") || dindingVal.includes("lapuk")) {
        dindingRusak++;
      }

      // 4. Lantai Rusak / Tanah
      const lantaiVal = String(item.lantai || "").toLowerCase();
      if (lantaiVal === "sedang" || lantaiVal === "buruk" || lantaiVal.includes("tanah") || lantaiVal.includes("pecah")) {
        lantaiRusak++;
      }

      // 5. Sanitasi / Jamban Tidak Layak (MCK komunal/umum, tidak ada, dll)
      const sanitasiVal = String(item.sanitasi || "").trim();
      if (["tidak_ada_babs", "numpang_mck", "3", "4", "5", "6"].includes(sanitasiVal) || sanitasiVal.includes("tidak ada") || sanitasiVal.includes("mck") || sanitasiVal.includes("babs")) {
        tanpaJamban++;
      }

      // 6. Air Minum Tidak Terlindung
      const airVal = String(item.sumber_air || "").trim();
      if (["sungai_tidak_terlindung", "sumur_tak_terlindung", "mata_air_tak_terlindung", "air_permukaan", "6", "8", "9", "10", "11"].includes(airVal) || airVal.includes("tak terlindung") || airVal.includes("permukaan")) {
        airTidakLayak++;
      }

      // 7. Pencahayaan Alami Kurang / Gelap
      const cahayaVal = String(item.pencahayaan || "").toLowerCase();
      if (cahayaVal === "sedang" || cahayaVal === "buruk" || cahayaVal.includes("gelap") || cahayaVal.includes("kurang")) {
        pencahayaanKurang++;
      }

      // 8. Penghawaan / Ventilasi Pengap / Kurang
      const ventilasiVal = String(item.penghawaan || "").toLowerCase();
      if (ventilasiVal === "sedang" || ventilasiVal === "buruk" || ventilasiVal.includes("pengap") || ventilasiVal.includes("kurang") || ventilasiVal.includes("tanpa")) {
        penghawaanKurang++;
      }

      // 9. Luas Lantai Kurang Dari Standar (< 7.2 m²/jiwa)
      if (item.luas_per_jiwa && Number(item.luas_per_jiwa) < 7.2) {
        luasKurang++;
      }
    });

    return {
      total,
      pending,
      terverifikasi,
      revisi,
      persenVerifikasi: total ? Math.round((terverifikasi / total) * 100) : 0,
      rwMap,
      dusunMap: rwMap,
      issues: {
        pondasiSloofRusak,
        kolomBalokRusak,
        rangkaAtapRusak,
        strukturRusak,
        atapRusak,
        dindingRusak,
        lantaiRusak,
        tanpaJamban,
        airTidakLayak,
        pencahayaanKurang,
        penghawaanKurang,
        luasKurang,
        dindingBambu: dindingRusak,
        lantaiTanah: lantaiRusak
      }
    };
  },

  exportToCSV(customList = null) {
    let list = customList;
    if (!list) {
      list = this.getSurveys();
      const currentUser = this.getCurrentUser();
      if (this.getCurrentRole() === 'petugas') {
        list = list.filter(item => isSurveyOwnedByPetugas(item, currentUser));
      }
    }
    const headers = [
      "ID Survey", "No Urut BNBA", "Tanggal Survey", "Petugas Lapangan",
      "NIK", "No KK", "Nama Kepala Keluarga", "Jenis Kelamin", "Usia",
      "Lama Huni (Thn)", "RW", "RT", "Jumlah Jiwa",
      "Pekerjaan", "Penghasilan", "Penghasilan Nominal", "Nilai UMK",
      "Status Rumah", "Aset Rumah Lain", "Status Tanah",
      "1. Pondasi", "2. Sloof", "3. Kolom", "4. Ring Balok", "5. Rangka Atap",
      "6. Dinding", "7. Lantai", "8. Penutup Atap", "9. Fasilitas Sanitasi",
      "10. Sumber Air Minum", "11. Pencahayaan", "12. Penghawaan",
      "13. Luas Bangunan (m2)", "Luas Lantai per Jiwa (m2/jiwa)",
      "SPAL", "Sumber Listrik",
      "Latitude", "Longitude", "Akurasi GPS (m)",
      "Status Verifikasi", "Catatan Admin"
    ];

    const rows = list.map(item => [
      `"${item.id || ""}"`,
      `"${item.no_urut_bnba || ""}"`,
      `"${item.tanggal_survey || ""}"`,
      `"${item.petugas_nama || ""}"`,
      `"'${item.nik || ""}"`,
      `"'${item.no_kk || ""}"`,
      `"${item.nama_kk || ""}"`,
      `"${item.jenis_kelamin || ""}"`,
      `"${item.usia || ""}"`,
      `"${item.lama_tinggal ?? ""}"`,
      `"${item.rw || ""}"`,
      `"${item.rt || ""}"`,
      `"${item.jumlah_jiwa || ""}"`,
      `"${item.pekerjaan || ""}"`,
      `"${item.penghasilan || ""}"`,
      `"${item.penghasilan_nominal || ""}"`,
      `"${item.nilai_umk || 3736101}"`,
      `"${item.status_rumah || ""}"`,
      `"${item.aset_rumah_lain || "Tidak"}"`,
      `"${item.status_tanah || ""}"`,
      `"${item.pondasi || ""}"`,
      `"${item.sloof || ""}"`,
      `"${item.kolom || ""}"`,
      `"${item.ring_balok || ""}"`,
      `"${item.rangka_atap || ""}"`,
      `"${item.dinding || ""}"`,
      `"${item.lantai || ""}"`,
      `"${item.atap || ""}"`,
      `"${item.sanitasi || ""}"`,
      `"${item.sumber_air || ""}"`,
      `"${item.pencahayaan || ""}"`,
      `"${item.penghawaan || ""}"`,
      `"${item.luas_bangunan || ""}"`,
      `"${item.luas_per_jiwa || ""}"`,
      `"${item.spal || ""}"`,
      `"${item.sumber_listrik || ""}"`,
      `"${item.latitude || ""}"`,
      `"${item.longitude || ""}"`,
      `"${item.akurasi_gps || "0"}"`,
      `"${item.status_verifikasi || ""}"`,
      `"${item.catatan_admin || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Kelayakan_Rumah_Kelurahan_Purwantoro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 4. Pencadangan (Backup) & Sinkronisasi Database
  async getDatabaseBackupStats() {
    try {
      const res = await fetch(`${API_BASE}/backup_database.php?action=stats`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Gagal mengambil statistik database dari server:", err);
      const surveys = this.getSurveys();
      const users = this.getUsers();
      return {
        success: false,
        is_local_fallback: true,
        counts: {
          surveys: surveys.length,
          users: users.length,
          rt_rws: 158,
          survey_photos: 0
        },
        size_formatted: "~400 KB",
        zip_supported: true
      };
    }
  },

  getBackupZipDownloadUrl() {
    const user = this.getCurrentUser();
    const actorName = encodeURIComponent(user?.nama || "Admin Kelurahan");
    return `${API_BASE}/backup_database.php?action=download_zip&actor_name=${actorName}`;
  },

  async restoreDatabaseBackup(file) {
    const formData = new FormData();
    formData.append("backup_file", file);
    formData.append("action", "restore");

    const res = await fetch(`${API_BASE}/backup_database.php?action=restore`, {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || "Gagal memulihkan basis data.");
    }
    // Sinkronkan ulang data lokal dari MySQL
    await this.syncSurveysFromDB();
    await this.syncUsersFromDB();
    return result;
  },

  // =========================================================
  // ANTRIAN DRAF SURVEI LAPANGAN (OFFLINE SAAT BLANK SPOT)
  // =========================================================
  getAllOfflineDrafts() {
    try {
      const data = localStorage.getItem("sipelita_offline_drafts_v1");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Gagal membaca draft offline:", e);
      return [];
    }
  },

  getOfflineDrafts(targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    const all = this.getAllOfflineDrafts();
    if (!user) return [];
    return all.filter(draft => isDraftOwnedByUser(draft, user));
  },

  saveOfflineDraft(surveyData) {
    const drafts = this.getAllOfflineDrafts();
    const currentUser = this.getCurrentUser();
    const draftId = surveyData.id || `DRAFT-${Date.now()}`;
    const draftItem = {
      ...surveyData,
      id: draftId,
      saved_by_id: currentUser?.id || "",
      saved_by_username: currentUser?.username || "",
      saved_by_nama: currentUser?.nama || "",
      created_by: surveyData.created_by || currentUser?.id || "",
      petugas_id: surveyData.petugas_id || currentUser?.id_petugas || currentUser?.id || "",
      petugas_nama: surveyData.petugas_nama || currentUser?.nama || (currentUser?.role === 'petugas' ? "Petugas Lapangan" : "Pengguna"),
      _is_offline_draft: true,
      _saved_at: new Date().toISOString()
    };
    const existingIdx = drafts.findIndex(d => d.id === draftId || (d.nik && surveyData.nik && d.nik === surveyData.nik));
    if (existingIdx !== -1) {
      drafts[existingIdx] = { ...drafts[existingIdx], ...draftItem };
    } else {
      drafts.unshift(draftItem);
    }
    
    try {
      localStorage.setItem("sipelita_offline_drafts_v1", JSON.stringify(drafts));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.warn("Kapasitas localStorage penuh. Mengoptimalkan draf tersimpan...");
        // Hapus foto dari draf yang lebih lama untuk memberi ruang
        if (drafts.length > 1) {
          for (let i = 1; i < drafts.length; i++) {
            delete drafts[i].foto_depan;
            delete drafts[i].foto_dalam;
            delete drafts[i].foto_atap;
            delete drafts[i].foto_sanitasi;
          }
        }
        try {
          localStorage.setItem("sipelita_offline_drafts_v1", JSON.stringify(drafts));
        } catch (innerErr) {
          console.error("Penyimpanan peramban penuh:", innerErr);
        }
      }
    }
    return draftItem;
  },

  deleteOfflineDraft(draftId) {
    let drafts = this.getAllOfflineDrafts();
    drafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem("sipelita_offline_drafts_v1", JSON.stringify(drafts));
  },

  async syncOfflineDrafts(targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    const draftsToSync = this.getOfflineDrafts(user);
    if (draftsToSync.length === 0) return { successCount: 0, failedCount: 0, errors: [] };

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const draft of draftsToSync) {
      try {
        const payload = { ...draft };
        delete payload._is_offline_draft;
        delete payload._saved_at;
        delete payload.saved_by_id;
        delete payload.saved_by_username;
        delete payload.saved_by_nama;
        delete payload.author_id;
        delete payload.author_username;
        if (payload.id && String(payload.id).startsWith("DRAFT-")) {
          delete payload.id;
        }

        const res = await fetch(`${API_BASE}/save_survey.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (resData.success) {
          this.deleteOfflineDraft(draft.id);
          successCount++;
        } else {
          failedCount++;
          errors.push(`${draft.nama_kk || draft.id}: ${resData.message}`);
        }
      } catch (err) {
        failedCount++;
        errors.push(`${draft.nama_kk || draft.id}: Koneksi terputus (${err.message})`);
      }
    }

    if (successCount > 0) {
      await this.syncSurveysFromDB();
    }

    return { successCount, failedCount, errors };
  },

  // =========================================================
  // EKSPOR FORMAT STANDAR E-RTLH KEMENTERIAN PUPR & BPS
  // =========================================================
  exportToPUPRFormat(customList = null) {
    let list = customList;
    if (!list) {
      list = this.getSurveys();
      const currentUser = this.getCurrentUser();
      if (this.getCurrentRole() === 'petugas') {
        list = list.filter(item => isSurveyOwnedByPetugas(item, currentUser));
      }
    }

    const headers = [
      "NO",
      "KODE_PROVINSI",
      "PROVINSI",
      "KODE_KAB_KOTA",
      "KABUPATEN_KOTA",
      "KECAMATAN",
      "KELURAHAN_DESA",
      "RW",
      "RT",
      "ALAMAT_LENGKAP",
      "NOMOR_URUT_BNBA",
      "ID_SURVEI",
      "NIK_KEPALA_KELUARGA",
      "NOMOR_KARTU_KELUARGA",
      "NAMA_KEPALA_KELUARGA",
      "JENIS_KELAMIN",
      "USIA_TAHUN",
      "JUMLAH_ANGGOTA_JIWA",
      "ANGGOTA_RENTAN_BALITA_LANSIA",
      "PEKERJAAN_UTAMA",
      "PENGHASILAN_BULANAN",
      "STATUS_KEPEMILIKAN_RUMAH",
      "STATUS_KEPEMILIKAN_TANAH",
      "ASET_RUMAH_LAIN",
      "LUAS_BANGUNAN_M2",
      "LUAS_LANTAI_PER_JIWA_M2",
      "STANDAR_KECUKUPAN_RUANG",
      "KONDISI_PONDASI_SLOOF",
      "KONDISI_KOLOM_RING_BALOK",
      "KONDISI_RANGKA_ATAP",
      "KONDISI_PENUTUP_ATAP",
      "KONDISI_DINDING_TERLUAS",
      "KONDISI_LANTAI_TERLUAS",
      "FASILITAS_JAMBAN_SANITASI",
      "SUMBER_AIR_MINUM",
      "PENCAHAYAAN_ALAMI",
      "PENGHAWAAN_VENTILASI",
      "SUMBER_LISTRIK",
      "KOORDINAT_LATITUDE",
      "KOORDINAT_LONGITUDE",
      "AKURASI_GPS_METER",
      "STATUS_VERIFIKASI_KELURAHAN",
      "PETUGAS_SURVEYOR",
      "TANGGAL_SURVEI"
    ];

    const rows = list.map((item, idx) => {
      const luasM2 = Number(item.luas_bangunan) || 0;
      const jiwa = Number(item.jumlah_jiwa) || 1;
      const luasPerJiwa = (luasM2 / jiwa).toFixed(1);
      const isAdequate = Number(luasPerJiwa) >= 7.2 ? "MEMENUHI" : "TIDAK MEMENUHI (< 7.2 m2)";

      return [
        idx + 1,
        "35",
        "JAWA TIMUR",
        "3573",
        "KOTA MALANG",
        "BLIMBING",
        "PURWANTORO",
        `"'${String(item.rw || '').padStart(2, '0')}"`,
        `"'${String(item.rt || '').padStart(2, '0')}"`,
        `"${(item.alamat_lengkap || item.dusun || '-').replace(/"/g, '""')}"`,
        `"${item.no_urut_bnba || '-'}"`,
        `"${item.id || '-'}"`,
        `"'${item.nik || ''}"`,
        `"'${item.no_kk || ''}"`,
        `"${(item.nama_kk || '').replace(/"/g, '""')}"`,
        `"${item.jenis_kelamin || '-'}"`,
        item.usia || 0,
        jiwa,
        item.jumlah_lansia_balita || 0,
        `"${(item.pekerjaan || '-').replace(/"/g, '""')}"`,
        `"${(item.penghasilan || '-').replace(/"/g, '""')}"`,
        `"${item.status_rumah || '-'}"`,
        `"${item.status_tanah || '-'}"`,
        `"${item.aset_rumah_lain || 'Tidak'}"`,
        luasM2,
        luasPerJiwa,
        `"${isAdequate}"`,
        `"${item.pondasi || item.sloof || '-'}"`,
        `"${item.kolom || item.ring_balok || '-'}"`,
        `"${item.rangka_atap || '-'}"`,
        `"${item.atap || '-'}"`,
        `"${item.dinding || '-'}"`,
        `"${item.lantai || '-'}"`,
        `"${item.sanitasi || '-'}"`,
        `"${item.sumber_air || '-'}"`,
        `"${item.pencahayaan || '-'}"`,
        `"${item.penghawaan || '-'}"`,
        `"${item.sumber_listrik || 'PLN'}"`,
        item.latitude || '',
        item.longitude || '',
        item.akurasi_gps || '0',
        `"${item.status_verifikasi || 'MENUNGGU_VALIDASI'}"`,
        `"${item.petugas_nama || '-'}"`,
        `"${item.tanggal_survey || (item.created_at ? item.created_at.slice(0, 10) : '-')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `REKAP_E_RTLH_PUPR_PURWANTORO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};