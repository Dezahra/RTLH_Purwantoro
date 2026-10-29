<?php

header("Content-Type: application/json");

require_once "../config/database.php";

try {

    $stmt = $pdo->query("
        SELECT
            id,
            role,
            username,
            nama,
            nip,
            id_petugas,
            jabatan,
            wilayah_tugas,
            desa,
            kecamatan,
            kabupaten,
            telepon,
            email,
            status,
            avatar,
            registered_at,
            approved_at,
            approved_by
        FROM users
        ORDER BY registered_at DESC
    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "total" => count($users),
        "data" => $users
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil data users",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}