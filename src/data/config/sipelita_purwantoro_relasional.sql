
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
  `dusun` VARCHAR(100) DEFAULT NULL,
  `rt` VARCHAR(10) DEFAULT NULL,
  `rw` VARCHAR(10) DEFAULT NULL,
  `rt_rw_id` INT DEFAULT NULL,
  `jumlah_jiwa` INT DEFAULT NULL,
  `pekerjaan` VARCHAR(100) DEFAULT NULL,
  `penghasilan` VARCHAR(100) DEFAULT NULL,
  `penghasilan_nominal` DECIMAL(14,2) DEFAULT NULL,
  `nilai_umk` DECIMAL(14,2) DEFAULT 3736101.00,
  `status_rumah` VARCHAR(100) DEFAULT NULL,
  `aset_rumah_lain` VARCHAR(10) DEFAULT 'Tidak',
  `status_tanah` VARCHAR(100) DEFAULT NULL,
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
  `rekomendasi_sistem` TEXT DEFAULT NULL,
  `status_verifikasi` ENUM('MENUNGGU_VALIDASI','TERVERIFIKASI','BUTUH_REVISI') NOT NULL DEFAULT 'MENUNGGU_VALIDASI',
  `catatan_admin` TEXT DEFAULT NULL,
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
