-- ================================================
-- PRAYER & VERSE REMINDER APP - DATABASE SCHEMA
-- Script SQL Completo para Instalación
-- ================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS prayer_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prayer_app;

-- ================================================
-- TABLA: users
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: user_settings
-- ================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    language VARCHAR(2) DEFAULT 'es',
    dark_mode BOOLEAN DEFAULT FALSE,
    bible_version VARCHAR(20) DEFAULT 'RVR1960',
    default_theme VARCHAR(20) DEFAULT 'faith',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    notifications_paused BOOLEAN DEFAULT FALSE,
    interval_mode BOOLEAN DEFAULT TRUE,
    interval_hours INT DEFAULT 2,
    checkin_time TIME DEFAULT '09:00:00',
    checkin_notification BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: notification_schedules
-- ================================================
CREATE TABLE IF NOT EXISTS notification_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: emotions
-- ================================================
CREATE TABLE IF NOT EXISTS emotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name_es VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    theme_suggestion VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#8B5CF6',
    INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: daily_checkins
-- ================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    emotion_id INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (emotion_id) REFERENCES emotions(id),
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date),
    INDEX idx_emotion (emotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: verse_themes
-- ================================================
CREATE TABLE IF NOT EXISTS verse_themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name_es VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    description_es TEXT,
    description_en TEXT,
    INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: verses
-- ================================================
CREATE TABLE IF NOT EXISTS verses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) NOT NULL,
    book VARCHAR(50) NOT NULL,
    chapter INT NOT NULL,
    verse_start INT NOT NULL,
    verse_end INT NULL,
    text_es TEXT NOT NULL,
    text_en TEXT NOT NULL,
    theme_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES verse_themes(id),
    INDEX idx_theme (theme_id),
    INDEX idx_book (book)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: emotion_theme_mapping
-- ================================================
CREATE TABLE IF NOT EXISTS emotion_theme_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emotion_id INT NOT NULL,
    theme_id INT NOT NULL,
    priority INT DEFAULT 1,
    FOREIGN KEY (emotion_id) REFERENCES emotions(id),
    FOREIGN KEY (theme_id) REFERENCES verse_themes(id),
    UNIQUE KEY unique_emotion_theme (emotion_id, theme_id),
    INDEX idx_emotion (emotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: verse_history
-- ================================================
CREATE TABLE IF NOT EXISTS verse_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    verse_id INT NOT NULL,
    emotion_context_id INT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verse_id) REFERENCES verses(id),
    FOREIGN KEY (emotion_context_id) REFERENCES emotions(id),
    INDEX idx_user_id (user_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: favorites
-- ================================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    verse_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verse_id) REFERENCES verses(id),
    UNIQUE KEY unique_user_verse (user_id, verse_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INSERTAR DATOS: emotions
-- ================================================
INSERT INTO emotions (key_name, name_es, name_en, emoji, theme_suggestion, color) VALUES
('happy', 'Feliz', 'Happy', '😊', 'gratitude', '#10B981'),
('grateful', 'Agradecido', 'Grateful', '🙏', 'gratitude', '#F59E0B'),
('sad', 'Triste', 'Sad', '😔', 'comfort', '#6366F1'),
('anxious', 'Ansioso', 'Anxious', '😰', 'peace', '#8B5CF6'),
('stressed', 'Estresado', 'Stressed', '😫', 'peace', '#EC4899'),
('peaceful', 'En Paz', 'Peaceful', '😌', 'wisdom', '#14B8A6'),
('strong', 'Fuerte', 'Strong', '💪', 'strength', '#EF4444'),
('motivated', 'Motivado', 'Motivated', '🔥', 'purpose', '#F97316'),
('confused', 'Confundido', 'Confused', '😕', 'guidance', '#6B7280'),
('discouraged', 'Desanimado', 'Discouraged', '😞', 'hope', '#3B82F6'),
('needy', 'Necesitado', 'Needy', '🤲', 'faith', '#A855F7'),
('lonely', 'Solo', 'Lonely', '😢', 'love', '#EC4899');

-- ================================================
-- INSERTAR DATOS: verse_themes
-- ================================================
INSERT INTO verse_themes (key_name, name_es, name_en, description_es, description_en) VALUES
('faith', 'Fe', 'Faith', 'Versículos sobre confiar en Dios', 'Verses about trusting in God'),
('love', 'Amor', 'Love', 'Versículos sobre el amor de Dios', 'Verses about God\'s love'),
('hope', 'Esperanza', 'Hope', 'Versículos de esperanza y futuro', 'Verses of hope and future'),
('strength', 'Fortaleza', 'Strength', 'Versículos de fuerza y valentía', 'Verses of strength and courage'),
('peace', 'Paz', 'Peace', 'Versículos de paz y tranquilidad', 'Verses of peace and tranquility'),
('wisdom', 'Sabiduría', 'Wisdom', 'Versículos de sabiduría y guía', 'Verses of wisdom and guidance'),
('comfort', 'Consuelo', 'Comfort', 'Versículos de consuelo en tiempos difíciles', 'Verses of comfort in difficult times'),
('gratitude', 'Gratitud', 'Gratitude', 'Versículos de agradecimiento y alabanza', 'Verses of thanksgiving and praise'),
('guidance', 'Guía', 'Guidance', 'Versículos de dirección divina', 'Verses of divine direction'),
('purpose', 'Propósito', 'Purpose', 'Versículos sobre el propósito de vida', 'Verses about life purpose');

-- ================================================
-- INSERTAR DATOS: verses
-- ================================================

-- Fe (Faith)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Hebreos 11:1', 'Hebreos', 11, 1, NULL, 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.', 'Now faith is confidence in what we hope for and assurance about what we do not see.', 1),
('Marcos 11:24', 'Marcos', 11, 24, NULL, 'Por tanto, os digo que todo lo que pidiereis orando, creed que lo recibiréis, y os vendrá.', 'Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.', 1),
('Mateo 17:20', 'Mateo', 17, 20, NULL, 'Si tuviereis fe como un grano de mostaza, diréis a este monte: Pásate de aquí allá, y se pasará; y nada os será imposible.', 'If you have faith as small as a mustard seed, you can say to this mountain, "Move from here to there," and it will move. Nothing will be impossible for you.', 1),
('Proverbios 3:5-6', 'Proverbios', 3, 5, 6, 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', 1);

-- Amor (Love)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('1 Corintios 13:4-5', '1 Corintios', 13, 4, 5, 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo.', 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking.', 2),
('Juan 13:34', 'Juan', 13, 34, NULL, 'Un mandamiento nuevo os doy: Que os améis unos a otros; como yo os he amado, que también os améis unos a otros.', 'A new command I give you: Love one another. As I have loved you, so you must love one another.', 2),
('1 Juan 4:8', '1 Juan', 4, 8, NULL, 'El que no ama, no ha conocido a Dios; porque Dios es amor.', 'Whoever does not love does not know God, because God is love.', 2),
('Romanos 8:38-39', 'Romanos', 8, 38, 39, 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir podrá separarnos del amor de Dios.', 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future will be able to separate us from the love of God.', 2);

-- Esperanza (Hope)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Romanos 15:13', 'Romanos', 15, 13, NULL, 'Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo.', 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', 3),
('Jeremías 29:11', 'Jeremías', 29, 11, NULL, 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.', 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 3),
('Salmos 42:5', 'Salmos', 42, 5, NULL, '¿Por qué te abates, oh alma mía, y te turbas dentro de mí? Espera en Dios; porque aún he de alabarle, Salvación mía y Dios mío.', 'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.', 3),
('Lamentaciones 3:22-23', 'Lamentaciones', 3, 22, 23, 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.', 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.', 3);

-- Fortaleza (Strength)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Filipenses 4:13', 'Filipenses', 4, 13, NULL, 'Todo lo puedo en Cristo que me fortalece.', 'I can do all this through him who gives me strength.', 4),
('Isaías 40:31', 'Isaías', 40, 31, NULL, 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.', 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 4),
('2 Timoteo 1:7', '2 Timoteo', 1, 7, NULL, 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.', 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 4),
('Josué 1:9', 'Josué', 1, 9, NULL, 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.', 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 4);

-- Paz (Peace)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Juan 14:27', 'Juan', 14, 27, NULL, 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.', 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', 5),
('Filipenses 4:6-7', 'Filipenses', 4, 6, 7, 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones.', 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God. And the peace of God will guard your hearts and your minds.', 5),
('Salmos 34:14', 'Salmos', 34, 14, NULL, 'Apártate del mal, y haz el bien; busca la paz, y síguela.', 'Turn from evil and do good; seek peace and pursue it.', 5),
('Isaías 26:3', 'Isaías', 26, 3, NULL, 'Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.', 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', 5);

-- Sabiduría (Wisdom)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Santiago 1:5', 'Santiago', 1, 5, NULL, 'Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.', 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', 6),
('Proverbios 4:7', 'Proverbios', 4, 7, NULL, 'Sabiduría ante todo; adquiere sabiduría; y sobre todas tus posesiones adquiere inteligencia.', 'The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding.', 6),
('Proverbios 2:6', 'Proverbios', 2, 6, NULL, 'Porque Jehová da la sabiduría, y de su boca viene el conocimiento y la inteligencia.', 'For the Lord gives wisdom; from his mouth come knowledge and understanding.', 6),
('Colosenses 3:16', 'Colosenses', 3, 16, NULL, 'La palabra de Cristo more en abundancia en vosotros, enseñándoos y exhortándoos unos a otros en toda sabiduría.', 'Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom.', 6);

-- Consuelo (Comfort)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Mateo 5:4', 'Mateo', 5, 4, NULL, 'Bienaventurados los que lloran, porque ellos recibirán consolación.', 'Blessed are those who mourn, for they will be comforted.', 7),
('2 Corintios 1:3-4', '2 Corintios', 1, 3, 4, 'Bendito sea el Dios y Padre de nuestro Señor Jesucristo, Padre de misericordias y Dios de toda consolación, el cual nos consuela en todas nuestras tribulaciones.', 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.', 7),
('Salmos 34:18', 'Salmos', 34, 18, NULL, 'Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu.', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', 7),
('Salmos 147:3', 'Salmos', 147, 3, NULL, 'Él sana a los quebrantados de corazón, y venda sus heridas.', 'He heals the brokenhearted and binds up their wounds.', 7);

-- Gratitud (Gratitude)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('1 Tesalonicenses 5:18', '1 Tesalonicenses', 5, 18, NULL, 'Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.', 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.', 8),
('Salmos 100:4', 'Salmos', 100, 4, NULL, 'Entrad por sus puertas con acción de gracias, por sus atrios con alabanza; alabadle, bendecid su nombre.', 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.', 8),
('Colosenses 3:17', 'Colosenses', 3, 17, NULL, 'Y todo lo que hacéis, sea de palabra o de hecho, hacedlo todo en el nombre del Señor Jesús, dando gracias a Dios Padre por medio de él.', 'And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.', 8),
('Salmos 107:1', 'Salmos', 107, 1, NULL, 'Alabad a Jehová, porque él es bueno; porque para siempre es su misericordia.', 'Give thanks to the Lord, for he is good; his love endures forever.', 8);

-- Guía (Guidance)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Salmos 32:8', 'Salmos', 32, 8, NULL, 'Te haré entender, y te enseñaré el camino en que debes andar; sobre ti fijaré mis ojos.', 'I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.', 9),
('Proverbios 16:9', 'Proverbios', 16, 9, NULL, 'El corazón del hombre piensa su camino; mas Jehová endereza sus pasos.', 'In their hearts humans plan their course, but the Lord establishes their steps.', 9),
('Salmos 119:105', 'Salmos', 119, 105, NULL, 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.', 'Your word is a lamp for my feet, a light on my path.', 9),
('Isaías 30:21', 'Isaías', 30, 21, NULL, 'Entonces tus oídos oirán a tus espaldas palabra que diga: Este es el camino, andad por él.', 'Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, "This is the way; walk in it."', 9);

-- Propósito (Purpose)
INSERT INTO verses (reference, book, chapter, verse_start, verse_end, text_es, text_en, theme_id) VALUES
('Jeremías 1:5', 'Jeremías', 1, 5, NULL, 'Antes que te formase en el vientre te conocí, y antes que nacieses te santifiqué, te di por profeta a las naciones.', 'Before I formed you in the womb I knew you, before you were born I set you apart.', 10),
('Efesios 2:10', 'Efesios', 2, 10, NULL, 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.', 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.', 10),
('Romanos 8:28', 'Romanos', 8, 28, NULL, 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 10),
('1 Pedro 4:10', '1 Pedro', 4, 10, NULL, 'Cada uno según el don que ha recibido, minístrelo a los otros, como buenos administradores de la multiforme gracia de Dios.', 'Each of you should use whatever gift you have received to serve others, as faithful stewards of God\'s grace.', 10);

-- ================================================
-- INSERTAR DATOS: emotion_theme_mapping
-- ================================================
INSERT INTO emotion_theme_mapping (emotion_id, theme_id, priority) VALUES
-- Happy/Grateful -> Gratitude, Love
(1, 8, 1), (1, 2, 2),
(2, 8, 1), (2, 2, 2),
-- Sad -> Comfort, Hope
(3, 7, 1), (3, 3, 2),
-- Anxious/Stressed -> Peace, Comfort
(4, 5, 1), (4, 7, 2),
(5, 5, 1), (5, 4, 2),
-- Peaceful -> Wisdom, Gratitude
(6, 6, 1), (6, 8, 2),
-- Strong/Motivated -> Strength, Purpose
(7, 4, 1), (7, 10, 2),
(8, 10, 1), (8, 4, 2),
-- Confused -> Guidance, Wisdom
(9, 9, 1), (9, 6, 2),
-- Discouraged -> Hope, Strength
(10, 3, 1), (10, 4, 2),
-- Needy -> Faith, Hope
(11, 1, 1), (11, 3, 2),
-- Lonely -> Love, Comfort
(12, 2, 1), (12, 7, 2);

-- ================================================
-- VERIFICAR INSTALACIÓN
-- ================================================
SELECT 'Base de datos creada exitosamente!' AS estado;
SELECT COUNT(*) AS total_versiculos FROM verses;
SELECT COUNT(*) AS total_temas FROM verse_themes;
SELECT COUNT(*) AS total_emociones FROM emotions;
SELECT COUNT(*) AS total_mapeos FROM emotion_theme_mapping;