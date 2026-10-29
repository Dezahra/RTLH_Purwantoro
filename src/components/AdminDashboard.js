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
