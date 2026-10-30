import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";

export function renderDetailModal(survey) {
  const currentRole = storage.getCurrentRole();

  return `
    <div class="modal-backdrop" id="survey-detail-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:40px; height:40px; background:var(--primary-100); color:var(--primary-800); border-radius:10px; display:flex; align-items:center; justify-content:center;">
              ${icons.home('w-5 h-5')}
            </div>
            <div>
              <div style="font-weight:800; font-size:1.15rem; color:var(--dark-900);">
                Dossier Penilaian: ${survey.nama_kk}
              </div>
              <div style="font-size:0.75rem; color:var(--dark-600);">
                No. Registrasi: ${survey.id} • <strong>No. Urut BNBA:</strong> <span style="font-family:monospace; color:var(--primary-700); font-weight:700;">${survey.no_urut_bnba || '-'}</span> • Tanggal Survey: ${survey.tanggal_survey || '-'} • Petugas: ${survey.petugas_nama}
              </div>
            </div>
          </div>
          <button class="btn btn-secondary" id="btn-close-modal" style="padding:0.4rem; border-radius:50%;">
            ${icons.cross('w-5 h-5')}
          </button>
        </div>

        <div class="modal-body">
          <!-- Summary Header Banner -->
          <div style="background:linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); border:1px solid var(--gray-200); border-radius:var(--radius-lg); padding:1.25rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--dark-600); text-transform:uppercase;">
                Identitas Berkas Lapangan
              </div>
              <div style="display:flex; align-items:center; gap:0.6rem; margin-top:0.35rem;">
                <span class="badge ${survey.status_verifikasi === 'TERVERIFIKASI' ? 'badge-success' : (survey.status_verifikasi === 'BUTUH_REVISI' ? 'badge-danger' : 'badge-warning')}" style="font-size:0.9rem; padding:4px 12px;">
                  ${survey.status_verifikasi === 'TERVERIFIKASI' ? '✓ Terverifikasi' : (survey.status_verifikasi === 'BUTUH_REVISI' ? '⚠️ Butuh Revisi' : '⏳ Menunggu Validasi')}
                </span>
                <span style="font-size:0.85rem; font-weight:700; color:var(--dark-800);">BNBA: ${survey.no_urut_bnba || '-'}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--dark-700); margin-top:0.35rem;">
                Standar Luas: <strong>${survey.luas_per_jiwa || '-'} m²/jiwa</strong> (${survey.luas_bangunan || '-'} m² / ${survey.jumlah_jiwa || 1} jiwa)
              </div>
            </div>

            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <div style="background:white; border:1px solid var(--gray-200); padding:0.5rem 0.85rem; border-radius:8px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--dark-500); font-weight:700;">STATUS TANAH</div>
                <div style="font-size:0.95rem; font-weight:800; color:var(--dark-800);">${survey.status_tanah || '-'}</div>
              </div>
              <div style="background:white; border:1px solid var(--gray-200); padding:0.5rem 0.85rem; border-radius:8px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--dark-500); font-weight:700;">STATUS RUMAH</div>
                <div style="font-size:0.95rem; font-weight:800; color:var(--dark-800);">${survey.status_rumah || '-'}</div>
              </div>
            </div>
          </div>

          <!-- 4 Foto Lapangan Carousel / Grid -->
          <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.9rem; font-weight:800; color:var(--dark-900); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
              ${icons.camera('w-4 h-4')} Dokumentasi Visual Lapangan (4 Sudut Pandang)
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:0.75rem;">
              <div style="border-radius:var(--radius-md); overflow:hidden; border:1px solid var(--gray-200); background:var(--gray-50);">
                ${survey.foto_depan && !survey.foto_depan.includes('sample-images') ? `
                  <img src="${survey.foto_depan}" style="width:100%; height:130px; object-fit:cover; display:block;" alt="Tampak Depan" />
                ` : `
                  <div style="width:100%; height:130px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Tidak Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.4rem 0.6rem; font-size:0.75rem; font-weight:700; background:white;">1. Tampak Depan</div>
              </div>

              <div style="border-radius:var(--radius-md); overflow:hidden; border:1px solid var(--gray-200); background:var(--gray-50);">
                ${survey.foto_dalam && !survey.foto_dalam.includes('sample-images') ? `
                  <img src="${survey.foto_dalam}" style="width:100%; height:130px; object-fit:cover; display:block;" alt="Dinding & Lantai Interior" />
                ` : `
                  <div style="width:100%; height:130px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Tidak Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.4rem 0.6rem; font-size:0.75rem; font-weight:700; background:white;">2. Dinding & Lantai</div>
              </div>

              <div style="border-radius:var(--radius-md); overflow:hidden; border:1px solid var(--gray-200); background:var(--gray-50);">
                ${survey.foto_atap && !survey.foto_atap.includes('sample-images') ? `
                  <img src="${survey.foto_atap}" style="width:100%; height:130px; object-fit:cover; display:block;" alt="Rangka Atap" />
                ` : `
                  <div style="width:100%; height:130px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Tidak Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.4rem 0.6rem; font-size:0.75rem; font-weight:700; background:white;">3. Atap & Konstruksi</div>
              </div>

              <div style="border-radius:var(--radius-md); overflow:hidden; border:1px solid var(--gray-200); background:var(--gray-50);">
                ${survey.foto_sanitasi && !survey.foto_sanitasi.includes('sample-images') ? `
                  <img src="${survey.foto_sanitasi}" style="width:100%; height:130px; object-fit:cover; display:block;" alt="Sanitasi / Toilet" />
                ` : `
                  <div style="width:100%; height:130px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Tidak Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.4rem 0.6rem; font-size:0.75rem; font-weight:700; background:white;">4. Toilet & Sanitasi</div>
              </div>
            </div>
          </div>

          <!-- Parameter Comparison Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">
            <!-- Profil Demografi -->
            <div style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
              <div style="font-weight:800; font-size:0.85rem; color:var(--primary-800); margin-bottom:0.75rem; border-bottom:1px solid var(--gray-100); padding-bottom:0.35rem;">
                DATA DEMOGRAFI & EKONOMI
              </div>
              <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
                <div><span style="color:var(--dark-500);">No. Urut BNBA:</span> <strong style="font-family:monospace; color:var(--primary-700); font-size:0.9rem;">${survey.no_urut_bnba || '-'}</strong></div>
                <div><span style="color:var(--dark-500);">NIK:</span> <strong>${survey.nik}</strong></div>
                <div><span style="color:var(--dark-500);">No. KK:</span> <strong>${survey.no_kk}</strong></div>
                <div><span style="color:var(--dark-500);">Usia & Gender:</span> ${survey.usia} thn / ${survey.jenis_kelamin}</div>
                <div><span style="color:var(--dark-500);">Lama Menghuni:</span> <strong>${survey.lama_tinggal || '-'} Tahun</strong></div>
                <div><span style="color:var(--dark-500);">Alamat:</span> ${survey.alamat_lengkap || '-'}</div>
                <div><span style="color:var(--dark-500);">Wilayah:</span> RT ${survey.rt ? String(survey.rt).padStart(2, '0') : '-'} / RW ${survey.rw ? String(survey.rw).padStart(2, '0') : '-'}</div>
                <div><span style="color:var(--dark-500);">Anggota Keluarga:</span> ${survey.jumlah_jiwa} Jiwa (${survey.jumlah_lansia_balita || 0} Balita/Lansia)</div>
                <div><span style="color:var(--dark-500);">Pekerjaan:</span> ${survey.pekerjaan || '-'}</div>
                <div>
                  <span style="color:var(--dark-500);">Penghasilan Riil:</span> 
                  <strong style="color:#047857; font-size:0.85rem;">Rp ${(survey.penghasilan_nominal ? Number(survey.penghasilan_nominal).toLocaleString('id-ID') : survey.penghasilan || '-')}</strong> / bln
                </div>
                <div>
                  <span style="color:var(--dark-500);">Nilai UMK (Kota Malang):</span> 
                  <strong>Rp ${(Number(survey.nilai_umk || 3736101)).toLocaleString('id-ID')}</strong>
                  ${(Number(survey.penghasilan_nominal || 0) <= Number(survey.nilai_umk || 3736101))
                    ? '<span class="badge badge-success" style="font-size:0.65rem; margin-left:4px;">✓ &le; UMK</span>'
                    : '<span class="badge badge-danger" style="font-size:0.65rem; margin-left:4px;">⚠️ &gt; UMK</span>'}
                </div>
                <div><span style="color:var(--dark-500);">Status Rumah:</span> ${survey.status_rumah}</div>
                <div>
                  <span style="color:var(--dark-500);">Aset Rumah Lain:</span> 
                  ${survey.aset_rumah_lain === 'Ya' 
                    ? '<span class="badge badge-danger" style="font-size:0.7rem;">⚠️ Ya (Rumah > 1)</span>' 
                    : '<span class="badge badge-success" style="font-size:0.7rem;">Tidak Ada</span>'}
                </div>
                <div><span style="color:var(--dark-500);">Status Lahan:</span> ${survey.status_tanah}</div>
                <div><span style="color:var(--dark-500);">Bansos:</span> <span class="badge badge-info">${survey.bansos_diterima || '-'}</span></div>
              </div>
            </div>

            <!-- Parameter Fisik -->
            <div style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
              <div style="font-weight:800; font-size:0.85rem; color:var(--primary-800); margin-bottom:0.75rem; border-bottom:1px solid var(--gray-100); padding-bottom:0.35rem;">
                PARAMETER KONDISI FISIK BANGUNAN
              </div>
              <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
                <div><span style="color:var(--dark-500);">Pondasi:</span> <strong>${survey.pondasi}</strong></div>
                <div><span style="color:var(--dark-500);">Kolom / Tiang:</span> <strong>${survey.kolom_balok}</strong></div>
                <div><span style="color:var(--dark-500);">Rangka Atap:</span> <strong>${survey.rangka_atap}</strong></div>
                <div><span style="color:var(--dark-500);">Penutup Atap:</span> ${survey.atap}</div>
                <div><span style="color:var(--dark-500);">Dinding Terluas:</span> ${survey.dinding}</div>
                <div><span style="color:var(--dark-500);">Lantai Terluas:</span> ${survey.lantai}</div>
                <div><span style="color:var(--dark-500);">Luas Bangunan:</span> ${survey.luas_bangunan} m² (${survey.luas_per_jiwa} m²/jiwa)</div>
                <div><span style="color:var(--dark-500);">Ventilasi:</span> ${survey.ventilasi}</div>
                <div><span style="color:var(--dark-500);">Sanitasi & Jamban:</span> <strong>${survey.sanitasi}</strong></div>
                <div><span style="color:var(--dark-500);">Jenis Kloset:</span> <strong>${survey.jenis_kloset || '-'}</strong></div>
                <div><span style="color:var(--dark-500);">TPA Tinja:</span> <strong>${survey.tpa_tinja || '-'}</strong></div>
                <div><span style="color:var(--dark-500);">Sumber Air:</span> ${survey.sumber_air}</div>
                <div><span style="color:var(--dark-500);">Sempadan Sungai:</span> <strong>${survey.sempadan_sungai || '-'}</strong></div>
                <div><span style="color:var(--dark-500);">Listrik:</span> ${survey.sumber_listrik || '-'}</div>
              </div>
            </div>
          </div>

          <!-- Geotagging & Koordinat GPS -->
          <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div>
              <div style="font-weight:800; font-size:0.85rem; color:var(--dark-900); display:flex; align-items:center; gap:0.4rem;">
                ${icons.mapPin('w-4 h-4')} Titik Koordinat Geospasial
              </div>
              <div style="font-size:0.8rem; color:var(--dark-700); margin-top:0.25rem;">
                Lat: <code>${survey.latitude}</code>, Long: <code>${survey.longitude}</code> • Akurasi GPS: <strong>${(survey.akurasi_gps !== undefined && survey.akurasi_gps !== null && survey.akurasi_gps !== '') ? (String(survey.akurasi_gps) === '0' ? '0 (Pas)' : (isNaN(survey.akurasi_gps) ? survey.akurasi_gps : `± ${survey.akurasi_gps} m`)) : '0 (Pas)'}</strong>
              </div>
            </div>
            <a href="https://www.google.com/maps?q=${survey.latitude},${survey.longitude}" target="_blank" class="btn btn-secondary btn-sm" style="font-size:0.8rem; text-decoration:none;">
              Buka di Google Maps ↗
            </a>
          </div>

          <!-- Catatan Lapangan Surveyor -->
          <div style="margin-bottom:1.5rem;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--dark-800); margin-bottom:0.35rem;">
              Catatan Petugas Lapangan:
            </div>
            <div style="font-size:0.82rem; color:var(--dark-700); background:#f8fafc; padding:0.75rem; border-radius:var(--radius-md); border-left:3px solid var(--primary-600);">
              "${survey.catatan_surveyor || 'Tidak ada catatan khusus dari petugas.'}"
            </div>
          </div>

          <!-- Admin & Pegawai Verification Controls -->
          ${(currentRole === 'admin' || currentRole === 'pegawai') ? `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-md); padding:1.25rem;">
              <div style="font-weight:800; font-size:0.9rem; color:#166534; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
                ${icons.shield('w-5 h-5')} Keputusan & Validasi Berkas Kelurahan
              </div>

              <div class="form-group" style="margin-bottom:0.75rem;">
                <label class="form-label">Status Verifikasi Kelurahan Purwantoro</label>
                <select id="modal-select-verif" class="form-select">
                  <option value="MENUNGGU_VALIDASI" ${survey.status_verifikasi === 'MENUNGGU_VALIDASI' ? 'selected' : ''}>⏳ Menunggu Validasi</option>
                  <option value="TERVERIFIKASI" ${survey.status_verifikasi === 'TERVERIFIKASI' ? 'selected' : ''}>✓ Terverifikasi Layak Program</option>
                  <option value="BUTUH_REVISI" ${survey.status_verifikasi === 'BUTUH_REVISI' ? 'selected' : ''}>⚠️ Butuh Perbaikan / Cek Ulang</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0.75rem;">
                <label class="form-label">Catatan Verifikator Kelurahan</label>
                <input type="text" id="modal-input-admin-notes" class="form-input" placeholder="Tuliskan catatan verifikasi..." value="${survey.catatan_admin || ''}">
              </div>

              <button type="button" class="btn btn-primary" id="btn-save-verif" style="width:100%;">
                ${icons.check('w-4 h-4')} Simpan Keputusan Verifikasi
              </button>
            </div>
          ` : `
            <div style="background:#f8fafc; border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
              <div style="font-weight:700; font-size:0.85rem; color:var(--dark-800);">Status Verifikasi Kelurahan:</div>
              <div style="margin-top:0.35rem;">
                <span class="badge ${survey.status_verifikasi === 'TERVERIFIKASI' ? 'badge-success' : (survey.status_verifikasi === 'BUTUH_REVISI' ? 'badge-danger' : 'badge-warning')}">
                  ${survey.status_verifikasi}
                </span>
                ${survey.catatan_admin ? `<span style="font-size:0.8rem; margin-left:0.5rem; color:var(--dark-700);">Catatan Admin: "${survey.catatan_admin}"</span>` : ''}
              </div>
            </div>
          `}
        </div>

        <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            ${(currentRole === 'admin' || survey.status_verifikasi !== 'TERVERIFIKASI') ? `
              <button type="button" class="btn btn-secondary" id="btn-modal-edit" style="font-size:0.82rem;">
                ${icons.edit('w-4 h-4')} Ubah Data
              </button>
            ` : ''}
            ${currentRole === 'admin' ? `
              <button type="button" class="btn btn-danger" id="btn-modal-delete" style="font-size:0.82rem; background:#fee2e2; color:#b91c1c; border-color:#fca5a5;">
                ${icons.trash('w-4 h-4')} Hapus
              </button>
            ` : ''}
          </div>

          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" id="btn-modal-print" style="font-size:0.82rem;">
              ${icons.printer('w-4 h-4')} Cetak Surat RTLH
            </button>
            <button type="button" class="btn btn-primary" id="btn-modal-close-bottom" style="font-size:0.82rem;">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initDetailModalEvents(container, survey, { onClose, onPrint, onEdit, onUpdateSuccess, showToast }) {
  const backdrop = container.querySelector("#survey-detail-backdrop");
  if (!backdrop) return;

  const closeBtn = container.querySelector("#btn-close-modal");
  const closeBtnBottom = container.querySelector("#btn-modal-close-bottom");
  const printBtn = container.querySelector("#btn-modal-print");
  const editBtn = container.querySelector("#btn-modal-edit");
  const deleteBtn = container.querySelector("#btn-modal-delete");

  function close() {
    backdrop.remove();
    onClose();
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (closeBtnBottom) closeBtnBottom.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      onPrint(survey.id);
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      close();
      if (typeof onEdit === "function") {
        onEdit(survey.id);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (confirm(`Apakah Anda yakin ingin menghapus data survey ${survey.nama_kk} (${survey.id})?`)) {
        await storage.deleteSurvey(survey.id);
        if (typeof showToast === "function") {
          showToast(`Data survey ${survey.id} berhasil dihapus.`);
        }
        close();
        if (typeof onUpdateSuccess === "function") {
          onUpdateSuccess();
        }
      }
    });
  }

  // Admin verification save button
  const saveVerifBtn = container.querySelector("#btn-save-verif");
  if (saveVerifBtn) {
    saveVerifBtn.addEventListener("click", () => {
      const status = container.querySelector("#modal-select-verif").value;
      const catatanAdmin = container.querySelector("#modal-input-admin-notes").value;

      storage.updateVerification(survey.id, {
        status,
        catatanAdmin
      });

      showToast(`Keputusan verifikasi ${survey.nama_kk} berhasil disimpan.`);
      onUpdateSuccess();
      close();
    });
  }
}
