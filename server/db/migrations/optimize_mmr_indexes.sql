-- Migration : Optimisation des index pour MMR et Rankings
-- Améliore les performances des requêtes de classement
-- 
-- NOTE: MariaDB ne supporte pas les expressions JSON directement dans les index.
-- Solution: créer des colonnes générées (STORED) puis les indexer.
--
-- INSTRUCTIONS:
-- Exécutez cette migration section par section. Si une colonne existe déjà,
-- vous obtiendrez une erreur "Duplicate column name" - c'est normal, passez à la section suivante.

-- MMR EN - Colonne générée pour extraire le MMR anglais
-- Si la colonne existe déjà, cette commande échouera - ignorez l'erreur et continuez
ALTER TABLE users 
ADD COLUMN mmr_en INT GENERATED ALWAYS AS (
  COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, '$.en')) AS UNSIGNED), 1000)
) STORED;

-- Créer l'index (ignorer si déjà existant)
CREATE INDEX IF NOT EXISTS idx_users_mmr_en ON users(mmr_en DESC);

-- MMR FR - Colonne générée pour extraire le MMR français
ALTER TABLE users 
ADD COLUMN mmr_fr INT GENERATED ALWAYS AS (
  COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, '$.fr')) AS UNSIGNED), 1000)
) STORED;

CREATE INDEX IF NOT EXISTS idx_users_mmr_fr ON users(mmr_fr DESC);

-- MMR ES - Colonne générée pour extraire le MMR espagnol
ALTER TABLE users 
ADD COLUMN mmr_es INT GENERATED ALWAYS AS (
  COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, '$.es')) AS UNSIGNED), 1000)
) STORED;

CREATE INDEX IF NOT EXISTS idx_users_mmr_es ON users(mmr_es DESC);

-- STATS - Colonne générée pour extraire totalMatches depuis le JSON stats
-- Cette colonne est utilisée dans les index composites pour améliorer les requêtes de rankings
ALTER TABLE users 
ADD COLUMN stats_total_matches INT GENERATED ALWAYS AS (
  COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(stats, '$.totalMatches')) AS UNSIGNED), 0)
) STORED;

-- Index composites pour améliorer les requêtes de rankings avec stats
-- Ces index permettent un tri efficace par MMR puis par nombre de matchs
CREATE INDEX idx_users_mmr_en_stats ON users(mmr_en DESC, stats_total_matches DESC);
CREATE INDEX idx_users_mmr_fr_stats ON users(mmr_fr DESC, stats_total_matches DESC);
CREATE INDEX idx_users_mmr_es_stats ON users(mmr_es DESC, stats_total_matches DESC);

-- Index pour les requêtes de matchs fréquentes
-- Note: On ne peut pas utiliser de sous-requête dans un index.
-- On indexe user_id et match_id séparément, et on utilise l'index existant sur matches.date
-- Les requêtes avec JOIN utiliseront ces index de manière optimale
-- (Ces index peuvent déjà exister dans le schéma de base - IF NOT EXISTS pour éviter les erreurs)
CREATE INDEX IF NOT EXISTS idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_match_id ON user_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_type_date ON matches(type, date DESC);

