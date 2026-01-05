-- Migration : Ajouter la colonne preferences à la table users
-- Exécutez ce script si la table users existe déjà sans la colonne preferences

-- Ajouter la colonne preferences si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN preferences JSONB DEFAULT '{"defaultMode": "solo"}';
  END IF;
END $$;

