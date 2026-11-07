import Chart from "chart.js/auto";
import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { formatDateIndo } from "../utils/dateHelper.js";

let statusChartInstance = null;
let rwChartInstance = null;

export function renderDashboard() {
  const stats = storage.getStats();
  const pStats = storage.getPetugasStats();

  return `

    <!-- KPI Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Rumah Terdata</span>
          <div class="kpi-icon-wrap">${icons.home('w-4 h-4')}</div>
        </div>
        <div class="kpi-value">${stats.total}</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--success);">
        <div class="kpi-header">
          <span class="kpi-title">Terverifikasi Valid</span>
          <div class="kpi-icon-wrap" style="color:var(--success);">${icons.checkCircle('w-4 h-4')}</div>
        </div>
        <div class="kpi-value" style="color:var(--success);">${stats.terverifikasi} <span style="font-size:0.9rem; font-weight:600;">(${stats.persenVerifikasi || 0}%)</span></div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--warning);">
        <div class="kpi-header">
          <span class="kpi-title">Menunggu Validasi</span>
          <div class="kpi-icon-wrap" style="color:var(--warning);">${icons.clipboard('w-4 h-4')}</div>
        </div>
        <div class="kpi-value" style="color:var(--warning);">${stats.pending}</div>
      </div>
    </div>

    <!-- Analytics Charts Grid -->
    <div class="analytics-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            ${icons.chart('w-5 h-5')} Status Validasi Berkas Survei
          </div>
          <span class="badge badge-secondary">${stats.total} Rumah</span>
        </div>
        <div class="chart-container">
          <canvas id="chart-status-pie"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            ${icons.layers('w-5 h-5')} Sebaran Data Survei per RW
          </div>
          <span class="badge badge-info">Peta Wilayah RW</span>
        </div>
        <div class="chart-container">
          <canvas id="chart-rw-bar"></canvas>
        </div>
      </div>
    </div>

    <!-- Analisis & Rekap Kinerja Hasil Input per Petugas Lapangan -->
    <div class="card" style="margin-top:1.25rem;">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div class="card-title">
          ${icons.chart('w-5 h-5')} Analisis Hasil Input per Petugas Lapangan
        </div>
        <div style="font-size:0.8rem; font-weight:700; color:#64748b;">
          ${pStats.activePetugasCount} dari ${pStats.totalPetugasCount} Petugas Aktif Menginput (${pStats.totalSurveys} Total Data)
        </div>
      </div>

      <div class="table-responsive" style="max-height:360px; overflow-y:auto;">
        <table class="custom-table" style="width:100%; margin:0; font-size:0.85rem;">
          <thead style="position:sticky; top:0; background:#f8fafc; z-index:2;">
            <tr>
              <th style="width:40px; text-align:center;">No</th>
              <th>Petugas Surveyor</th>
              <th>Wilayah Tugas</th>
              <th style="text-align:center;">Jumlah Survei</th>
              <th>Status Validasi</th>
              <th>Terakhir Input</th>
            </tr>
          </thead>
          <tbody>
            ${pStats.petugasList.map((p, idx) => {
              const pct = pStats.totalSurveys > 0 ? Math.round((p.total_survei / pStats.totalSurveys) * 100) : 0;
              return `
                <tr>
                  <td style="text-align:center; font-weight:700; color:#64748b;">${idx + 1}</td>
                  <td>
                    <div style="font-weight:700; color:#1e293b;">${p.nama}</div>
                    <div style="font-size:0.72rem; color:#64748b;">ID: ${p.id_petugas || p.id} • @${p.username}</div>
                  </td>
                  <td>
                    <div style="font-weight:600; color:#334155;">${p.wilayah_tugas || '-'}</div>
                  </td>
                  <td style="text-align:center;">
                    <div style="font-weight:800; font-size:1.05rem; color:${p.total_survei > 0 ? '#1e293b' : '#94a3b8'};">
                      ${p.total_survei}
                    </div>
                    ${p.total_survei > 0 ? `
                      <div style="width:70px; height:4px; background:#e2e8f0; border-radius:999px; margin:3px auto 0 auto; overflow:hidden;">
                        <div style="width:${Math.min(100, pct * 2)}%; height:100%; background:#2563eb; border-radius:999px;"></div>
                      </div>
                      <div style="font-size:0.65rem; color:#64748b;">${pct}%</div>
                    ` : '<div style="font-size:0.65rem; color:#94a3b8;">Belum input</div>'}
                  </td>
                  <td>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                      <span class="badge" style="background:#10b981; color:white; font-size:0.68rem; padding:2px 6px;">✓ ${p.terverifikasi}</span>
                      <span class="badge" style="background:#f59e0b; color:white; font-size:0.68rem; padding:2px 6px;">⏳ ${p.pending}</span>
                      <span class="badge" style="background:#ef4444; color:white; font-size:0.68rem; padding:2px 6px;">⚠️ ${p.revisi}</span>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:0.75rem; color:#475569; font-weight:500;">
                      ${p.terakhir_input ? formatDateIndo(p.terakhir_input, 'short') : '-'}
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function initDashboardCharts(container) {
  const stats = storage.getStats();

  // Chart 1: Donut Chart Status Validasi
  const ctxPie = container.querySelector("#chart-status-pie");
  if (ctxPie) {
    if (statusChartInstance) statusChartInstance.destroy();

    statusChartInstance = new Chart(ctxPie, {
      type: "doughnut",
      data: {
        labels: ["Terverifikasi", "Menunggu Validasi", "Butuh Revisi"],
        datasets: [{
          data: [stats.terverifikasi || 0, stats.pending || 0, stats.revisi || 0],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: { family: "Plus Jakarta Sans", size: 11, weight: "bold" },
              padding: 12
            }
          }
        },
        cutout: "68%"
      }
    });
  }

  // Chart 2: Grouped Bar Chart per RW
  const ctxBar = container.querySelector("#chart-rw-bar");
  if (ctxBar) {
    if (rwChartInstance) rwChartInstance.destroy();

    const rwMap = stats.rwMap || {};
    const rwLabels = Object.keys(rwMap).sort();
    const verifData = rwLabels.map(rw => rwMap[rw].terverifikasi || 0);
    const pendingData = rwLabels.map(rw => (rwMap[rw].pending || 0) + (rwMap[rw].revisi || 0));

    rwChartInstance = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: rwLabels.length > 0 ? rwLabels : ["RW 01"],
        datasets: [
          {
            label: "Terverifikasi",
            data: rwLabels.length > 0 ? verifData : [0],
            backgroundColor: "#10b981",
            borderRadius: 6
          },
          {
            label: "Menunggu / Revisi",
            data: rwLabels.length > 0 ? pendingData : [0],
            backgroundColor: "#f59e0b",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "Plus Jakarta Sans", size: 11, weight: "bold" }
            }
          }
        }
      }
    });
  }
}
