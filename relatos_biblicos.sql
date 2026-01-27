-- ================================================
-- MANÁ DIGITAL - RELATOS BÍBLICOS
-- Historias resumidas de la Biblia
-- ================================================

-- ================================================
-- TABLA: bible_stories (Relatos Bíblicos)
-- ================================================
CREATE TABLE IF NOT EXISTS bible_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title_es VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    summary_es TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    moral_es VARCHAR(255),
    moral_en VARCHAR(255),
    theme_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES verse_themes(id),
    INDEX idx_theme (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: story_theme_mapping (Mapeo Emociones -> Relatos)
-- ================================================
CREATE TABLE IF NOT EXISTS story_theme_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emotion_id INT NOT NULL,
    theme_id INT NOT NULL,
    priority INT DEFAULT 1,
    FOREIGN KEY (emotion_id) REFERENCES emotions(id),
    FOREIGN KEY (theme_id) REFERENCES verse_themes(id),
    UNIQUE KEY unique_story_emotion_theme (emotion_id, theme_id),
    INDEX idx_emotion (emotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: story_history (Historial de Relatos)
-- ================================================
CREATE TABLE IF NOT EXISTS story_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    story_id INT NOT NULL,
    emotion_context_id INT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES bible_stories(id),
    FOREIGN KEY (emotion_context_id) REFERENCES emotions(id),
    INDEX idx_user_id (user_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- MODIFICAR user_settings para preferencia de contenido
-- ================================================
ALTER TABLE user_settings
ADD COLUMN content_preference ENUM('verse', 'story', 'both') DEFAULT 'verse' AFTER default_theme;

-- ================================================
-- INSERTAR RELATOS BÍBLICOS
-- ================================================

-- FE (Faith) - theme_id = 1
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('David y Goliat', 'David and Goliath', '1 Samuel 17',
'Un joven pastor llamado David se enfrentó al gigante filisteo Goliat cuando todo el ejército de Israel tenía miedo. Mientras los soldados veían un gigante imposible de vencer, David veía una oportunidad para que Dios mostrara su poder. Sin armadura ni espada, solo con una honda y cinco piedras, David derrotó a Goliat con una sola piedra en la frente.

David no confiaba en sus propias fuerzas ni en armas humanas. Su fe estaba puesta en el Dios vivo que ya lo había librado del león y del oso mientras cuidaba ovejas. Esa misma fe lo llevó a la victoria contra el gigante.',
'A young shepherd named David faced the Philistine giant Goliath when all of Israel''s army was afraid. While the soldiers saw an impossible giant to defeat, David saw an opportunity for God to show His power. Without armor or sword, only with a sling and five stones, David defeated Goliath with a single stone to the forehead.

David did not trust in his own strength or human weapons. His faith was placed in the living God who had already delivered him from the lion and the bear while tending sheep. That same faith led him to victory against the giant.',
'La fe en Dios puede vencer cualquier gigante en nuestra vida.',
'Faith in God can overcome any giant in our life.', 1),

('Abraham e Isaac', 'Abraham and Isaac', 'Génesis 22:1-19',
'Dios probó la fe de Abraham pidiéndole que sacrificara a su único hijo Isaac, el hijo de la promesa que había esperado por décadas. Abraham obedeció con un corazón quebrantado pero confiado. Subió al monte Moriah con Isaac, preparó el altar y levantó el cuchillo.

En el último momento, un ángel detuvo su mano. Dios proveyó un carnero para el sacrificio. Abraham llamó a ese lugar "Jehová proveerá". Su fe fue probada al límite, pero Dios honró su obediencia y reafirmó sus promesas.',
'God tested Abraham''s faith by asking him to sacrifice his only son Isaac, the son of promise he had waited decades for. Abraham obeyed with a broken but trusting heart. He climbed Mount Moriah with Isaac, prepared the altar, and raised the knife.

At the last moment, an angel stopped his hand. God provided a ram for the sacrifice. Abraham called that place "The Lord Will Provide." His faith was tested to the limit, but God honored his obedience and reaffirmed His promises.',
'Dios prueba nuestra fe, pero siempre provee.',
'God tests our faith, but He always provides.', 1),

('Pedro camina sobre el agua', 'Peter Walks on Water', 'Mateo 14:22-33',
'Los discípulos estaban en una barca en medio de una tormenta cuando vieron a Jesús caminando sobre el agua. Pedro, con valentía, le pidió que lo llamara a caminar hacia Él. Jesús dijo: "Ven". Pedro salió de la barca y comenzó a caminar sobre el agua hacia Jesús.

Pero cuando vio el viento y las olas, tuvo miedo y comenzó a hundirse. Gritó: "¡Señor, sálvame!" Jesús inmediatamente lo tomó de la mano y le dijo: "Hombre de poca fe, ¿por qué dudaste?" Mientras Pedro mantuvo sus ojos en Jesús, caminó sobre lo imposible.',
'The disciples were in a boat in the middle of a storm when they saw Jesus walking on the water. Peter, with courage, asked Him to call him to walk toward Him. Jesus said, "Come." Peter got out of the boat and began walking on the water toward Jesus.

But when he saw the wind and the waves, he became afraid and began to sink. He cried out, "Lord, save me!" Jesus immediately took his hand and said, "You of little faith, why did you doubt?" As long as Peter kept his eyes on Jesus, he walked on the impossible.',
'Mantén tus ojos en Jesús, no en las tormentas.',
'Keep your eyes on Jesus, not on the storms.', 1);

-- AMOR (Love) - theme_id = 2
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('El hijo pródigo', 'The Prodigal Son', 'Lucas 15:11-32',
'Un hijo pidió su herencia a su padre y se fue a un país lejano donde malgastó todo en una vida desenfrenada. Cuando una hambruna azotó la tierra, terminó cuidando cerdos y deseando comer su comida. Entonces recordó la casa de su padre.

Regresó humillado, preparado para pedir ser tratado como un sirviente. Pero el padre lo vio desde lejos, corrió hacia él, lo abrazó y lo besó. Organizó una fiesta y dijo: "Mi hijo estaba muerto y ha vuelto a la vida; estaba perdido y ha sido encontrado." Así es el amor del Padre celestial por nosotros.',
'A son asked his father for his inheritance and went to a distant country where he squandered everything in wild living. When a famine struck the land, he ended up feeding pigs and wishing he could eat their food. Then he remembered his father''s house.

He returned humiliated, prepared to ask to be treated as a servant. But the father saw him from afar, ran to him, embraced him, and kissed him. He threw a party and said, "My son was dead and is alive again; he was lost and is found." This is how the Heavenly Father loves us.',
'El amor de Dios nos espera sin importar cuán lejos hayamos ido.',
'God''s love awaits us no matter how far we have gone.', 2),

('El buen samaritano', 'The Good Samaritan', 'Lucas 10:25-37',
'Un hombre fue asaltado en el camino de Jerusalén a Jericó y dejado medio muerto. Un sacerdote lo vio y pasó de largo. Un levita hizo lo mismo. Pero un samaritano, considerado enemigo por los judíos, se detuvo.

El samaritano curó sus heridas, lo subió a su animal, lo llevó a una posada y pagó por su cuidado. Jesús preguntó: "¿Quién fue el prójimo?" La respuesta fue clara: el que mostró misericordia. El amor verdadero no conoce fronteras de raza, religión o enemistad.',
'A man was robbed on the road from Jerusalem to Jericho and left half dead. A priest saw him and passed by. A Levite did the same. But a Samaritan, considered an enemy by the Jews, stopped.

The Samaritan treated his wounds, put him on his animal, took him to an inn, and paid for his care. Jesus asked, "Who was the neighbor?" The answer was clear: the one who showed mercy. True love knows no boundaries of race, religion, or enmity.',
'El amor verdadero se demuestra con acciones, no con palabras.',
'True love is demonstrated with actions, not words.', 2),

('Rut y Noemí', 'Ruth and Naomi', 'Rut 1-4',
'Noemí perdió a su esposo y sus dos hijos en tierra extranjera. Decidió regresar a Israel y le dijo a sus nueras que volvieran con sus familias. Orfa se fue, pero Rut se negó a abandonarla: "Tu pueblo será mi pueblo, y tu Dios será mi Dios."

Rut cuidó de Noemí trabajando en los campos de Booz, un pariente de su difunto esposo. Su lealtad y amor fueron recompensados: Booz la tomó como esposa. Rut, una extranjera moabita, se convirtió en bisabuela del rey David y antepasada de Jesús.',
'Naomi lost her husband and two sons in a foreign land. She decided to return to Israel and told her daughters-in-law to go back to their families. Orpah left, but Ruth refused to abandon her: "Your people will be my people, and your God will be my God."

Ruth cared for Naomi by working in the fields of Boaz, a relative of her late husband. Her loyalty and love were rewarded: Boaz took her as his wife. Ruth, a foreign Moabite, became the great-grandmother of King David and an ancestor of Jesus.',
'La lealtad y el amor sacrificial son recompensados por Dios.',
'Loyalty and sacrificial love are rewarded by God.', 2);

-- ESPERANZA (Hope) - theme_id = 3
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('José y sus hermanos', 'Joseph and His Brothers', 'Génesis 37-50',
'José fue vendido como esclavo por sus propios hermanos, falsamente acusado y encarcelado en Egipto. Pasaron años oscuros donde parecía que Dios lo había olvidado. Pero José nunca perdió la esperanza ni su integridad.

Dios lo levantó de la prisión para convertirlo en el segundo hombre más poderoso de Egipto. Cuando hubo hambruna, sus hermanos vinieron a él. José les dijo: "Ustedes pensaron hacerme mal, pero Dios lo transformó en bien para salvar muchas vidas." Lo que parecía destrucción era preparación.',
'Joseph was sold as a slave by his own brothers, falsely accused, and imprisoned in Egypt. Dark years passed where it seemed God had forgotten him. But Joseph never lost hope or his integrity.

God raised him from prison to become the second most powerful man in Egypt. When there was famine, his brothers came to him. Joseph told them: "You intended to harm me, but God intended it for good to save many lives." What seemed like destruction was preparation.',
'Dios puede transformar nuestras peores situaciones en bendiciones.',
'God can transform our worst situations into blessings.', 3),

('Los huesos secos', 'The Valley of Dry Bones', 'Ezequiel 37:1-14',
'El profeta Ezequiel tuvo una visión: un valle lleno de huesos secos, completamente muertos. Dios le preguntó: "¿Podrán vivir estos huesos?" Ezequiel respondió: "Señor, tú lo sabes."

Dios le ordenó profetizar sobre los huesos. Mientras hablaba, los huesos se juntaron, les crecieron tendones, carne y piel. Luego el Espíritu sopló sobre ellos y se levantaron como un gran ejército. Esta visión representaba la restauración de Israel, pero nos enseña que ninguna situación está más allá de la resurrección de Dios.',
'The prophet Ezekiel had a vision: a valley full of dry bones, completely dead. God asked him, "Can these bones live?" Ezekiel answered, "Lord, you know."

God commanded him to prophesy over the bones. As he spoke, the bones came together, grew tendons, flesh, and skin. Then the Spirit breathed on them and they rose as a great army. This vision represented Israel''s restoration, but it teaches us that no situation is beyond God''s resurrection power.',
'Dios puede dar vida a lo que parece completamente muerto.',
'God can bring life to what seems completely dead.', 3),

('El ciego Bartimeo', 'Blind Bartimaeus', 'Marcos 10:46-52',
'Bartimeo era un mendigo ciego que se sentaba junto al camino en Jericó. Cuando escuchó que Jesús pasaba, comenzó a gritar: "¡Jesús, Hijo de David, ten misericordia de mí!" La multitud trataba de callarlo, pero él gritaba más fuerte.

Jesús se detuvo y lo mandó llamar. Le preguntó: "¿Qué quieres que haga por ti?" Bartimeo respondió: "Maestro, que pueda ver." Jesús dijo: "Vete, tu fe te ha sanado." Inmediatamente recobró la vista y siguió a Jesús. Su persistencia en medio de la oposición fue recompensada.',
'Bartimaeus was a blind beggar who sat by the roadside in Jericho. When he heard that Jesus was passing by, he began to shout, "Jesus, Son of David, have mercy on me!" The crowd tried to silence him, but he shouted louder.

Jesus stopped and called for him. He asked, "What do you want me to do for you?" Bartimaeus answered, "Rabbi, I want to see." Jesus said, "Go, your faith has healed you." Immediately he received his sight and followed Jesus. His persistence amid opposition was rewarded.',
'Nunca dejes de clamar a Jesús, sin importar quién te quiera callar.',
'Never stop crying out to Jesus, no matter who tries to silence you.', 3);

-- FORTALEZA (Strength) - theme_id = 4
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('Sansón', 'Samson', 'Jueces 13-16',
'Sansón fue consagrado a Dios desde antes de nacer y recibió una fuerza sobrenatural. Derrotó ejércitos filisteos, mató un león con sus manos y realizó hazañas increíbles. Su fuerza venía de su pacto con Dios, simbolizado en su cabello sin cortar.

Cuando reveló su secreto a Dalila, perdió todo. Ciego y humillado, fue puesto como espectáculo ante los filisteos. Pero en su momento final, clamó a Dios una última vez. Su cabello había crecido, y con él su fuerza. Derribó el templo sobre sus enemigos, logrando más en su muerte que en toda su vida.',
'Samson was consecrated to God from before birth and received supernatural strength. He defeated Philistine armies, killed a lion with his hands, and performed incredible feats. His strength came from his covenant with God, symbolized by his uncut hair.

When he revealed his secret to Delilah, he lost everything. Blind and humiliated, he was made a spectacle before the Philistines. But in his final moment, he cried out to God one last time. His hair had grown back, and with it his strength. He brought down the temple on his enemies, accomplishing more in his death than in his entire life.',
'Nuestra verdadera fortaleza viene de nuestra relación con Dios.',
'Our true strength comes from our relationship with God.', 4),

('Daniel en el foso de los leones', 'Daniel in the Lions'' Den', 'Daniel 6',
'Daniel servía fielmente al rey Darío, pero sus enemigos conspiaron contra él. Convencieron al rey de firmar un decreto: nadie podía orar a ningún dios excepto al rey por 30 días, bajo pena de muerte en el foso de los leones. Daniel lo sabía, pero siguió orando a Dios tres veces al día.

Fue arrojado al foso de los leones. El rey pasó la noche sin dormir. Al amanecer, corrió al foso y llamó: "Daniel, ¿pudo tu Dios librarte?" Daniel respondió: "Mi Dios envió su ángel y cerró la boca de los leones." Su fe y obediencia lo protegieron.',
'Daniel served King Darius faithfully, but his enemies conspired against him. They convinced the king to sign a decree: no one could pray to any god except the king for 30 days, under penalty of death in the lions'' den. Daniel knew this, but continued praying to God three times a day.

He was thrown into the lions'' den. The king spent a sleepless night. At dawn, he ran to the den and called out: "Daniel, was your God able to save you?" Daniel replied: "My God sent his angel and shut the mouths of the lions." His faith and obedience protected him.',
'La obediencia a Dios vale más que la obediencia a los hombres.',
'Obedience to God is worth more than obedience to men.', 4),

('Los tres jóvenes en el horno', 'The Three Young Men in the Furnace', 'Daniel 3',
'El rey Nabucodonosor levantó una estatua de oro y ordenó que todos la adoraran. Tres jóvenes hebreos—Sadrac, Mesac y Abed-nego—se negaron. El rey, furioso, amenazó con arrojarlos a un horno ardiente.

Ellos respondieron: "Nuestro Dios puede librarnos del horno. Pero aunque no lo haga, no adoraremos tu estatua." Fueron arrojados al horno calentado siete veces más de lo normal. Pero el rey vio cuatro figuras caminando en el fuego, ilesas. Los sacó y ni siquiera olían a humo. El cuarto era como un hijo de los dioses.',
'King Nebuchadnezzar set up a golden statue and commanded everyone to worship it. Three Hebrew young men—Shadrach, Meshach, and Abednego—refused. The king, furious, threatened to throw them into a blazing furnace.

They answered: "Our God can deliver us from the furnace. But even if He does not, we will not worship your statue." They were thrown into the furnace heated seven times hotter than usual. But the king saw four figures walking in the fire, unharmed. He brought them out and they did not even smell of smoke. The fourth was like a son of the gods.',
'La fe verdadera confía en Dios incluso cuando no entendemos el resultado.',
'True faith trusts God even when we do not understand the outcome.', 4);

-- PAZ (Peace) - theme_id = 5
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('Jesús calma la tormenta', 'Jesus Calms the Storm', 'Marcos 4:35-41',
'Jesús y sus discípulos cruzaban el mar de Galilea cuando se desató una tormenta violenta. Las olas golpeaban la barca y la llenaban de agua. Los discípulos estaban aterrorizados. Pero Jesús dormía tranquilamente en la popa, sobre un cabezal.

Lo despertaron gritando: "¡Maestro! ¿No te importa que perezcamos?" Jesús se levantó, reprendió al viento y dijo al mar: "¡Calla, enmudece!" El viento cesó y hubo gran calma. Luego les preguntó: "¿Por qué tenéis miedo? ¿Aún no tenéis fe?" Jesús puede calmar cualquier tormenta.',
'Jesus and his disciples were crossing the Sea of Galilee when a violent storm arose. Waves beat against the boat and filled it with water. The disciples were terrified. But Jesus slept peacefully in the stern, on a cushion.

They woke him shouting, "Teacher! Don''t you care if we drown?" Jesus got up, rebuked the wind and said to the sea, "Quiet! Be still!" The wind died down and it was completely calm. Then he asked them, "Why are you afraid? Do you still have no faith?" Jesus can calm any storm.',
'Jesús tiene poder sobre todas las tormentas de nuestra vida.',
'Jesus has power over all the storms in our life.', 5),

('María y Marta', 'Mary and Martha', 'Lucas 10:38-42',
'Jesús visitó la casa de Marta y María. Marta estaba afanada con muchos preparativos, queriendo que todo fuera perfecto para servir a Jesús. María, en cambio, se sentó a los pies de Jesús escuchando sus palabras.

Marta, frustrada, le pidió a Jesús que le dijera a María que la ayudara. Jesús respondió con amor: "Marta, Marta, estás afanada y turbada con muchas cosas. Pero solo una cosa es necesaria. María ha escogido la buena parte, la cual no le será quitada." A veces, la paz viene de detenernos y simplemente estar con Jesús.',
'Jesus visited the home of Martha and Mary. Martha was busy with many preparations, wanting everything to be perfect to serve Jesus. Mary, instead, sat at Jesus'' feet listening to his words.

Martha, frustrated, asked Jesus to tell Mary to help her. Jesus answered with love: "Martha, Martha, you are worried and troubled about many things. But only one thing is necessary. Mary has chosen the good part, which will not be taken from her." Sometimes, peace comes from stopping and simply being with Jesus.',
'La paz se encuentra en la presencia de Jesús, no en el afán.',
'Peace is found in Jesus'' presence, not in busyness.', 5),

('Elías y la voz apacible', 'Elijah and the Still Small Voice', '1 Reyes 19:1-18',
'Después de una gran victoria sobre los profetas de Baal, Elías huyó aterrorizado de la reina Jezabel. Agotado y deprimido, pidió morir. Un ángel lo alimentó y lo guió al monte Horeb, donde se escondió en una cueva.

Dios le preguntó: "¿Qué haces aquí, Elías?" Luego le mostró un viento poderoso, un terremoto y fuego, pero Dios no estaba en ninguno de ellos. Después vino un silbo apacible y delicado. Ahí estaba Dios. A veces necesitamos silencio para escuchar la paz de Dios.',
'After a great victory over the prophets of Baal, Elijah fled in terror from Queen Jezebel. Exhausted and depressed, he asked to die. An angel fed him and guided him to Mount Horeb, where he hid in a cave.

God asked him, "What are you doing here, Elijah?" Then He showed him a powerful wind, an earthquake, and fire, but God was not in any of them. After that came a gentle whisper. There was God. Sometimes we need silence to hear God''s peace.',
'Dios a menudo habla en la quietud, no en el ruido.',
'God often speaks in stillness, not in noise.', 5);

-- SABIDURÍA (Wisdom) - theme_id = 6
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('El juicio de Salomón', 'Solomon''s Judgment', '1 Reyes 3:16-28',
'Dos mujeres se presentaron ante el rey Salomón con un bebé, cada una afirmando ser la verdadera madre. Una había aplastado accidentalmente a su hijo mientras dormía y cambió los bebés. Ahora ambas reclamaban al niño vivo.

Salomón pidió una espada y ordenó: "Corten al niño en dos y denle la mitad a cada una." La verdadera madre gritó: "¡No! Denle el niño a ella, pero no lo maten." La otra dijo: "Que no sea ni para mí ni para ti; divídanlo." Salomón supo quién era la verdadera madre. Israel quedó asombrado por la sabiduría que Dios le había dado.',
'Two women came before King Solomon with a baby, each claiming to be the true mother. One had accidentally smothered her child while sleeping and switched the babies. Now both claimed the living child.

Solomon called for a sword and ordered, "Cut the child in two and give half to each." The true mother cried out, "No! Give her the child, but do not kill him." The other said, "Let him be neither mine nor yours; divide him." Solomon knew who the true mother was. Israel was amazed at the wisdom God had given him.',
'La sabiduría de Dios revela la verdad en situaciones imposibles.',
'God''s wisdom reveals truth in impossible situations.', 6),

('La reina de Sabá', 'The Queen of Sheba', '1 Reyes 10:1-13',
'La reina de Sabá oyó de la fama de Salomón y viajó desde lejos para probar su sabiduría con preguntas difíciles. Llegó con un séquito enorme, camellos cargados de especias, oro y piedras preciosas.

Salomón respondió todas sus preguntas; nada fue demasiado difícil para él. La reina quedó sin aliento al ver su sabiduría, su palacio, la comida de su mesa y la organización de sus sirvientes. Exclamó: "¡No me habían contado ni la mitad! Tu sabiduría supera todo lo que había oído." La sabiduría de Dios atrae a las naciones.',
'The Queen of Sheba heard of Solomon''s fame and traveled from far away to test his wisdom with hard questions. She arrived with a huge entourage, camels loaded with spices, gold, and precious stones.

Solomon answered all her questions; nothing was too hard for him. The queen was breathless seeing his wisdom, his palace, the food on his table, and the organization of his servants. She exclaimed, "I was not told half of it! Your wisdom exceeds everything I had heard." God''s wisdom attracts the nations.',
'La verdadera sabiduría glorifica a Dios ante el mundo.',
'True wisdom glorifies God before the world.', 6),

('Jesús y los fariseos', 'Jesus and the Pharisees', 'Mateo 22:15-22',
'Los fariseos querían atrapar a Jesús con una pregunta imposible: "¿Es lícito pagar impuestos al César?" Si decía sí, lo acusarían de apoyar a Roma. Si decía no, lo entregarían a las autoridades romanas como rebelde.

Jesús les pidió una moneda y preguntó: "¿De quién es esta imagen?" Respondieron: "Del César." Entonces Jesús dijo: "Dad al César lo que es del César, y a Dios lo que es de Dios." Sus enemigos quedaron asombrados y no pudieron responder. La sabiduría de Jesús desarma las trampas más elaboradas.',
'The Pharisees wanted to trap Jesus with an impossible question: "Is it lawful to pay taxes to Caesar?" If he said yes, they would accuse him of supporting Rome. If he said no, they would hand him over to the Roman authorities as a rebel.

Jesus asked them for a coin and questioned, "Whose image is this?" They answered, "Caesar''s." Then Jesus said, "Give to Caesar what is Caesar''s, and to God what is God''s." His enemies were amazed and could not reply. Jesus'' wisdom disarms the most elaborate traps.',
'La sabiduría de Dios encuentra respuestas donde parece no haberlas.',
'God''s wisdom finds answers where there seem to be none.', 6);

-- CONSUELO (Comfort) - theme_id = 7
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('La resurrección de Lázaro', 'The Resurrection of Lazarus', 'Juan 11:1-44',
'Lázaro, amigo cercano de Jesús, estaba gravemente enfermo. Sus hermanas Marta y María enviaron un mensaje urgente a Jesús, pero Él se demoró dos días más. Cuando llegó, Lázaro llevaba cuatro días muerto. Marta dijo: "Si hubieras estado aquí, mi hermano no habría muerto."

Jesús lloró. Luego fue a la tumba y ordenó: "¡Lázaro, ven fuera!" El hombre muerto salió, todavía envuelto en vendas. Jesús demostró que Él es la resurrección y la vida. Nuestro dolor le importa, y Él tiene poder sobre la muerte.',
'Lazarus, a close friend of Jesus, was gravely ill. His sisters Martha and Mary sent an urgent message to Jesus, but He delayed two more days. When He arrived, Lazarus had been dead four days. Martha said, "If you had been here, my brother would not have died."

Jesus wept. Then He went to the tomb and commanded, "Lazarus, come out!" The dead man came out, still wrapped in burial cloths. Jesus demonstrated that He is the resurrection and the life. Our grief matters to Him, and He has power over death.',
'Jesús llora con nosotros y tiene poder para restaurar.',
'Jesus weeps with us and has power to restore.', 7),

('Noemí encuentra esperanza', 'Naomi Finds Hope', 'Rut 4:13-17',
'Noemí había perdido todo: su esposo, sus dos hijos, su hogar. Regresó a Israel amargada, diciéndole a la gente que la llamaran "Mara" (amargura). Pero Dios no había terminado su historia. Su nuera Rut permaneció fiel a ella.

Rut se casó con Booz y tuvo un hijo llamado Obed. Las mujeres de Belén dijeron a Noemí: "Bendito sea el Señor que no te ha dejado sin pariente." Pusieron al bebé en sus brazos y dijeron: "Él restaurará tu vida." Obed fue abuelo del rey David. Dios convirtió la amargura de Noemí en bendición.',
'Naomi had lost everything: her husband, her two sons, her home. She returned to Israel bitter, telling people to call her "Mara" (bitterness). But God had not finished her story. Her daughter-in-law Ruth remained faithful to her.

Ruth married Boaz and had a son named Obed. The women of Bethlehem told Naomi, "Blessed be the Lord who has not left you without a redeemer." They placed the baby in her arms and said, "He will restore your life." Obed became the grandfather of King David. God turned Naomi''s bitterness into blessing.',
'Dios puede restaurar los años que la langosta comió.',
'God can restore the years the locusts have eaten.', 7),

('Job restaurado', 'Job Restored', 'Job 42:10-17',
'Job lo perdió todo: sus hijos, su riqueza, su salud. Sus amigos lo acusaban de pecado oculto. Su esposa le dijo que maldijera a Dios. Pero Job, en medio de su dolor incomprensible, declaró: "Yo sé que mi Redentor vive."

Después de pasar por el fuego de la prueba, Dios habló a Job desde un torbellino y le mostró Su grandeza. Job se arrepintió de cuestionar a Dios. Entonces el Señor restauró su fortuna, dándole el doble de lo que había tenido. Tuvo más hijos e hijas y vivió 140 años más. El sufrimiento no era el final de su historia.',
'Job lost everything: his children, his wealth, his health. His friends accused him of hidden sin. His wife told him to curse God. But Job, in the midst of incomprehensible pain, declared, "I know that my Redeemer lives."

After going through the fire of testing, God spoke to Job from a whirlwind and showed him His greatness. Job repented of questioning God. Then the Lord restored his fortune, giving him twice what he had before. He had more sons and daughters and lived 140 more years. Suffering was not the end of his story.',
'Después de la prueba viene la restauración de Dios.',
'After the trial comes God''s restoration.', 7);

-- GRATITUD (Gratitude) - theme_id = 8
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('Los diez leprosos', 'The Ten Lepers', 'Lucas 17:11-19',
'Diez leprosos se encontraron con Jesús en el camino. Desde lejos gritaron: "¡Jesús, Maestro, ten misericordia de nosotros!" Jesús les dijo que fueran a mostrarse a los sacerdotes. Mientras iban, fueron sanados.

Solo uno de ellos, un samaritano, regresó a agradecer a Jesús. Se postró a sus pies glorificando a Dios. Jesús preguntó: "¿No fueron sanados los diez? ¿Dónde están los otros nueve?" La gratitud es una respuesta apropiada a las bendiciones de Dios, pero pocos la practican.',
'Ten lepers met Jesus on the road. From a distance they shouted, "Jesus, Master, have mercy on us!" Jesus told them to go show themselves to the priests. As they went, they were healed.

Only one of them, a Samaritan, returned to thank Jesus. He fell at his feet glorifying God. Jesus asked, "Were not all ten cleansed? Where are the other nine?" Gratitude is an appropriate response to God''s blessings, but few practice it.',
'No olvides agradecer a Dios por sus bendiciones.',
'Do not forget to thank God for His blessings.', 8),

('Ana y el nacimiento de Samuel', 'Hannah and Samuel''s Birth', '1 Samuel 1-2',
'Ana era estéril y sufría el desprecio de la otra esposa de su marido. Cada año iba al templo y lloraba amargamente, pidiendo un hijo a Dios. Prometió que si le daba un hijo, lo dedicaría al Señor para siempre.

Dios escuchó su oración y nació Samuel. Cuando lo destetó, Ana cumplió su promesa y lo llevó al templo para que sirviera al Señor. En lugar de resentimiento por "perder" a su hijo, Ana oró un cántico de gratitud que alababa la grandeza de Dios. Samuel llegó a ser uno de los profetas más grandes de Israel.',
'Hannah was barren and suffered the scorn of her husband''s other wife. Every year she went to the temple and wept bitterly, asking God for a son. She promised that if He gave her a son, she would dedicate him to the Lord forever.

God heard her prayer and Samuel was born. When she weaned him, Hannah kept her promise and took him to the temple to serve the Lord. Instead of resentment for "losing" her son, Hannah prayed a song of gratitude praising God''s greatness. Samuel became one of Israel''s greatest prophets.',
'La gratitud transforma nuestro dolor en adoración.',
'Gratitude transforms our pain into worship.', 8),

('La ofrenda de la viuda', 'The Widow''s Offering', 'Marcos 12:41-44',
'Jesús observaba a la gente depositando ofrendas en el templo. Los ricos echaban grandes cantidades con ostentación. Entonces llegó una viuda pobre y echó dos pequeñas monedas de cobre, que apenas valían unos centavos.

Jesús llamó a sus discípulos y dijo: "Esta viuda pobre ha echado más que todos. Ellos dieron de lo que les sobraba, pero ella, de su pobreza, dio todo lo que tenía para vivir." La viuda no se quejó de lo poco que tenía; agradeció a Dios dándole todo. Su gratitud fue medida por su sacrificio, no por la cantidad.',
'Jesus watched people putting offerings in the temple. The rich threw in large amounts with show. Then a poor widow came and put in two small copper coins, worth only a few cents.

Jesus called his disciples and said, "This poor widow has put in more than all the others. They gave out of their surplus, but she, out of her poverty, put in everything she had to live on." The widow did not complain about how little she had; she thanked God by giving Him everything. Her gratitude was measured by her sacrifice, not by the amount.',
'La verdadera gratitud se mide por el sacrificio, no por la cantidad.',
'True gratitude is measured by sacrifice, not by amount.', 8);

-- GUÍA (Guidance) - theme_id = 9
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('La zarza ardiente', 'The Burning Bush', 'Éxodo 3:1-15',
'Moisés pastoreaba ovejas en el desierto cuando vio algo extraordinario: una zarza que ardía pero no se consumía. Se acercó a investigar. Entonces Dios le habló desde el fuego: "Quita tus sandalias, porque estás en tierra santa."

Dios le reveló su plan: enviar a Moisés a liberar a su pueblo de Egipto. Moisés dudó: "¿Quién soy yo para ir al faraón?" Dios respondió: "Yo estaré contigo." Cuando Moisés preguntó el nombre de Dios, Él respondió: "YO SOY EL QUE SOY." A veces la guía de Dios viene en los lugares más inesperados.',
'Moses was shepherding sheep in the desert when he saw something extraordinary: a bush that burned but was not consumed. He approached to investigate. Then God spoke to him from the fire: "Take off your sandals, for you are on holy ground."

God revealed His plan: to send Moses to free His people from Egypt. Moses doubted: "Who am I to go to Pharaoh?" God answered, "I will be with you." When Moses asked God''s name, He replied, "I AM WHO I AM." Sometimes God''s guidance comes in the most unexpected places.',
'Dios nos guía incluso en el desierto de nuestra vida.',
'God guides us even in the desert of our life.', 9),

('Felipe y el etíope', 'Philip and the Ethiopian', 'Hechos 8:26-40',
'Un ángel le dijo a Felipe que fuera por el camino del desierto hacia Gaza. Allí encontró a un funcionario etíope que leía al profeta Isaías en su carruaje. El Espíritu le dijo a Felipe: "Acércate a ese carruaje."

Felipe corrió y preguntó: "¿Entiendes lo que lees?" El etíope respondió: "¿Cómo puedo, si nadie me guía?" Felipe subió y le explicó que el pasaje hablaba de Jesús. El etíope creyó y pidió ser bautizado inmediatamente. Dios orquestó este encuentro divino en medio del desierto.',
'An angel told Philip to go down the desert road toward Gaza. There he found an Ethiopian official reading the prophet Isaiah in his chariot. The Spirit told Philip, "Go to that chariot."

Philip ran and asked, "Do you understand what you are reading?" The Ethiopian replied, "How can I, unless someone guides me?" Philip got in and explained that the passage spoke of Jesus. The Ethiopian believed and asked to be baptized immediately. God orchestrated this divine encounter in the middle of the desert.',
'Dios pone personas en nuestro camino para guiarnos a la verdad.',
'God puts people in our path to guide us to the truth.', 9),

('La estrella de Belén', 'The Star of Bethlehem', 'Mateo 2:1-12',
'Unos sabios de oriente vieron una estrella especial que anunciaba el nacimiento del Rey de los judíos. Viajaron cientos de kilómetros siguiendo esa estrella hasta Jerusalén, donde preguntaron por el niño. Herodes los envió a Belén.

La estrella los guió hasta detenerse sobre el lugar donde estaba el niño Jesús. Los sabios se postraron, lo adoraron y le ofrecieron oro, incienso y mirra. Advertidos en sueños que no volvieran a Herodes, regresaron por otro camino. Dios usó una estrella y un sueño para guiarlos.',
'Wise men from the east saw a special star announcing the birth of the King of the Jews. They traveled hundreds of miles following that star to Jerusalem, where they asked about the child. Herod sent them to Bethlehem.

The star guided them until it stopped over the place where the child Jesus was. The wise men bowed down, worshiped him, and offered gold, frankincense, and myrrh. Warned in a dream not to return to Herod, they went back by another route. God used a star and a dream to guide them.',
'Dios usa muchos medios para guiar a quienes lo buscan.',
'God uses many means to guide those who seek Him.', 9);

-- PROPÓSITO (Purpose) - theme_id = 10
INSERT INTO bible_stories (title_es, title_en, reference, summary_es, summary_en, moral_es, moral_en, theme_id) VALUES
('Ester salva a su pueblo', 'Esther Saves Her People', 'Ester 4-7',
'Ester era una joven judía que se convirtió en reina de Persia. Cuando el malvado Amán conspiró para destruir a todos los judíos, su primo Mardoqueo le pidió que intercediera ante el rey. Pero acercarse al rey sin ser llamada significaba arriesgar la muerte.

Mardoqueo le dijo: "¿Quién sabe si para esta hora has llegado al reino?" Ester ayunó tres días y luego fue ante el rey, diciendo: "Si perezco, que perezca." El rey la recibió con favor. Ester expuso la conspiración de Amán y los judíos fueron salvados. Estaba en ese lugar para ese propósito.',
'Esther was a young Jewish woman who became queen of Persia. When the wicked Haman conspired to destroy all the Jews, her cousin Mordecai asked her to intercede with the king. But approaching the king without being summoned meant risking death.

Mordecai told her, "Who knows if you have come to the kingdom for such a time as this?" Esther fasted for three days and then went before the king, saying, "If I perish, I perish." The king received her with favor. Esther exposed Haman''s conspiracy and the Jews were saved. She was in that place for that purpose.',
'Dios te ha puesto donde estás para un propósito específico.',
'God has placed you where you are for a specific purpose.', 10),

('El llamado de Isaías', 'Isaiah''s Calling', 'Isaías 6:1-8',
'En el año que murió el rey Uzías, Isaías tuvo una visión del Señor sentado en un trono alto y sublime. Serafines volaban proclamando: "Santo, santo, santo es el Señor de los ejércitos." La casa se llenó de humo y los quiciales temblaron.

Isaías clamó: "¡Ay de mí! Soy hombre de labios impuros." Un serafín tocó sus labios con un carbón encendido del altar: "Tu culpa ha sido quitada." Entonces oyó la voz del Señor: "¿A quién enviaré?" Isaías respondió: "Heme aquí, envíame a mí." Su encuentro con Dios definió su propósito.',
'In the year King Uzziah died, Isaiah had a vision of the Lord seated on a high and exalted throne. Seraphim flew proclaiming, "Holy, holy, holy is the Lord Almighty." The house was filled with smoke and the doorposts shook.

Isaiah cried out, "Woe to me! I am a man of unclean lips." A seraph touched his lips with a live coal from the altar: "Your guilt is taken away." Then he heard the Lord''s voice: "Whom shall I send?" Isaiah responded, "Here am I. Send me!" His encounter with God defined his purpose.',
'Un encuentro con Dios transforma y define nuestro propósito.',
'An encounter with God transforms and defines our purpose.', 10),

('Pablo en el camino a Damasco', 'Paul on the Road to Damascus', 'Hechos 9:1-19',
'Saulo era un fariseo que perseguía ferozmente a los cristianos. Iba camino a Damasco para arrestar más creyentes cuando una luz del cielo lo cegó. Cayó al suelo y oyó una voz: "Saulo, Saulo, ¿por qué me persigues?" Era Jesús.

Ciego y quebrantado, Saulo fue llevado a Damasco. Dios envió a Ananías a orar por él. Las escamas cayeron de sus ojos, fue bautizado y llenado del Espíritu Santo. El mayor perseguidor de la iglesia se convirtió en su mayor misionero. Pablo escribiría gran parte del Nuevo Testamento y llevaría el evangelio al mundo gentil.',
'Saul was a Pharisee who fiercely persecuted Christians. He was on his way to Damascus to arrest more believers when a light from heaven blinded him. He fell to the ground and heard a voice: "Saul, Saul, why do you persecute me?" It was Jesus.

Blind and broken, Saul was led to Damascus. God sent Ananias to pray for him. Scales fell from his eyes, he was baptized and filled with the Holy Spirit. The greatest persecutor of the church became its greatest missionary. Paul would write much of the New Testament and take the gospel to the Gentile world.',
'Dios puede transformar al perseguidor en predicador.',
'God can transform the persecutor into a preacher.', 10);

-- ================================================
-- COPIAR MAPEO DE EMOCIONES (usar mismo que versículos)
-- ================================================
INSERT INTO story_theme_mapping (emotion_id, theme_id, priority)
SELECT emotion_id, theme_id, priority FROM emotion_theme_mapping;

-- ================================================
-- VERIFICACIÓN
-- ================================================
SELECT t.name_es AS tema, COUNT(s.id) AS total_relatos
FROM verse_themes t
LEFT JOIN bible_stories s ON t.id = s.theme_id
GROUP BY t.id, t.name_es
ORDER BY t.id;

SELECT CONCAT('Total de relatos bíblicos: ', COUNT(*)) AS resumen FROM bible_stories;
