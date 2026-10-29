<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php";

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

$id = $data['id'] ?? null;
$action = $data['action'] ?? null; // 'approve' | 'reject' | 'delete' | 'reset_password' | 'rotate_wilayah'
$actorName = $data['actor_name'] ?? 'Admin Kelurahan';
$reason = $data['reason'] ?? '';

if (!$id || !$action) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID user dan aksi wajib disertakan."]);
    exit();
}

try {
    if ($action === 'approve') {
        $stmt = $pdo->prepare("
            UPDATE users 
            SET status = 'APPROVED', approved_at = NOW(), approved_by = :approved_by 
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'          => $id,
            ':approved_by' => $actorName
        ]);
        $msg = "Akun berhasil disetujui dan diaktifkan.";
    } elseif ($action === 'reject') {
        $stmt = $pdo->prepare("
            UPDATE users 
            SET status = 'REJECTED', rejected_at = NOW(), reject_reason = :reason, rejected_by = :rejected_by 
            WHERE id = :id
        ");
        $stmt->execute([
            ':id'          => $id,
            ':reason'      => $reason,
            ':rejected_by' => $actorName
        ]);
        $msg = "Pendaftaran akun telah ditolak.";
    } elseif ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $msg = "Akun berhasil dihapus dari sistem.";
    } elseif ($action === 'reset_password') {
        $defaultPass = $data['new_password'] ?? 'password123';
        $hashed = password_hash($defaultPass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id");
        $stmt->execute([
            ':password' => $hashed,
            ':id'       => $id
        ]);
        $msg = "Kata sandi akun berhasil direset menjadi: " . $defaultPass;
    } elseif ($action === 'rotate_wilayah') {
        $newRw = trim($data['rw'] ?? '');
        if (empty($newRw)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Wilayah RW tujuan wajib dipilih."]);
            exit();
        }
        $rwPad = str_pad(ltrim($newRw, '0') ?: '0', 2, '0', STR_PAD_LEFT);

        // Validasi Kebijakan 1 RW 1 Petugas: Cek apakah RW sudah ditugaskan ke petugas lain yang aktif
        $check = $pdo->prepare("
            SELECT id, nama FROM users 
            WHERE role = 'petugas' AND LPAD(TRIM(rw), 2, '0') = :rw AND id != :id AND status != 'REJECTED' 
            LIMIT 1
        ");
        $check->execute([':rw' => $rwPad, ':id' => $id]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "message" => "Wilayah RW {$rwPad} sudah ditugaskan kepada petugas {$existing['nama']}. Berdasarkan aturan 1 RW 1 Petugas, silakan pilih RW yang masih tersedia."
            ]);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE users 
            SET rw = :rw, rt = 'Semua', wilayah_tugas = :wt, updated_at = NOW() 
            WHERE id = :id
        ");
        $stmt->execute([
            ':rw' => $rwPad,
            ':wt' => "RW {$rwPad} (Seluruh RT)",
            ':id' => $id
        ]);
        $msg = "Wilayah penugasan petugas berhasil diubah ke RW {$rwPad} (Seluruh RT).";
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Aksi tidak dikenali."]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "message" => $msg
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>
