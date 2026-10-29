import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { icons } from "../utils/icons.js";
import { storage, compressBase64Image } from "../utils/storage.js";
import { calculateHousingEligibility } from "../utils/calculator.js";
import { initRtRwDropdowns } from "../utils/rtrw.js";
import { renderStep1, renderStep2, renderStep3, renderStep4, renderStep5 } from "./surveyFormSteps.js";

let miniMapInstance = null;
let miniMapMarker = null;

export function renderSurveyForm(initialData = null) {
  const currentUser = storage.getCurrentUser();
  const isAdmin = storage.getCurrentRole() === 'admin';
  const isEdit = !!initialData;
  const bnbaValue = initialData?.no_urut_bnba || storage.getNextBnbaNumber();
  const hasDraft = !isEdit && !!localStorage.getItem("sipelita_survey_draft");

  return `
    <div class="wizard-container">
      <div class="wizard-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 class="wizard-title">${isEdit ? 'Ubah Data Survey Rumah' : 'Formulir Survey Kelayakan Rumah Warga'}</h2>
            <p class="wizard-desc">Kelurahan Purwantoro, Kec. Blimbing, Kota Malang</p>
          </div>
          <span class="badge ${currentUser.role === 'petugas' ? 'badge-warning' : 'badge-info'}">${currentUser.nama}</span>
        </div>
      </div>

      ${hasDraft ? `
        <div id="draft-alert-banner" style="background:#eff6ff; border:1px solid #bfdbfe; border-left:4px solid #0284c7; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:#1e40af;">
            <span style="font-size:1.1rem;">📝</span>
            <span>Ditemukan <strong>Draf Isian Survei Sebelumnya</strong> di peramban ini. Ingin memulihkan data?</span>
          </div>
          <div style="display:flex; gap:0.4rem;">
            <button type="button" class="btn btn-sm btn-primary" id="btn-restore-draft" style="font-size:0.75rem; padding:4px 12px; background:#0284c7; border-color:#0284c7; font-weight:700;">Pulihkan Draf</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-discard-draft" style="font-size:0.75rem; padding:4px 10px;">Abaikan</button>
          </div>
        </div>
      ` : ''}

      <!-- Stepper Header -->
      <div class="stepper-nav" id="survey-stepper">
        <div class="step-item active" data-step="1"><div class="step-number">1</div><div class="step-label">Demografi</div></div>
        <div class="step-item" data-step="2"><div class="step-number">2</div><div class="step-label">Fisik</div></div>
        <div class="step-item" data-step="3"><div class="step-number">3</div><div class="step-label">Foto</div></div>
        <div class="step-item" data-step="4"><div class="step-number">4</div><div class="step-label">GPS</div></div>
        <div class="step-item" data-step="5"><div class="step-number">5</div><div class="step-label">Konfirmasi</div></div>
      </div>

      <form id="housing-survey-form">
        <input type="hidden" name="id" value="${initialData?.id || ''}">
        <input type="hidden" name="status_verifikasi" value="${initialData?.status_verifikasi || 'MENUNGGU_VALIDASI'}">
        <input type="hidden" name="created_by" value="${initialData?.created_by || currentUser.id || ''}">
        <input type="hidden" name="petugas_nama" value="${initialData?.petugas_nama || currentUser.nama}">
        <input type="hidden" name="petugas_id" value="${initialData?.petugas_id || currentUser.id_petugas || 'ADM-01'}">
        <input type="hidden" name="tanggal_survey" value="${initialData?.tanggal_survey || new Date().toISOString().slice(0, 10)}">

        <div class="wizard-body">
          ${renderStep1(initialData, isAdmin, currentUser, bnbaValue)}
          ${renderStep2(initialData)}
          ${renderStep3(initialData)}
          ${renderStep4(initialData)}
          ${renderStep5(initialData)}
        </div>

        <div class="wizard-footer" style="display:flex; gap:10px; margin-top:20px; align-items:center; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" id="btn-prev-step" style="display:none;">${icons.chevronLeft('w-4 h-4')} Kembali</button>
          <button type="button" class="btn btn-secondary" id="btn-save-offline-draft" style="font-size:0.8rem; padding:0.45rem 0.85rem;" title="Simpan sebagai draf offline di perangkat jika koneksi internet terputus">
             Simpan Draf Offline
          </button>
          <div style="flex:1;"></div>
          <button type="button" class="btn btn-primary" id="btn-next-step">Lanjut ${icons.chevronRight('w-4 h-4')}</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-survey" style="display:none; background:#047857; border-color:#047857;">${icons.check('w-4 h-4')} ${isEdit ? 'Simpan Perubahan' : 'Kirim Berkas'}</button>
        </div>
      </form>
    </div>
  `;
}

export function initSurveyFormEvents(container, { onSaveSuccess, onCancel }) {
  const form = container.querySelector("#housing-survey-form");
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 5;
  const prevBtn = container.querySelector("#btn-prev-step");
  const nextBtn = container.querySelector("#btn-next-step");
  const submitBtn = container.querySelector("#btn-submit-survey");

  // Inisialisasi Dropdown RT/RW
  const currentRw = form.querySelector('[name="rw"]')?.dataset?.initial || '';
  const currentRt = form.querySelector('[name="rt"]')?.dataset?.initial || '';
  initRtRwDropdowns(container, currentRw, currentRt);

  // Stepper Controller
  function goToStep(step) {
    currentStep = step;
    for (let i = 1; i <= totalSteps; i++) {
      const pane = container.querySelector(`#pane-step-${i}`);
      if (pane) pane.style.display = i === currentStep ? "block" : "none";
      const nav = container.querySelector(`.step-item[data-step="${i}"]`);
      if (nav) nav.classList.toggle("active", i === currentStep);
    }
    prevBtn.style.display = currentStep > 1 ? "inline-flex" : "none";
    nextBtn.style.display = currentStep < totalSteps ? "inline-flex" : "none";
    submitBtn.style.display = currentStep === totalSteps ? "inline-flex" : "none";

    if (currentStep === 4) setTimeout(initMiniMap, 150);
    if (currentStep === 5) updateLiveCalculation();
  }

  // Validasi Bertahap (Step-by-Step Validation)
  function validateCurrentStep(step) {
    const pane = container.querySelector(`#pane-step-${step}`);
    if (!pane) return true;

    // 1. Cek semua input & select required di langkah aktif
    const requiredInputs = pane.querySelectorAll("input[required], select[required], textarea[required]");
    for (const el of requiredInputs) {
      if (!el.value || el.value.trim() === "") {
        el.focus();
        const group = el.closest(".form-group");
        const label = group?.querySelector(".form-label")?.textContent?.replace("*", "").trim() || el.name;
        alert(`Bidang wajib belum diisi:\n"${label}"\n\nHarap lengkapi isian ini sebelum melanjutkan.`);
        return false;
      }
    }

    // 2. Validasi Khusus Langkah 1 (Identitas & Domisili)
    if (step === 1) {
      const nikEl = pane.querySelector('[name="nik"]');
      if (nikEl) {
        const nikVal = nikEl.value.trim();
        if (!/^\d{16}$/.test(nikVal)) {
          nikEl.focus();
          alert("Validasi Gagal:\nNomor Induk Kependudukan (NIK) harus terdiri dari tepat 16 digit angka resmi.");
          return false;
        }
      }

      const kkEl = pane.querySelector('[name="no_kk"]');
      if (kkEl) {
        const kkVal = kkEl.value.trim();
        if (!/^\d{16}$/.test(kkVal)) {
          kkEl.focus();
          alert("Validasi Gagal:\nNomor Kartu Keluarga (No. KK) harus terdiri dari tepat 16 digit angka.");
          return false;
        }
      }

      const rwSelect = pane.querySelector('[name="rw"]');
      const rtSelect = pane.querySelector('[name="rt"]');
      if (rwSelect && (!rwSelect.value || rwSelect.value === "")) {
        rwSelect.focus();
        alert("Validasi Gagal:\nSilakan pilih nomor RW penugasan survei.");
        return false;
      }
      if (rtSelect && (!rtSelect.value || rtSelect.value === "")) {
        rtSelect.focus();
        alert("Validasi Gagal:\nSilakan pilih nomor RT domisili rumah warga.");
        return false;
      }
    }

    // 3. Validasi Khusus Langkah 4 (Titik Koordinat Lokasi)
    if (step === 4) {
      const latInput = form.querySelector('[name="latitude"]');
      const lngInput = form.querySelector('[name="longitude"]');
      const latVal = parseFloat(latInput?.value);
      const lngVal = parseFloat(lngInput?.value);
      if (isNaN(latVal) || isNaN(lngVal) || latVal === 0 || lngVal === 0) {
        alert("Validasi Lokasi:\nTitik koordinat GPS rumah belum ditentukan. Silakan klik tombol 'Ambil Koordinat GPS Saat Ini' atau klik langsung pada peta.");
        return false;
      }
    }

    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (validateCurrentStep(currentStep)) {
      if (currentStep < totalSteps) goToStep(currentStep + 1);
    }
  });
  prevBtn.addEventListener("click", () => currentStep > 1 && goToStep(currentStep - 1));

  // Klik navigasi stepper di atas
  container.querySelectorAll(".step-item").forEach(item => {
    item.addEventListener("click", () => {
      const targetStep = Number(item.dataset.step);
      if (targetStep > currentStep) {
        if (!validateCurrentStep(currentStep)) return;
      }
      goToStep(targetStep);
    });
  });

  // Tombol Simpan Draf Offline Manual
  const btnSaveOfflineDraft = container.querySelector("#btn-save-offline-draft");
  if (btnSaveOfflineDraft) {
    btnSaveOfflineDraft.addEventListener("click", async () => {
      btnSaveOfflineDraft.disabled = true;
      const originalText = btnSaveOfflineDraft.innerHTML;
      btnSaveOfflineDraft.innerHTML = "⏳ Mengompresi & Menyimpan...";
      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Poin 4: Optimalkan ukuran foto agar hemat kuota penyimpanan browser (localStorage)
        for (const slot of ['foto_depan', 'foto_dalam', 'foto_atap', 'foto_sanitasi']) {
          if (data[slot] && typeof data[slot] === 'string' && data[slot].length > 40000) {
            data[slot] = await compressBase64Image(data[slot], 640, 0.6);
          }
        }
        const draft = storage.saveOfflineDraft(data);
        alert(`Draf survei berhasil dioptimalkan dan disimpan di penyimpanan perangkat:\n"${draft.nama_kk || 'Draf Tanpa Nama'}"\n\nUkuran berkas telah dihemat sehingga aman disimpan di peramban ini dan siap disinkronkan saat ada jaringan internet.`);
      } catch (err) {
        alert("Gagal menyimpan draf offline: " + err.message);
      } finally {
        btnSaveOfflineDraft.disabled = false;
        btnSaveOfflineDraft.innerHTML = originalText;
      }
    });
  }

  // Perhitungan Nilai Live
  function updateLiveCalculation() {
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());
    dataObj.luas_bangunan = Number(dataObj.luas_bangunan) || 0;
    dataObj.jumlah_jiwa = Number(dataObj.jumlah_jiwa) || 1;
    const luasPerJiwa = (dataObj.luas_bangunan / dataObj.jumlah_jiwa).toFixed(1);
    const luasPerJiwaText = container.querySelector("#text-luas-per-jiwa");
    if (luasPerJiwaText) {
      const isAdequate = Number(luasPerJiwa) >= 7.2;
      luasPerJiwaText.textContent = `${luasPerJiwa} m² / jiwa (${isAdequate
        ? "Memenuhi Standar PUPR >= 7.2 m²"
        : "Kurang dari Standar Minimal PUPR"
        })`;
      luasPerJiwaText.style.color = isAdequate ? "var(--dark-800)" : "var(--danger)";
    }
    const step5Luas = container.querySelector("#step5-luas-info");
    if (step5Luas) {
      const isAdequate = Number(luasPerJiwa) >= 7.2;
      step5Luas.innerHTML = `<span style="color:${isAdequate ? '#059669' : '#dc2626'}; font-weight:700;">${luasPerJiwa} m²/jiwa (${isAdequate ? 'Memenuhi Standar PUPR' : 'Di Bawah Standar PUPR'})</span>`;
    }

    const step5Foto = container.querySelector("#step5-foto-info");
    if (step5Foto) {
      const slots = ['depan', 'dalam', 'dapur', 'toilet'];
      const filled = slots.filter(s => !!container.querySelector(`#input-foto-${s}`)?.value).length;
      step5Foto.innerHTML = `<span style="color:${filled === 4 ? '#059669' : '#d97706'}; font-weight:700;">${filled} / 4 Foto Terisi</span>`;
    }
  }
  const inputLuas = container.querySelector("#input-luas-bangunan");
  const inputJiwa = container.querySelector("#input-jumlah-jiwa");

  if (inputLuas) {
    inputLuas.addEventListener("input", updateLiveCalculation);
  }
  if (inputJiwa) {
    inputJiwa.addEventListener("input", updateLiveCalculation);
  }
  form.querySelectorAll("select, input").forEach((el) => {
    el.addEventListener("change", updateLiveCalculation);
  });
  updateLiveCalculation();

  // Helper: Terapkan foto ke slot form
  function applyPhotoToSlot(targetSlot, dataUrl) {
    const previewImg = container.querySelector(`#img-preview-${targetSlot}`);
    const placeholder = container.querySelector(`#placeholder-slot-${targetSlot}`);
    const inputHidden = container.querySelector(`#input-foto-${targetSlot}`);
    const slotCard = container.querySelector(`#card-slot-${targetSlot}`);
    const removeBtn = slotCard?.querySelector(".btn-remove-photo");

    if (previewImg) {
      previewImg.src = dataUrl;
      previewImg.style.display = "block";
    }
    if (placeholder) placeholder.style.display = "none";
    if (inputHidden) inputHidden.value = dataUrl;
    if (slotCard) slotCard.classList.add("has-photo");
    if (removeBtn) removeBtn.style.display = "inline-flex";
  }

  function compressAndApplyFile(targetSlot, file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target.result;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        applyPhotoToSlot(targetSlot, compressedDataUrl);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  }

  // 1. Handle Upload File Foto (Step 3)
  const filePickers = container.querySelectorAll(".file-picker-input");
  filePickers.forEach((picker) => {
    picker.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) compressAndApplyFile(picker.dataset.target, file);
    });
  });

  // 2. Handle Native Camera File Input (Mobile Fallback)
  const nativeCamInputs = container.querySelectorAll(".file-camera-native");
  nativeCamInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) compressAndApplyFile(input.dataset.target, file);
    });
  });

  // 3. Handle Live WebRTC Camera Capture
  let activeMediaStream = null;
  let activeFacingMode = "environment"; // default ke kamera belakang pada smartphone
  let currentCameraTargetSlot = null;

  function stopActiveCamera() {
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach((track) => track.stop());
      activeMediaStream = null;
    }
    const modal = document.querySelector("#camera-capture-modal");
    if (modal) modal.remove();
  }

  async function openLiveCamera(targetSlot, title) {
    currentCameraTargetSlot = targetSlot;

    // Jika browser tidak mendukung getUserMedia, langsung picu native camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const fallback = container.querySelector(`.file-camera-native[data-target="${targetSlot}"]`);
      if (fallback) fallback.click();
      return;
    }

    stopActiveCamera();
    const modal = document.createElement("div");
    modal.id = "camera-capture-modal";
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1rem;";

    modal.innerHTML = `
      <div style="background:#0f172a; border:1px solid #334155; border-radius:16px; width:100%; max-width:520px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.7); display:flex; flex-direction:column;">
        <div style="padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; color:#fff;">
          <div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; font-size:0.95rem;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#ef4444; box-shadow:0 0 10px #ef4444;"></span>
            <span>Kamera: ${title || 'Dokumentasi Lapangan'}</span>
          </div>
          <button type="button" id="btn-close-cam-modal" style="background:transparent; border:none; color:#94a3b8; font-size:1.75rem; cursor:pointer; line-height:1;">&times;</button>
        </div>

        <div style="position:relative; width:100%; height:340px; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          <video id="cam-video" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover;"></video>
          <canvas id="cam-canvas" style="display:none; width:100%; height:100%; object-fit:cover;"></canvas>

          <!-- Framing Grid Overlay -->
          <div style="position:absolute; inset:0; pointer-events:none; border:1px solid rgba(255,255,255,0.1); display:grid; grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr;">
            <div style="border-right:1px dashed rgba(255,255,255,0.25); border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-right:1px dashed rgba(255,255,255,0.25); border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-right:1px dashed rgba(255,255,255,0.25); border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-right:1px dashed rgba(255,255,255,0.25); border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-bottom:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-right:1px dashed rgba(255,255,255,0.25);"></div>
            <div style="border-right:1px dashed rgba(255,255,255,0.25);"></div>
            <div></div>
          </div>

          <div id="cam-flash" style="position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; transition:opacity 0.15s;"></div>
        </div>

        <div style="padding:1.25rem; background:#0b1120; border-top:1px solid #1e293b; display:flex; flex-direction:column; gap:0.75rem;">
          <!-- Controls 1: Live Stream -->
          <div id="cam-live-bar" style="display:flex; justify-content:space-around; align-items:center;">
            <button type="button" id="btn-toggle-facing" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; border-radius:50%; width:44px; height:44px; font-size:1.1rem; cursor:pointer;" title="Ganti Kamera Depan/Belakang">
              🔄
            </button>
            <button type="button" id="btn-snap" style="background:#fff; border:4px solid #38bdf8; border-radius:50%; width:64px; height:64px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 0 20px rgba(56,189,248,0.4);" title="Jepret Foto">
              <span style="display:block; width:46px; height:46px; border-radius:50%; background:#ef4444;"></span>
            </button>
            <button type="button" id="btn-trigger-native-cam" style="background:#1e293b; border:1px solid #334155; color:#94a3b8; border-radius:50%; width:44px; height:44px; font-size:1.1rem; cursor:pointer;" title="Buka Kamera HP Bawaan">
              📷
            </button>
          </div>

          <!-- Controls 2: Snapshot Preview -->
          <div id="cam-preview-bar" style="display:none; justify-content:space-between; gap:1rem;">
            <button type="button" id="btn-retake" class="btn btn-secondary" style="flex:1; background:#1e293b; color:#fff; border-color:#334155;">
              ↺ Ambil Ulang
            </button>
            <button type="button" id="btn-use-photo" class="btn btn-primary" style="flex:1; background:#10b981; border-color:#059669;">
              ✓ Gunakan Foto Ini
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const videoEl = modal.querySelector("#cam-video");
    const canvasEl = modal.querySelector("#cam-canvas");
    const liveBar = modal.querySelector("#cam-live-bar");
    const previewBar = modal.querySelector("#cam-preview-bar");
    const flashEl = modal.querySelector("#cam-flash");
    let capturedDataUrl = null;

    async function startStream() {
      try {
        if (activeMediaStream) {
          activeMediaStream.getTracks().forEach((t) => t.stop());
        }
        activeMediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: activeFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        videoEl.srcObject = activeMediaStream;
        await videoEl.play();
        videoEl.style.display = "block";
        canvasEl.style.display = "none";
        liveBar.style.display = "flex";
        previewBar.style.display = "none";
      } catch (err) {
        console.warn("Kamera WebRTC tidak dapat diakses langsung, memicu kamera bawaan:", err);
        stopActiveCamera();
        const fallback = container.querySelector(`.file-camera-native[data-target="${targetSlot}"]`);
        if (fallback) fallback.click();
      }
    }

    modal.querySelector("#btn-close-cam-modal").addEventListener("click", stopActiveCamera);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) stopActiveCamera();
    });

    modal.querySelector("#btn-toggle-facing").addEventListener("click", () => {
      activeFacingMode = activeFacingMode === "environment" ? "user" : "environment";
      startStream();
    });

    modal.querySelector("#btn-trigger-native-cam").addEventListener("click", () => {
      stopActiveCamera();
      const fallback = container.querySelector(`.file-camera-native[data-target="${targetSlot}"]`);
      if (fallback) fallback.click();
    });

    modal.querySelector("#btn-snap").addEventListener("click", () => {
      if (!videoEl.videoWidth || !videoEl.videoHeight) return;

      flashEl.style.opacity = "0.85";
      setTimeout(() => { flashEl.style.opacity = "0"; }, 150);

      const maxDim = 1200;
      let width = videoEl.videoWidth;
      let height = videoEl.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvasEl.width = width;
      canvasEl.height = height;
      const ctx = canvasEl.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, width, height);

      capturedDataUrl = canvasEl.toDataURL("image/jpeg", 0.85);

      videoEl.style.display = "none";
      canvasEl.style.display = "block";
      liveBar.style.display = "none";
      previewBar.style.display = "flex";
    });

    modal.querySelector("#btn-retake").addEventListener("click", () => {
      videoEl.style.display = "block";
      canvasEl.style.display = "none";
      liveBar.style.display = "flex";
      previewBar.style.display = "none";
      capturedDataUrl = null;
    });

    modal.querySelector("#btn-use-photo").addEventListener("click", () => {
      if (capturedDataUrl && currentCameraTargetSlot) {
        applyPhotoToSlot(currentCameraTargetSlot, capturedDataUrl);
      }
      stopActiveCamera();
    });

    startStream();
  }

  // Bind Tombol Ambil Kamera di setiap slot foto
  const cameraButtons = container.querySelectorAll(".btn-open-camera");
  cameraButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openLiveCamera(btn.dataset.target, btn.dataset.title);
    });
  });

  // 4. Handle Hapus Foto (Step 3)
  const removeButtons = container.querySelectorAll(".btn-remove-photo");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSlot = btn.dataset.target;
      const previewImg = container.querySelector(`#img-preview-${targetSlot}`);
      const placeholder = container.querySelector(`#placeholder-slot-${targetSlot}`);
      const inputHidden = container.querySelector(`#input-foto-${targetSlot}`);
      const slotCard = container.querySelector(`#card-slot-${targetSlot}`);
      const picker = slotCard?.querySelector(".file-picker-input");
      const nativePicker = slotCard?.querySelector(".file-camera-native");

      if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      if (placeholder) placeholder.style.display = "flex";
      if (inputHidden) inputHidden.value = "";
      if (slotCard) slotCard.classList.remove("has-photo");
      if (picker) picker.value = "";
      if (nativePicker) nativePicker.value = "";
      btn.style.display = "none";
    });
  });

  // Mini Map Leaflet
  // 1. Inisialisasi Peta Leaflet untuk Step 4
  function initMiniMap() {
    const mapDiv = container.querySelector("#survey-mini-map");
    if (!mapDiv) return;

    const latInput = container.querySelector("#input-latitude");
    const lngInput = container.querySelector("#input-longitude");
    const initLat = parseFloat(latInput?.value) || -7.9546;
    const initLng = parseFloat(lngInput?.value) || 112.6436;

    // Bersihkan instance peta sebelumnya jika sudah ada
    if (miniMapInstance) {
      miniMapInstance.remove();
      miniMapInstance = null;
    }

    miniMapInstance = L.map("survey-mini-map", {
      center: [initLat, initLng],
      zoom: 17
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(miniMapInstance);

    const pinIcon = L.divIcon({
      className: "mini-pin",
      html: `<div style="background:#ef4444; width:22px; height:22px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 22]
    });

    miniMapMarker = L.marker([initLat, initLng], {
      draggable: true,
      icon: pinIcon
    }).addTo(miniMapInstance);

    function checkCoordinatesBoundary(lat, lng) {
      const warningBox = container.querySelector("#gps-boundary-warning");
      if (!warningBox) return;
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (isNaN(numLat) || isNaN(numLng)) return;
      const isInside = numLat >= -8.05 && numLat <= -7.90 && numLng >= 112.58 && numLng <= 112.70;
      warningBox.style.display = isInside ? "none" : "flex";
    }

    const resetPurwantoroBtn = container.querySelector("#btn-reset-purwantoro-coords");
    if (resetPurwantoroBtn) {
      resetPurwantoroBtn.addEventListener("click", () => {
        if (latInput) latInput.value = "-7.954600";
        if (lngInput) lngInput.value = "112.643600";
        const accInput = container.querySelector("#input-akurasi-gps");
        if (accInput) accInput.value = "0";
        if (miniMapMarker) miniMapMarker.setLatLng([-7.9546, 112.6436]);
        if (miniMapInstance) miniMapInstance.setView([-7.9546, 112.6436], 17);
        checkCoordinatesBoundary(-7.9546, 112.6436);
      });
    }

    // Update input koordinat saat pin digeser (dragend)
    miniMapMarker.on("dragend", (evt) => {
      const pos = evt.target.getLatLng();
      if (latInput) latInput.value = pos.lat.toFixed(6);
      if (lngInput) lngInput.value = pos.lng.toFixed(6);
      const accInput = container.querySelector("#input-akurasi-gps");
      if (accInput && (!accInput.value || accInput.value === "Pin disesuaikan di peta")) {
        accInput.value = "0";
      }
      checkCoordinatesBoundary(pos.lat, pos.lng);
    });

    // Update pin saat area peta diklik
    miniMapInstance.on("click", (evt) => {
      const pos = evt.latlng;
      miniMapMarker.setLatLng(pos);
      if (latInput) latInput.value = pos.lat.toFixed(6);
      if (lngInput) lngInput.value = pos.lng.toFixed(6);
      const accInput = container.querySelector("#input-akurasi-gps");
      if (accInput && (!accInput.value || accInput.value === "Pin disesuaikan di peta")) {
        accInput.value = "0";
      }
      checkCoordinatesBoundary(pos.lat, pos.lng);
    });

    checkCoordinatesBoundary(initLat, initLng);

    // Wajib: Menyesuaikan ulang ukuran wadah peta
    setTimeout(() => {
      if (miniMapInstance) miniMapInstance.invalidateSize();
    }, 200);
  }

  // 2. Tombol Ambil Titik Koordinat GPS Browser
  const gpsBtn = container.querySelector("#btn-detect-gps");
  const gpsStatus = container.querySelector("#gps-status-text");

  if (gpsBtn) {
    gpsBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (gpsStatus) gpsStatus.innerHTML = `<span style="color:var(--danger)">Browser Anda tidak mendukung geolokasi GPS.</span>`;
        return;
      }

      if (gpsStatus) gpsStatus.innerHTML = `<span>⏳ Mengambil sinyal satelit GPS...</span>`;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = Math.round(position.coords.accuracy);

          const latInput = container.querySelector("#input-latitude");
          const lngInput = container.querySelector("#input-longitude");
          const accInput = container.querySelector("#input-akurasi-gps");

          if (latInput) latInput.value = lat.toFixed(6);
          if (lngInput) lngInput.value = lng.toFixed(6);
          if (accInput) accInput.value = acc !== undefined && acc !== null ? String(acc) : "0";

          if (gpsStatus) {
            if (acc <= 10) {
              gpsStatus.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Titik GPS Sangat Akurat (Akurasi: ±${acc}m)</span>`;
            } else if (acc <= 25) {
              gpsStatus.innerHTML = `<span style="color:#d97706; font-weight:700;">✓ Titik GPS Cukup Baik (Akurasi: ±${acc}m)</span>`;
            } else {
              gpsStatus.innerHTML = `<span style="color:#dc2626; font-weight:700;">⚠️ Titik GPS Kurang Presisi (Akurasi: ±${acc}m) — Disarankan berada di luar ruangan terbuka agar sinyal satelit optimal.</span>`;
            }
          }

          if (miniMapInstance && miniMapMarker) {
            miniMapMarker.setLatLng([lat, lng]);
            miniMapInstance.setView([lat, lng], 18);
          }

          const warningBox = container.querySelector("#gps-boundary-warning");
          if (warningBox) {
            const isInside = lat >= -8.05 && lat <= -7.90 && lng >= 112.58 && lng <= 112.70;
            warningBox.style.display = isInside ? "none" : "flex";
          }
        },
        (error) => {
          if (gpsStatus) {
            gpsStatus.innerHTML = `<span style="color:var(--warning)">Izin GPS ditolak atau sinyal lemah. Silakan geser pin merah di atas peta secara manual.</span>`;
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // 3. Pastikan Inisialisasi Peta Dipanggil saat Membuka Step 4
  function goToStep(step) {
    currentStep = step;
    for (let i = 1; i <= totalSteps; i++) {
      const pane = container.querySelector(`#pane-step-${i}`);
      if (pane) pane.style.display = i === currentStep ? "block" : "none";
      const nav = container.querySelector(`.step-item[data-step="${i}"]`);
      if (nav) nav.classList.toggle("active", i === currentStep);
    }

    prevBtn.style.display = currentStep > 1 ? "inline-flex" : "none";
    nextBtn.style.display = currentStep < totalSteps ? "inline-flex" : "none";
    submitBtn.style.display = currentStep === totalSteps ? "inline-flex" : "none";

    // PENTING: Panggil initMiniMap saat berada di Step 4 setelah tampilan dirender
    if (currentStep === 4) {
      setTimeout(initMiniMap, 150);
    }

    if (currentStep === 5) {
      updateLiveCalculation();
    }
  }

  // 4. Mekanisme Simpan & Pulihkan Draf Otomatis
  const isFormEdit = !!form.querySelector('[name="id"]')?.value;
  let draftTimer = null;
  function triggerSaveDraft() {
    if (isFormEdit) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try {
        const formData = new FormData(form);
        const draftObj = Object.fromEntries(formData.entries());
        ['depan', 'dalam', 'atap', 'sanitasi'].forEach(slot => {
          const inp = form.querySelector(`#input-foto-${slot}`);
          if (inp && inp.value) draftObj[`foto_${slot}`] = inp.value;
        });
        localStorage.setItem("sipelita_survey_draft", JSON.stringify(draftObj));
      } catch (err) {
        console.warn("Gagal simpan draf:", err);
      }
    }, 700);
  }

  form.addEventListener("input", triggerSaveDraft);
  form.addEventListener("change", triggerSaveDraft);

  const restoreDraftBtn = container.querySelector("#btn-restore-draft");
  const discardDraftBtn = container.querySelector("#btn-discard-draft");
  const draftBanner = container.querySelector("#draft-alert-banner");

  if (restoreDraftBtn) {
    restoreDraftBtn.addEventListener("click", () => {
      try {
        const raw = localStorage.getItem("sipelita_survey_draft");
        if (raw) {
          const draft = JSON.parse(raw);
          Object.keys(draft).forEach(key => {
            const inputEl = form.querySelector(`[name="${key}"]`);
            if (inputEl) {
              inputEl.value = draft[key];
            }
          });
          ['depan', 'dalam', 'atap', 'sanitasi'].forEach(slot => {
            const pVal = draft[`foto_${slot}`];
            if (pVal && pVal.length > 50) {
              applyPhotoToSlot(slot, pVal, "");
            }
          });
          updateLiveCalculation();
          if (draftBanner) draftBanner.remove();
        }
      } catch (e) {
        console.error("Gagal memulihkan draf:", e);
      }
    });
  }

  if (discardDraftBtn) {
    discardDraftBtn.addEventListener("click", () => {
      localStorage.removeItem("sipelita_survey_draft");
      if (draftBanner) draftBanner.remove();
    });
  }

  // Form Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form).entries());

      // Pastikan rw dan rt tidak hilang jika select dalam keadaan disabled/styled
      const rwSelect = form.querySelector('[name="rw"]');
      const rtSelect = form.querySelector('[name="rt"]');
      if (rwSelect && (!data.rw || data.rw === "")) data.rw = rwSelect.value;
      if (rtSelect && (!data.rt || data.rt === "")) data.rt = rtSelect.value;

      // Fallback ke penugasan petugas jika masih kosong
      const currentUser = storage.getCurrentUser();
      if (currentUser?.role === 'petugas') {
        if (!data.rw && currentUser.rw) data.rw = String(currentUser.rw).padStart(2, '0');
        if (!data.rt && currentUser.rt) data.rt = String(currentUser.rt).padStart(2, '0');
        if (!data.created_by) data.created_by = currentUser.id;
        if (!data.petugas_nama) data.petugas_nama = currentUser.nama;
      }

      // Pastikan akurasi_gps terisi default 0 jika kosong
      if (data.akurasi_gps === undefined || data.akurasi_gps === null || String(data.akurasi_gps).trim() === "") {
        data.akurasi_gps = "0";
      }

      const saved = await storage.saveSurvey(data);
      localStorage.removeItem("sipelita_survey_draft");

      if (saved && saved._is_offline) {
        alert("⚠️ Perhatian: Koneksi jaringan atau server lokal sedang offline.\n\nSurvei Anda berhasil disimpan aman sebagai DRAFT OFFLINE di perangkat ini. Data akan otomatis siap disinkronkan ke server saat ada jaringan internet.");
      } else {
        if (typeof showToast === "function") {
          showToast(`Data survei ${data.nama_kk || ''} berhasil disimpan ke basis data.`);
        }
      }
      if (typeof onSaveSuccess === "function") onSaveSuccess(saved);
    } catch (err) {
      alert("Peringatan / Gagal Menyimpan Survei:\n" + (err.message || err));
      submitBtn.disabled = false;
    }
  });

  goToStep(1);
}