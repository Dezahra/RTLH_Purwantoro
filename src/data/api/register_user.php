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
$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Format data tidak valid."]);
    exit();
}

$role = trim($input['role'] ?? 'petugas');
$nama = trim($input['nama'] ?? '');
$no_hp = trim($input['no_hp'] ?? '');
$username = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$rw = trim($input['rw'] ?? '');
$rt = trim($input['rt'] ?? '');
$wilayah_tugas = trim($input['wilayah_tugas'] ?? '');
$id_petugas = trim($input['id_petugas'] ?? '');
$nip = trim($input['nip'] ?? '');
$jabatan = trim($input['jabatan'] ?? ($role === 'pegawai' ? 'Pegawai Kelurahan' : 'Petugas Surveyor Lapangan'));

if (empty($nama) || empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nama, username, dan password wajib diisi."]);
    exit();
}

try {
    // 1. Cek duplikasi username atau email
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE username = :u OR (email = :e AND email != '') LIMIT 1");
    $checkUser->execute([':u' => $username, ':e' => $email]);
    if ($checkUser->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Username atau Email sudah terdaftar."]);
        exit();
    }

    // 2. Validasi aturan 1 RW hanya untuk 1 Petugas Lapangan
    if ($role === 'petugas' && !empty($rw)) {
        $rwPad = str_pad(ltrim($rw, '0') ?: '0', 2, '0', STR_PAD_LEFT);
        $checkWilayah = $pdo->prepare("
            SELECT id, nama FROM users 
            WHERE role = 'petugas' AND LPAD(TRIM(rw), 2, '0') = :rw AND status != 'REJECTED'
            LIMIT 1
        ");
        $checkWilayah->execute([':rw' => $rwPad]);
        $existing = $checkWilayah->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "Wilayah RW {$rwPad} sudah ditugaskan kepada petugas {$existing['nama']}. Berdasarkan kebijakan sistem, setiap 1 RW hanya dapat ditugaskan kepada 1 Petugas Lapangan."
            ]);
            exit();
        }

        $rw = $rwPad;
        if (empty($wilayah_tugas)) {
            $wilayah_tugas = "RW {$rwPad} (Seluruh RT)";
        }
    }

    // 3. Cari rt_rw_id dari tabel relasi rt_rws
    $rtRwId = null;
    if (!empty($rw)) {
        $rwPad = str_pad(ltrim($rw, '0') ?: '0', 2, '0', STR_PAD_LEFT);
        $rtPad = !empty($rt) ? str_pad(ltrim($rt, '0') ?: '0', 2, '0', STR_PAD_LEFT) : '01';
        $stmtRtRw = $pdo->prepare("SELECT id FROM rt_rws WHERE rw = :rw AND rt = :rt LIMIT 1");
        $stmtRtRw->execute([':rw' => $rwPad, ':rt' => $rtPad]);
        $rowRtRw = $stmtRtRw->fetch(PDO::FETCH_ASSOC);
        if ($rowRtRw) {
            $rtRwId = $rowRtRw['id'];
        }
    }

    // 4. Generate ID User unik jika belum ada
    $userId = ($role === 'pegawai')
        ? 'USR-PGW-' . str_pad(rand(10, 999), 3, '0', STR_PAD_LEFT)
        : 'USR-PTG-' . str_pad(rand(10, 999), 3, '0', STR_PAD_LEFT);

    if ($role === 'petugas') {
        if (empty($id_petugas)) {
            $maxStmt = $pdo->query("SELECT MAX(CAST(SUBSTRING(id_petugas, 9) AS UNSIGNED)) FROM users WHERE id_petugas LIKE 'PETUGAS-%'");
            $maxNum = (int)$maxStmt->fetchColumn();
            $id_petugas = 'PETUGAS-' . str_pad($maxNum + 1, 2, '0', STR_PAD_LEFT);
        }
        $nip = null;
    } else {
        $id_petugas = null;
        if (empty($nip)) $nip = null;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("
        INSERT INTO users (
            id, role, username, password, nama, nip, id_petugas, 
            telepon, email, jabatan, rt_rw_id, rw, rt, wilayah_tugas, 
            desa, kecamatan, kabupaten, status, registered_at
        ) VALUES (
            :id, :role, :username, :password, :nama, :nip, :id_petugas,
            :telepon, :email, :jabatan, :rt_rw_id, :rw, :rt, :wilayah_tugas,
            'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', 'PENDING', NOW()
        )
    ");

    $stmt->execute([
        ':id'            => $userId,
        ':role'          => $role,
        ':username'      => $username,
        ':password'      => $hashedPassword,
        ':nama'          => $nama,
        ':nip'           => $nip,
        ':id_petugas'    => $id_petugas,
        ':telepon'       => $no_hp,
        ':email'         => $email,
        ':jabatan'       => $jabatan,
        ':rt_rw_id'      => $rtRwId,
        ':rw'            => $rw,
        ':rt'            => $rt,
        ':wilayah_tugas' => $wilayah_tugas
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Pendaftaran akun berhasil diajukan.",
        "user_id" => $userId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Kesalahan database: " . $e->getMessage()
    ]);
}
?>
