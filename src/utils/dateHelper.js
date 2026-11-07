/**
 * Helper pemformatan tanggal resmi bahasa Indonesia untuk aplikasi SIPELITA
 */

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const NAMA_BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

/**
 * Format tanggal ke standar Indonesia
 * @param {string|Date|number} input - String tanggal, objek Date, atau timestamp
 * @param {'long'|'short'|'numeric'|'full'} format - Format tampilan
 * @returns {string} Tanggal terformat (contoh: "5 November 2026" atau "05 Nov 2026")
 */
export function formatDateIndo(input, format = 'long') {
  if (!input || input === '-' || String(input).trim() === '') return '-';

  try {
    let year, month, day;

    if (typeof input === 'string') {
      const clean = input.trim();
      // Handle string format YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss...
      const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      }
    }

    if (year === undefined) {
      const d = new Date(input);
      if (isNaN(d.getTime())) return String(input);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    const dayStr = String(day).padStart(2, '0');
    const monthName = NAMA_BULAN[month] || `Bulan-${month + 1}`;
    const monthShort = NAMA_BULAN_SINGKAT[month] || monthName.slice(0, 3);

    if (format === 'short') {
      return `${dayStr} ${monthShort} ${year}`;
    }

    if (format === 'numeric') {
      const mStr = String(month + 1).padStart(2, '0');
      return `${dayStr}/${mStr}/${year}`;
    }

    // Default 'long': "5 November 2026"
    return `${day} ${monthName} ${year}`;
  } catch (e) {
    return String(input);
  }
}
