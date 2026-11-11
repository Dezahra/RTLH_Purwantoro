
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `survey_parameter_scores`;
DROP TABLE IF EXISTS `survey_photos`;
DROP TABLE IF EXISTS `survey_verifications`;
DROP TABLE IF EXISTS `kriteria_penilaian`;
DROP TABLE IF EXISTS `surveys`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `rt_rws`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABEL MASTER WILAYAH RT/RW PURWANTORO
CREATE TABLE `rt_rws` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode` VARCHAR(10) NOT NULL UNIQUE,
  `rw` VARCHAR(5) NOT NULL,
  `rt` VARCHAR(5) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `kelurahan` VARCHAR(100) DEFAULT 'Purwantoro',
  `kecamatan` VARCHAR(100) DEFAULT 'Blimbing',
  `kota` VARCHAR(100) DEFAULT 'Kota Malang',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_rt_rw` (`rw`, `rt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABEL PENGGUNA & PETUGAS (Relasi ke rt_rws)
CREATE TABLE `users` (
  `id` VARCHAR(30) PRIMARY KEY,
  `role` ENUM('admin','pegawai','petugas') NOT NULL DEFAULT 'petugas',
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nama` VARCHAR(150) NOT NULL,
  `nip` VARCHAR(50) DEFAULT NULL,
  `id_petugas` VARCHAR(50) DEFAULT NULL UNIQUE,
  `jabatan` VARCHAR(150) DEFAULT NULL,
  `rt_rw_id` INT DEFAULT NULL,
  `rw` VARCHAR(10) DEFAULT NULL,
  `rt` VARCHAR(10) DEFAULT NULL,
  `wilayah_tugas` VARCHAR(255) DEFAULT NULL,
  `desa` VARCHAR(100) DEFAULT 'Kelurahan Purwantoro',
  `kecamatan` VARCHAR(100) DEFAULT 'Kecamatan Blimbing',
  `kabupaten` VARCHAR(100) DEFAULT 'Kota Malang',
  `telepon` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `avatar` VARCHAR(20) DEFAULT '👤',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  `approved_by` VARCHAR(150) DEFAULT NULL,
  `rejected_at` DATETIME DEFAULT NULL,
  `reject_reason` TEXT DEFAULT NULL,
  `rejected_by` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_rt_rw` (`rt_rw_id`),
  CONSTRAINT `fk_users_rt_rw` FOREIGN KEY (`rt_rw_id`) REFERENCES `rt_rws` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABEL SURVEI RTLH (Relasi ke users dan rt_rws)
CREATE TABLE `surveys` (
  `id` VARCHAR(30) PRIMARY KEY,
  `tanggal_survey` DATE NOT NULL,
  `created_by` VARCHAR(30) DEFAULT NULL,
  `petugas_nama` VARCHAR(150) DEFAULT NULL,
  `nik` VARCHAR(20) NOT NULL,
  `no_kk` VARCHAR(20) NOT NULL,
  `no_urut_bnba` VARCHAR(30) DEFAULT NULL,
  `nama_kk` VARCHAR(150) NOT NULL,
  `jenis_kelamin` VARCHAR(20) DEFAULT NULL,
  `usia` INT DEFAULT NULL,
  `lama_tinggal` INT DEFAULT 1,
  `alamat_lengkap` VARCHAR(255) DEFAULT NULL,
  `rt` VARCHAR(10) DEFAULT NULL,
  `rw` VARCHAR(10) DEFAULT NULL,
  `rt_rw_id` INT DEFAULT NULL,
  `jumlah_jiwa` INT DEFAULT NULL,
  `jumlah_lansia_balita` INT DEFAULT 0,
  `pekerjaan` VARCHAR(100) DEFAULT NULL,
  `penghasilan` VARCHAR(100) DEFAULT NULL,
  `penghasilan_nominal` DECIMAL(14,2) DEFAULT NULL,
  `nilai_umk` DECIMAL(14,2) DEFAULT 3736101.00,
  `status_rumah` VARCHAR(100) DEFAULT NULL,
  `aset_rumah_lain` VARCHAR(10) DEFAULT 'Tidak',
  `status_tanah` VARCHAR(100) DEFAULT NULL,
  `bansos_diterima` VARCHAR(100) DEFAULT 'Belum Pernah',
  -- 13 Parameter Teknis Standar Kementerian PUPR
  `pondasi` VARCHAR(50) DEFAULT NULL,
  `sloof` VARCHAR(50) DEFAULT NULL,
  `kolom` VARCHAR(50) DEFAULT NULL,
  `ring_balok` VARCHAR(50) DEFAULT NULL,
  `rangka_atap` VARCHAR(50) DEFAULT NULL,
  `dinding` VARCHAR(100) DEFAULT NULL,
  `lantai` VARCHAR(100) DEFAULT NULL,
  `atap` VARCHAR(100) DEFAULT NULL,
  `sanitasi` VARCHAR(100) DEFAULT NULL,
  `jenis_kloset` VARCHAR(100) DEFAULT '1. Leher angsa',
  `tpa_tinja` VARCHAR(100) DEFAULT '1. Tangki septik',
  `sumber_air` VARCHAR(100) DEFAULT NULL,
  `pencahayaan` VARCHAR(50) DEFAULT NULL,
  `penghawaan` VARCHAR(50) DEFAULT NULL,
  `spal` VARCHAR(100) DEFAULT NULL,
  `sumber_listrik` VARCHAR(100) DEFAULT NULL,
  `luas_bangunan` DECIMAL(10,2) DEFAULT NULL,
  `latitude` DECIMAL(10,7) DEFAULT NULL,
  `longitude` DECIMAL(10,7) DEFAULT NULL,
  `akurasi_gps` VARCHAR(50) DEFAULT '0',
  `skor_total` DECIMAL(5,1) DEFAULT NULL,
  `kategori_kelayakan` VARCHAR(30) DEFAULT NULL,
  `kategori_label` VARCHAR(100) DEFAULT NULL,
  `luas_per_jiwa` DECIMAL(10,1) DEFAULT NULL,
  `sempadan_sungai` VARCHAR(100) DEFAULT 'Tidak (≥ 6 meter / Aman)',
  `rekomendasi_sistem` TEXT DEFAULT NULL,
  `status_verifikasi` ENUM('MENUNGGU_VALIDASI','TERVERIFIKASI','BUTUH_REVISI') NOT NULL DEFAULT 'MENUNGGU_VALIDASI',
  `catatan_admin` TEXT DEFAULT NULL,
  `catatan_surveyor` TEXT DEFAULT NULL,
  `program_bantuan` TEXT DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `revision_at` DATETIME DEFAULT NULL,
  `foto_depan` MEDIUMTEXT DEFAULT NULL,
  `foto_dalam` MEDIUMTEXT DEFAULT NULL,
  `foto_atap` MEDIUMTEXT DEFAULT NULL,
  `foto_sanitasi` MEDIUMTEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_surveys_created_by` (`created_by`),
  INDEX `idx_surveys_rt_rw` (`rt_rw_id`),
  CONSTRAINT `fk_surveys_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_surveys_rt_rw` FOREIGN KEY (`rt_rw_id`) REFERENCES `rt_rws` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABEL DOKUMENTASI FOTO (Relasi ke surveys)
CREATE TABLE `survey_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `survey_id` VARCHAR(30) NOT NULL,
  `slot` VARCHAR(30) NOT NULL,
  `file_url` MEDIUMTEXT NOT NULL,
  `caption` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_photos_survey` (`survey_id`),
  UNIQUE KEY `uk_survey_slot` (`survey_id`, `slot`),
  CONSTRAINT `fk_photos_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL RIWAYAT VERIFIKASI (Relasi ke surveys dan users)
CREATE TABLE `survey_verifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `survey_id` VARCHAR(30) NOT NULL,
  `verifier_id` VARCHAR(30) DEFAULT NULL,
  `verifier_nama` VARCHAR(150) DEFAULT NULL,
  `status_sebelumnya` VARCHAR(50) DEFAULT NULL,
  `status_baru` ENUM('MENUNGGU_VALIDASI','TERVERIFIKASI','BUTUH_REVISI') NOT NULL,
  `catatan` TEXT DEFAULT NULL,
  `program_bantuan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_verif_survey` (`survey_id`),
  INDEX `idx_verif_user` (`verifier_id`),
  CONSTRAINT `fk_verif_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_verif_user` FOREIGN KEY (`verifier_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL MASTER KRITERIA PENILAIAN (Standar 13 Parameter PUPR)
CREATE TABLE `kriteria_penilaian` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode` VARCHAR(50) NOT NULL UNIQUE,
  `nama_parameter` VARCHAR(150) NOT NULL,
  `pilar` ENUM('KESELAMATAN_STRUKTUR','KOMPONEN_BAHAN','KESEHATAN_SANITASI','KECUKUPAN_RUANG') NOT NULL,
  `bobot_persen` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `standar_kelayakan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABEL DETAIL SKOR PARAMETER (Relasi ke surveys dan kriteria_penilaian)
CREATE TABLE `survey_parameter_scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `survey_id` VARCHAR(30) NOT NULL,
  `kriteria_id` INT NOT NULL,
  `nilai_opsi` VARCHAR(100) DEFAULT NULL,
  `skor` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `keterangan_kondisi` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_scores_survey` (`survey_id`),
  INDEX `idx_scores_kriteria` (`kriteria_id`),
  UNIQUE KEY `uk_survey_kriteria` (`survey_id`, `kriteria_id`),
  CONSTRAINT `fk_scores_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_scores_kriteria` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria_penilaian` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- 8. DATA AWAL (SEED DATA): 13 PARAMETER PUPR
-- =========================================================
INSERT INTO `kriteria_penilaian` (`id`, `kode`, `nama_parameter`, `pilar`, `bobot_persen`, `standar_kelayakan`) VALUES
(1, 'pondasi', 'Pondasi Bangunan', 'KESELAMATAN_STRUKTUR', 10.00, 'Pondasi batu kali/beton bertulang kondisi baik tanpa retak struktur.'),
(2, 'kolom', 'Kolom & Balok', 'KESELAMATAN_STRUKTUR', 15.00, 'Kolom dan balok pengikat kokoh, tidak keropos, dan mampu menopang beban.'),
(3, 'rangka_atap', 'Rangka Atap', 'KESELAMATAN_STRUKTUR', 10.00, 'Kuda-kuda kayu/baja ringan tidak lapuk, melengkung, atau dimakan rayap.'),
(4, 'dinding', 'Dinding Pengisi', 'KOMPONEN_BAHAN', 8.00, 'Dinding pasangan bata/plesteran kokoh tanpa retak tembus.'),
(5, 'lantai', 'Lantai Rumah', 'KOMPONEN_BAHAN', 7.00, 'Lantai keramik/semen kedap air, tidak berupa tanah liat/lembab.'),
(6, 'atap', 'Penutup Atap', 'KOMPONEN_BAHAN', 10.00, 'Genteng/seng/asbes rapat, tidak bocor saat hujan.'),
(7, 'sanitasi', 'Fasilitas Sanitasi (Jamban)', 'KESEHATAN_SANITASI', 10.00, 'Jamban leher angsa dengan tangki septik sendiri.'),
(8, 'sumber_air', 'Akses Air Minum', 'KESEHATAN_SANITASI', 8.00, 'Sumber air terlindung (PDAM/sumur bor) jarak > 10m dari tangki septik.'),
(9, 'pencahayaan', 'Pencahayaan Alami', 'KESEHATAN_SANITASI', 6.00, 'Bukaan jendela minimal 10% dari luas lantai ruangan.'),
(10, 'penghawaan', 'Penghawaan / Ventilasi', 'KESEHATAN_SANITASI', 6.00, 'Ventilasi udara minimal 5% dari luas lantai ruangan.'),
(11, 'spal', 'Saluran Pembuangan Air Limbah', 'KESEHATAN_SANITASI', 5.00, 'Saluran tertutup mengalir lancar ke saluran lingkungan.'),
(12, 'luas_bangunan', 'Kecukupan Luas Ruang', 'KECUKUPAN_RUANG', 5.00, 'Luas lantai minimal 7.2 m2 per jiwa / penghuni.'),
(13, 'sumber_listrik', 'Sumber Penerangan / Listrik', 'KESEHATAN_SANITASI', 0.00, 'Listrik PLN mandiri dengan daya mencukupi.')
ON DUPLICATE KEY UPDATE `nama_parameter` = VALUES(`nama_parameter`);

-- =========================================================
-- 9. DATA AWAL (SEED DATA): PENGGUNA DEFAULT (ADMIN)
-- =========================================================
INSERT INTO `users` (`id`, `role`, `username`, `password`, `nama`, `nip`, `id_petugas`, `jabatan`, `desa`, `kecamatan`, `kabupaten`, `telepon`, `email`, `status`, `avatar`, `registered_at`, `approved_at`, `approved_by`)
VALUES (
  'USR-PGW-001',
  'admin',
  'admin',
  '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG',
  'admin',
  '19880415 201201 1 002',
  'ADM-001',
  'Kasi Kesejahteraan / Pegawai Kelurahan',
  'Kelurahan Purwantoro',
  'Kecamatan Blimbing',
  'Kota Malang',
  '081234567890',
  'zahra@purwantoro.malangkota.go.id',
  'APPROVED',
  '🏢',
  NOW(),
  NOW(),
  'Sistem Otomatis'
)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `status` = 'APPROVED';


-- =========================================================
-- 10. DATA AWAL (SEED DATA): 24 PETUGAS PURWANTORO
-- =========================================================
INSERT INTO `users` (`id`, `role`, `username`, `password`, `nama`, `id_petugas`, `jabatan`, `rw`, `rt`, `wilayah_tugas`, `desa`, `kecamatan`, `kabupaten`, `telepon`, `email`, `status`, `avatar`, `registered_at`, `approved_at`, `approved_by`) VALUES
('USR-PTG-01', 'petugas', 'isma.harianti', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'ISMA HARIANTI', 'PETUGAS-01', 'Petugas Surveyor Lapangan', '04', '01, 02, 03', 'RW 04 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'isma.harianti@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-02', 'petugas', 'agustin.suliyati', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'AGUSTIN SULIYATI', 'PETUGAS-02', 'Petugas Surveyor Lapangan', '06', '01, 02, 06', 'RW 06 (RT 01, 02, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'agustin.suliyati@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-03', 'petugas', 'ratna.indah', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'RATNA INDAH SRI NING WULAN', 'PETUGAS-03', 'Petugas Surveyor Lapangan', '06', '03, 04, 05', 'RW 06 (RT 03, 04, 05)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'ratna.indah@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-04', 'petugas', 'sri.hastini', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SRI HASTINI', 'PETUGAS-04', 'Petugas Surveyor Lapangan', '07', '01, 02, 03', 'RW 07 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'sri.hastini@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-05', 'petugas', 'wiwiek.isty', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'WIWIEK ISTY RAHAJU', 'PETUGAS-05', 'Petugas Surveyor Lapangan', '07', '04, 05, 06', 'RW 07 (RT 04, 05, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'wiwiek.isty@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-06', 'petugas', 'sumiarti', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SUMIARTI', 'PETUGAS-06', 'Petugas Surveyor Lapangan', '07', '07, 08, 09', 'RW 07 (RT 07, 08, 09)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'sumiarti@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-07', 'petugas', 'sri.utami', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SRI UTAMI', 'PETUGAS-07', 'Petugas Surveyor Lapangan', '07', '10, 11, 12', 'RW 07 (RT 10, 11, 12)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'sri.utami@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-08', 'petugas', 'indrawati', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'INDRAWATI', 'PETUGAS-08', 'Petugas Surveyor Lapangan', '07', '13, 14, 15', 'RW 07 (RT 13, 14, 15)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'indrawati@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-09', 'petugas', 'ummu.mahdah', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'UMMU MAHDAH', 'PETUGAS-09', 'Petugas Surveyor Lapangan', '09', '01, 02, 03', 'RW 09 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'ummu.mahdah@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-10', 'petugas', 'nisrotul.iailah', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'NIS ROTUL IAILAH', 'PETUGAS-10', 'Petugas Surveyor Lapangan', '09', '04, 05, 06', 'RW 09 (RT 04, 05, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'nisrotul.iailah@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-11', 'petugas', 'mustofa', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'MUSTOFA', 'PETUGAS-11', 'Petugas Surveyor Lapangan', '10', '01, 05, 06', 'RW 10 (RT 01, 05, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'mustofa@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-12', 'petugas', 'ilham.octavia', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'ILHAM OCTAVIA', 'PETUGAS-12', 'Petugas Surveyor Lapangan', '10', '02, 03, 04', 'RW 10 (RT 02, 03, 04)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'ilham.octavia@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-13', 'petugas', 'herdyan.aprianto', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'HERDYAN APRIANTO', 'PETUGAS-13', 'Petugas Surveyor Lapangan', '10', '07, 08', 'RW 10 (RT 07, 08)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'herdyan.aprianto@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-14', 'petugas', 'nanik.nurhidayati', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'NANIK NURHIDAYATI', 'PETUGAS-14', 'Petugas Surveyor Lapangan', '11', '01, 02, 03', 'RW 11 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'nanik.nurhidayati@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-15', 'petugas', 'suwarsih', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SUWARSIH', 'PETUGAS-15', 'Petugas Surveyor Lapangan', '11', '04, 05', 'RW 11 (RT 04, 05)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'suwarsih@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-16', 'petugas', 'achmad.nadzie', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'ACHMAD NADZIE', 'PETUGAS-16', 'Petugas Surveyor Lapangan', '15', '01, 02', 'RW 15 (RT 01, 02)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'achmad.nadzie@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-17', 'petugas', 'farisyatul.mufrodah', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'FARISYATUL MUFRODAH', 'PETUGAS-17', 'Petugas Surveyor Lapangan', '15', '03, 04, 10', 'RW 15 (RT 03, 04, 10)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'farisyatul.mufrodah@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-18', 'petugas', 'silvi.muyasaroh', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SILVI MUYASAROH', 'PETUGAS-18', 'Petugas Surveyor Lapangan', '15', '05, 06', 'RW 15 (RT 05, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'silvi.muyasaroh@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-19', 'petugas', 'vega.yusril', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'VEGA YUSRIL', 'PETUGAS-19', 'Petugas Surveyor Lapangan', '15', '07, 08, 09', 'RW 15 (RT 07, 08, 09)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'vega.yusril@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-20', 'petugas', 'vicky.wahyu', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'VICKY WAHYU', 'PETUGAS-20', 'Petugas Surveyor Lapangan', '16', '01, 02, 03', 'RW 16 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'vicky.wahyu@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-21', 'petugas', 'muhammad.nizar', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'MUHAMMAD NIZAR', 'PETUGAS-21', 'Petugas Surveyor Lapangan', '16', '04, 05, 09', 'RW 16 (RT 04, 05, 09)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'muhammad.nizar@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-22', 'petugas', 'moch.hasanudin', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'MOCH. HASANUDIN', 'PETUGAS-22', 'Petugas Surveyor Lapangan', '16', '06, 07, 08', 'RW 16 (RT 06, 07, 08)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'moch.hasanudin@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-23', 'petugas', 'endah.setyorini', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'ENDAH SETYORINI', 'PETUGAS-23', 'Petugas Surveyor Lapangan', '18', '01, 02, 03', 'RW 18 (RT 01, 02, 03)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'endah.setyorini@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis'),
('USR-PTG-24', 'petugas', 'sulistio.rini', '$2b$10$90PreEvslTOdndC08owVr.3BqLGdLOXUfEECh4P5ING2.1TfyFPBG', 'SULISTIO RINI', 'PETUGAS-24', 'Petugas Surveyor Lapangan', '18', '04, 05, 06', 'RW 18 (RT 04, 05, 06)', 'Kelurahan Purwantoro', 'Kecamatan Blimbing', 'Kota Malang', '081234567890', 'sulistio.rini@purwantoro.malangkota.go.id', 'APPROVED', '👤', NOW(), NOW(), 'Sistem Otomatis')
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`), `password` = VALUES(`password`), `rw` = VALUES(`rw`), `rt` = VALUES(`rt`), `wilayah_tugas` = VALUES(`wilayah_tugas`), `status` = 'APPROVED';
