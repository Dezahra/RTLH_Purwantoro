<?php
header("Content-Type: application/json");
require_once __DIR__ . "/../config/database.php";

try {
    // Cek apakah kolom no_urut_bnba sudah ada
    $check = $pdo->query("SHOW COLUMNS FROM surveys LIKE 'no_urut_bnba'");
    if ($check->rowCount() === 0) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN no_urut_bnba VARCHAR(30) NULL AFTER no_kk");
        $status = "Kolom no_urut_bnba berhasil ditambahkan ke tabel surveys.";
    } else {
        $status = "Kolom no_urut_bnba sudah ada.";
    }
    
    // Update data lama yang belum punya nomor urut BNBA jika ada
    $surveysWithoutBnba = $pdo->query("SELECT id FROM surveys WHERE no_urut_bnba IS NULL OR no_urut_bnba = '' ORDER BY created_at ASC")->fetchAll(PDO::FETCH_COLUMN);
    $updatedCount = 0;
    foreach ($surveysWithoutBnba as $idx => $sId) {
        $bnbaVal = "BNBA-2026-" . str_pad($idx + 1, 3, "0", STR_PAD_LEFT);
        $stmtUp = $pdo->prepare("UPDATE surveys SET no_urut_bnba = :bnba WHERE id = :id");
        $stmtUp->execute([':bnba' => $bnbaVal, ':id' => $sId]);
        $updatedCount++;
    }

    echo json_encode([
        "success" => true,
        "status" => $status,
        "backfilled_count" => $updatedCount
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
