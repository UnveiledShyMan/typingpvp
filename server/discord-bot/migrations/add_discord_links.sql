-- Migration pour ajouter le système de liaison Discord - MariaDB
-- Crée une table pour lier les comptes Discord aux comptes du site

CREATE TABLE IF NOT EXISTS discord_links (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  discord_username VARCHAR(255) NOT NULL,
  verification_code VARCHAR(10) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  linked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_discord (user_id, discord_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_discord_links_user_id ON discord_links(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord_id ON discord_links(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_verification_code ON discord_links(verification_code);
CREATE INDEX IF NOT EXISTS idx_discord_links_verified ON discord_links(verified);
