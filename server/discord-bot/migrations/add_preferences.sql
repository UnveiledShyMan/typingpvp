-- Migration : Ajouter la colonne preferences à la table users - MariaDB
-- Exécutez ce script si la table users existe déjà sans la colonne preferences

-- Ajouter la colonne preferences si elle n'existe pas
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'users' 
               AND column_name = 'preferences');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE users ADD COLUMN preferences JSON DEFAULT (JSON_OBJECT(''defaultMode'', ''solo''))',
  'SELECT ''Column already exists'' AS result');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
