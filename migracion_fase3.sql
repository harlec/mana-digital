-- ================================================
-- Maná Digital · Fase 3 (peticiones, ayuda y testimonios)
-- Aditivo: solo CREATE TABLE IF NOT EXISTS. Ejecutar en phpMyAdmin sobre la BD admin_mana.
-- Requiere haber ejecutado antes migracion_fase1.sql y migracion_fase2.sql.
-- ================================================

CREATE TABLE IF NOT EXISTS prayer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  kind ENUM('spiritual','health','family','material') NOT NULL,
  text TEXT NOT NULL,
  needs SET('prayer','encouragement','help') NOT NULL DEFAULT 'prayer',
  visibility ENUM('group','leader','anonymous') NOT NULL DEFAULT 'group',
  status ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  testimony TEXT NULL,
  answered_at TIMESTAMP NULL,
  hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_group_status (group_id, status),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ofrecimientos de ayuda: solo los ven el autor de la petición y los líderes
CREATE TABLE IF NOT EXISTS help_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prayer_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('transfer','food','goods','transport','visit','other') NOT NULL,
  detail VARCHAR(300) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_offer (prayer_id, user_id, type),
  FOREIGN KEY (prayer_id) REFERENCES prayer_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
