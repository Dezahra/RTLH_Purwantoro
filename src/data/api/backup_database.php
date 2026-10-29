<?php
/**
 * API Pencadangan (Backup) & Pemulihan (Restore) Database SIPELITA Purwantoro
 * Menghasilkan arsip .ZIP berisi:
 * 1. database_dump.sql (Skema & Data MySQL Lengkap)
 * 2. data_survei_rtlh.json (Dataset Survei JSON)
 * 3. data_pengguna_sistem.json (Akun & Petugas JSON)
 * 4. data_master_rtrw.json (Master RT/RW JSON)
 * 5. data_survei_lengkap.csv (Format Tabel Excel CSV)
 * 6. manifest_cadangan.json (Metadata & Statistik)
 * 7. README_PANDUAN_PEMULIHAN.txt (Panduan Restorasi)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/../config/database.php";

$action = $_GET['action'] ?? $_POST['action'] ?? 'stats';

// -----------------------------------------------------------------------------
// 1. STATS ACTION: Mengembalikan info jumlah data & status database
// -----------------------------------------------------------------------------
if ($action === 'stats') {
    header("Content-Type: application/json; charset=UTF-8");
    try {
        $tables = ['surveys', 'users', 'rt_rws', 'survey_photos', 'survey_verifications', 'kriteria_penilaian'];
        $counts = [];

        foreach ($tables as $tbl) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM `$tbl`");
                $counts[$tbl] = (int)$stmt->fetchColumn();
            } catch (Exception $e) {
                $counts[$tbl] = 0;
            }
        }

        // Statistik klasifikasi kelayakan
        $statsKelayakan = [
            'rlh' => 0,
            'rtlh_ringan' => 0,
            'rtlh_sedang' => 0,
            'rtlh_berat' => 0
        ];
        try {
            $stmt = $pdo->query("
                SELECT kategori_kelayakan, COUNT(*) as jml 
                FROM surveys 
                GROUP BY kategori_kelayakan
            ");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $k = strtolower($row['kategori_kelayakan'] ?? '');
                if (str_contains($k, 'rlh') && !str_contains($k, 'rtlh')) $statsKelayakan['rlh'] = (int)$row['jml'];
                elseif (str_contains($k, 'ringan')) $statsKelayakan['rtlh_ringan'] = (int)$row['jml'];
                elseif (str_contains($k, 'sedang')) $statsKelayakan['rtlh_sedang'] = (int)$row['jml'];
                elseif (str_contains($k, 'berat')) $statsKelayakan['rtlh_berat'] = (int)$row['jml'];
            }
        } catch (Exception $e) {}

        // Perkiraan ukuran database di MySQL
        $sizeBytes = 0;
        try {
            $stmt = $pdo->prepare("
                SELECT SUM(data_length + index_length) AS size 
                FROM information_schema.TABLES 
                WHERE table_schema = :db
            ");
            $stmt->execute([':db' => $dbname]);
            $sizeBytes = (int)$stmt->fetchColumn();
        } catch (Exception $e) {}

        echo json_encode([
            "success" => true,
            "database" => $dbname,
            "kelurahan" => "Kelurahan Purwantoro",
            "kecamatan" => "Kecamatan Blimbing",
            "kota" => "Kota Malang",
            "counts" => $counts,
            "stats_kelayakan" => $statsKelayakan,
            "size_bytes" => $sizeBytes,
            "size_formatted" => formatBytes($sizeBytes),
            "zip_supported" => class_exists('ZipArchive'),
            "server_time" => date('Y-m-d H:i:s'),
            "server_time_iso" => date('c')
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit();
    }
}

// -----------------------------------------------------------------------------
// 2. DOWNLOAD ZIP ACTION: Membuat arsip ZIP cadangan dan mengirimkan file
// -----------------------------------------------------------------------------
if ($action === 'download_zip' || $action === 'download') {
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "message" => "Modul PHP ZipArchive tidak aktif pada server."]);
        exit();
    }

    try {
        $actorName = $_GET['actor_name'] ?? $_POST['actor_name'] ?? 'Admin / Pegawai Kelurahan';
        $timestamp = date('Y-m-d_His');
        $dateReadable = date('d F Y, H:i:s T');
        $zipFilename = "SIPELITA_PURWANTORO_BACKUP_{$timestamp}.zip";

        // Tabel yang akan diexport berurutan (induk sebelum anak)
        $tablesToDump = ['rt_rws', 'users', 'kriteria_penilaian', 'surveys', 'survey_photos', 'survey_verifications'];
        $existingTables = [];
        foreach ($tablesToDump as $t) {
            $chk = $pdo->query("SHOW TABLES LIKE '$t'")->fetchColumn();
            if ($chk) $existingTables[] = $t;
        }

        // A. Generate SQL Dump
        $sqlDump = "-- ==========================================================================\n";
        $sqlDump .= "-- SIPELITA PURWANTORO - PENCADANGAN BASIS DATA LENGKAP (SQL DUMP)\n";
        $sqlDump .= "-- Wilayah       : Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang\n";
        $sqlDump .= "-- Database      : {$dbname}\n";
        $sqlDump .= "-- Waktu Ekspor  : {$dateReadable}\n";
        $sqlDump .= "-- Diekspor Oleh : {$actorName}\n";
        $sqlDump .= "-- PHP Version   : " . PHP_VERSION . "\n";
        $sqlDump .= "-- ==========================================================================\n\n";
        $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sqlDump .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
        $sqlDump .= "SET time_zone = '+07:00';\n";
        $sqlDump .= "SET NAMES utf8mb4;\n\n";

        $tableCounts = [];

        foreach ($existingTables as $table) {
            $createTableStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_ASSOC);
            $createTableSql = $createTableStmt['Create Table'] ?? '';

            $sqlDump .= "-- --------------------------------------------------------------------------\n";
            $sqlDump .= "-- Struktur tabel untuk `{$table}`\n";
            $sqlDump .= "-- --------------------------------------------------------------------------\n";
            $sqlDump .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sqlDump .= $createTableSql . ";\n\n";

            // Data rows
            $dataRows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
            $tableCounts[$table] = count($dataRows);

            if (!empty($dataRows)) {
                $sqlDump .= "-- Dumping data untuk tabel `{$table}` (" . count($dataRows) . " baris)\n";
                $columns = array_keys($dataRows[0]);
                $colNames = implode('`, `', $columns);

                // Batching insert per 50 rows
                $chunkSize = 50;
                $chunks = array_chunk($dataRows, $chunkSize);

                foreach ($chunks as $chunk) {
                    $valuesArr = [];
                    foreach ($chunk as $row) {
                        $escapedValues = [];
                        foreach ($columns as $col) {
                            $val = $row[$col];
                            if ($val === null) {
                                $escapedValues[] = 'NULL';
                            } else {
                                $escapedValues[] = $pdo->quote($val);
                            }
                        }
                        $valuesArr[] = "(" . implode(', ', $escapedValues) . ")";
                    }
                    $sqlDump .= "INSERT INTO `{$table}` (`{$colNames}`) VALUES\n" . implode(",\n", $valuesArr) . ";\n";
                }
                $sqlDump .= "\n";
            }
        }

        $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $sqlDump .= "-- === AKHIR DARI SQL DUMP SIPELITA PURWANTORO ===\n";

        // B. Generate JSON Datasets
        // 1. Surveys JSON
        $surveys = [];
        try {
            $surveys = $pdo->query("
                SELECT s.*, 
                       r.label AS rtrw_label, 
                       u.nama AS surveyor_nama,
                       u.jabatan AS surveyor_jabatan
                FROM surveys s
                LEFT JOIN rt_rws r ON s.rt_rw_id = r.id
                LEFT JOIN users u ON s.created_by = u.id
                ORDER BY s.id ASC
            ")->fetchAll(PDO::FETCH_ASSOC);

            // Format breakdown
            foreach ($surveys as &$s) {
                if (!empty($s['breakdown']) && is_string($s['breakdown'])) {
                    $dec = json_decode($s['breakdown'], true);
                    if ($dec) $s['breakdown'] = $dec;
                }
            }
            unset($s);
        } catch (Exception $e) {}

        // 2. Users JSON (tanpa membocorkan salt plain, hash tetap disertakan untuk kemudahan restore)
        $users = [];
        try {
            $users = $pdo->query("
                SELECT id, role, username, password, nama, nip, id_petugas, jabatan, 
                       rt_rw_id, rw, rt, wilayah_tugas, desa, kecamatan, kabupaten, 
                       telepon, email, status, avatar, registered_at, approved_at, 
                       approved_by, rejected_at, reject_reason, created_at, updated_at
                FROM users 
                ORDER BY role ASC, id ASC
            ")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}

        // 3. RT/RW JSON
        $rtrws = [];
        try {
            $rtrws = $pdo->query("SELECT * FROM rt_rws ORDER BY rw ASC, rt ASC")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}

        // C. Generate CSV Export untuk Surveys
        $csvContent = "\xEF\xBB\xBF"; // UTF-8 BOM
        $csvHeaders = [
            "ID Survey", "No Urut BNBA", "Tanggal Survey", "Petugas Lapangan",
            "NIK", "No KK", "Nama Kepala Keluarga", "Jenis Kelamin", "Usia",
            "Lama Huni (Thn)", "RW", "RT", "Jumlah Jiwa",
            "Pekerjaan", "Penghasilan", "Penghasilan Nominal", "Nilai UMK",
            "Status Rumah", "Aset Rumah Lain", "Status Tanah",
            "Skor Kelayakan", "Kategori Kelayakan",
            "1. Pondasi", "2. Sloof", "3. Kolom", "4. Ring Balok", "5. Rangka Atap",
            "6. Dinding", "7. Lantai", "8. Penutup Atap", "9. Fasilitas Sanitasi",
            "10. Sumber Air Minum", "11. Pencahayaan", "12. Penghawaan",
            "13. Luas Bangunan (m2)", "Luas Lantai per Jiwa (m2/jiwa)",
            "SPAL", "Sumber Listrik",
            "Latitude", "Longitude", "Akurasi GPS (m)",
            "Status Verifikasi", "Catatan Admin", "Program Bantuan"
        ];
        $csvContent .= implode(';', array_map(fn($h) => '"' . str_replace('"', '""', $h) . '"', $csvHeaders)) . "\n";

        foreach ($surveys as $item) {
            $row = [
                $item['id'] ?? '',
                $item['no_urut_bnba'] ?? '',
                $item['tanggal_survey'] ?? '',
                $item['petugas_nama'] ?? '',
                "'" . ($item['nik'] ?? ''),
                "'" . ($item['no_kk'] ?? ''),
                $item['nama_kk'] ?? '',
                $item['jenis_kelamin'] ?? '',
                $item['usia'] ?? '',
                $item['lama_tinggal'] ?? '',
                $item['rw'] ?? '',
                $item['rt'] ?? '',
                $item['jumlah_jiwa'] ?? '',
                $item['pekerjaan'] ?? '',
                $item['penghasilan'] ?? '',
                $item['penghasilan_nominal'] ?? '',
                $item['nilai_umk'] ?? '3736101',
                $item['status_rumah'] ?? '',
                $item['aset_rumah_lain'] ?? 'Tidak',
                $item['status_tanah'] ?? '',
                $item['skor_total'] ?? '',
                $item['kategori_label'] ?? '',
                $item['pondasi'] ?? '',
                $item['sloof'] ?? '',
                $item['kolom'] ?? '',
                $item['ring_balok'] ?? '',
                $item['rangka_atap'] ?? '',
                $item['dinding'] ?? '',
                $item['lantai'] ?? '',
                $item['atap'] ?? '',
                $item['sanitasi'] ?? '',
                $item['sumber_air'] ?? '',
                $item['pencahayaan'] ?? '',
                $item['penghawaan'] ?? '',
                $item['luas_bangunan'] ?? '',
                $item['luas_per_jiwa'] ?? '',
                $item['spal'] ?? '',
                $item['sumber_listrik'] ?? '',
                $item['latitude'] ?? '',
                $item['longitude'] ?? '',
                $item['akurasi_gps'] ?? '0',
                $item['status_verifikasi'] ?? '',
                $item['catatan_admin'] ?? '',
                $item['program_bantuan'] ?? ''
            ];
            $csvContent .= implode(';', array_map(fn($v) => '"' . str_replace('"', '""', (string)$v) . '"', $row)) . "\n";
        }

        // D. Generate Manifest JSON
        $manifest = [
            "aplikasi" => "SIPELITA (Sistem Informasi Pendataan Kelayakan Rumah Tinggal)",
            "entitas" => "Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang",
            "versi_sistem" => "2.5.0",
            "waktu_cadangan" => date('c'),
            "waktu_cadangan_lokal" => $dateReadable,
            "dibuat_oleh" => $actorName,
            "total_tabel" => count($existingTables),
            "ringkasan_data" => $tableCounts,
            "arsip_berkas" => [
                "database_dump.sql" => "Skema DDL & DML lengkap MySQL untuk impor phpMyAdmin / CLI",
                "data_survei_rtlh.json" => "Seluruh berkas survei rumah beserta skor dan koordinat",
                "data_pengguna_sistem.json" => "Daftar akun admin, pegawai, dan enumerator lapangan",
                "data_master_rtrw.json" => "Daftar RT dan RW resmi Kelurahan Purwantoro",
                "data_survei_lengkap.csv" => "Data tabular untuk pengolahan spreadsheet Microsoft Excel",
                "manifest_cadangan.json" => "Metadata integritas dan rincian berkas pencadangan",
                "README_PANDUAN_PEMULIHAN.txt" => "Instruksi cara memulihkan / sinkronisasi data"
            ]
        ];

        // E. Generate README
        $readme = "===============================================================================\n";
        $readme .= "PANDUAN PEMULIHAN & SINKRONISASI DATA SIPELITA KELURAHAN PURWANTORO\n";
        $readme .= "===============================================================================\n\n";
        $readme .= "Berkas ini dihasilkan secara otomatis oleh fitur Pencadangan Database SIPELITA.\n";
        $readme .= "Tanggal Pencadangan: {$dateReadable}\n";
        $readme .= "Oleh: {$actorName}\n\n";
        $readme .= "CARA PEMULIHAN (RESTORE) DATA:\n";
        $readme .= "1. Melalui Menu Aplikasi SIPELITA:\n";
        $readme .= "   - Masuk sebagai Admin / Pegawai Kelurahan.\n";
        $readme .= "   - Buka menu 'Cadangkan Database'.\n";
        $readme .= "   - Pada bagian 'Pulihkan & Sinkronkan Data', unggah file ZIP ini.\n";
        $readme .= "   - Klik tombol 'Unggah & Sinkronkan Data'.\n\n";
        $readme .= "2. Melalui phpMyAdmin:\n";
        $readme .= "   - Buka phpMyAdmin (http://localhost/phpmyadmin).\n";
        $readme .= "   - Pilih database '{$dbname}'.\n";
        $readme .= "   - Masuk ke tab 'Import'.\n";
        $readme .= "   - Pilih file 'database_dump.sql' dari dalam ZIP ini.\n";
        $readme .= "   - Klik 'Go' / 'Kirim'.\n\n";
        $readme .= "3. Melalui MySQL Command Line (CLI):\n";
        $readme .= "   mysql -u root -p {$dbname} < database_dump.sql\n\n";
        $readme .= "PENTING: Simpan arsip ZIP ini di tempat yang aman (Flashdisk/Google Drive Dinas)\n";
        $readme .= "sebagai salinan cadangan berkala Kelurahan Purwantoro.\n";

        // F. Masukkan ke file ZIP sementara
        $tempZip = tempnam(sys_get_temp_dir(), 'sipelita_bak_') . '.zip';
        $zip = new ZipArchive();

        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new Exception("Gagal membuat arsip ZIP sementara.");
        }

        $zip->addFromString('database_dump.sql', $sqlDump);
        $zip->addFromString('data_survei_rtlh.json', json_encode($surveys, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $zip->addFromString('data_pengguna_sistem.json', json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $zip->addFromString('data_master_rtrw.json', json_encode($rtrws, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $zip->addFromString('data_survei_lengkap.csv', $csvContent);
        $zip->addFromString('manifest_cadangan.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $zip->addFromString('README_PANDUAN_PEMULIHAN.txt', $readme);
        $zip->close();

        // G. Kirim file ZIP ke browser
        if (ob_get_level()) ob_end_clean();

        header("Content-Type: application/zip");
        header("Content-Disposition: attachment; filename=\"{$zipFilename}\"");
        header("Content-Length: " . filesize($tempZip));
        header("Cache-Control: no-cache, no-store, must-revalidate");
        header("Pragma: no-cache");
        header("Expires: 0");

        readfile($tempZip);
        @unlink($tempZip);
        exit();

    } catch (Exception $e) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "message" => "Gagal membuat cadangan ZIP: " . $e->getMessage()]);
        exit();
    }
}

// -----------------------------------------------------------------------------
// 3. RESTORE / SYNC ACTION: Memulihkan atau sinkronisasi data dari file upload
// -----------------------------------------------------------------------------
if ($action === 'restore' || $action === 'sync') {
    header("Content-Type: application/json; charset=UTF-8");

    if (empty($_FILES['backup_file']) || $_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Berkas cadangan tidak ditemukan atau gagal diunggah."]);
        exit();
    }

    $uploadedFile = $_FILES['backup_file']['tmp_name'];
    $fileName = $_FILES['backup_file']['name'];
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $sqlToExecute = null;
    $jsonData = null;

    try {
        if ($ext === 'zip') {
            if (!class_exists('ZipArchive')) {
                throw new Exception("Modul PHP ZipArchive tidak tersedia untuk membuka file ZIP.");
            }
            $zip = new ZipArchive();
            if ($zip->open($uploadedFile) !== true) {
                throw new Exception("Gagal mengekstrak berkas ZIP yang diunggah.");
            }

            // Cari file SQL terlebih dahulu
            $sqlContent = $zip->getFromName('database_dump.sql');
            if ($sqlContent !== false && strlen(trim($sqlContent)) > 10) {
                $sqlToExecute = $sqlContent;
            } else {
                // Fallback cari JSON
                $jsonSurveys = $zip->getFromName('data_survei_rtlh.json');
                $jsonUsers = $zip->getFromName('data_pengguna_sistem.json');
                if ($jsonSurveys !== false) {
                    $jsonData = [
                        'surveys' => json_decode($jsonSurveys, true),
                        'users' => $jsonUsers ? json_decode($jsonUsers, true) : []
                    ];
                }
            }
            $zip->close();
        } elseif ($ext === 'sql') {
            $sqlToExecute = file_get_contents($uploadedFile);
        } elseif ($ext === 'json') {
            $raw = file_get_contents($uploadedFile);
            $parsed = json_decode($raw, true);
            if (is_array($parsed)) {
                if (isset($parsed['surveys'])) {
                    $jsonData = $parsed;
                } else {
                    $jsonData = ['surveys' => $parsed];
                }
            }
        } else {
            throw new Exception("Format berkas tidak didukung. Harap unggah file .ZIP, .SQL, atau .JSON.");
        }

        // Eksekusi Pemulihan
        if ($sqlToExecute) {
            // Nonaktifkan pemeriksaan kunci asing sementara
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            // Pisahkan statement berdasarkan titik koma di akhir baris
            $statements = array_filter(
                array_map('trim', explode(";\n", $sqlToExecute)),
                fn($q) => !empty($q) && !str_starts_with($q, '--')
            );

            $executedCount = 0;
            foreach ($statements as $stmt) {
                if (!empty($stmt)) {
                    $pdo->exec($stmt);
                    $executedCount++;
                }
            }

            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            // Dapatkan jumlah terbaru
            $countSurveys = (int)$pdo->query("SELECT COUNT(*) FROM surveys")->fetchColumn();
            $countUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

            echo json_encode([
                "success" => true,
                "message" => "Basis data berhasil dipulihkan dari SQL dump.",
                "total_queries" => $executedCount,
                "surveys_count" => $countSurveys,
                "users_count" => $countUsers
            ]);
            exit();

        } elseif ($jsonData && !empty($jsonData['surveys'])) {
            $pdo->beginTransaction();
            $surveyCount = 0;

            foreach ($jsonData['surveys'] as $s) {
                if (empty($s['id'])) continue;

                $cols = [
                    'id', 'no_urut_bnba', 'created_by', 'petugas_nama', 'petugas_id', 'tanggal_survey',
                    'nik', 'no_kk', 'nama_kk', 'jenis_kelamin', 'usia', 'lama_tinggal',
                    'rw', 'rt', 'rt_rw_id', 'alamat_lengkap', 'jumlah_jiwa', 'jumlah_lansia_balita',
                    'pekerjaan', 'penghasilan', 'penghasilan_nominal', 'nilai_umk', 'bansos_diterima',
                    'status_rumah', 'aset_rumah_lain', 'status_tanah', 'skor_total', 'kategori_kelayakan',
                    'kategori_label', 'status_color', 'rekomendasi_sistem', 'pondasi', 'sloof', 'kolom',
                    'ring_balok', 'rangka_atap', 'atap', 'dinding', 'lantai', 'ventilasi', 'sanitasi',
                    'sumber_air', 'sumber_listrik', 'spal', 'luas_bangunan', 'luas_per_jiwa', 'catatan_surveyor',
                    'status_verifikasi', 'catatan_admin', 'program_bantuan', 'latitude', 'longitude', 'akurasi_gps'
                ];

                $fields = [];
                $placeholders = [];
                $updates = [];
                $params = [];

                foreach ($cols as $c) {
                    if (array_key_exists($c, $s)) {
                        $fields[] = "`$c`";
                        $placeholders[] = ":$c";
                        $updates[] = "`$c` = VALUES(`$c`)";
                        $params[":$c"] = is_array($s[$c]) ? json_encode($s[$c]) : $s[$c];
                    }
                }

                if (!empty($fields)) {
                    $sql = "INSERT INTO surveys (" . implode(',', $fields) . ") 
                            VALUES (" . implode(',', $placeholders) . ") 
                            ON DUPLICATE KEY UPDATE " . implode(',', $updates);
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $surveyCount++;
                }
            }

            $pdo->commit();

            echo json_encode([
                "success" => true,
                "message" => "Berhasil menyinkronkan {$surveyCount} data survei ke basis data MySQL.",
                "surveys_count" => $surveyCount
            ]);
            exit();

        } else {
            throw new Exception("Tidak ditemukan data SQL atau JSON yang valid di dalam berkas cadangan.");
        }

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Gagal memulihkan cadangan: " . $e->getMessage()]);
        exit();
    }
}

// Helper format bytes
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}
