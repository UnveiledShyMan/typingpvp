/**
 * Système de Matchmaking Optimisé avec Buckets MMR
 * 
 * Remplace la recherche linéaire O(n) par un système de buckets O(1)
 * Organise les joueurs par langue → type → bucket MMR (par tranches de 100)
 * 
 * Performance :
 * - Ajout : O(1)
 * - Recherche : O(1) dans bucket + O(k) pour buckets adjacents (k = nombre de buckets à vérifier)
 * - Suppression : O(1)
 */

/**
 * Classe pour gérer une queue de matchmaking optimisée
 */
export class MatchmakingQueue {
  constructor() {
    // Structure : Map<language, Map<type, Map<bucketMMR, Map<socketId, playerData>>>>
    // Exemple : queues['en']['ranked'][1200] = Map({ 'socket1': { userId, mmr, ... } })
    this.queues = new Map();
    
    // Map inverse pour retrouver rapidement le bucket d'un joueur : Map<socketId, { language, type, bucket }>
    this.playerIndex = new Map();
  }

  /**
   * Calcule le bucket MMR (tranches de 100 points)
   * Exemples : 1234 → 1200, 1099 → 1000, 2000 → 2000
   */
  getBucket(mmr) {
    return Math.floor(mmr / 100) * 100;
  }

  /**
   * Ajoute un joueur à la queue
   * @param {string} language - Langue du joueur
   * @param {string} type - 'ranked' ou 'unrated'
   * @param {string} socketId - ID du socket
   * @param {object} playerData - Données du joueur { userId, username, mmr, language, joinedAt, ranked }
   * @returns {boolean} true si ajouté, false si déjà présent
   */
  addPlayer(language, type, socketId, playerData) {
    // Vérifier si déjà dans la queue
    if (this.playerIndex.has(socketId)) {
      return false;
    }

    const mmr = playerData.mmr || 1000;
    const bucket = this.getBucket(mmr);

    // Initialiser la structure si nécessaire
    if (!this.queues.has(language)) {
      this.queues.set(language, new Map());
    }
    const langQueue = this.queues.get(language);

    if (!langQueue.has(type)) {
      langQueue.set(type, new Map());
    }
    const typeQueue = langQueue.get(type);

    if (!typeQueue.has(bucket)) {
      typeQueue.set(bucket, new Map());
    }
    const bucketQueue = typeQueue.get(bucket);

    // Ajouter le joueur
    bucketQueue.set(socketId, playerData);
    this.playerIndex.set(socketId, { language, type, bucket });

    return true;
  }

  /**
   * Retire un joueur de la queue
   * @param {string} socketId - ID du socket
   * @returns {boolean} true si retiré, false si pas présent
   */
  removePlayer(socketId) {
    const index = this.playerIndex.get(socketId);
    if (!index) {
      return false;
    }

    const { language, type, bucket } = index;
    const bucketQueue = this.queues.get(language)?.get(type)?.get(bucket);

    if (bucketQueue) {
      bucketQueue.delete(socketId);
      
      // Nettoyer les structures vides pour libérer la mémoire
      if (bucketQueue.size === 0) {
        const typeQueue = this.queues.get(language).get(type);
        typeQueue.delete(bucket);
        
        if (typeQueue.size === 0) {
          const langQueue = this.queues.get(language);
          langQueue.delete(type);
          
          if (langQueue.size === 0) {
            this.queues.delete(language);
          }
        }
      }
    }

    this.playerIndex.delete(socketId);
    return true;
  }

  /**
   * Trouve le meilleur match pour un joueur
   * @param {string} socketId - ID du socket du joueur cherchant
   * @param {number} mmrRange - Plage de MMR acceptée (±mmrRange)
   * @returns {object|null} { socketId, playerData } ou null si pas de match
   */
  findMatch(socketId, mmrRange = 200) {
    const index = this.playerIndex.get(socketId);
    if (!index) {
      return null;
    }

    const { language, type, bucket: playerBucket } = index;
    const playerData = this.queues.get(language)?.get(type)?.get(playerBucket)?.get(socketId);
    
    if (!playerData) {
      return null;
    }

    const playerMMR = playerData.mmr || 1000;
    const typeQueue = this.queues.get(language)?.get(type);
    
    if (!typeQueue) {
      return null;
    }

    // Calculer les buckets à vérifier (bucket du joueur ± buckets adjacents)
    // Exemple : si playerMMR = 1234 (bucket 1200), mmrRange = 200
    // On vérifie les buckets : 1000, 1100, 1200, 1300, 1400
    const minBucket = this.getBucket(playerMMR - mmrRange);
    const maxBucket = this.getBucket(playerMMR + mmrRange);
    
    let bestMatch = null;
    let bestMMRDiff = Infinity;

    // OPTIMISATION : Parcourir les buckets et arrêter dès qu'un match parfait est trouvé
    // Un match parfait (différence < 50) est retourné immédiatement pour meilleure performance
    for (let bucket = minBucket; bucket <= maxBucket; bucket += 100) {
      const bucketQueue = typeQueue.get(bucket);
      if (!bucketQueue) continue;

      // Parcourir les joueurs dans ce bucket
      for (const [otherSocketId, otherPlayer] of bucketQueue.entries()) {
        // Ignorer le joueur lui-même (même socketId)
        if (otherSocketId === socketId) continue;
        
        // IMPORTANT: Ignorer aussi si c'est le même utilisateur avec un socket différent
        // Cela évite qu'un utilisateur soit matché contre lui-même s'il a plusieurs onglets
        const currentPlayer = this.getPlayer(socketId);
        if (currentPlayer && currentPlayer.userId && otherPlayer.userId && currentPlayer.userId === otherPlayer.userId) {
          continue;
        }

        // Calculer la différence de MMR exacte
        const otherMMR = otherPlayer.mmr || 1000;
        const mmrDiff = Math.abs(otherMMR - playerMMR);

        // Si dans la plage
        if (mmrDiff <= mmrRange) {
          // OPTIMISATION : Si match parfait (différence < 50), retourner immédiatement
          // Cela évite de parcourir les autres buckets inutilement
          if (mmrDiff < 50) {
            return { socketId: otherSocketId, player: otherPlayer };
          }
          
          // Sinon, garder le meilleur match trouvé jusqu'ici
          if (mmrDiff < bestMMRDiff) {
            bestMatch = { socketId: otherSocketId, player: otherPlayer };
            bestMMRDiff = mmrDiff;
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Retourne le nombre total de joueurs en queue
   * @returns {number}
   */
  getQueueSize() {
    return this.playerIndex.size;
  }

  /**
   * Retourne le nombre de joueurs dans une queue spécifique
   * @param {string} language - Langue
   * @param {string} type - 'ranked' ou 'unrated'
   * @returns {number}
   */
  getQueueSizeFor(language, type) {
    let count = 0;
    const typeQueue = this.queues.get(language)?.get(type);
    if (!typeQueue) return 0;

    for (const bucketQueue of typeQueue.values()) {
      count += bucketQueue.size;
    }
    return count;
  }

  /**
   * Vérifie si un joueur est dans la queue
   * @param {string} socketId - ID du socket
   * @returns {boolean}
   */
  hasPlayer(socketId) {
    return this.playerIndex.has(socketId);
  }

  /**
   * Récupère les données d'un joueur
   * @param {string} socketId - ID du socket
   * @returns {object|null}
   */
  getPlayer(socketId) {
    const index = this.playerIndex.get(socketId);
    if (!index) return null;

    const { language, type, bucket } = index;
    return this.queues.get(language)?.get(type)?.get(bucket)?.get(socketId) || null;
  }

  /**
   * Nettoie la queue (retire les joueurs inactifs depuis plus de X minutes)
   * @param {number} maxWaitTimeMs - Temps max en millisecondes
   * @returns {Array<string>} Liste des socketIds retirés
   */
  cleanupInactive(maxWaitTimeMs = 30 * 60 * 1000) {
    const now = Date.now();
    const removed = [];

    for (const [socketId, index] of this.playerIndex.entries()) {
      const playerData = this.getPlayer(socketId);
      if (!playerData) continue;

      const waitTime = now - (playerData.joinedAt || now);
      if (waitTime > maxWaitTimeMs) {
        this.removePlayer(socketId);
        removed.push(socketId);
      }
    }

    return removed;
  }

  /**
   * Retourne des statistiques sur la queue (pour monitoring)
   * @returns {object}
   */
  getStats() {
    const stats = {
      total: this.playerIndex.size,
      byLanguage: {},
      byType: { ranked: 0, unrated: 0 }
    };

    for (const [language, langQueue] of this.queues.entries()) {
      stats.byLanguage[language] = { ranked: 0, unrated: 0 };
      
      for (const [type, typeQueue] of langQueue.entries()) {
        let count = 0;
        for (const bucketQueue of typeQueue.values()) {
          count += bucketQueue.size;
        }
        stats.byLanguage[language][type] = count;
        stats.byType[type] += count;
      }
    }

    return stats;
  }
}

