-- Schéma de base de données MariaDB pour TypingPVP
-- Exécutez ce script une seule fois pour créer les tables

-- Table users : Stocke les informations des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT,
  bio TEXT,
  gear TEXT,
  social_media JSON DEFAULT (JSON_OBJECT()),
  friends JSON DEFAULT (JSON_ARRAY()),
  friend_requests_sent JSON DEFAULT (JSON_ARRAY()),
  friend_requests_received JSON DEFAULT (JSON_ARRAY()),
  mmr JSON DEFAULT (JSON_OBJECT()),
  stats JSON DEFAULT (JSON_OBJECT(
    'totalMatches', 0,
    'wins', 0,
    'losses', 0,
    'totalWPM', 0,
    'bestWPM', 0,
    'averageAccuracy', 0
  )),
  preferences JSON DEFAULT (JSON_OBJECT('defaultMode', 'solo')),
  provider VARCHAR(50) DEFAULT 'local',
  provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_provider_provider_id (provider, provider_id),
  UNIQUE KEY unique_provider_provider_id (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table matches : Stocke les informations des matchs
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'solo', 'battle', 'matchmaking', 'competition'
  language VARCHAR(10) DEFAULT 'en',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSON NOT NULL -- Données complètes du match (joueurs, etc.)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table user_matches : Relation many-to-many entre users et matches
-- Stocke les performances de chaque joueur dans chaque match
CREATE TABLE IF NOT EXISTS user_matches (
  user_id VARCHAR(255) NOT NULL,
  match_id VARCHAR(255) NOT NULL,
  wpm INT,
  accuracy DECIMAL(5,2),
  won BOOLEAN DEFAULT false,
  position INT, -- Position dans les compétitions
  PRIMARY KEY (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table discord_links : Liaison des comptes Discord
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

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_match_id ON user_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(type);
CREATE INDEX IF NOT EXISTS idx_discord_links_user_id ON discord_links(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord_id ON discord_links(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_verification_code ON discord_links(verification_code);
CREATE INDEX IF NOT EXISTS idx_discord_links_verified ON discord_links(verified);

