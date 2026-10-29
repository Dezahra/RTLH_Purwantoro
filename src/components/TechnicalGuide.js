import { icons } from "../utils/icons.js";

export function renderTechnicalGuide() {
  return `
    <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            ${icons.info('w-5 h-5')} Panduan Teknis & Standar Kelayakan Rumah Tinggal (RTLH & RLH)
          </div>
          <span class="badge badge-info">Pedoman Teknis PUPR & BPS</span>
        </div>

        <p style="font-size:0.9rem; color:var(--dark-700); line-height:1.6; margin-bottom:1.25rem;">
          Sistem Pendataan Kelayakan Rumah Kelurahan Purwantoro mengacu pada ketentuan teknis <strong>Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat (PUPR)</strong> serta indikator kesejahteraan perumahan <strong>Badan Pusat Statistik (BPS)</strong>. Penilaian kelayakan rumah tinggal didasarkan pada 4 (empat) pilar utama:
        </p>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:800; font-size:0.88rem; color:#047857; margin-bottom:0.25rem;">
              1. Keselamatan Bangunan (40%)
            </div>
            <div style="font-size:0.78rem; color:var(--dark-600); line-height:1.4;">
              Meliputi ketahanan struktur pondasi, kolom beton/tiang penyangga utama, dan rangka kuda-kuda atap agar tidak rawan roboh saat gempa atau angin ribut.
            </div>
          </div>

          <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:800; font-size:0.88rem; color:#0284c7; margin-bottom:0.25rem;">
              2. Kesehatan & Sanitasi (30%)
            </div>
            <div style="font-size:0.78rem; color:var(--dark-600); line-height:1.4;">
              Ketersediaan jamban sendiri leher angsa + tangki septik, sumber air minum aman/terlindung, saluran limbah SPAL, dan ventilasi jendela &ge; 10% luas lantai.
            </div>
          </div>

          <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:800; font-size:0.88rem; color:#d97706; margin-bottom:0.25rem;">
              3. Bahan Bangunan (20%)
            </div>
            <div style="font-size:0.78rem; color:var(--dark-600); line-height:1.4;">
              Kualitas penutup atap (bukan rumbia/seng bocor parah), dinding terluas (tembok/kayu baik, bukan gedek lapuk), dan lantai (keramik/semen, bukan tanah liat).
            </div>
          </div>

          <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:800; font-size:0.88rem; color:#7c3aed; margin-bottom:0.25rem;">
              4. Kecukupan Ruang (10%)
            </div>
            <div style="font-size:0.78rem; color:var(--dark-600); line-height:1.4;">
              Kecukupan luas lantai per orang anggota keluarga dengan standar minimal <strong>&ge; 7.2 m² / jiwa</strong> untuk menjaga kesehatan dan privasi penghuni.
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
