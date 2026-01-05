-- Migration pour ajouter le support OAuth (Google) - MariaDB
-- Ajoute les colonnes nécessaires pour l'authentification OAuth

-- Vérifier et ajouter la colonne provider si elle n'existe pas
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'provider');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT ''local''',
  'SELECT ''Column provider already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter la colonne provider_id si elle n'existe pas
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'provider_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN provider_id VARCHAR(255)',
  'SELECT ''Column provider_id already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rendre password_hash nullable pour OAuth (si ce n'est pas déjà le cas)
-- Vérifier d'abord si la colonne existe et si elle est NOT NULL
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'password_hash');
SET @is_nullable = (SELECT IS_NULLABLE FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'users' 
                    AND COLUMN_NAME = 'password_hash'
                    LIMIT 1);

-- Si la colonne existe et n'est pas nullable, la rendre nullable
SET @sql = IF(@col_exists > 0 AND (@is_nullable = 'NO' OR @is_nullable IS NULL),
  'ALTER TABLE users MODIFY COLUMN password_hash TEXT NULL',
  'SELECT ''Column already nullable or does not exist'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Créer un index unique sur provider + provider_id pour les comptes OAuth
-- Vérifier d'abord si l'index existe
SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'users' 
                     AND INDEX_NAME = 'idx_users_provider_provider_id');
SET @sql = IF(@index_exists = 0,
  'CREATE UNIQUE INDEX idx_users_provider_provider_id ON users(provider, provider_id)',
  'SELECT ''Index already exists'' AS result');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mettre à jour les utilisateurs existants pour qu'ils aient provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;

