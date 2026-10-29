<?php

header("Content-Type: application/json");

require_once "../config/database.php";

try {

    $users = [
        [
            "id" => "USR-PGW-001",
            "role" => "admin",
            "username" => "admin",
            "password" => "password123",
            "nama" => "Devi Zahra Safrida",
            "nip" => "19880415 201201 1 002",
            "id_petugas" => null,
            "jabatan" => "Kasi Kesejahteraan / Pegawai Desa",
            "wilayah_tugas" => null,
            "desa" => "Kelurahan Purwantoro",
            "kecamatan" => "Blimbing",
            "kabupaten" => "Kota Malang",
            "telepon" => "081234567890",
            "email" => "zahra@purwantoro.malangkota.go.id",
            "status" => "APPROVED",
            "avatar" => "🏢"
        ],
    ];

    $sql = "
        INSERT INTO users (
            id,
            role,
            username,
            password,
            nama,
            nip,
            id_petugas,
            jabatan,
            wilayah_tugas,
            desa,
            kecamatan,
            kabupaten,
            telepon,
            email,
            status,
            avatar,
            registered_at,
            approved_at,
            approved_by
        ) VALUES (
            :id,
            :role,
            :username,
            :password,
            :nama,
            :nip,
            :id_petugas,
            :jabatan,
            :wilayah_tugas,
            :desa,
            :kecamatan,
            :kabupaten,
            :telepon,
            :email,
            :status,
            :avatar,
            NOW(),
            NOW(),
            'Sistem'
        )
    ";

    $stmt = $pdo->prepare($sql);

    $inserted = 0;

    foreach ($users as $user) {

        $stmt->execute([
            ":id" => $user["id"],
            ":role" => $user["role"],
            ":username" => $user["username"],
            ":password" => password_hash($user["password"], PASSWORD_DEFAULT),
            ":nama" => $user["nama"],
            ":nip" => $user["nip"],
            ":id_petugas" => $user["id_petugas"],
            ":jabatan" => $user["jabatan"],
            ":wilayah_tugas" => $user["wilayah_tugas"],
            ":desa" => $user["desa"],
            ":kecamatan" => $user["kecamatan"],
            ":kabupaten" => $user["kabupaten"],
            ":telepon" => $user["telepon"],
            ":email" => $user["email"],
            ":status" => $user["status"],
            ":avatar" => $user["avatar"]
        ]);

        $inserted++;
    }

    echo json_encode([
        "success" => true,
        "message" => "Data users berhasil dimasukkan",
        "inserted" => $inserted
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal memasukkan users",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}