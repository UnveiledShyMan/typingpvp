-- Migration pour ajouter le support OAuth (Google) - MariaDB
-- Ajoute les colonnes nécessaires pour l'authentification OAuth

-- Ajouter les colonnes pour OAuth (provider peut être 'local' ou 'google')
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- Rendre password_hash nullable pour OAuth (si ce n'est pas déjà le cas)
-- MariaDB utilise MODIFY COLUMN au lieu de ALTER COLUMN
ALTER TABLE users 
MODIFY COLUMN password_hash TEXT NULL;

-- Créer un index unique sur provider + provider_id pour les comptes OAuth
-- Note: MariaDB ne supporte pas IF NOT EXISTS pour CREATE INDEX, donc on utilise une procédure
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'users' 
               AND index_name = 'idx_users_provider_provider_id');
SET @sqlstmt := IF(@exist = 0, 
  'CREATE UNIQUE INDEX idx_users_provider_provider_id ON users(provider, provider_id) WHERE provider_id IS NOT NULL',
  'SELECT ''Index already exists'' AS result');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Alternative plus simple : créer l'index directement (échouera silencieusement s'il existe déjà)
-- CREATE UNIQUE INDEX idx_users_provider_provider_id ON users(provider, provider_id);

-- Mettre à jour les utilisateurs existants pour qu'ils aient provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;

