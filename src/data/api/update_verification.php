<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db   = "sipelita_desa"; // Pastikan sesuai nama database kamu
$user = "root";
$pass = "";
$charset = "utf8mb4";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Gagal koneksi database: " . $e->getMessage()]);
    exit();
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

$id = $data['id'] ?? null;
$status = $data['status'] ?? null;
$catatanAdmin = $data['catatanAdmin'] ?? '';
$programBantuan = $data['programBantuan'] ?? null;

if (!$id || !$status) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID survei dan status verifikasi wajib diisi."]);
    exit();
}

try {
    $now = date('Y-m-d H:i:s');
    $verifiedAt = ($status === 'TERVERIFIKASI') ? $now : null;
    $revisionAt = ($status === 'BUTUH_REVISI') ? $now : null;

    // Ambil status sebelumnya
    $stmtPrev = $pdo->prepare("SELECT status_verifikasi FROM surveys WHERE id = :id");
    $stmtPrev->execute([':id' => $id]);
    $prevStatus = $stmtPrev->fetchColumn() ?: 'MENUNGGU_VALIDASI';

    $sql = "UPDATE surveys SET 
                status_verifikasi = :status,
                catatan_admin = :catatan,
                verified_at = :verified_at,
                revision_at = :revision_at,
                updated_at = :updated_at";

    $params = [
        ':status' => $status,
        ':catatan' => $catatanAdmin,
        ':verified_at' => $verifiedAt,
        ':revision_at' => $revisionAt,
        ':updated_at' => $now,
        ':id' => $id
    ];

    if ($programBantuan !== null) {
        $sql .= ", program_bantuan = :program";
        $params[':program'] = $programBantuan;
    }

    $sql .= " WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Catat ke tabel relasi survey_verifications
    $stmtLog = $pdo->prepare("
        INSERT INTO survey_verifications (survey_id, status_sebelumnya, status_baru, catatan, program_bantuan)
        VALUES (:s_id, :prev, :curr, :catatan, :program)
    ");
    $stmtLog->execute([
        ':s_id'    => $id,
        ':prev'    => $prevStatus,
        ':curr'    => $status,
        ':catatan' => $catatanAdmin,
        ':program' => $programBantuan
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Status verifikasi berhasil diperbarui dan tercatat di riwayat verifikasi database."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>