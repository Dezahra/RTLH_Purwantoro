<?php

header("Content-Type: application/json");

require_once "../config/database.php";

try {

    $users = $pdo->query("SELECT COUNT(*) AS total FROM users")
                 ->fetch(PDO::FETCH_ASSOC);

    $surveys = $pdo->query("SELECT COUNT(*) AS total FROM surveys")
                   ->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "database" => "sipelita_desa",
        "tables" => [
            "users" => (int) $users["total"],
            "surveys" => (int) $surveys["total"]
        ]
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal membaca tabel",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}