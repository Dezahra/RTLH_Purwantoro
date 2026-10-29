import Chart from "chart.js/auto";
import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";

let statusChartInstance = null;
let rwChartInstance = null;

export function renderDashboard() {
  const stats = storage.getStats();

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

      <div class="kpi-card" style="border-left: 4px solid var(--danger);">
        <div class="kpi-header">
          <span class="kpi-title">Butuh Revisi Lapangan</span>
          <div class="kpi-icon-wrap" style="color:var(--danger);">${icons.alertTriangle('w-4 h-4')}</div>
        </div>
        <div class="kpi-value" style="color:var(--danger);">${stats.revisi}</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid #6366f1;">
        <div class="kpi-header">
          <span class="kpi-title">Kerusakan Struktur</span>
          <div class="kpi-icon-wrap" style="color:#6366f1;">${icons.layers('w-4 h-4')}</div>
        </div>
        <div class="kpi-value" style="color:#6366f1;">${stats.issues?.strukturRusak || 0}</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid #0284c7;">
        <div class="kpi-header">
          <span class="kpi-title">Tanpa Jamban Layak</span>
          <div class="kpi-icon-wrap" style="color:#0284c7;">${icons.info('w-4 h-4')}</div>
        </div>
        <div class="kpi-value" style="color:#0284c7;">${stats.issues?.tanpaJamban || 0}</div>
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

    <!-- Defisit Parameter Fisik & Urgensi Intervensi -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="card-title">
            ${icons.alertTriangle('w-5 h-5 text-warning')} Parameter
          </div>
        </div>
      </div>
      <div class="issues-grid">
        <div class="issue-pill">
          <span class="issue-pill-text">Pondasi & Sloof Rusak / Rapuh</span>
          <span class="issue-pill-count">${stats.issues.pondasiSloofRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Kolom & Ring Balok Rusak</span>
          <span class="issue-pill-count">${stats.issues.kolomBalokRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Rangka Atap Melengkung / Rapuh</span>
          <span class="issue-pill-count">${stats.issues.rangkaAtapRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Penutup Atap Bocor / Asbes Pecah</span>
          <span class="issue-pill-count">${stats.issues.atapRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Dinding Rusak / Tidak Kedap Air</span>
          <span class="issue-pill-count">${stats.issues.dindingRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Lantai Tanah / Belum Diplester</span>
          <span class="issue-pill-count">${stats.issues.lantaiRusak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Sanitasi / Tanpa Jamban Sendiri</span>
          <span class="issue-pill-count">${stats.issues.tanpaJamban} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Sumber Air Minum Tidak Terlindung</span>
          <span class="issue-pill-count">${stats.issues.airTidakLayak} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Pencahayaan Alami Kurang / Gelap</span>
          <span class="issue-pill-count">${stats.issues.pencahayaanKurang} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Penghawaan / Ventilasi Pengap</span>
          <span class="issue-pill-count">${stats.issues.penghawaanKurang} Rumah</span>
        </div>
        <div class="issue-pill">
          <span class="issue-pill-text">Luas Sempit (&lt; 7.2 m²/jiwa)</span>
          <span class="issue-pill-count">${stats.issues.luasKurang} Rumah</span>
        </div>
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
