<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php";

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Data JSON tidak valid atau kosong."]);
    exit();
}

try {
    // 1. Generate ID jika belum ada
    $isNew = empty($data['id']);
    if ($isNew) {
        $data['id'] = "SRV-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(3)));
        $data['status_verifikasi'] = $data['status_verifikasi'] ?? 'MENUNGGU_VALIDASI';
        $data['created_at'] = date('Y-m-d H:i:s');
    } else {
        // Poin 2: Jika status survei lama BUTUH_REVISI, ubah otomatis kembali ke MENUNGGU_VALIDASI
        $checkOldStatus = $pdo->prepare("SELECT status_verifikasi, catatan_admin FROM surveys WHERE id = :id LIMIT 1");
        $checkOldStatus->execute([':id' => $data['id']]);
        $oldRow = $checkOldStatus->fetch(PDO::FETCH_ASSOC);
        if ($oldRow && $oldRow['status_verifikasi'] === 'BUTUH_REVISI') {
            $data['status_verifikasi'] = 'MENUNGGU_VALIDASI';
            $data['revision_at'] = date('Y-m-d H:i:s');
            $existingNote = $oldRow['catatan_admin'] ?? '';
            $data['catatan_admin'] = "[Diperbaiki Petugas " . date('d/m/Y H:i') . "] " . $existingNote;
        }
    }

    // Validasi NIK Wajib & Cek Duplikasi NIK di Database (Prioritas Integritas Data RTLH)
    $nik = trim($data['nik'] ?? '');
    if (!empty($nik)) {
        if ($isNew) {
            $checkNik = $pdo->prepare("SELECT id, no_urut_bnba, nama_kk, rw, rt FROM surveys WHERE nik = :nik LIMIT 1");
            $checkNik->execute([':nik' => $nik]);
            $existing = $checkNik->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "message" => "Warga dengan NIK {$nik} sudah terdata sebelumnya atas nama {$existing['nama_kk']} di RT {$existing['rt']}/RW {$existing['rw']} (No. BNBA: {$existing['no_urut_bnba']}). Setiap warga hanya dapat didata 1 kali untuk mencegah duplikasi bantuan RTLH."
                ]);
                exit();
            }
        } else {
            $checkNik = $pdo->prepare("SELECT id, no_urut_bnba, nama_kk, rw, rt FROM surveys WHERE nik = :nik AND id != :id LIMIT 1");
            $checkNik->execute([':nik' => $nik, ':id' => $data['id']]);
            $existing = $checkNik->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "message" => "NIK {$nik} sudah digunakan pada data survei lain atas nama {$existing['nama_kk']} (No. BNBA: {$existing['no_urut_bnba']})."
                ]);
                exit();
            }
        }
    }
    
    // 2. Generate Nomor Urut BNBA otomatis jika kosong
    if (empty($data['no_urut_bnba'])) {
        $stmtCount = $pdo->query("SELECT COUNT(*) FROM surveys");
        $nextCount = (int)$stmtCount->fetchColumn() + 1;
        $data['no_urut_bnba'] = "BNBA-" . date("Y") . "-" . str_pad($nextCount, 3, "0", STR_PAD_LEFT);
    }
    $data['updated_at'] = date('Y-m-d H:i:s');

    // 3. Fallback Identitas Surveyor (Kunci perbaikan untuk Admin & Pegawai)
    $creatorRaw = $data['created_by'] ?? $data['user_id'] ?? $data['petugas_id'] ?? null;
    $namaPetugas = $data['petugas_nama'] ?? $data['nama_petugas'] ?? null;
    $validUserId = null;

    if (!empty($creatorRaw)) {
        // Cari ID user di tabel users berdasarkan id, username, id_petugas, atau nip
        $checkStmt = $pdo->prepare("
            SELECT id FROM users 
            WHERE id = :u OR username = :u OR id_petugas = :u OR nip = :u 
            LIMIT 1
        ");
        $checkStmt->execute([':u' => $creatorRaw]);
        $userRow = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if ($userRow) {
            $validUserId = $userRow['id'];
        }
    }
    
    if (!$validUserId && !empty($namaPetugas)) {
        $checkByName = $pdo->prepare("
            SELECT id FROM users 
            WHERE LOWER(TRIM(nama)) = LOWER(TRIM(:nama)) 
            LIMIT 1
        ");
        $checkByName->execute([':nama' => $namaPetugas]);
        $userRowName = $checkByName->fetch(PDO::FETCH_ASSOC);
        if ($userRowName) {
            $validUserId = $userRowName['id'];
        }
    }

    // Jika admin/pegawai yang menginput, diset NULL agar lolos Foreign Key
    $data['created_by'] = $validUserId;

    if (empty($data['petugas_nama'])) {
        $data['petugas_nama'] = $data['nama_petugas'] 
            ?? $data['nama'] 
            ?? 'Admin/Pegawai Kelurahan';
    }    
    // Tanggal survei default hari ini jika form tidak mengisinya
    if (empty($data['tanggal_survey'])) {
        $data['tanggal_survey'] = date('Y-m-d');
    }

    // Default Nilai UMK Kota Malang jika kosong atau nol
    if (empty($data['nilai_umk'])) {
        $data['nilai_umk'] = 3736101;
    } else {
        $data['nilai_umk'] = (float)preg_replace('/[^\d.]/', '', (string)$data['nilai_umk']);
    }

    // Sanitasi Nominal Penghasilan Riil
    if (isset($data['penghasilan_nominal']) && $data['penghasilan_nominal'] !== '') {
        $data['penghasilan_nominal'] = (float)preg_replace('/[^\d.]/', '', (string)$data['penghasilan_nominal']);
        if (empty($data['penghasilan'])) {
            $data['penghasilan'] = "Rp " . number_format($data['penghasilan_nominal'], 0, ',', '.');
        }
    }

    // Aset rumah lain (default: Tidak)
    if (empty($data['aset_rumah_lain'])) {
        $data['aset_rumah_lain'] = 'Tidak';
    }

    // Lama tinggal (tahun)
    if (isset($data['lama_tinggal'])) {
        $data['lama_tinggal'] = (int)$data['lama_tinggal'];
    } else {
        $data['lama_tinggal'] = 1;
    }

    // 4. Resolusi relasi ke tabel rt_rws (rt_rw_id)
    $rtRwId = null;
    $rwVal = !empty($data['rw']) ? str_pad(ltrim($data['rw'], '0') ?: '0', 2, '0', STR_PAD_LEFT) : null;
    $rtVal = !empty($data['rt']) ? str_pad(ltrim($data['rt'], '0') ?: '0', 2, '0', STR_PAD_LEFT) : null;
    if ($rwVal && $rtVal) {
        $stmtRtRw = $pdo->prepare("SELECT id FROM rt_rws WHERE rw = :rw AND rt = :rt LIMIT 1");
        $stmtRtRw->execute([':rw' => $rwVal, ':rt' => $rtVal]);
        $rowRtRw = $stmtRtRw->fetch(PDO::FETCH_ASSOC);
        if ($rowRtRw) {
            $rtRwId = $rowRtRw['id'];
        }
    }
    $data['rt_rw_id'] = $rtRwId;

    if (!isset($data['akurasi_gps']) || $data['akurasi_gps'] === '' || $data['akurasi_gps'] === null) {
        $data['akurasi_gps'] = '0';
    }

    // 5. Kolom-kolom pada tabel surveys (termasuk rt_rw_id, akurasi_gps, dan foto)
    $columns = [
        'id', 'no_urut_bnba', 'tanggal_survey', 'created_by', 'petugas_nama', 'nik', 'no_kk', 'nama_kk',
        'jenis_kelamin', 'usia', 'lama_tinggal', 'dusun', 'rt', 'rw', 'rt_rw_id', 'jumlah_jiwa', 'pekerjaan',
        'penghasilan', 'penghasilan_nominal', 'nilai_umk', 'status_rumah', 'aset_rumah_lain', 'status_tanah', 'pondasi', 'sloof', 'kolom',
        'ring_balok', 'rangka_atap', 'dinding', 'lantai', 'atap', 'sanitasi',
        'sumber_air', 'pencahayaan', 'penghawaan', 'spal', 'sumber_listrik',
        'luas_bangunan', 'latitude', 'longitude', 'akurasi_gps', 'skor_total', 'kategori_kelayakan',
        'kategori_label', 'luas_per_jiwa', 'rekomendasi_sistem', 'status_verifikasi',
        'catatan_admin', 'program_bantuan', 'verified_at', 'revision_at',
        'foto_depan', 'foto_dalam', 'foto_atap', 'foto_sanitasi'
    ];

    $params = [];
    $insertCols = [];
    $insertPlaceholders = [];
    $updateClauses = [];

    foreach ($columns as $col) {
        $val = $data[$col] ?? null;
        $params[":$col"] = $val;
        $insertCols[] = $col;
        $insertPlaceholders[] = ":$col";

        if ($col !== 'id') {
            $updateClauses[] = "$col = VALUES($col)";
        }
    }

    $colSql = implode(", ", $insertCols);
    $placeholderSql = implode(", ", $insertPlaceholders);
    $updateSql = implode(", ", $updateClauses);

    // UPSERT ke tabel surveys
    $sql = "INSERT INTO surveys ($colSql) VALUES ($placeholderSql)
            ON DUPLICATE KEY UPDATE $updateSql";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // 6. Sinkronisasi ke tabel relasi: survey_photos
    $photoMap = [
        'depan'    => $data['foto_depan'] ?? null,
        'dalam'    => $data['foto_dalam'] ?? null,
        'atap'     => $data['foto_atap'] ?? null,
        'sanitasi' => $data['foto_sanitasi'] ?? null
    ];
    $stmtPhoto = $pdo->prepare("
        INSERT INTO survey_photos (survey_id, slot, file_url, caption)
        VALUES (:s_id, :slot, :url, :caption)
        ON DUPLICATE KEY UPDATE file_url = VALUES(file_url)
    ");
    foreach ($photoMap as $slot => $url) {
        if (!empty($url)) {
            $stmtPhoto->execute([
                ':s_id'    => $data['id'],
                ':slot'    => $slot,
                ':url'     => $url,
                ':caption' => "Foto $slot {$data['nama_kk']}"
            ]);
        }
    }

    // 7. Sinkronisasi ke tabel relasi: survey_parameter_scores
    $kriteriaRows = $pdo->query("SELECT id, kode FROM kriteria_penilaian")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($kriteriaRows)) {
        $stmtScore = $pdo->prepare("
            INSERT INTO survey_parameter_scores (survey_id, kriteria_id, nilai_opsi, skor, keterangan_kondisi)
            VALUES (:s_id, :k_id, :opsi, :skor, :ket)
            ON DUPLICATE KEY UPDATE nilai_opsi = VALUES(nilai_opsi), keterangan_kondisi = VALUES(keterangan_kondisi)
        ");
        foreach ($kriteriaRows as $kr) {
            $kKode = $kr['kode'];
            $val = $data[$kKode] ?? null;
            if ($kKode === 'luas_ruang') {
                $val = (!empty($data['luas_per_jiwa'])) ? $data['luas_per_jiwa'] . " m²/jiwa" : null;
            }
            if ($val !== null) {
                $stmtScore->execute([
                    ':s_id' => $data['id'],
                    ':k_id' => $kr['id'],
                    ':opsi' => (string)$val,
                    ':skor' => 100.0,
                    ':ket'  => "Kondisi $kKode: $val"
                ]);
            }
        }
    }

    // 8. Catat log awal ke tabel relasi: survey_verifications jika baru
    if ($isNew) {
        $stmtVerif = $pdo->prepare("
            INSERT INTO survey_verifications (survey_id, verifier_id, verifier_nama, status_sebelumnya, status_baru, catatan)
            VALUES (:s_id, :v_id, :v_nama, NULL, :status, 'Pendaftaran survei baru di lapangan.')
        ");
        $stmtVerif->execute([
            ':s_id'   => $data['id'],
            ':v_id'   => $validUserId,
            ':v_nama' => $data['petugas_nama'],
            ':status' => $data['status_verifikasi']
        ]);
    }

    echo json_encode([
        "success" => true,
        "message" => $isNew ? "Data survei berhasil disimpan ke database terelasi." : "Data survei berhasil diperbarui.",
        "id" => $data['id'],
        "survey" => $data
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal menyimpan survei: " . $e->getMessage()
    ]);
}
?>
