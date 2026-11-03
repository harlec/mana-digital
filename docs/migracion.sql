-- Maná Digital · migración para el devocional diario y comunidad
-- MySQL 8 · utf8mb4. Ejecutar sobre la BD existente (users, user_settings, emotions, verses, ...).

ALTER TABLE users
  ADD COLUMN phone VARCHAR(20) NULL UNIQUE AFTER email,
  ADD COLUMN phone_verified_at TIMESTAMP NULL,
  ADD COLUMN avatar_color VARCHAR(9) DEFAULT '#6B3FBF',
  ADD COLUMN city VARCHAR(60) NULL,
  ADD COLUMN timezone VARCHAR(40) DEFAULT 'America/Lima',
  MODIFY email VARCHAR(255) NULL,
  MODIFY password_hash VARCHAR(255) NULL;

ALTER TABLE user_settings
  ADD COLUMN theme_mode ENUM('day','auto','night') DEFAULT 'auto',
  ADD COLUMN reading_mode ENUM('plan','feeling','group') DEFAULT 'plan',
  ADD COLUMN morning_time TIME DEFAULT '07:00:00',
  ADD COLUMN examen_time TIME DEFAULT '21:30:00',
  ADD COLUMN moment_times JSON NULL; -- ["10:30","13:00","17:30"]

CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  attempts TINYINT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Texto bíblico por capítulo (ver README §4.3 sobre licencias)
CREATE TABLE bible_books (
  id SMALLINT PRIMARY KEY,
  name_es VARCHAR(40) NOT NULL,
  chapters SMALLINT NOT NULL,
  testament ENUM('OT','NT') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bible_verses (
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT 'RV1909',
  text TEXT NOT NULL,
  PRIMARY KEY (version, book_id, chapter, verse),
  FOREIGN KEY (book_id) REFERENCES bible_books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pasajes sugeridos por emoción (modo "según cómo me siento")
CREATE TABLE emotion_passages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emotion_id INT NOT NULL,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse_start SMALLINT NULL,
  verse_end SMALLINT NULL,
  reason_es VARCHAR(200) NULL, -- "Ayer te sentiste ansioso: ..."
  FOREIGN KEY (emotion_id) REFERENCES emotions(id),
  FOREIGN KEY (book_id) REFERENCES bible_books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reading_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_type ENUM('user','group','catalog') NOT NULL,
  owner_id INT NULL,
  title VARCHAR(120) NOT NULL,
  book_id SMALLINT NOT NULL,
  pace TINYINT NOT NULL DEFAULT 1,            -- capítulos por día
  period ENUM('week','month','book') NOT NULL DEFAULT 'book',
  start_date DATE NOT NULL,
  total_days SMALLINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES bible_books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE daily_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  source ENUM('plan','feeling','group') NOT NULL,
  plan_id INT NULL,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  rhema_verse SMALLINT NULL,
  read_at TIMESTAMP NULL,
  learned TEXT NULL,
  apply_text TEXT NULL,
  prayer TEXT NULL,
  moments JSON NULL,           -- [true,false,false]
  learned_check BOOLEAN DEFAULT FALSE,
  communion_check BOOLEAN DEFAULT FALSE,
  examen_emotion_id INT NULL,
  examen_closed_at TIMESTAMP NULL,
  UNIQUE KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (examen_emotion_id) REFERENCES emotions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  type ENUM('family','cell','friends','ministry','church','interest','prayer') NOT NULL,
  city VARCHAR(60) NULL,
  church_name VARCHAR(120) NULL,
  visibility ENUM('private','public_open','public_approval') DEFAULT 'private',
  verified_at TIMESTAMP NULL,
  initial CHAR(1) NULL,
  color VARCHAR(9) DEFAULT '#6B3FBF',
  active_plan_id INT NULL,
  rules JSON NULL,  -- {material_members_only,hide_phones,private_offers,close_after_30d}
  invite_code VARCHAR(12) UNIQUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (city), INDEX (visibility),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE group_members (
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('leader','member') DEFAULT 'member',
  status ENUM('active','pending','removed') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE group_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  invited_by INT NOT NULL,
  channel ENUM('app','sms','whatsapp') NOT NULL,
  accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (phone),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE group_questions (
  group_id INT NOT NULL,
  date DATE NOT NULL,
  text VARCHAR(400) NOT NULL,
  author_id INT NOT NULL,
  PRIMARY KEY (group_id, date),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  book_id SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NULL,
  text TEXT NOT NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (group_id, date),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reacciones genéricas: amén (aportes), oraré (peticiones), gloria (testimonios)
CREATE TABLE reactions (
  target_type ENUM('contribution','prayer','testimony','city_request') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  kind ENUM('amen','praying','glory') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (target_type, target_id, user_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('contribution','prayer') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  text VARCHAR(1000) NOT NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prayer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  kind ENUM('spiritual','health','family','material') NOT NULL,
  text TEXT NOT NULL,
  needs SET('prayer','encouragement','help') DEFAULT 'prayer',
  visibility ENUM('group','leader','anonymous') DEFAULT 'group',
  status ENUM('open','answered','stale','closed') DEFAULT 'open',
  testimony TEXT NULL,
  answered_at TIMESTAMP NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (group_id, status),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE help_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prayer_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('transfer','food','goods','transport','visit','other') NOT NULL,
  detail VARCHAR(300) NULL,
  status ENUM('offered','accepted','done','declined') DEFAULT 'offered',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prayer_id) REFERENCES prayer_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nudges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  date DATE NOT NULL,
  kind ENUM('reminder','care') DEFAULT 'reminder',
  message VARCHAR(300) NULL,
  UNIQUE KEY (from_user_id, to_user_id, date, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NULL,
  reporter_id INT NULL,           -- NULL = automático
  target_type ENUM('contribution','comment','prayer','city_request','user') NOT NULL,
  target_id INT NOT NULL,
  reason VARCHAR(300) NULL,
  status ENUM('open','kept','removed') DEFAULT 'open',
  resolved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE leader_verifications (
  user_id INT NOT NULL,
  group_id INT NOT NULL,
  church_name VARCHAR(120) NOT NULL,
  verified_by VARCHAR(120) NULL,
  verified_at TIMESTAMP NULL,
  PRIMARY KEY (user_id, group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE city_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_city VARCHAR(60) NULL,
  city VARCHAR(60) NOT NULL,
  kind ENUM('prayer','visit','help') NOT NULL,
  text TEXT NOT NULL,
  coordinator_id INT NULL,        -- líder verificado asignado
  status ENUM('open','coordinating','done','closed') DEFAULT 'open',
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (city, status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE city_request_offers (
  request_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id, user_id),
  FOREIGN KEY (request_id) REFERENCES city_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
