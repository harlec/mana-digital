-- ================================================
-- Maná Digital · Fase 2 (grupos)
-- Aditivo: solo CREATE TABLE IF NOT EXISTS. Ejecutar en phpMyAdmin sobre la BD admin_mana.
-- Requiere haber ejecutado antes migracion_fase1.sql.
-- ================================================

-- Grupo con su plan de lectura compartido (el mismo capítulo para todos cada día)
CREATE TABLE IF NOT EXISTS `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  type ENUM('family','cell','friends','ministry') NOT NULL DEFAULT 'friends',
  color VARCHAR(9) NOT NULL DEFAULT '#6B3FBF',
  book_id SMALLINT NOT NULL,
  pace TINYINT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  total_days SMALLINT NOT NULL,
  invite_code VARCHAR(12) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invite (invite_code),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('leader','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pregunta del día fijada por el líder
CREATE TABLE IF NOT EXISTS group_questions (
  group_id INT NOT NULL,
  date DATE NOT NULL,
  text VARCHAR(400) NOT NULL,
  author_id INT NOT NULL,
  PRIMARY KEY (group_id, date),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aporte de un miembro sobre el capítulo del día (uno por persona y día)
CREATE TABLE IF NOT EXISTS contributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_day (group_id, user_id, date),
  INDEX idx_group_date (group_id, date),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- “Amén” a un aporte
CREATE TABLE IF NOT EXISTS reactions (
  target_type ENUM('contribution','prayer','testimony','city_request') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  kind ENUM('amen','praying','glory') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (target_type, target_id, user_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('contribution','prayer') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  text VARCHAR(1000) NOT NULL,
  hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- “Recordar” a un miembro: 1 por remitente, destinatario y día
CREATE TABLE IF NOT EXISTS nudges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  date DATE NOT NULL,
  kind ENUM('reminder','care') NOT NULL DEFAULT 'reminder',
  message VARCHAR(300) NULL,
  UNIQUE KEY uq_nudge (from_user_id, to_user_id, date, kind),
  INDEX idx_to (to_user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
