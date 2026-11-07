-- ================================================
-- Maná Digital · Fase 4 (panel del líder / pastor)
-- Aditivo: solo CREATE TABLE IF NOT EXISTS. Ejecutar en phpMyAdmin sobre la BD admin_mana.
-- Requiere haber ejecutado antes las migraciones de las Fases 1, 2 y 3.
-- ================================================

-- Reportes de contenido: reporter_id NULL = detectado automáticamente
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  reporter_id INT NULL,
  target_type ENUM('contribution','comment','prayer') NOT NULL,
  target_id INT NOT NULL,
  reason VARCHAR(300) NULL,
  status ENUM('open','kept','removed') NOT NULL DEFAULT 'open',
  resolved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_group_status (group_id, status),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas de seguridad del grupo (sin fila = valores por defecto)
CREATE TABLE IF NOT EXISTS group_rules (
  group_id INT NOT NULL PRIMARY KEY,
  close_after_30d TINYINT(1) NOT NULL DEFAULT 0,
  allow_anonymous TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
