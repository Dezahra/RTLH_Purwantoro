import { icons } from "../utils/icons.js";

export function renderStep1(initialData, isAdmin, currentUser, bnbaValue) {
  const statusTanah = initialData?.status_tanah || '';
  const isTanahMilik = !statusTanah || statusTanah.includes('Milik') || statusTanah.includes('SHM') || statusTanah.includes('Girik') || statusTanah === 'milik sendiri, ada bukti sah';
  const isTanahSewa = statusTanah.includes('sewa') || statusTanah.includes('Tanah Kas Desa');
  const isTanahIlegal = statusTanah.includes('ilegal') || statusTanah.includes('Numpang');

  const safeNominal = initialData?.penghasilan_nominal ?? (typeof initialData?.penghasilan === 'number' ? initialData.penghasilan : 0);

  const iconClipboard = icons && typeof icons.clipboard === 'function' ? icons.clipboard('w-4 h-4 text-primary') : '';
  const iconUsers = icons && typeof icons.users === 'function' ? icons.users('w-5 h-5') : '';
  const iconChart = icons && typeof icons.chart === 'function' ? icons.chart('w-5 h-5') : '';

  const bnbaBtnHtml = isAdmin
    ? '<button type="button" class="btn btn-secondary btn-sm" id="btn-generate-bnba" style="font-size:0.72rem; padding:3px 9px; font-weight:700;">🔄 Generate Antrean Otomatis</button>'
    : '';

  return `
    <div class="wizard-step-pane" id="pane-step-1">
      <div class="form-group" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid ${isAdmin ? '#cbd5e1' : '#e2e8f0'}; border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
          <label class="form-label" style="font-weight:800; display:flex; align-items:center; gap:0.5rem; margin-bottom:0;">
            ${iconClipboard} Nomor Urut BNBA<span class="req">*</span>
          </label>
          ${bnbaBtnHtml}
        </div>
        <input 
          type="text" 
          name="no_urut_bnba" 
          id="input-no-urut-bnba" 
          class="form-input" 
          value="${bnbaValue || ''}" 
          placeholder="Contoh: BNBA-2026-001" 
          required 
          ${!isAdmin ? 'readonly' : ''} 
          style="${!isAdmin ? 'background-color: #f1f5f9; cursor: not-allowed;' : 'background: white;'}"
        />
      </div>

      <div class="section-divider">
        1. Demografi
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Nomor Induk Kependudukan (NIK)<span class="req">*</span></label>
          <input type="text" name="nik" class="form-input" maxlength="16" placeholder="Masukkan NIK" required value="${initialData?.nik || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Nomor Kartu Keluarga (No. KK)<span class="req">*</span></label>
          <input type="text" name="no_kk" class="form-input" maxlength="16" placeholder="Masukkan No. KK" required value="${initialData?.no_kk || ''}">
        </div>
      </div>

      <div class="form-grid-3">
        <div class="form-group">
          <label class="form-label">Nama Kepala Keluarga<span class="req">*</span></label>
          <input type="text" name="nama_kk" class="form-input" placeholder="Masukkan Nama Kepala Keluarga" required value="${initialData?.nama_kk || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Kelamin<span class="req">*</span></label>
          <select name="jenis_kelamin" class="form-select" required>
            <option value="" disabled ${!initialData?.jenis_kelamin ? 'selected' : ''}>-- Pilih Jenis Kelamin --</option>
            <option value="Laki-laki" ${initialData?.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
            <option value="Perempuan" ${initialData?.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Usia (Tahun)</label>
          <input type="number" name="usia" class="form-input" min="17" max="100" placeholder="Masukkan Usia" value="${initialData?.usia || 0}">
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 1rem;">
        <div class="form-group" style="width: 130px; flex-shrink: 0;">
          <label class="form-label">Nomor RW</label>
          <select name="rw" id="survey-select-rw" class="form-input" style="text-align: center;" data-initial="${initialData?.rw || ''}">
            <option value="">Pilih RW</option>
          </select>
        </div>
        <div class="form-group" style="width: 130px; flex-shrink: 0;">
          <label class="form-label">Nomor RT</label>
          <select name="rt" id="survey-select-rt" class="form-input" style="text-align: center;" disabled data-initial="${initialData?.rt || ''}">
            <option value="">Pilih RT</option>
          </select>
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label">Alamat Rumah</label>
          <input type="text" name="alamat_lengkap" class="form-input" placeholder="Masukkan Alamat Rumah" value="${initialData?.alamat_lengkap || ''}">
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Jumlah Anggota Keluarga (Jiwa)<span class="req">*</span></label>
          <input type="number" name="jumlah_jiwa" id="input-jumlah-jiwa" class="form-input" min="1" max="20" required value="${initialData?.jumlah_jiwa || 4}">
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Anggota Rentan (Balita / Lansia)</label>
          <input type="number" name="jumlah_lansia_balita" class="form-input" min="0" max="10" value="${initialData?.jumlah_lansia_balita || 0}">
        </div>
      </div>

      <div class="section-divider">
        2. Kepemilikan
      </div>

      <div class="form-grid-2">
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="font-weight: 700;">Status Penguasaan Lahan <span class="req" style="color: #ef4444;">*</span></label>
          <select name="status_tanah" class="form-select" required>
            <option value="" disabled ${!initialData?.status_tanah ? 'selected' : ''}>-- Pilih Status Penguasaan Lahan --</option>
            <option value="milik sendiri, ada bukti sah" ${isTanahMilik ? 'selected' : ''}>milik sendiri, ada bukti sah</option>
            <option value="sewa/pinjam pakai/izin tinggal/menumpang, ada bukti sah" ${isTanahSewa ? 'selected' : ''}>sewa/pinjam pakai/izin tinggal/menumpang, ada bukti sah</option>
            <option value="tanpa bukti sah/ilegal" ${isTanahIlegal ? 'selected' : ''}>tanpa bukti sah/ilegal</option>
          </select>
          <input type="hidden" name="status_rumah" value="Milik Sendiri" />
        </div>
        <div class="form-group">
          <label class="form-label">Lama Menghuni Rumah (Tahun)<span class="req">*</span></label>
          <input type="number" name="lama_tinggal" id="input-lama-tinggal" class="form-input" min="0" max="100" placeholder="Contoh: 12" required value="${initialData?.lama_tinggal ?? 0}">
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="color: #1e293b; display: block; margin-bottom: 0.5rem;">
            Memiliki Aset Rumah Lainnya?<span class="req" style="color: #ef4444;">*</span>
          </label>
          <select name="aset_rumah_lain" id="input-aset-rumah-lain" class="form-select" required style="width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid #cbd5e1; border-radius: 6px;">
            <option value="" disabled ${!initialData?.aset_rumah_lain ? 'selected' : ''}>-- Pilih Jawaban --</option>
            <option value="Tidak" ${initialData?.aset_rumah_lain === 'Tidak' || !initialData?.aset_rumah_lain ? 'selected' : ''}>Tidak</option>
            <option value="Ya" ${initialData?.aset_rumah_lain === 'Ya' ? 'selected' : ''}>Ya</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Bantuan Sosial Diterima</label>
          <select name="bansos_diterima" class="form-select">
            <option value="" disabled ${!initialData?.bansos_diterima ? 'selected' : ''}>-- Pilih Bantuan Sosial --</option>
            <option value="PKH & BPNT" ${initialData?.bansos_diterima === 'PKH & BPNT' ? 'selected' : ''}>PKH & BPNT</option>
            <option value="PKH" ${initialData?.bansos_diterima === 'PKH' ? 'selected' : ''}>PKH saja</option>
            <option value="BPNT" ${initialData?.bansos_diterima === 'BPNT' ? 'selected' : ''}>BPNT (Sembako)</option>
            <option value="Bantuan Sosial Kelurahan / APBD" ${initialData?.bansos_diterima === 'Bantuan Sosial Kelurahan / APBD' ? 'selected' : ''}>Bantuan Sosial Kelurahan / APBD</option>
            <option value="BLT Dana Desa" ${initialData?.bansos_diterima === 'BLT Dana Desa' || initialData?.bansos_diterima === 'BLT Kemensos' ? 'selected' : ''}>BLT Kemensos / Dana Kelurahan</option>
            <option value="Belum Pernah" ${!initialData?.bansos_diterima || initialData?.bansos_diterima === 'Belum Pernah' ? 'selected' : ''}>Belum Pernah Menerima</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

export function renderStep2(initialData) {
  const iconShield = icons && typeof icons.shield === 'function' ? icons.shield('w-5 h-5') : '';
  const iconHome = icons && typeof icons.home === 'function' ? icons.home('w-5 h-5') : '';
  const iconInfo = icons && typeof icons.info === 'function' ? icons.info('w-5 h-5') : '';
  const iconCompass = icons && typeof icons.compass === 'function' ? icons.compass('w-5 h-5') : '';

  return `
    <div class="wizard-step-pane" id="pane-step-2" style="display:none;">
      <div class="section-divider">
        1. Keselamatan Struktur Bangunan
      </div>

      <div class="form-group">
        <label class="form-label">Pondasi <span class="req">*</span></label>
        <select name="pondasi" class="form-select" required>
          <option value="">-- Pilih Kondisi Pondasi --</option>
          <option value="baik" ${initialData?.pondasi === 'baik' ? 'selected' : ''}>A. Ada, kondisi baik, kokoh</option>
          <option value="rapuh_sebagian" ${initialData?.pondasi === 'rapuh_sebagian' ? 'selected' : ''}>B. Ada, sebagian rapuh, tidak kokoh</option>
          <option value="rapuh_seluruhnya" ${initialData?.pondasi === 'rapuh_seluruhnya' ? 'selected' : ''}>C. Tidak ada, seluruhnya rapuh</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Sloof <span class="req">*</span></label>
        <select name="sloof" class="form-select" required>
          <option value="">-- Pilih Kondisi Sloof --</option>
          <option value="baik" ${initialData?.sloof === 'baik' ? 'selected' : ''}>A. Ada, kondisi baik, kokoh</option>
          <option value="rapuh_sebagian" ${initialData?.sloof === 'rapuh_sebagian' ? 'selected' : ''}>B. Ada, sebagian rapuh, tidak kokoh</option>
          <option value="rapuh_seluruhnya" ${initialData?.sloof === 'rapuh_seluruhnya' ? 'selected' : ''}>C. Tidak ada, seluruhnya rapuh</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Kolom <span class="req">*</span></label>
        <select name="kolom" class="form-select" required>
          <option value="">-- Pilih Kondisi Kolom --</option>
          <option value="baik" ${initialData?.kolom === 'baik' ? 'selected' : ''}>A. Ada, kondisi baik, kokoh</option>
          <option value="rapuh_sebagian" ${initialData?.kolom === 'rapuh_sebagian' ? 'selected' : ''}>B. Ada, sebagian rapuh, tidak kokoh</option>
          <option value="rapuh_seluruhnya" ${initialData?.kolom === 'rapuh_seluruhnya' ? 'selected' : ''}>C. Tidak ada, seluruhnya rapuh</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Ring Balok <span class="req">*</span></label>
        <select name="ring_balok" class="form-select" required>
          <option value="">-- Pilih Kondisi Ring Balok --</option>
          <option value="baik" ${initialData?.ring_balok === 'baik' ? 'selected' : ''}>A. Ada, kondisi baik, kokoh</option>
          <option value="rapuh_sebagian" ${initialData?.ring_balok === 'rapuh_sebagian' ? 'selected' : ''}>B. Ada, sebagian rapuh, tidak kokoh</option>
          <option value="rapuh_seluruhnya" ${initialData?.ring_balok === 'rapuh_seluruhnya' ? 'selected' : ''}>C. Tidak ada, seluruhnya rapuh</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Rangka Atap <span class="req">*</span></label>
        <select name="rangka_atap" class="form-select" required>
          <option value="">-- Pilih Kondisi Rangka Atap --</option>
          <option value="baik" ${initialData?.rangka_atap === 'baik' ? 'selected' : ''}>A. Ada, kondisi baik, kokoh</option>
          <option value="rapuh_sebagian" ${initialData?.rangka_atap === 'rapuh_sebagian' ? 'selected' : ''}>B. Ada, sebagian rapuh, tidak kokoh</option>
          <option value="rapuh_seluruhnya" ${initialData?.rangka_atap === 'rapuh_seluruhnya' ? 'selected' : ''}>C. Tidak ada, seluruhnya rapuh</option>
        </select>
      </div>

      <div class="section-divider">
       2. Komponen Bahan Bangunan
      </div>

      <div class="form-grid-3">
        <div class="form-group">
          <label class="form-label">Dinding <span class="req">*</span></label>
          <select name="dinding" class="form-select" required>
            <option value="">-- Pilih Kondisi Dinding --</option>
            <option value="baik" ${initialData?.dinding === 'baik' ? 'selected' : ''}>A. Tembok diplester / kokoh</option>
            <option value="sedang" ${initialData?.dinding === 'sedang' ? 'selected' : ''}>B. Retak / tidak kedap air</option>
            <option value="buruk" ${initialData?.dinding === 'buruk' ? 'selected' : ''}>C. Bambu tipis / triplek rapuh</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Lantai <span class="req">*</span></label>
          <select name="lantai" class="form-select" required>
            <option value="">-- Pilih Kondisi Lantai --</option>
            <option value="baik" ${initialData?.lantai === 'baik' ? 'selected' : ''}>A. Plester/ubin/keramik baik</option>
            <option value="sedang" ${initialData?.lantai === 'sedang' ? 'selected' : ''}>B. Plester pecah-pecah</option>
            <option value="buruk" ${initialData?.lantai === 'buruk' ? 'selected' : ''}>C. Tanah / rapuh</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Penutup Atap <span class="req">*</span></label>
          <select name="atap" class="form-select" required>
            <option value="">-- Pilih Kondisi Penutup Atap --</option>
            <option value="baik" ${initialData?.atap === 'baik' ? 'selected' : ''}>A. Genteng/seng kondisi baik</option>
            <option value="sedang" ${initialData?.atap === 'sedang' ? 'selected' : ''}>B. Sebagian rusak / bocor</option>
            <option value="buruk" ${initialData?.atap === 'buruk' ? 'selected' : ''}>C. Asbes pecah / rawan runtuh</option>
          </select>
        </div>
      </div>

      <div class="section-divider">
       3. Sanitasi, Air Bersih & Kesehatan Lingkungan
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fasilitas Jamban & Sanitasi<span class="req">*</span></label>
          <select name="sanitasi" class="form-select" required>
            <option value="">-- Pilih Fasilitas Sanitasi --</option>
            <option value="1" ${initialData?.sanitasi === '1' ? 'selected' : ''}>1. Ada, digunakan oleh anggota keluarga dalam satu rumah</option>
            <option value="2" ${initialData?.sanitasi === '2' ? 'selected' : ''}>2. Ada, digunakan bersama oleh anggota keluarga dari beberapa rumah</option>
            <option value="3" ${initialData?.sanitasi === '3' ? 'selected' : ''}>3. Ada, di MCK komunal</option>
            <option value="4" ${initialData?.sanitasi === '4' ? 'selected' : ''}>4. Ada, di MCK umum/siapapun menggunakan</option>
            <option value="5" ${initialData?.sanitasi === '5' ? 'selected' : ''}>5. Ada, anggota keluarga tidak menggunakan</option>
            <option value="6" ${initialData?.sanitasi === '6' ? 'selected' : ''}>6. Tidak ada</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Sumber Air Minum Utama<span class="req">*</span></label>
          <select name="sumber_air" class="form-select" required>
            <option value="">-- Pilih Sumber Air Minum --</option>
            <option value="1" ${initialData?.sumber_air === '1' ? 'selected' : ''}>1. Air kemasan bermerek</option>
            <option value="2" ${initialData?.sumber_air === '2' ? 'selected' : ''}>2. Air isi ulang</option>
            <option value="3" ${initialData?.sumber_air === '3' ? 'selected' : ''}>3. Leding / PDAM</option>
            <option value="4" ${initialData?.sumber_air === '4' ? 'selected' : ''}>4. Sumur bor / pompa</option>
            <option value="5" ${initialData?.sumber_air === '5' ? 'selected' : ''}>5. Sumur terlindung</option>
            <option value="6" ${initialData?.sumber_air === '6' ? 'selected' : ''}>6. Sumur tak terlindung</option>
            <option value="7" ${initialData?.sumber_air === '7' ? 'selected' : ''}>7. Mata air terlindungi</option>
            <option value="8" ${initialData?.sumber_air === '8' ? 'selected' : ''}>8. Mata air tidak terlindungi</option>
            <option value="9" ${initialData?.sumber_air === '9' ? 'selected' : ''}>9. Air permukaan (sungai/danau/waduk/kolam/irigasi)</option>
            <option value="10" ${initialData?.sumber_air === '10' ? 'selected' : ''}>10. Air hujan</option>
            <option value="11" ${initialData?.sumber_air === '11' ? 'selected' : ''}>11. Lainnya</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Pencahayaan</label>
          <select name="pencahayaan" class="form-select" required>
            <option value="baik" ${initialData?.pencahayaan === 'baik' ? 'selected' : ''}>A. Terang normal pada siang hari</option>
            <option value="sedang" ${initialData?.pencahayaan === 'sedang' ? 'selected' : ''}>B. Kurang terang</option>
            <option value="buruk" ${initialData?.pencahayaan === 'buruk' ? 'selected' : ''}>C. Gelap / perlu lampu siang hari</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Penghawaan <span class="req">*</span></label>
          <select name="penghawaan" class="form-select" required>
            <option value="baik" ${initialData?.penghawaan === 'baik' ? 'selected' : ''}>A. Cukup ventilasi / sirkulasi baik</option>
            <option value="sedang" ${initialData?.penghawaan === 'sedang' ? 'selected' : ''}>B. Ventilasi kurang / agak pengap</option>
            <option value="buruk" ${initialData?.penghawaan === 'buruk' ? 'selected' : ''}>C. Pengap / lembab / tanpa ventilasi</option>
          </select>
        </div>
      </div>

      <div class="section-divider">
        4. Kecukupan Ruang
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Luas Bangunan Rumah (m²)<span class="req">*</span></label>
          <input type="number" name="luas_bangunan" id="input-luas-bangunan" class="form-input" min="10" max="500" required value="${initialData?.luas_bangunan || 36}">
          <span class="form-hint">Standar Permen PUPR: Minimal &ge;7.2 m² per jiwa.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Estimasi Luas Lantai per Jiwa</label>
          <div style="padding:0.65rem 0.85rem; background:var(--gray-100); border-radius:var(--radius-md); font-weight:700; color:var(--dark-800);" id="text-luas-per-jiwa">
            9.0 m² / jiwa (Memenuhi standar kecukupan)
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderStep3(initialData) {
  const iconCamera = icons && typeof icons.camera === 'function' ? icons.camera('w-5 h-5') : '';
  const iconUpload = icons && typeof icons.upload === 'function' ? icons.upload('w-3.5 h-3.5') : '';

  const photoSlots = [
    { id: 'depan', title: '1. Foto Tampak Depan*' },
    { id: 'dalam', title: '2. Dinding & Lantai Interior' },
    { id: 'atap', title: '3. Atap & Rangka Struktur' },
  ];

  return `
    <div class="wizard-step-pane" id="pane-step-3" style="display:none;">
      <div class="section-divider">
        ${iconCamera} Dokumentasi Foto Lapangan
      </div>
      <p style="font-size:0.85rem; color:var(--dark-600); margin-bottom:1.25rem;">
        Unggah foto dokumentasi kondisi rumah warga secara langsung dari perangkat/kamera:
      </p>

      <div class="photo-upload-grid">
        ${photoSlots.map(s => {
    const photoVal = initialData?.['foto_' + s.id] && !initialData['foto_' + s.id].includes('sample-images') ? initialData['foto_' + s.id] : '';
    const hasPhoto = Boolean(photoVal);

    return `
            <div class="photo-slot-card ${hasPhoto ? 'has-photo' : ''}" id="card-slot-${s.id}">
              <div class="photo-preview-placeholder" id="placeholder-slot-${s.id}" style="${hasPhoto ? 'display:none;' : 'display:flex; flex-direction:column; align-items:center; justify-content:center; height:150px; background:var(--gray-100); border-radius:var(--radius-md); margin-bottom:0.5rem; color:var(--dark-500);'}">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6; margin-bottom:0.35rem;">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span style="font-size:0.75rem; font-weight:600;">Belum Ada Foto</span>
                <span style="font-size:0.68rem; color:var(--dark-400);">Gunakan Kamera atau Unggah</span>
              </div>

              <img src="${photoVal}" class="photo-preview-img" id="img-preview-${s.id}" alt="${s.title}" style="${hasPhoto ? 'display:block;' : 'display:none;'}" />
              <div class="photo-slot-title">${s.title}</div>
              <input type="hidden" name="foto_${s.id}" id="input-foto-${s.id}" value="${photoVal}">
              
              <div class="photo-slot-actions" style="display:flex; flex-wrap:wrap; gap:0.4rem; justify-content:center;">
                <button type="button" class="btn-photo-action btn-open-camera" data-target="${s.id}" data-title="${s.title}" style="background:#0284c7; color:white; border-color:#0284c7; cursor:pointer;">
                  ${iconCamera} Ambil Kamera
                </button>
                <label class="btn-photo-action" style="cursor:pointer; background:white; color:var(--dark-800); border-color:var(--gray-300);">
                  ${iconUpload} Unggah File
                  <input type="file" accept="image/*" class="file-picker-input" data-target="${s.id}" style="display:none;">
                </label>
                <input type="file" accept="image/*" capture="environment" class="file-camera-native" data-target="${s.id}" style="display:none;">
                <button type="button" class="btn-photo-action btn-remove-photo" data-target="${s.id}" style="color:var(--danger); border-color:var(--danger); ${hasPhoto ? 'display:inline-flex;' : 'display:none;'}">
                  Hapus
                </button>
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

export function renderStep4(initialData) {
  const iconMapPin = icons && typeof icons.mapPin === 'function' ? icons.mapPin('w-5 h-5') : '';
  const iconPinSmall = icons && typeof icons.mapPin === 'function' ? icons.mapPin('w-4 h-4') : '';

  return `
    <div class="wizard-step-pane" id="pane-step-4" style="display:none;">
      <div class="section-divider">
        ${iconMapPin} Geotagging
      </div>

      <div class="gps-picker-box">
        <div class="gps-controls-row">
          <button type="button" class="btn-gps-detect" id="btn-detect-gps">
            ${iconPinSmall} Ambil Titik Koordinat GPS Saya
          </button>
        </div>

        <div id="survey-mini-map" style="height:250px; margin-top:10px;"></div>
        <div id="gps-boundary-warning" style="display:none; background:#fffbeb; border:1px solid #fef3c7; border-left:4px solid #f59e0b; padding:0.6rem 0.85rem; border-radius:6px; margin-top:0.75rem; font-size:0.8rem; color:#92400e; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong>Perhatian:</strong> Titik koordinat GPS terdeteksi berada di luar wilayah Kelurahan Purwantoro / Kota Malang.
          </div>
          <button type="button" class="btn btn-sm" id="btn-reset-purwantoro-coords" style="background:#f59e0b; color:white; border:none; padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer; font-weight:700;">
            Pusatkan ke Purwantoro
          </button>
        </div>
        <div style="font-size:0.75rem; color:var(--dark-600); margin-top:0.5rem;">
           <em>Tips: Geser pin merah pada peta untuk menentukan posisi atap rumah secara presisi.</em>
        </div>
      </div>

      <div class="form-grid-3" style="margin-top: 1rem;">
        <div class="form-group">
          <label class="form-label">Latitude (Garis Lintang)<span class="req">*</span></label>
          <input type="number" step="any" name="latitude" id="input-latitude" class="form-input" required value="${initialData?.latitude || -7.9546}">
        </div>

        <div class="form-group">
          <label class="form-label">Longitude (Garis Bujur)<span class="req">*</span></label>
          <input type="number" step="any" name="longitude" id="input-longitude" class="form-input" required value="${initialData?.longitude || 112.6436}">
        </div>

        <div class="form-group">
          <label class="form-label">Akurasi GPS (meter)</label>
          <input type="text" name="akurasi_gps" id="input-akurasi-gps" class="form-input" value="${initialData?.akurasi_gps !== undefined && initialData?.akurasi_gps !== null && initialData?.akurasi_gps !== '' ? initialData.akurasi_gps : '0'}" placeholder="0">
        </div>
      </div>
    </div>
  `;
}

export function renderStep5(initialData) {
  const iconCheck = icons && typeof icons.checkCircle === 'function' ? icons.checkCircle('w-5 h-5') : '';

  return `
    <div class="wizard-step-pane" id="pane-step-5" style="display:none;">
      <div class="section-divider">
        ${iconCheck} Konfirmasi Survei & Catatan Petugas Lapangan
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1.25rem; margin-bottom:1.25rem;">
        <h4 style="font-size:0.92rem; font-weight:700; color:var(--dark-800); margin-bottom:0.4rem; display:flex; align-items:center; gap:0.5rem;">
          <span></span> Verifikasi Kelengkapan Data Lapangan
        </h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; font-size:0.8rem; background:white; padding:0.75rem 1rem; border-radius:8px; border:1px solid #edf2f7;">
          <div><span style="color:#64748b;">Standar Luas / Jiwa:</span> <strong id="step5-luas-info">-</strong></div>
          <div><span style="color:#64748b;">Dokumentasi Foto:</span> <strong id="step5-foto-info">-</strong></div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Catatan Khusus Petugas Surveyor Lapangan</label>
        <textarea name="catatan_surveyor" class="form-textarea" rows="4" placeholder="Tuliskan catatan kondisi khusus keluarga atau kondisi fisik rumah di lapangan...">${initialData?.catatan_surveyor || ''}</textarea>
      </div>
    </div>
  `;
}