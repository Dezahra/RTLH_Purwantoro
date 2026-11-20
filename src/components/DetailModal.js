import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { formatDateIndo } from "../utils/dateHelper.js";

// Helper Formatters agar kode nilai sesuai dengan teks lengkap pada isian form
function formatStructure(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("kondisi baik") || s.includes("kokoh")) return "A. Ada, kondisi baik, kokoh";
  if (s === "rapuh_sebagian" || s === "sedang" || s.includes("sebagian")) return "B. Ada, sebagian rapuh, tidak kokoh";
  if (s === "rapuh_seluruhnya" || s === "buruk" || s.includes("seluruhnya") || s.includes("tidak ada")) return "C. Tidak ada, seluruhnya rapuh";
  return val;
}

function formatDinding(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("tembok") || s.includes("kokoh")) return "A. Tembok diplester / kokoh";
  if (s === "sedang" || s.includes("retak")) return "B. Retak / tidak kedap air";
  if (s === "buruk" || s.includes("bambu") || s.includes("triplek")) return "C. Bambu tipis / triplek rapuh";
  return val;
}

function formatLantai(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("ubin") || s.includes("keramik") || s.includes("plester baik")) return "A. Plester / ubin / keramik baik";
  if (s === "sedang" || s.includes("pecah")) return "B. Plester pecah-pecah";
  if (s === "buruk" || s.includes("tanah")) return "C. Tanah / rapuh";
  return val;
}

function formatAtap(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("genteng") || s.includes("seng baik")) return "A. Genteng/seng/asbes kondisi baik";
  if (s === "sedang" || s.includes("bocor") || s.includes("rusak")) return "B. Sebagian rusak / bocor";
  if (s === "buruk" || s.includes("asbes") || s.includes("runtuh")) return "C. Asbes pecah / rawan runtuh";
  return val;
}

function formatSanitasi(val) {
  if (!val) return "-";
  const s = String(val).trim();
  const map = {
    "1": "1. Ada, digunakan oleh anggota keluarga dalam satu rumah",
    "2": "2. Ada, digunakan bersama oleh anggota keluarga dari beberapa rumah",
    "3": "3. Ada, di MCK komunal",
    "4": "4. Ada, di MCK umum/siapapun menggunakan",
    "5": "5. Ada, anggota keluarga tidak menggunakan",
    "6": "6. Tidak ada fasilitas jamban"
  };
  return map[s] || val;
}

function formatSumberAir(val) {
  if (!val) return "-";
  const s = String(val).trim();
  const map = {
    "1": "1. Air kemasan bermerek",
    "2": "2. Air isi ulang",
    "3": "3. Leding / PDAM",
    "4": "4. Sumur bor / pompa",
    "5": "5. Sumur terlindung",
    "6": "6. Sumur tak terlindung",
    "7": "7. Mata air terlindungi",
    "8": "8. Mata air tidak terlindungi",
    "9": "9. Air permukaan (sungai / danau)",
    "10": "10. Air hujan",
    "11": "11. Lainnya"
  };
  return map[s] || val;
}

function formatPencahayaan(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("terang")) return "A. Terang normal pada siang hari";
  if (s === "sedang" || s.includes("kurang")) return "B. Kurang terang";
  if (s === "buruk" || s.includes("gelap")) return "C. Gelap / perlu lampu siang hari";
  return val;
}

function formatPenghawaan(val) {
  if (!val) return "-";
  const s = String(val).toLowerCase();
  if (s === "baik" || s.includes("cukup") || s.includes("sirkulasi")) return "A. Cukup ventilasi / sirkulasi baik";
  if (s === "sedang" || s.includes("kurang") || s.includes("agak")) return "B. Ventilasi kurang / agak pengap";
  if (s === "buruk" || s.includes("pengap") || s.includes("lembab")) return "C. Pengap / lembab / tanpa ventilasi";
  return val;
}

export function renderDetailModal(survey) {
  const currentRole = storage.getCurrentRole();

  return `
    <div class="modal-backdrop" id="survey-detail-backdrop">
      <div class="modal-dialog" style="max-width: 920px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:40px; height:40px; background:var(--primary-100); color:var(--primary-800); border-radius:10px; display:flex; align-items:center; justify-content:center;">
              ${icons.home('w-5 h-5')}
            </div>
            <div>
              <div style="font-weight:800; font-size:1.15rem; color:var(--dark-900);">
                Dossier Penilaian: ${survey.nama_kk || 'Calon Penerima'}
              </div>
              <div style="font-size:0.75rem; color:var(--dark-600);">
                No. Registrasi: <span style="font-family:monospace;">${survey.id}</span> • <strong>No. Urut BNBA:</strong> <span style="font-family:monospace; color:var(--primary-700); font-weight:700;">${survey.no_urut_bnba || '-'}</span> • Tanggal Survey: ${formatDateIndo(survey.tanggal_survey || survey.created_at)} • Petugas: ${survey.petugas_nama || 'Petugas Lapangan'}
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
                  ${survey.status_verifikasi === 'TERVERIFIKASI' ? '✓ Terverifikasi' : (survey.status_verifikasi === 'BUTUH_REVISI' ? '⚠️ Butuh Revisi' : ' Menunggu Validasi')}
                </span>
                <span style="font-size:0.85rem; font-weight:700; color:var(--dark-800);">BNBA: ${survey.no_urut_bnba || '-'}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--dark-700); margin-top:0.35rem;">
                Standar Luas: <strong>${survey.luas_per_jiwa || '-'} m²/jiwa</strong> (${survey.luas_bangunan || '-'} m² / ${survey.jumlah_jiwa || 1} jiwa)
              </div>
            </div>

            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <div style="background:white; border:1px solid var(--gray-200); padding:0.5rem 0.85rem; border-radius:8px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--dark-500); font-weight:700;">STATUS PENGUASAAN LAHAN</div>
                <div style="font-size:0.88rem; font-weight:800; color:#0369a1;">${survey.status_tanah || '-'}</div>
              </div>
              <div style="background:white; border:1px solid var(--gray-200); padding:0.5rem 0.85rem; border-radius:8px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--dark-500); font-weight:700;">STATUS KEPEMILIKAN RUMAH</div>
                <div style="font-size:0.88rem; font-weight:800; color:var(--dark-800);">${survey.status_rumah || 'Milik Sendiri'}</div>
              </div>
            </div>
          </div>

          <!-- 4 Foto Lapangan Clickable Gallery (Bisa Langsung Diklik Untuk Zoom Tanpa Buka Tab Baru) -->
          <div style="margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div style="font-size:0.9rem; font-weight:800; color:var(--dark-900); display:flex; align-items:center; gap:0.5rem;">
                ${icons.camera('w-4 h-4')} Dokumentasi Visual Lapangan (4 Sudut Pandang)
              </div>
              <span style="font-size:0.75rem; color:var(--primary-700); font-weight:600;">
                💡 Klik pada foto untuk memperbesar / melihat ukuran jelas
              </span>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:0.75rem;">
              
              <!-- 1. Foto Tampak Depan -->
              <div class="detail-photo-card" data-full-src="${survey.foto_depan || ''}" data-title="1. Tampak Depan Bangunan Rumah" style="border-radius:var(--radius-md); overflow:hidden; border:1.5px solid var(--gray-200); background:var(--gray-50); cursor:pointer; position:relative; transition:transform 0.15s, box-shadow 0.15s;">
                ${survey.foto_depan && !survey.foto_depan.includes('sample-images') ? `
                  <img src="${survey.foto_depan}" style="width:100%; height:135px; object-fit:cover; display:block;" alt="Tampak Depan" />
                  <div style="position:absolute; top:6px; right:6px; background:rgba(15,23,42,0.7); color:white; font-size:0.65rem; padding:2px 7px; border-radius:10px; backdrop-filter:blur(3px);">🔍 Klik Zoom</div>
                ` : `
                  <div style="width:100%; height:135px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Belum Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.45rem 0.65rem; font-size:0.75rem; font-weight:700; background:white; border-top:1px solid var(--gray-100);">1. Tampak Depan</div>
              </div>

              <!-- 2. Foto Dinding & Lantai -->
              <div class="detail-photo-card" data-full-src="${survey.foto_dalam || ''}" data-title="2. Dinding & Lantai Interior" style="border-radius:var(--radius-md); overflow:hidden; border:1.5px solid var(--gray-200); background:var(--gray-50); cursor:pointer; position:relative; transition:transform 0.15s, box-shadow 0.15s;">
                ${survey.foto_dalam && !survey.foto_dalam.includes('sample-images') ? `
                  <img src="${survey.foto_dalam}" style="width:100%; height:135px; object-fit:cover; display:block;" alt="Dinding & Lantai Interior" />
                  <div style="position:absolute; top:6px; right:6px; background:rgba(15,23,42,0.7); color:white; font-size:0.65rem; padding:2px 7px; border-radius:10px; backdrop-filter:blur(3px);">🔍 Klik Zoom</div>
                ` : `
                  <div style="width:100%; height:135px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Belum Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.45rem 0.65rem; font-size:0.75rem; font-weight:700; background:white; border-top:1px solid var(--gray-100);">2. Dinding & Lantai</div>
              </div>

              <!-- 3. Foto Atap & Rangka Struktur -->
              <div class="detail-photo-card" data-full-src="${survey.foto_atap || ''}" data-title="3. Rangka Atap & Konstruksi" style="border-radius:var(--radius-md); overflow:hidden; border:1.5px solid var(--gray-200); background:var(--gray-50); cursor:pointer; position:relative; transition:transform 0.15s, box-shadow 0.15s;">
                ${survey.foto_atap && !survey.foto_atap.includes('sample-images') ? `
                  <img src="${survey.foto_atap}" style="width:100%; height:135px; object-fit:cover; display:block;" alt="Rangka Atap" />
                  <div style="position:absolute; top:6px; right:6px; background:rgba(15,23,42,0.7); color:white; font-size:0.65rem; padding:2px 7px; border-radius:10px; backdrop-filter:blur(3px);">🔍 Klik Zoom</div>
                ` : `
                  <div style="width:100%; height:135px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Belum Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.45rem 0.65rem; font-size:0.75rem; font-weight:700; background:white; border-top:1px solid var(--gray-100);">3. Rangka Atap</div>
              </div>

              <!-- 4. Foto Toilet & Sanitasi -->
              <div class="detail-photo-card" data-full-src="${survey.foto_sanitasi || ''}" data-title="4. Fasilitas Jamban & Sanitasi" style="border-radius:var(--radius-md); overflow:hidden; border:1.5px solid var(--gray-200); background:var(--gray-50); cursor:pointer; position:relative; transition:transform 0.15s, box-shadow 0.15s;">
                ${survey.foto_sanitasi && !survey.foto_sanitasi.includes('sample-images') ? `
                  <img src="${survey.foto_sanitasi}" style="width:100%; height:135px; object-fit:cover; display:block;" alt="Sanitasi / Toilet" />
                  <div style="position:absolute; top:6px; right:6px; background:rgba(15,23,42,0.7); color:white; font-size:0.65rem; padding:2px 7px; border-radius:10px; backdrop-filter:blur(3px);">🔍 Klik Zoom</div>
                ` : `
                  <div style="width:100%; height:135px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--gray-100); color:var(--dark-500);">
                    ${icons.camera('w-6 h-6')}
                    <span style="font-size:0.72rem; font-weight:600; margin-top:0.35rem;">Belum Ada Foto</span>
                  </div>
                `}
                <div style="padding:0.45rem 0.65rem; font-size:0.75rem; font-weight:700; background:white; border-top:1px solid var(--gray-100);">4. Toilet & Sanitasi</div>
              </div>

            </div>
          </div>

          <!-- Parameter Comparison Grid (Sesuai Isian Form Lapangan) -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">
            
            <!-- KOLOM KIRI: DATA DEMOGRAFI & KEPEMILIKAN SOSIAL-EKONOMI -->
            <div style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1.15rem; display:flex; flex-direction:column; gap:0.55rem;">
              <div style="font-weight:800; font-size:0.88rem; color:var(--primary-800); border-bottom:1.5px solid var(--primary-100); padding-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                <span>👤</span> DATA DEMOGRAFI & KEPEMILIKAN
              </div>

              <div style="display:flex; flex-direction:column; gap:0.45rem; font-size:0.82rem;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">No. Urut BNBA:</span>
                  <strong style="font-family:monospace; color:var(--primary-700); font-size:0.88rem;">${survey.no_urut_bnba || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Nomor Induk Kependudukan (NIK):</span>
                  <strong style="font-family:monospace;">${survey.nik || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Nomor Kartu Keluarga (No. KK):</span>
                  <strong style="font-family:monospace;">${survey.no_kk || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Nama Kepala Keluarga:</span>
                  <strong>${survey.nama_kk || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Jenis Kelamin / Usia:</span>
                  <span>${survey.jenis_kelamin || '-'} / <strong>${survey.usia ? survey.usia + ' Tahun' : '-'}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Wilayah Tugas (RW / RT):</span>
                  <strong>RW ${survey.rw ? String(survey.rw).padStart(2, '0') : '-'} / RT ${survey.rt ? String(survey.rt).padStart(2, '0') : '-'}</strong>
                </div>
                <div style="border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500); display:block; margin-bottom:2px;">Alamat Rumah:</span>
                  <strong>${survey.alamat_lengkap || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Jumlah Penghuni (Jiwa):</span>
                  <span><strong>${survey.jumlah_jiwa || 1} Jiwa</strong> (${survey.jumlah_lansia_balita || 0} Balita/Lansia)</span>
                </div>

                <!-- Kepemilikan & Status Sosial -->
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px; margin-top:4px;">
                  <span style="color:var(--dark-500);">Status Penguasaan Lahan:</span>
                  <strong style="color:#0369a1; text-align:right;">${survey.status_tanah || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Status Kepemilikan Rumah:</span>
                  <strong>${survey.status_rumah || 'Milik Sendiri'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Lama Menghuni Rumah:</span>
                  <strong>${survey.lama_tinggal !== undefined && survey.lama_tinggal !== null ? survey.lama_tinggal + ' Tahun' : '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Memiliki Aset Rumah Lainnya:</span>
                  ${survey.aset_rumah_lain === 'Ya'
                    ? '<span class="badge badge-danger" style="font-size:0.72rem;">⚠️ Ya (Memiliki > 1 Rumah)</span>'
                    : '<span class="badge badge-success" style="font-size:0.72rem;">✓ Tidak Ada</span>'}
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                  <span style="color:var(--dark-500);">Bantuan Sosial Diterima:</span>
                  <span class="badge badge-info" style="font-size:0.72rem;">${survey.bansos_diterima || 'Belum Pernah Menerima'}</span>
                </div>

                ${(survey.pekerjaan || survey.penghasilan_nominal) ? `
                  <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:3px;">
                    <span style="color:var(--dark-500);">Pekerjaan:</span>
                    <strong>${survey.pekerjaan || '-'}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--dark-500);">Penghasilan:</span>
                    <strong style="color:#059669;">Rp ${(Number(survey.penghasilan_nominal || 0)).toLocaleString('id-ID')} / bln</strong>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- KOLOM KANAN: PARAMETER KONDISI FISIK BANGUNAN (13 PARAMETER LENGKAP PUPR) -->
            <div style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1.15rem; display:flex; flex-direction:column; gap:0.55rem;">
              <div style="font-weight:800; font-size:0.88rem; color:var(--primary-800); border-bottom:1.5px solid var(--primary-100); padding-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                <span>🏠</span> PARAMETER KONDISI FISIK BANGUNAN
              </div>

              <div style="display:flex; flex-direction:column; gap:0.45rem; font-size:0.82rem;">
                <!-- 1. Keselamatan Struktur Bangunan -->
                <div style="font-weight:700; color:#0369a1; font-size:0.72rem; text-transform:uppercase; background:#f0f9ff; padding:2px 6px; border-radius:4px;">
                  1. Keselamatan Struktur Bangunan
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Pondasi:</span>
                  <strong style="text-align:right;">${formatStructure(survey.pondasi)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Sloof:</span>
                  <strong style="text-align:right;">${formatStructure(survey.sloof)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Kolom:</span>
                  <strong style="text-align:right;">${formatStructure(survey.kolom || survey.kolom_balok)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Ring Balok:</span>
                  <strong style="text-align:right;">${formatStructure(survey.ring_balok)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Rangka Atap:</span>
                  <strong style="text-align:right;">${formatStructure(survey.rangka_atap)}</strong>
                </div>

                <!-- 2. Komponen Bahan Bangunan -->
                <div style="font-weight:700; color:#0369a1; font-size:0.72rem; text-transform:uppercase; background:#f0f9ff; padding:2px 6px; border-radius:4px; margin-top:3px;">
                  2. Komponen Bahan Bangunan
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Dinding Terluas:</span>
                  <strong style="text-align:right;">${formatDinding(survey.dinding)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Lantai Terluas:</span>
                  <strong style="text-align:right;">${formatLantai(survey.lantai)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Penutup Atap:</span>
                  <strong style="text-align:right;">${formatAtap(survey.atap)}</strong>
                </div>

                <!-- 3. Sanitasi, Air Bersih & Kesehatan Lingkungan -->
                <div style="font-weight:700; color:#0369a1; font-size:0.72rem; text-transform:uppercase; background:#f0f9ff; padding:2px 6px; border-radius:4px; margin-top:3px;">
                  3. Sanitasi, Air Bersih & Lingkungan
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Fasilitas Sanitasi:</span>
                  <strong style="text-align:right; max-width:60%;">${formatSanitasi(survey.sanitasi)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Jenis Kloset:</span>
                  <strong style="text-align:right;">${survey.jenis_kloset || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">TPA Tinja:</span>
                  <strong style="text-align:right; max-width:60%;">${survey.tpa_tinja || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Sumber Air Minum:</span>
                  <strong style="text-align:right;">${formatSumberAir(survey.sumber_air)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Sempadan Sungai:</span>
                  <strong style="text-align:right;">${survey.sempadan_sungai || '-'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Pencahayaan:</span>
                  <strong style="text-align:right;">${formatPencahayaan(survey.pencahayaan)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Penghawaan:</span>
                  <strong style="text-align:right;">${formatPenghawaan(survey.penghawaan || survey.ventilasi)}</strong>
                </div>

                <!-- 4. Kecukupan Ruang -->
                <div style="font-weight:700; color:#0369a1; font-size:0.72rem; text-transform:uppercase; background:#f0f9ff; padding:2px 6px; border-radius:4px; margin-top:3px;">
                  4. Kecukupan Ruang
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--gray-100); padding-bottom:2px;">
                  <span style="color:var(--dark-500);">Luas Bangunan:</span>
                  <strong>${survey.luas_bangunan || '-'} m²</strong>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="color:var(--dark-500);">Luas per Jiwa:</span>
                  <span>
                    <strong>${survey.luas_per_jiwa || '-'} m²/jiwa</strong>
                    ${Number(survey.luas_per_jiwa) >= 7.2
                      ? '<span class="badge badge-success" style="font-size:0.68rem; margin-left:4px;">✓ Memenuhi (≥7.2 m²)</span>'
                      : '<span class="badge badge-danger" style="font-size:0.68rem; margin-left:4px;">⚠️ Kurang (<7.2 m²)</span>'}
                  </span>
                </div>
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
                  <option value="MENUNGGU_VALIDASI" ${survey.status_verifikasi === 'MENUNGGU_VALIDASI' ? 'selected' : ''}> Menunggu Validasi</option>
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

      <!-- Lightbox Image Viewer Overlay (Buka Foto Jelas Sekali Klik) -->
      <div id="detail-lightbox-modal" style="display:none; position:fixed; inset:0; z-index:999999; background:rgba(15,23,42,0.92); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:1.25rem;">
        <div style="position:relative; max-width:94vw; max-height:92vh; display:flex; flex-direction:column; align-items:center;">
          <button type="button" id="btn-close-lightbox" style="position:absolute; top:-44px; right:0; background:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.4); color:white; font-size:1.5rem; width:38px; height:38px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">
            &times;
          </button>
          <div style="background:#0f172a; padding:6px; border-radius:12px; box-shadow:0 25px 60px rgba(0,0,0,0.85); border:1px solid rgba(255,255,255,0.15);">
            <img id="lightbox-img" src="" alt="Foto Lapangan" style="max-width:88vw; max-height:74vh; object-fit:contain; display:block; border-radius:8px;" />
          </div>
          <div style="margin-top:0.85rem; width:100%; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; color:white;">
            <div>
              <div id="lightbox-title" style="font-weight:800; font-size:1rem; color:#f8fafc;"></div>
              <div style="font-size:0.78rem; color:#94a3b8;">${survey.nama_kk || 'Warga'} • RT ${survey.rt ? String(survey.rt).padStart(2, '0') : '-'} / RW ${survey.rw ? String(survey.rw).padStart(2, '0') : '-'}</div>
            </div>
            <a id="lightbox-open-raw" href="#" target="_blank" style="background:#0284c7; color:white; text-decoration:none; font-size:0.8rem; font-weight:700; padding:6px 14px; border-radius:6px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 8px rgba(2,132,199,0.4);">
              Buka File Asli ↗
            </a>
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

  // Lightbox Photo Zoom Events (Buka Foto Jelas Tanpa Harus Klik Kanan Buka Tab Baru)
  const lightboxModal = container.querySelector("#detail-lightbox-modal");
  const lightboxImg = container.querySelector("#lightbox-img");
  const lightboxTitle = container.querySelector("#lightbox-title");
  const lightboxOpenRaw = container.querySelector("#lightbox-open-raw");
  const btnCloseLightbox = container.querySelector("#btn-close-lightbox");

  function openLightbox(src, title) {
    if (!lightboxModal || !src) return;
    lightboxImg.src = src;
    lightboxTitle.textContent = title || "Dokumentasi Foto Lapangan";
    lightboxOpenRaw.href = src;
    lightboxModal.style.display = "flex";
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.style.display = "none";
    lightboxImg.src = "";
  }

  container.querySelectorAll(".detail-photo-card").forEach((card) => {
    card.addEventListener("click", () => {
      const src = card.dataset.fullSrc;
      const title = card.dataset.title;
      if (src && !src.includes("sample-images")) {
        openLightbox(src, title);
      }
    });
  });

  if (btnCloseLightbox) {
    btnCloseLightbox.addEventListener("click", closeLightbox);
  }
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      if (lightboxModal && lightboxModal.style.display === "flex") {
        closeLightbox();
      } else {
        close();
      }
    }
  };
  document.addEventListener("keydown", handleEsc);

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
