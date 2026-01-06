# Plan d'Optimisation Complet - Système de Jeu en Ligne

## Analyse de l'Existant

### Points Forts Actuels
- ✅ Stockage en mémoire pour les rooms actives (performances)
- ✅ Système ELO fonctionnel
- ✅ Matchmaking basique opérationnel

### Points à Améliorer

#### 1. **Matchmaking Algorithm** ⚠️ Critique
**Problème actuel** : Recherche linéaire O(n) à chaque tentative de match
```javascript
// Actuellement : O(n) - parcourt toute la queue
for (const [otherSocketId, otherPlayer] of queue.entries()) {
  if (otherPlayer.language !== language) continue;
  const mmrDiff = Math.abs(otherPlayer.mmr - mmr);
  if (mmrDiff <= MMR_RANGE && mmrDiff < bestMMRDiff) {
    bestMatch = { socketId: otherSocketId, player: otherPlayer };
  }
}
```

**Impact** : Avec 100+ joueurs en queue, chaque recherche prend du temps

#### 2. **Système ELO** ⚠️ Améliorable
**Problème actuel** : ELO standard avec K-factor fixe (32)
- Ne tient pas compte de la volatilité du joueur
- Pas d'incertitude (certainty) dans le rating
- K-factor fixe peut être trop élevé/bas selon le niveau

#### 3. **Rankings Database** ⚠️ Performance
**Problème actuel** : Requête avec ORDER BY sur JSON, pas d'index optimisé
```sql
ORDER BY COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, ...)) AS UNSIGNED), 1000) DESC
```

#### 4. **Stockage des Queues** ⚠️ Structure
**Problème actuel** : Simple Map, pas optimisé pour recherche par langue/MMR

## Solutions Proposées

### 1. Matchmaking Optimisé : Système de Buckets MMR

**Principe** : Organiser la queue par buckets de MMR (ex: 1000-1099, 1100-1199, etc.)

**Avantages** :
- Recherche O(1) dans le bucket approprié
- Scalable à des milliers de joueurs
- Facile à implémenter

**Structure** :
```javascript
// Queue organisée par langue puis par bucket MMR
const matchmakingQueue = {
  'en': {
    'ranked': {
      '1000': Set([socketId1, socketId2, ...]),  // MMR 1000-1099
      '1100': Set([socketId3, ...]),              // MMR 1100-1199
      ...
    },
    'unrated': { ... }
  },
  'fr': { ... }
}
```

**Complexité** :
- Ajout : O(1)
- Recherche match : O(1) dans le bucket + vérification des buckets adjacents
- Suppression : O(1)

### 2. Système ELO Amélioré : Glicko-2

**Glicko-2** vs ELO Standard :
- **Rating Deviation (RD)** : Mesure l'incertitude du rating
- **Volatilité** : Tient compte de la consistance du joueur
- **K-factor adaptatif** : Plus précis pour les nouveaux joueurs

**Avantages** :
- Plus précis que ELO standard
- Meilleure prédiction des résultats
- Adaptatif selon l'historique du joueur

**Alternatives** :
- **TrueSkill** (Microsoft) : Excellent pour matchmaking probabiliste
- **ELO adaptatif** : K-factor variable selon le nombre de matchs

### 3. Optimisation Database

**Index composés pour MMR** :
```sql
-- Créer une colonne dérivée pour chaque langue courante
ALTER TABLE users ADD COLUMN mmr_en INT GENERATED ALWAYS AS (
  COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, '$.en')) AS UNSIGNED), 1000)
) STORED;

-- Index sur cette colonne
CREATE INDEX idx_users_mmr_en ON users(mmr_en DESC);
```

**Cache pour Rankings** :
- Mettre en cache les top 100 pour chaque langue
- Invalider le cache après chaque match ranked

### 4. Persistence des Rooms Actives

**Problème** : Si le serveur redémarre, toutes les parties en cours sont perdues

**Solution** : Sauvegarder périodiquement dans la DB
- Rooms `waiting` : Pas besoin (peuvent être recréées)
- Rooms `playing` : Sauvegarder toutes les 30 secondes
- Rooms `finished` : Sauvegarder immédiatement

**Table proposée** :
```sql
CREATE TABLE IF NOT EXISTS active_rooms (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'battle', 'matchmaking', 'competition'
  status VARCHAR(20) NOT NULL, -- 'waiting', 'playing', 'finished'
  data JSON NOT NULL, -- État complet de la room
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL -- TTL pour cleanup automatique
) ENGINE=InnoDB;

CREATE INDEX idx_active_rooms_status ON active_rooms(status);
CREATE INDEX idx_active_rooms_expires ON active_rooms(expires_at);
```

### 5. Structure de Données Optimisée pour Matchmaking

**Current** : `Map<socketId, playerData>`

**Optimized** : Structure multi-niveau
```javascript
class MatchmakingQueue {
  // Organisé par langue → type → bucket MMR → Set de socketIds
  constructor() {
    this.queues = new Map(); // Map<language, Map<type, Map<bucket, Set<socketId>>>>
  }
  
  // O(1) insertion
  addPlayer(language, type, mmr, socketId, playerData) {
    const bucket = Math.floor(mmr / 100) * 100; // Ex: 1234 → 1200
    // ...
  }
  
  // O(1) recherche dans bucket + buckets adjacents
  findMatch(language, type, mmr, range = 200) {
    const bucket = Math.floor(mmr / 100) * 100;
    // Chercher dans bucket-100, bucket, bucket+100
  }
}
```

## Recommandations d'Implémentation

### Priorité 1 : Matchmaking Bucket System (Impact Immédiat)
- Réduction drastique du temps de recherche
- Scalable
- Facile à implémenter

### Priorité 2 : Glicko-2 ou TrueSkill (Précision)
- Améliore la qualité des matchs
- Plus de précision dans les ratings
- Meilleure expérience utilisateur

### Priorité 3 : Optimisation Database (Performance)
- Index composés pour rankings
- Cache pour les requêtes fréquentes
- Améliore les temps de réponse

### Priorité 4 : Persistence Rooms (Robustesse)
- Récupération après crash
- Meilleure fiabilité
- Moins de frustration utilisateur

## Algorithme Recommandé : Matchmaking Bucket System

**Pourquoi cette approche** :
1. ✅ Simple à implémenter
2. ✅ Performance O(1) pour recherche
3. ✅ Scalable à des milliers de joueurs
4. ✅ Compatible avec le schéma actuel
5. ✅ Peut être combiné avec TrueSkill plus tard

**Implémentation** :
- Buckets de 100 points MMR
- Recherche dans le bucket ±200 points
- Expansion progressive si pas de match trouvé

