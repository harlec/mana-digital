-- ================================================
-- Maná Digital · Notificaciones push
-- Aditivo: solo CREATE TABLE IF NOT EXISTS. Ejecutar en phpMyAdmin sobre la BD admin_mana.
-- Independiente de las demás fases (las notificaciones de grupos solo se envían si esas tablas existen).
-- ================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint TEXT NOT NULL,
  endpoint_hash CHAR(64) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_endpoint (endpoint_hash),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Claves VAPID (se generan solas la primera vez; la clave privada nunca sale de la base de datos)
CREATE TABLE IF NOT EXISTS push_config (
  k VARCHAR(40) NOT NULL PRIMARY KEY,
  v TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evita avisos repetidos (un aviso por clave y persona; ej. "morning:2026-11-08")
CREATE TABLE IF NOT EXISTS push_log (
  user_id INT NOT NULL,
  log_key VARCHAR(80) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, log_key),
  INDEX idx_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
