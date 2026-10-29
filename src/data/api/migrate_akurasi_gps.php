<?php
require __DIR__ . '/../config/database.php';

try {
    $check = $pdo->query("SHOW COLUMNS FROM surveys LIKE 'akurasi_gps'");
    if ($check->rowCount() === 0) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN akurasi_gps VARCHAR(50) DEFAULT '0' AFTER longitude");
        echo "Kolom akurasi_gps berhasil ditambahkan ke tabel surveys.\n";
    } else {
        echo "Kolom akurasi_gps sudah ada di tabel surveys.\n";
    }

    $pdo->exec("UPDATE surveys SET akurasi_gps = '0' WHERE akurasi_gps IS NULL OR akurasi_gps = ''");
    echo "Data lama berhasil diperbarui dengan default akurasi_gps = '0'.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
