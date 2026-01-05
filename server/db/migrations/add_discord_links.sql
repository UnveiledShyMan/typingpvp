-- Migration pour ajouter le système de liaison Discord
-- Crée une table pour lier les comptes Discord aux comptes du site

CREATE TABLE IF NOT EXISTS discord_links (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  discord_username VARCHAR(255) NOT NULL,
  verification_code VARCHAR(10) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  linked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, discord_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_discord_links_user_id ON discord_links(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord_id ON discord_links(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_verification_code ON discord_links(verification_code);
CREATE INDEX IF NOT EXISTS idx_discord_links_verified ON discord_links(verified);

