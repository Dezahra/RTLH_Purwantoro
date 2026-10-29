import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { icons } from "../utils/icons.js";
import { storage } from "../utils/storage.js";
import { masterRtRwPurwantoro } from "../utils/rtrw.js";

let mapInstance = null;
let markersLayer = null;

export function renderGisMap() {
  const currentRole = storage.getCurrentRole();

  return `
    <div class="map-view-container">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--dark-900);">
            Peta Sebaran Kelayakan Rumah
          </h2>
        </div>

        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-recenter-map">
            ${icons.compass('w-4 h-4')} Pusatkan ke Purwantoro
          </button>
        </div>
      </div>

      <!-- Main GIS Container -->
      <div class="map-card-wrapper">
        <!-- Sidebar Filter & List -->
        <div class="map-sidebar">
          <div class="map-filter-group">
            <label class="map-filter-label">Cari Nama / NIK Warga</label>
            <div class="search-input-wrap" style="min-width: 100%;">
              <span class="search-icon-inside">${icons.search('w-4 h-4')}</span>
              <input type="text" class="search-input-field" id="map-search-query" placeholder="Ketik nama KK atau NIK...">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; margin-bottom: 0.85rem;">
            <div class="map-filter-group" style="margin-bottom:0;">
              <label class="map-filter-label">Filter RW</label>
              <select class="form-select" id="map-filter-rw">
                <option value="ALL">Semua RW</option>
              </select>
            </div>
            <div class="map-filter-group" style="margin-bottom:0;">
              <label class="map-filter-label">Filter RT</label>
              <select class="form-select" id="map-filter-rt">
                <option value="ALL">Semua RT</option>
              </select>
            </div>
          </div>

          <div class="map-filter-group">
            <label class="map-filter-label">Filter Status Verifikasi</label>
            <select class="form-select" id="map-filter-status">
              <option value="ALL">Semua Status Verifikasi</option>
              <option value="TERVERIFIKASI">🟢 Terverifikasi Valid</option>
              <option value="MENUNGGU_VALIDASI">🟡 Menunggu Validasi</option>
              <option value="BUTUH_REVISI">🔴 Butuh Revisi Lapangan</option>
            </select>
          </div>

          <!-- Legend -->
          <div class="map-legend" style="margin-bottom: 1rem;">
            <div style="font-weight: 700; margin-bottom: 0.35rem; color: var(--dark-800);">Legenda Titik:</div>
            <div class="legend-item"><span class="legend-dot" style="background:#10b981;"></span> Terverifikasi Valid</div>
            <div class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span> Menunggu Validasi</div>
            <div class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span> Butuh Revisi Lapangan</div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--dark-600); text-transform:uppercase;">Daftar Titik Rumah</span>
            <span class="badge badge-secondary" id="map-count-badge">0 Titik</span>
          </div>

          <!-- House List Cards -->
          <div class="map-house-list" id="map-house-items">
            <!-- Dynamic items rendered via JS -->
          </div>
        </div>

        <!-- Leaflet Map Canvas -->
        <div class="map-canvas-area">
          <div id="gis-map-canvas"></div>
        </div>
      </div>
    </div>
  `;
}

export function initGisMap(container, { onSelectSurvey, onNewSurvey }) {
  const mapCanvas = container.querySelector("#gis-map-canvas");
  if (!mapCanvas) return;

  // Clean up existing map instance if any
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Purwantoro Village / Kelurahan Center Coordinates (Kota Malang)
  const defaultCenter = [-7.9546, 112.6436];
  const defaultZoom = 15;

  mapInstance = L.map("gis-map-canvas", {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: false
  });

  // Zoom control in top right
  L.control.zoom({ position: "topright" }).addTo(mapInstance);

  // Tile Layers: OSM & Esri Satellite
  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
  }).addTo(mapInstance);

  const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
  });

  const baseLayers = {
    "Peta Jalan (OSM)": osmLayer,
    "Satelit Bumi (Esri)": satelliteLayer
  };

  L.control.layers(baseLayers, null, { position: "topright" }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);

  // Bind Recenter
  const recenterBtn = container.querySelector("#btn-recenter-map");
  if (recenterBtn) {
    recenterBtn.addEventListener("click", () => {
      mapInstance.setView(defaultCenter, defaultZoom);
    });
  }

  const addSurveyBtn = container.querySelector("#btn-map-add-survey");
  if (addSurveyBtn) {
    addSurveyBtn.addEventListener("click", () => {
      onNewSurvey();
    });
  }

  // Render Markers and Sidebar List
  const filterRw = container.querySelector("#map-filter-rw");
  const filterRt = container.querySelector("#map-filter-rt");
  const filterStatus = container.querySelector("#map-filter-status");
  const searchQuery = container.querySelector("#map-search-query");

  function populateRwOptions() {
    if (!filterRw) return;
    const rws = Object.keys(masterRtRwPurwantoro).sort((a, b) => Number(a) - Number(b));
    filterRw.innerHTML = '<option value="ALL">Semua RW</option>' +
      rws.map(rw => `<option value="${rw}">RW ${rw}</option>`).join("");
  }

  function updateRtOptions(selectedRw) {
    if (!filterRt) return;
    if (!selectedRw || selectedRw === "ALL") {
      filterRt.innerHTML = '<option value="ALL">Semua RT</option>';
      return;
    }
    const rts = masterRtRwPurwantoro[selectedRw] || [];
    filterRt.innerHTML = `<option value="ALL">Semua RT (RW ${selectedRw})</option>` +
      rts.map(rt => `<option value="${rt}">RT ${rt}</option>`).join("");
  }

  populateRwOptions();
  updateRtOptions("ALL");

  const currentUser = storage.getCurrentUser();
  if (currentUser?.role === 'petugas' && currentUser?.rw) {
    const assignedRw = String(currentUser.rw).padStart(2, '0');
    if (filterRw) {
      filterRw.value = assignedRw;
      updateRtOptions(assignedRw);
    }
    if (filterRt) {
      filterRt.value = "ALL";
    }
  }

  function updateMapAndList() {
    const surveys = storage.getSurveys();
    const rwVal = filterRw ? filterRw.value : "ALL";
    const rtVal = filterRt ? filterRt.value : "ALL";
    const sVal = filterStatus.value;
    const qVal = searchQuery.value.toLowerCase().trim();

    markersLayer.clearLayers();

    const filtered = surveys.filter(item => {
      // Filter RW
      if (rwVal !== "ALL") {
        const itemRw = String(item.rw || "").padStart(2, "0");
        if (itemRw !== rwVal) return false;
      }
      // Filter RT
      if (rtVal !== "ALL") {
        const itemRt = String(item.rt || "").padStart(2, "0");
        if (itemRt !== rtVal) return false;
      }
      // Filter Status
      if (sVal !== "ALL" && item.status_verifikasi !== sVal) return false;
      // Search
      if (qVal) {
        const matchName = (item.nama_kk || "").toLowerCase().includes(qVal);
        const matchNik = (item.nik || "").toLowerCase().includes(qVal);
        const matchId = (item.id || "").toLowerCase().includes(qVal);
        const matchBnba = (item.no_urut_bnba || "").toLowerCase().includes(qVal);
        if (!matchName && !matchNik && !matchId && !matchBnba) return false;
      }
      return true;
    });

    const countBadge = container.querySelector("#map-count-badge");
    if (countBadge) countBadge.textContent = `${filtered.length} Titik`;

    // Render list
    const listContainer = container.querySelector("#map-house-items");
    if (listContainer) {
      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align:center; padding:1.5rem; color:var(--dark-600); font-size:0.85rem;">
            Tidak ditemukan data rumah sesuai kriteria filter.
          </div>
        `;
      } else {
        listContainer.innerHTML = filtered.map(item => `
          <div class="map-house-item" data-id="${item.id}" data-lat="${item.latitude}" data-lng="${item.longitude}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--dark-900);">${item.nama_kk}</div>
                <div style="font-size:0.75rem; color:var(--dark-600);">RT ${item.rt ? String(item.rt).padStart(2, '0') : '-'} / RW ${item.rw ? String(item.rw).padStart(2, '0') : '-'}</div>
              </div>
              <span class="badge ${item.status_verifikasi === 'TERVERIFIKASI' ? 'badge-success' : (item.status_verifikasi === 'BUTUH_REVISI' ? 'badge-danger' : 'badge-warning')}" style="font-size:0.68rem;">
                ${item.status_verifikasi === 'TERVERIFIKASI' ? 'Terverifikasi' : (item.status_verifikasi === 'BUTUH_REVISI' ? 'Revisi' : 'Menunggu')}
              </span>
            </div>
            <div style="margin-top:0.35rem; font-size:0.72rem; color:var(--dark-600);">
              ${item.alamat_lengkap || '-'}
            </div>
          </div>
        `).join("");

        // Bind click on sidebar items to fly to map
        listContainer.querySelectorAll(".map-house-item").forEach(el => {
          el.addEventListener("click", () => {
            const lat = parseFloat(el.dataset.lat);
            const lng = parseFloat(el.dataset.lng);
            const id = el.dataset.id;
            if (!isNaN(lat) && !isNaN(lng)) {
              mapInstance.flyTo([lat, lng], 18, { duration: 1.2 });
              // open popup
              const marker = markersLayer.getLayers().find(m => m.options.surveyId === id);
              if (marker) marker.openPopup();
            }
          });
        });
      }
    }

    // Add Leaflet Markers
    filtered.forEach(item => {
      if (item.latitude && item.longitude) {
        const markerColor = item.status_verifikasi === 'TERVERIFIKASI' ? '#10b981' : (item.status_verifikasi === 'BUTUH_REVISI' ? '#ef4444' : '#f59e0b');

        // Create Custom HTML Pin Icon
        const customIcon = L.divIcon({
          className: "custom-gis-pin",
          html: `
            <div style="
              background-color: ${markerColor};
              width: 28px;
              height: 28px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
              border: 2px solid #ffffff;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">🏠</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28]
        });

        const marker = L.marker([item.latitude, item.longitude], {
          icon: customIcon,
          surveyId: item.id
        });

        // Popup Content
        const popupHtml = `
          <div style="width: 230px; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="position:relative; margin-bottom:6px; border-radius:6px; overflow:hidden;">
              ${item.foto_depan && !item.foto_depan.includes('sample-images') ? `
                <img src="${item.foto_depan}" 
                     style="width:100%; height:110px; object-fit:cover; display:block;" 
                     alt="Foto Rumah ${item.nama_kk}"
                />
              ` : `
                <div style="width:100%; height:80px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:11px; font-weight:600; gap:4px;">
                  <span>📷</span> Belum Ada Foto Lapangan
                </div>
              `}
              <span style="
                position:absolute; top:6px; right:6px; 
                background:${markerColor}; color:#fff; 
                font-size:10px; font-weight:700; 
                padding:2px 8px; border-radius:99px;
              ">${item.status_verifikasi === 'TERVERIFIKASI' ? 'Terverifikasi' : (item.status_verifikasi === 'BUTUH_REVISI' ? 'Butuh Revisi' : 'Menunggu')}</span>
            </div>
            <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:2px;">
              ${item.nama_kk}
            </div>
            <div style="font-size:11px; color:#475569; margin-bottom:4px;">
              NIK: ${item.nik}<br/>
              ${item.alamat_lengkap}
            </div>
            <div style="
              font-size:11px; font-weight:700; 
              color:${markerColor}; margin-bottom:6px;
            ">
              ${item.status_verifikasi === 'TERVERIFIKASI' ? '✓ Terverifikasi Valid' : (item.status_verifikasi === 'BUTUH_REVISI' ? '⚠️ Butuh Revisi Lapangan' : '⏳ Menunggu Validasi')}
            </div>
            <button class="btn-popup-detail" data-id="${item.id}" style="
              width:100%; background:#047857; color:white; border:none; 
              padding:6px; border-radius:6px; font-size:11px; font-weight:700; 
              cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;
            ">
              Lihat Detail Lengkap &rarr;
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml);
        markersLayer.addLayer(marker);
      }
    });
  }

  // Delegate popup button click to open survey detail
  mapCanvas.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-popup-detail");
    if (btn) {
      const id = btn.dataset.id;
      onSelectSurvey(id);
    }
  });

  // Filter change listeners
  if (filterRw) {
    filterRw.addEventListener("change", () => {
      updateRtOptions(filterRw.value);
      updateMapAndList();
    });
  }
  if (filterRt) filterRt.addEventListener("change", updateMapAndList);
  if (filterStatus) filterStatus.addEventListener("change", updateMapAndList);
  if (searchQuery) searchQuery.addEventListener("input", updateMapAndList);

  // Initial trigger
  updateMapAndList();

  // Leaflet size fix after DOM mount
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 250);

  // Sinkronisasi data survei terbaru dari DB
  (async () => {
    if (typeof storage.syncSurveysFromDB === "function") {
      await storage.syncSurveysFromDB();
      updateMapAndList();
    }
  })();
}
