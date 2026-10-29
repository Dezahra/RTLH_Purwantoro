import { storage } from "./storage.js";

export const masterRtRwPurwantoro = {
    "01": ["01", "02", "03", "04"],
    "02": ["01", "02", "03", "04", "05"],
    "03": ["01", "02", "03", "04"],
    "04": ["01", "02", "03"],
    "05": ["01", "02", "03", "04", "05"],
    "06": ["01", "02", "03", "04", "05", "06"],
    "07": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],
    "08": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
    "09": ["01", "02", "03", "04", "05", "06"],
    "10": ["01", "02", "03", "04", "05", "06", "07", "08"],
    "11": ["01", "02", "03", "04", "05"],
    "12": ["01", "02", "03", "04", "05", "06", "07"],
    "13": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    "14": ["01", "02", "03", "04", "05"],
    "15": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
    "16": ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
    "17": ["01", "02", "03"],
    "18": ["01", "02", "03", "04", "05", "06"],
    "19": ["01", "02", "03"],
    "20": ["01", "02", "03", "04", "05", "06", "07", "08"],
    "21": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
    "22": ["01", "02", "03", "04", "05"],
    "23": ["01", "02", "03", "04"],
    "24": ["01", "02", "03", "04", "05"]
};

export async function initRtRwDropdowns(container, savedRw = '', savedRt = '') {
    const rwSelect = container.querySelector('#survey-select-rw') || container.querySelector('[name="rw"]');
    const rtSelect = container.querySelector('#survey-select-rt') || container.querySelector('[name="rt"]');
    if (!rwSelect || !rtSelect) return;

    const currentUser = storage.getCurrentUser();
    const isPetugas = currentUser?.role === 'petugas';

    // Ekstrak RW penugasan petugas (Aturan 1 RW 1 Petugas)
    let assignedRw = currentUser?.rw ? String(currentUser.rw).padStart(2, '0') : '';

    if (!assignedRw && currentUser?.wilayah_tugas) {
        const match = currentUser.wilayah_tugas.match(/RW\s*(\d+)/i);
        if (match) {
            assignedRw = match[1].padStart(2, '0');
        }
    }

    // Jika yang login adalah Petugas (1 RW 1 Petugas):
    // Kunci nomor RW sesuai wilayah penugasan, namun buka pilihan seluruh RT di RW tersebut
    if (isPetugas && assignedRw) {
        rwSelect.innerHTML = `<option value="${assignedRw}" selected>RW ${assignedRw} (Wilayah Tugas Anda)</option>`;
        rwSelect.value = assignedRw;

        rwSelect.disabled = false;
        rwSelect.style.pointerEvents = 'none';
        rwSelect.tabIndex = -1;
        rwSelect.style.backgroundColor = '#f3f4f6';
        rwSelect.style.cursor = 'not-allowed';

        // Buka pilihan RT untuk seluruh RT yang ada di RW penugasan
        const rtsInRw = masterRtRwPurwantoro[assignedRw] || ["01", "02", "03", "04"];
        const curRt = savedRt ? String(savedRt).padStart(2, '0') : '';

        rtSelect.innerHTML = '<option value="">-- Pilih RT --</option>' +
            rtsInRw.map(rt => `<option value="${rt}" ${curRt === rt ? 'selected' : ''}>RT ${rt}</option>`).join("");

        rtSelect.disabled = false;
        rtSelect.style.pointerEvents = 'auto';
        rtSelect.tabIndex = 0;
        rtSelect.style.backgroundColor = '';
        rtSelect.style.cursor = 'pointer';

        if (curRt && rtsInRw.includes(curRt)) {
            rtSelect.value = curRt;
        }
        return;
    }

    // Alur reguler untuk Admin/Pegawai Kelurahan
    rwSelect.disabled = false;
    rtSelect.disabled = false;
    rwSelect.style.pointerEvents = 'auto';
    rtSelect.style.pointerEvents = 'auto';
    rwSelect.style.backgroundColor = '';
    rtSelect.style.backgroundColor = '';
    rwSelect.style.cursor = '';
    rtSelect.style.cursor = '';

    let rtrwList = [];
    try {
        const res = await fetch('http://localhost:8000/src/data/api/get_rtrw.php');
        if (res.ok) {
            const json = await res.json();
            if (json.status === 'success' && Array.isArray(json.data)) {
                rtrwList = json.data;
            }
        }
    } catch (e) {
        // Gunakan fallback masterRtRwPurwantoro jika server API belum merespons
    }

    if (rtrwList.length === 0) {
        Object.keys(masterRtRwPurwantoro).forEach(rw => {
            masterRtRwPurwantoro[rw].forEach(rt => rtrwList.push({ rw, rt }));
        });
    }

    const uniqueRw = [...new Set(rtrwList.map(item => item.rw))].sort((a, b) => Number(a) - Number(b));

    rwSelect.innerHTML = '<option value="">Pilih RW</option>';
    uniqueRw.forEach(rw => {
        const opt = document.createElement('option');
        opt.value = rw;
        opt.textContent = `RW ${rw}`;
        if (savedRw && String(savedRw).padStart(2, '0') === rw) opt.selected = true;
        rwSelect.appendChild(opt);
    });

    const updateRt = (selectedRw, currentRt = '') => {
        rtSelect.innerHTML = '<option value="">Pilih RT</option>';
        if (!selectedRw) {
            rtSelect.disabled = true;
            return;
        }
        const filtered = rtrwList.filter(item => item.rw === selectedRw).sort((a, b) => Number(a.rt) - Number(b.rt));
        filtered.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.rt;
            opt.textContent = `RT ${item.rt}`;
            if (currentRt && String(currentRt).padStart(2, '0') === item.rt) opt.selected = true;
            rtSelect.appendChild(opt);
        });
        rtSelect.disabled = false;
    };

    rwSelect.onchange = (e) => updateRt(e.target.value);
    if (savedRw) updateRt(String(savedRw).padStart(2, '0'), savedRt);
}
