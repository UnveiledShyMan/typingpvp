-- Migration pour ajouter le support OAuth (Google et X/Twitter)
-- Ajoute les colonnes nécessaires pour l'authentification OAuth

-- Ajouter les colonnes pour OAuth (provider peut être 'local', 'google', ou 'x')
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- Rendre password_hash nullable pour OAuth (si ce n'est pas déjà le cas)
-- Note: Cette commande peut échouer si la colonne n'existe pas encore, c'est normal
DO $$ 
BEGIN
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Créer un index unique sur provider + provider_id pour les comptes OAuth
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_id 
ON users(provider, provider_id) 
WHERE provider_id IS NOT NULL;

-- Mettre à jour les utilisateurs existants pour qu'ils aient provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;

