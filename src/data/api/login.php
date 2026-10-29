<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Tangani Preflight Request dari browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php";

try {
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    $username = trim($input["username"] ?? "");
    $password = $input["password"] ?? "";

    if ($username === "" || $password === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "code"    => "EMPTY_FIELDS",
            "message" => "Username dan kata sandi wajib diisi."
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Cari user berdasarkan username, email, NIP, atau ID Petugas
    $stmt = $pdo->prepare("
        SELECT *
        FROM users
        WHERE username = :identifier
           OR email = :identifier
           OR nip = :identifier
           OR id_petugas = :identifier
        LIMIT 1
    ");

    $stmt->execute([
        ":identifier" => $username
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "code"    => "NOT_FOUND",
            "message" => "Akun tidak ditemukan di sistem SIPELITA."
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // 1. Verifikasi Password (Bcrypt hash dengan fallback plain text untuk akun dummy)
    $isPasswordMatch = password_verify($password, $user["password"]) || ($password === $user["password"]);

    if (!$isPasswordMatch) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "code"    => "WRONG_PASSWORD",
            "message" => "Kata sandi yang Anda masukkan salah."
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // 2. Verifikasi Status Akun (Case-Insensitive)
    $status = strtoupper($user["status"] ?? "PENDING");

    if ($status === "PENDING") {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "code"    => "PENDING",
            "message" => "Akun Anda sedang menunggu persetujuan Admin Kelurahan."
        ], JSON_PRETTY_PRINT);
        exit;
    }

    if ($status === "REJECTED") {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "code"    => "REJECTED",
            "message" => "Pendaftaran akun Anda ditolak oleh Admin Kelurahan."
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // 3. Keamanan: Hapus password sebelum objek dikirim ke klien
    unset($user["password"]);

    echo json_encode([
        "success" => true,
        "message" => "Login berhasil.",
        "user"    => $user
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "code"    => "SERVER_ERROR",
        "message" => "Terjadi kesalahan server database.",
        "error"   => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}