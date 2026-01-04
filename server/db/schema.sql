-- Schéma de base de données PostgreSQL pour TypingPVP
-- Exécutez ce script une seule fois pour créer les tables

-- Table users : Stocke les informations des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  gear TEXT,
  social_media JSONB DEFAULT '{}',
  friends TEXT[] DEFAULT '{}',
  friend_requests_sent TEXT[] DEFAULT '{}',
  friend_requests_received TEXT[] DEFAULT '{}',
  mmr JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{
    "totalMatches": 0,
    "wins": 0,
    "losses": 0,
    "totalWPM": 0,
    "bestWPM": 0,
    "averageAccuracy": 0
  }',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table matches : Stocke les informations des matchs
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'solo', 'battle', 'matchmaking', 'competition'
  language VARCHAR(10) DEFAULT 'en',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSONB NOT NULL -- Données complètes du match (joueurs, etc.)
);

-- Table user_matches : Relation many-to-many entre users et matches
-- Stocke les performances de chaque joueur dans chaque match
CREATE TABLE IF NOT EXISTS user_matches (
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  match_id VARCHAR(255) REFERENCES matches(id) ON DELETE CASCADE,
  wpm INTEGER,
  accuracy DECIMAL(5,2),
  won BOOLEAN DEFAULT false,
  position INTEGER, -- Position dans les compétitions
  PRIMARY KEY (user_id, match_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_match_id ON user_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(type);

