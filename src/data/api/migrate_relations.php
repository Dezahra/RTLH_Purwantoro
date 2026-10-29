<?php
header("Content-Type: text/plain; charset=UTF-8");
require_once __DIR__ . "/../config/database.php";

echo "=== MEMULAI MIGRASI STRUKTUR DATABASE TERELASI SIPELITA PURWANTORO ===\n\n";

try {
    // 0. Standarisasi collation seluruh tabel ke utf8mb4_unicode_ci
    echo "0. Menyelaraskan collation tabel ke utf8mb4_unicode_ci...\n";
    $pdo->exec("ALTER DATABASE `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("ALTER TABLE `rt_rws` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("ALTER TABLE `surveys` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "   -> Collation berhasil diselaraskan.\n";

    // 1. Pastikan tabel rt_rws memiliki indeks unik pada (rw, rt) dan kolom wilayah
    echo "1. Memeriksa dan memperbarui tabel rt_rws...\n";
    $cols = $pdo->query("SHOW COLUMNS FROM rt_rws")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('kelurahan', $cols)) {
        $pdo->exec("ALTER TABLE rt_rws ADD COLUMN kelurahan VARCHAR(100) DEFAULT 'Purwantoro' AFTER label");
    }
    if (!in_array('kecamatan', $cols)) {
        $pdo->exec("ALTER TABLE rt_rws ADD COLUMN kecamatan VARCHAR(100) DEFAULT 'Blimbing' AFTER kelurahan");
    }
    if (!in_array('kota', $cols)) {
        $pdo->exec("ALTER TABLE rt_rws ADD COLUMN kota VARCHAR(100) DEFAULT 'Kota Malang' AFTER kecamatan");
    }
    // Index unik pada rw dan rt jika belum ada
    $indices = $pdo->query("SHOW INDEX FROM rt_rws WHERE Key_name = 'idx_rt_rw'")->fetchAll();
    if (empty($indices)) {
        $pdo->exec("ALTER TABLE rt_rws ADD UNIQUE INDEX idx_rt_rw (rw, rt)");
    }
    echo "   -> Tabel rt_rws siap.\n";

    // 2. Perbarui tabel users: tambahkan rt_rw_id dan foreign key ke rt_rws(id)
    echo "2. Menyesuaikan tabel users...\n";
    $userCols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('rt_rw_id', $userCols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN rt_rw_id INT NULL AFTER jabatan");
    }

    // Update data wilayah di tabel users ke Purwantoro, Blimbing, Kota Malang
    $pdo->exec("
        UPDATE users 
        SET desa = 'Kelurahan Purwantoro', 
            kecamatan = 'Kecamatan Blimbing', 
            kabupaten = 'Kota Malang'
        WHERE desa LIKE '%Sukamaju%' OR desa LIKE '%Desa Purwantoro%' OR kecamatan LIKE '%Cilongok%' OR kabupaten LIKE '%Banyumas%'
    ");
    $pdo->exec("
        ALTER TABLE users 
        MODIFY COLUMN desa VARCHAR(100) DEFAULT 'Kelurahan Purwantoro',
        MODIFY COLUMN kecamatan VARCHAR(100) DEFAULT 'Kecamatan Blimbing',
        MODIFY COLUMN kabupaten VARCHAR(100) DEFAULT 'Kota Malang'
    ");

    // Sinkronkan rt_rw_id pada users berdasarkan rw dan rt
    $pdo->exec("
        UPDATE users u
        JOIN rt_rws r ON LPAD(TRIM(u.rw), 2, '0') = r.rw AND LPAD(TRIM(u.rt), 2, '0') = r.rt
        SET u.rt_rw_id = r.id
        WHERE u.rw IS NOT NULL AND u.rt IS NOT NULL AND u.rw != '' AND u.rt != ''
    ");

    // Pasang Foreign Key users.rt_rw_id -> rt_rws.id
    $fkCheck = $pdo->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_rt_rw'
    ")->fetch();
    if (!$fkCheck) {
        $pdo->exec("
            ALTER TABLE users 
            ADD CONSTRAINT fk_users_rt_rw 
            FOREIGN KEY (rt_rw_id) REFERENCES rt_rws(id) 
            ON UPDATE CASCADE ON DELETE SET NULL
        ");
    }
    echo "   -> Tabel users terhubung ke rt_rws melalui Foreign Key fk_users_rt_rw.\n";

    // 3. Perbarui tabel surveys: tambahkan rt_rw_id dan foto columns jika belum ada
    echo "3. Menyesuaikan tabel surveys...\n";
    $surveyCols = $pdo->query("SHOW COLUMNS FROM surveys")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('rt_rw_id', $surveyCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN rt_rw_id INT NULL AFTER rw");
    }
    if (!in_array('foto_depan', $surveyCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN foto_depan MEDIUMTEXT NULL AFTER revision_at");
    }
    if (!in_array('foto_dalam', $surveyCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN foto_dalam MEDIUMTEXT NULL AFTER foto_depan");
    }
    if (!in_array('foto_atap', $surveyCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN foto_atap MEDIUMTEXT NULL AFTER foto_dalam");
    }
    if (!in_array('foto_sanitasi', $surveyCols)) {
        $pdo->exec("ALTER TABLE surveys ADD COLUMN foto_sanitasi MEDIUMTEXT NULL AFTER foto_atap");
    }

    // Sinkronkan rt_rw_id pada surveys berdasarkan rw dan rt
    $pdo->exec("
        UPDATE surveys s
        JOIN rt_rws r ON LPAD(TRIM(s.rw), 2, '0') = r.rw AND LPAD(TRIM(s.rt), 2, '0') = r.rt
        SET s.rt_rw_id = r.id
        WHERE s.rw IS NOT NULL AND s.rt IS NOT NULL AND s.rw != '' AND s.rt != ''
    ");

    // Pasang Foreign Key surveys.rt_rw_id -> rt_rws.id
    $fkSurveyRtRw = $pdo->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = 'surveys' AND CONSTRAINT_NAME = 'fk_surveys_rt_rw'
    ")->fetch();
    if (!$fkSurveyRtRw) {
        $pdo->exec("
            ALTER TABLE surveys 
            ADD CONSTRAINT fk_surveys_rt_rw 
            FOREIGN KEY (rt_rw_id) REFERENCES rt_rws(id) 
            ON UPDATE CASCADE ON DELETE SET NULL
        ");
    }
    echo "   -> Tabel surveys terhubung ke rt_rws melalui Foreign Key fk_surveys_rt_rw.\n";

    // 4. Buat tabel survey_photos (Relasi One-to-Many dari surveys)
    echo "4. Menyiapkan tabel survey_photos...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `survey_photos` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `survey_id` VARCHAR(30) NOT NULL,
            `slot` VARCHAR(30) NOT NULL,
            `file_url` MEDIUMTEXT NOT NULL,
            `caption` VARCHAR(255) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_photo_survey` (`survey_id`),
            UNIQUE KEY `uk_survey_slot` (`survey_id`, `slot`),
            CONSTRAINT `fk_photos_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "   -> Tabel survey_photos siap dengan FK ke surveys(id).\n";

    // 5. Buat tabel survey_verifications (Relasi Verifikasi ke surveys dan users)
    echo "5. Menyiapkan tabel survey_verifications...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `survey_verifications` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `survey_id` VARCHAR(30) NOT NULL,
            `verifier_id` VARCHAR(30) NULL,
            `verifier_nama` VARCHAR(150) NULL,
            `status_sebelumnya` VARCHAR(50) NULL,
            `status_baru` ENUM('MENUNGGU_VALIDASI','TERVERIFIKASI','BUTUH_REVISI') NOT NULL,
            `catatan` TEXT NULL,
            `program_bantuan` VARCHAR(255) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_verif_survey` (`survey_id`),
            INDEX `idx_verif_user` (`verifier_id`),
            CONSTRAINT `fk_verif_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT `fk_verif_user` FOREIGN KEY (`verifier_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "   -> Tabel survey_verifications siap dengan FK ke surveys(id) & users(id).\n";

    // 6. Buat tabel kriteria_penilaian (Master 13 Parameter Teknis Standar Permen PUPR)
    echo "6. Menyiapkan tabel kriteria_penilaian...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `kriteria_penilaian` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `kode` VARCHAR(50) NOT NULL UNIQUE,
            `nama_parameter` VARCHAR(150) NOT NULL,
            `pilar` ENUM('KESELAMATAN_STRUKTUR','KOMPONEN_BAHAN','KESEHATAN_SANITASI','KECUKUPAN_RUANG') NOT NULL,
            `bobot_persen` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            `standar_kelayakan` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Masukkan data 13 parameter teknis PUPR
    $kriteriaList = [
        ['pondasi', 'Pondasi Bangunan', 'KESELAMATAN_STRUKTUR', 10.0, 'Ada, kondisi baik dan kokoh menopang beban'],
        ['sloof', 'Sloof / Balok Bawah', 'KESELAMATAN_STRUKTUR', 7.5, 'Ada, terbuat dari beton bertulang/kayu kuat'],
        ['kolom', 'Kolom Praktis / Tiang', 'KESELAMATAN_STRUKTUR', 7.5, 'Ada kolom pengikat dinding yang tegak & kokoh'],
        ['ring_balok', 'Ring Balok / Balok Atas', 'KESELAMATAN_STRUKTUR', 7.5, 'Ada balok pengikat atas penumpu rangka atap'],
        ['rangka_atap', 'Kuda-kuda & Rangka Atap', 'KESELAMATAN_STRUKTUR', 7.5, 'Kayu/baja ringan kokoh, tidak lapuk/melengkung'],
        ['dinding', 'Dinding Pengisi', 'KOMPONEN_BAHAN', 10.0, 'Tembok diplester, kedap air, tidak retak tembus'],
        ['lantai', 'Penutup Lantai', 'KOMPONEN_BAHAN', 10.0, 'Plester semen rata/keramik, tidak langsung tanah'],
        ['atap', 'Penutup Atap', 'KOMPONEN_BAHAN', 10.0, 'Genteng/seng utuh, tidak bocor/asbes pecah'],
        ['sanitasi', 'Fasilitas Jamban & Sanitasi', 'KESEHATAN_SANITASI', 10.0, 'Jamban leher angsa sendiri terhubung tangki septik'],
        ['sumber_air', 'Sumber Air Minum Utama', 'KESEHATAN_SANITASI', 5.0, 'Air PDAM / sumur bor terlindung dari pencemaran'],
        ['pencahayaan', 'Pencahayaan Alami', 'KESEHATAN_SANITASI', 5.0, 'Terang pada siang hari tanpa bantuan lampu'],
        ['penghawaan', 'Penghawaan / Ventilasi', 'KESEHATAN_SANITASI', 5.0, 'Sirkulasi udara lancar, luas bukaan ventilasi >= 5%'],
        ['luas_ruang', 'Kecukupan Luas Ruang', 'KECUKUPAN_RUANG', 5.0, 'Luas lantai minimal >= 7.2 m² per penghuni rumah']
    ];

    $stmtKriteria = $pdo->prepare("
        INSERT INTO `kriteria_penilaian` (`kode`, `nama_parameter`, `pilar`, `bobot_persen`, `standar_kelayakan`)
        VALUES (:kode, :nama, :pilar, :bobot, :standar)
        ON DUPLICATE KEY UPDATE 
            `nama_parameter` = VALUES(`nama_parameter`),
            `pilar` = VALUES(`pilar`),
            `bobot_persen` = VALUES(`bobot_persen`),
            `standar_kelayakan` = VALUES(`standar_kelayakan`)
    ");
    foreach ($kriteriaList as $k) {
        $stmtKriteria->execute([
            ':kode'    => $k[0],
            ':nama'    => $k[1],
            ':pilar'   => $k[2],
            ':bobot'   => $k[3],
            ':standar' => $k[4]
        ]);
    }
    echo "   -> Tabel kriteria_penilaian siap dengan 13 Parameter PUPR.\n";

    // 7. Buat tabel survey_parameter_scores (Relasi Penilaian Detail ke surveys dan kriteria_penilaian)
    echo "7. Menyiapkan tabel survey_parameter_scores...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `survey_parameter_scores` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `survey_id` VARCHAR(30) NOT NULL,
            `kriteria_id` INT NOT NULL,
            `nilai_opsi` VARCHAR(100) NULL,
            `skor` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            `keterangan_kondisi` VARCHAR(255) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_scores_survey` (`survey_id`),
            INDEX `idx_scores_kriteria` (`kriteria_id`),
            UNIQUE KEY `uk_survey_kriteria` (`survey_id`, `kriteria_id`),
            CONSTRAINT `fk_scores_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT `fk_scores_kriteria` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria_penilaian` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "   -> Tabel survey_parameter_scores siap dengan FK ke surveys(id) & kriteria_penilaian(id).\n";
    echo "   -> Tabel survey_parameter_scores siap dengan FK ke surveys(id) & kriteria_penilaian(id).\n";

    // 8. Sinkronisasi data detail parameter untuk survei yang ada
    echo "8. Melakukan sinkronisasi data detail parameter dari survei lama...\n";
    $existingSurveys = $pdo->query("SELECT * FROM surveys")->fetchAll(PDO::FETCH_ASSOC);
    $kriteriaMap = $pdo->query("SELECT kode, id FROM kriteria_penilaian")->fetchAll(PDO::FETCH_KEY_PAIR);

    $stmtScore = $pdo->prepare("
        INSERT INTO `survey_parameter_scores` (`survey_id`, `kriteria_id`, `nilai_opsi`, `skor`, `keterangan_kondisi`)
        VALUES (:s_id, :k_id, :opsi, :skor, :ket)
        ON DUPLICATE KEY UPDATE `nilai_opsi` = VALUES(`nilai_opsi`), `skor` = VALUES(`skor`), `keterangan_kondisi` = VALUES(`keterangan_kondisi`)
    ");

    foreach ($existingSurveys as $s) {
        foreach ($kriteriaMap as $kode => $kId) {
            $val = $s[$kode] ?? null;
            if ($kode === 'luas_ruang') {
                $val = ($s['luas_per_jiwa'] ?? null) ? $s['luas_per_jiwa'] . " m²/jiwa" : null;
            }
            if ($val !== null) {
                $stmtScore->execute([
                    ':s_id'  => $s['id'],
                    ':k_id'  => $kId,
                    ':opsi'  => (string)$val,
                    ':skor'  => 100.0, // default placeholder
                    ':ket'   => "Terekam dari survei {$s['id']}"
                ]);
            }
        }

        // Sinkronkan foto jika ada kolom foto
        $photoSlots = ['depan' => $s['foto_depan'] ?? null, 'dalam' => $s['foto_dalam'] ?? null, 'atap' => $s['foto_atap'] ?? null, 'sanitasi' => $s['foto_sanitasi'] ?? null];
        $stmtPhoto = $pdo->prepare("
            INSERT INTO `survey_photos` (`survey_id`, `slot`, `file_url`, `caption`)
            VALUES (:s_id, :slot, :url, :caption)
            ON DUPLICATE KEY UPDATE `file_url` = VALUES(`file_url`)
        ");
        foreach ($photoSlots as $slot => $url) {
            if (!empty($url)) {
                $stmtPhoto->execute([
                    ':s_id'    => $s['id'],
                    ':slot'    => $slot,
                    ':url'     => $url,
                    ':caption' => "Foto $slot {$s['nama_kk']}"
                ]);
            }
        }
    }
    echo "   -> Sinkronisasi detail parameter selesai.\n\n";

    echo "=== SUKSES! SEMUA TABEL TELAH TERHUBUNG DAN BERELASI LENGKAP ===\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
