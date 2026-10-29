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

if (!$data || empty($data['id']) || empty($data['old_password']) || empty($data['new_password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID pengguna, kata sandi lama, dan kata sandi baru wajib diisi."]);
    exit();
}

$id = $data['id'];
$oldPassword = $data['old_password'];
$newPassword = $data['new_password'];

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Kata sandi baru minimal 6 karakter."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Pengguna tidak ditemukan."]);
        exit();
    }

    $isMatch = password_verify($oldPassword, $user['password']) || ($oldPassword === $user['password']);
    if (!$isMatch) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Kata sandi lama yang Anda masukkan tidak sesuai."]);
        exit();
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $pdo->prepare("UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id");
    $updateStmt->execute([
        ':password' => $newHash,
        ':id' => $id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Kata sandi berhasil diperbarui."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Kesalahan basis data: " . $e->getMessage()]);
}
