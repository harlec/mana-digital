-- Maná Digital · Fase 1 (devocional personal)
-- Compatible con MySQL 8 y MariaDB. Solo CREATE TABLE IF NOT EXISTS / INSERT IGNORE:
-- no modifica ninguna tabla existente y se puede ejecutar más de una vez sin dañar nada.
-- Ejecutar en phpMyAdmin (Plesk) sobre la base `admin_mana`, pestaña SQL.

CREATE TABLE IF NOT EXISTS bible_books (
  id SMALLINT PRIMARY KEY,
  name_es VARCHAR(40) NOT NULL,
  chapters SMALLINT NOT NULL,
  testament ENUM('OT','NT') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO bible_books (id, name_es, chapters, testament) VALUES
(1,'Génesis',50,'OT'),
(2,'Éxodo',40,'OT'),
(3,'Levítico',27,'OT'),
(4,'Números',36,'OT'),
(5,'Deuteronomio',34,'OT'),
(6,'Josué',24,'OT'),
(7,'Jueces',21,'OT'),
(8,'Rut',4,'OT'),
(9,'1 Samuel',31,'OT'),
(10,'2 Samuel',24,'OT'),
(11,'1 Reyes',22,'OT'),
(12,'2 Reyes',25,'OT'),
(13,'1 Crónicas',29,'OT'),
(14,'2 Crónicas',36,'OT'),
(15,'Esdras',10,'OT'),
(16,'Nehemías',13,'OT'),
(17,'Ester',10,'OT'),
(18,'Job',42,'OT'),
(19,'Salmos',150,'OT'),
(20,'Proverbios',31,'OT'),
(21,'Eclesiastés',12,'OT'),
(22,'Cantares',8,'OT'),
(23,'Isaías',66,'OT'),
(24,'Jeremías',52,'OT'),
(25,'Lamentaciones',5,'OT'),
(26,'Ezequiel',48,'OT'),
(27,'Daniel',12,'OT'),
(28,'Oseas',14,'OT'),
(29,'Joel',3,'OT'),
(30,'Amós',9,'OT'),
(31,'Abdías',1,'OT'),
(32,'Jonás',4,'OT'),
(33,'Miqueas',7,'OT'),
(34,'Nahúm',3,'OT'),
(35,'Habacuc',3,'OT'),
(36,'Sofonías',3,'OT'),
(37,'Hageo',2,'OT'),
(38,'Zacarías',14,'OT'),
(39,'Malaquías',4,'OT'),
(40,'Mateo',28,'NT'),
(41,'Marcos',16,'NT'),
(42,'Lucas',24,'NT'),
(43,'Juan',21,'NT'),
(44,'Hechos',28,'NT'),
(45,'Romanos',16,'NT'),
(46,'1 Corintios',16,'NT'),
(47,'2 Corintios',13,'NT'),
(48,'Gálatas',6,'NT'),
(49,'Efesios',6,'NT'),
(50,'Filipenses',4,'NT'),
(51,'Colosenses',4,'NT'),
(52,'1 Tesalonicenses',5,'NT'),
(53,'2 Tesalonicenses',3,'NT'),
(54,'1 Timoteo',6,'NT'),
(55,'2 Timoteo',4,'NT'),
(56,'Tito',3,'NT'),
(57,'Filemón',1,'NT'),
(58,'Hebreos',13,'NT'),
(59,'Santiago',5,'NT'),
(60,'1 Pedro',5,'NT'),
(61,'2 Pedro',3,'NT'),
(62,'1 Juan',5,'NT'),
(63,'2 Juan',1,'NT'),
(64,'3 Juan',1,'NT'),
(65,'Judas',1,'NT'),
(66,'Apocalipsis',22,'NT');

-- Texto bíblico por versículo. Se llena con tools/import_bible.php
CREATE TABLE IF NOT EXISTS bible_verses (
  version VARCHAR(10) NOT NULL DEFAULT 'RV1909',
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (version, book_id, chapter, verse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pasaje sugerido por emoción (modo "según cómo me sentí ayer")
CREATE TABLE IF NOT EXISTS emotion_passages (
  emotion_key VARCHAR(50) NOT NULL PRIMARY KEY,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  reason_es VARCHAR(200) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO emotion_passages (emotion_key, book_id, chapter, reason_es)
SELECT v.k, b.id, v.c, v.r FROM (
  SELECT 'happy' AS k, 'Salmos' AS n, 100 AS c, 'Hoy tu corazón está alegre. Dale gracias.' AS r UNION ALL
  SELECT 'grateful' AS k, 'Salmos' AS n, 103 AS c, 'Estás agradecido: recuerda todos sus beneficios.' AS r UNION ALL
  SELECT 'sad' AS k, 'Salmos' AS n, 42 AS c, 'Te sentiste triste. Dios cuida de ti en medio de eso.' AS r UNION ALL
  SELECT 'anxious' AS k, 'Filipenses' AS n, 4 AS c, 'Te sentiste ansioso. Esta lectura es para ti.' AS r UNION ALL
  SELECT 'stressed' AS k, 'Mateo' AS n, 11 AS c, 'Te sentiste estresado. Ven a Él y descansa.' AS r UNION ALL
  SELECT 'peaceful' AS k, 'Salmos' AS n, 23 AS c, 'Te sentiste en paz. Permanece ahí.' AS r UNION ALL
  SELECT 'strong' AS k, 'Josué' AS n, 1 AS c, 'Te sentiste fuerte. Sé valiente y esfuérzate.' AS r UNION ALL
  SELECT 'motivated' AS k, 'Colosenses' AS n, 3 AS c, 'Te sentiste motivado. Hazlo todo como para el Señor.' AS r UNION ALL
  SELECT 'confused' AS k, 'Proverbios' AS n, 3 AS c, 'Te sentiste confundido. Pide dirección.' AS r UNION ALL
  SELECT 'discouraged' AS k, 'Salmos' AS n, 27 AS c, 'Te sentiste desanimado. Espera en el Señor.' AS r UNION ALL
  SELECT 'needy' AS k, 'Salmos' AS n, 34 AS c, 'Te sentiste necesitado. Él oye y libra.' AS r UNION ALL
  SELECT 'lonely' AS k, 'Salmos' AS n, 139 AS c, 'Te sentiste solo. Él nunca se aparta de ti.' AS r
) v JOIN bible_books b ON b.name_es = v.n COLLATE utf8mb4_unicode_ci;

-- Planes de lectura personales
CREATE TABLE IF NOT EXISTS reading_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  book_id SMALLINT NOT NULL,
  pace TINYINT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  total_days SMALLINT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_active (user_id, is_active),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Un registro por usuario y día: lectura, rhema, devocional, comunión y examen
CREATE TABLE IF NOT EXISTS daily_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  source ENUM('plan','feeling') NOT NULL DEFAULT 'plan',
  plan_id INT NULL,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  chapter_end SMALLINT NOT NULL,
  rhema_chapter SMALLINT NULL,
  rhema_verse SMALLINT NULL,
  read_at TIMESTAMP NULL,
  learned TEXT NULL,
  apply_text TEXT NULL,
  prayer TEXT NULL,
  moment1 TINYINT(1) NOT NULL DEFAULT 0,
  moment2 TINYINT(1) NOT NULL DEFAULT 0,
  moment3 TINYINT(1) NOT NULL DEFAULT 0,
  learned_check TINYINT(1) NOT NULL DEFAULT 0,
  communion_check TINYINT(1) NOT NULL DEFAULT 0,
  examen_emotion_id INT NULL,
  examen_closed_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preferencias del día devocional (no toca user_settings)
CREATE TABLE IF NOT EXISTS user_day_settings (
  user_id INT NOT NULL PRIMARY KEY,
  reading_mode ENUM('plan','feeling') NOT NULL DEFAULT 'plan',
  morning_time TIME NOT NULL DEFAULT '07:00:00',
  examen_time TIME NOT NULL DEFAULT '21:30:00',
  onboarded TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
