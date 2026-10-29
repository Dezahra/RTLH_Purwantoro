<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    // Ambil data RT/RW urut berdasarkan RW dan RT
    $stmt = $pdo->query("SELECT id, kode, rw, rt, label FROM rt_rws ORDER BY CAST(rw AS UNSIGNED) ASC, CAST(rt AS UNSIGNED) ASC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $data
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal mengambil data RT/RW: ' . $e->getMessage()
    ]);
}