<?php
require_once __DIR__ . "/../config/database.php";

$stmt = $pdo->query("SHOW COLUMNS FROM surveys");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
$existingCols = [];
foreach ($cols as $c) {
    $existingCols[] = $c['Field'];
    echo $c['Field'] . " (" . $c['Type'] . ")\n";
}

// Columns to check/add:
// nilai_umk BIGINT / DECIMAL
// penghasilan_nominal BIGINT
// aset_rumah_lain VARCHAR(10)
// lama_tinggal INT

$toAdd = [
    'nilai_umk' => "DECIMAL(14,2) DEFAULT 3736101.00 AFTER penghasilan",
    'penghasilan_nominal' => "DECIMAL(14,2) NULL AFTER penghasilan",
    'aset_rumah_lain' => "VARCHAR(10) DEFAULT 'Tidak' AFTER status_rumah",
    'lama_tinggal' => "INT DEFAULT 1 AFTER usia"
];

foreach ($toAdd as $col => $def) {
    if (!in_array($col, $existingCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN $col $def");
        echo "ADDED: $col\n";
    } else {
        echo "ALREADY EXISTS: $col\n";
    }
}
