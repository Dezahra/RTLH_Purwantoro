<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php";

try {
    $stmt = $pdo->prepare("
        SELECT s.*, 
               r.label AS rtrw_label, 
               u.nama AS surveyor_nama,
               u.jabatan AS surveyor_jabatan
        FROM surveys s
        LEFT JOIN rt_rws r ON s.rt_rw_id = r.id
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.created_at DESC
    ");
    $stmt->execute();
    $surveys = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Ambil foto dari tabel relasi survey_photos jika ada
    $stmtPhotos = $pdo->query("SELECT survey_id, slot, file_url FROM survey_photos");
    $allPhotos = $stmtPhotos->fetchAll(PDO::FETCH_ASSOC);
    $photosBySurvey = [];
    foreach ($allPhotos as $ph) {
        $photosBySurvey[$ph['survey_id']]['foto_' . $ph['slot']] = $ph['file_url'];
    }

    foreach ($surveys as &$item) {
        if (isset($item['skor_total'])) $item['skor_total'] = (float)$item['skor_total'];
        if (isset($item['usia'])) $item['usia'] = (int)$item['usia'];
        if (isset($item['jumlah_jiwa'])) $item['jumlah_jiwa'] = (int)$item['jumlah_jiwa'];
        if (isset($item['jumlah_lansia_balita'])) $item['jumlah_lansia_balita'] = (int)$item['jumlah_lansia_balita'];
        if (isset($item['lama_tinggal'])) $item['lama_tinggal'] = (int)$item['lama_tinggal'];
        if (isset($item['luas_bangunan'])) $item['luas_bangunan'] = (float)$item['luas_bangunan'];
        if (isset($item['luas_per_jiwa'])) $item['luas_per_jiwa'] = (float)$item['luas_per_jiwa'];
        if (isset($item['latitude'])) $item['latitude'] = (float)$item['latitude'];
        if (isset($item['longitude'])) $item['longitude'] = (float)$item['longitude'];
        if (!isset($item['akurasi_gps']) || $item['akurasi_gps'] === null || $item['akurasi_gps'] === '') {
            $item['akurasi_gps'] = '0';
        }

        // Lengkapi foto dari tabel survey_photos jika kolom survey belum terisi
        if (isset($photosBySurvey[$item['id']])) {
            foreach ($photosBySurvey[$item['id']] as $k => $v) {
                if (empty($item[$k])) {
                    $item[$k] = $v;
                }
            }
        }

        // Decode JSON breakdown jika tersimpan sebagai JSON string di DB
        if (!empty($item['breakdown']) && is_string($item['breakdown'])) {
            $item['breakdown'] = json_decode($item['breakdown'], true);
        }
    }
    unset($item); // Putus referensi pointer memori

    echo json_encode([
        "success" => true,
        "data" => $surveys
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil data survei: " . $e->getMessage()
    ]);
}
?>