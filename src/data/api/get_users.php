<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php";

try {
    // Ambil semua kolom penugasan termasuk rw, rt, jabatan, telepon, status, dsb
    $sql = "SELECT u.id, u.username, u.nama, u.role, u.nip, u.id_petugas, 
                   u.rt_rw_id, u.rw, u.rt, r.label AS rtrw_label, u.wilayah_tugas, 
                   u.desa, u.kecamatan, u.kabupaten, u.jabatan, 
                   u.telepon, u.telepon AS no_hp, u.email, u.avatar, u.status, 
                   COALESCE(u.registered_at, u.created_at, NOW()) AS registered_at,
                   COALESCE(u.created_at, u.registered_at, NOW()) AS created_at,
                   u.approved_at, u.approved_by, 
                   u.rejected_at, u.reject_reason, u.rejected_by
            FROM users u
            LEFT JOIN rt_rws r ON u.rt_rw_id = r.id
            ORDER BY u.id DESC";
    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $users
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>