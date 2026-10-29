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

if (!$data || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID pengguna wajib disertakan."]);
    exit();
}

$id = $data['id'];
$nama = $data['nama'] ?? null;
$telepon = $data['telepon'] ?? null;
$email = $data['email'] ?? null;
$jabatan = $data['jabatan'] ?? null;
$wilayah = $data['wilayah_tugas'] ?? null;
$avatar = $data['avatar'] ?? null;

try {
    $stmt = $pdo->prepare("
        UPDATE users 
        SET nama = COALESCE(:nama, nama),
            telepon = COALESCE(:telepon, telepon),
            email = COALESCE(:email, email),
            jabatan = COALESCE(:jabatan, jabatan),
            wilayah_tugas = COALESCE(:wilayah_tugas, wilayah_tugas),
            avatar = COALESCE(:avatar, avatar),
            updated_at = NOW()
        WHERE id = :id
    ");

    $stmt->execute([
        ':nama' => $nama,
        ':telepon' => $telepon,
        ':email' => $email,
        ':jabatan' => $jabatan,
        ':wilayah_tugas' => $wilayah,
        ':avatar' => $avatar,
        ':id' => $id
    ]);

    // Fetch updated user
    $getStmt = $pdo->prepare("SELECT id, role, username, nama, nip, id_petugas, jabatan, rw, rt, wilayah_tugas, desa, kecamatan, kabupaten, telepon, email, status, avatar FROM users WHERE id = :id");
    $getStmt->execute([':id' => $id]);
    $user = $getStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "message" => "Profil berhasil diperbarui di database.",
        "user" => $user
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal memperbarui database: " . $e->getMessage()]);
}
