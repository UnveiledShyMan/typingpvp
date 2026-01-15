-- Migration : Indexes performance pour l'historique des matchs
-- Objectif : accélérer les requêtes par type/langue + date

CREATE INDEX IF NOT EXISTS idx_matches_type_date ON matches(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_language_date ON matches(language, date DESC);
