/**
 * Cache en mémoire pour les rankings
 * Réduit drastiquement les requêtes DB pour les top 100
 * 
 * TTL (Time To Live) : 5 minutes
 * Invalidation automatique après TTL
 */

// Structure du cache : Map<language, { data: rankings, timestamp: number }>
const rankingsCache = new Map();

// TTL en millisecondes (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Récupère les rankings depuis le cache ou null si expiré/inexistant
 * @param {string} language - Code langue ('en', 'fr', etc.)
 * @returns {Array|null} Rankings ou null si pas en cache/expiré
 */
export function getCachedRankings(language) {
  const cached = rankingsCache.get(language);
  
  if (!cached) {
    return null;
  }
  
  // Vérifier si le cache est expiré
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Cache expiré, le supprimer
    rankingsCache.delete(language);
    return null;
  }
  
  // Retourner les données en cache
  return cached.data;
}

/**
 * Met en cache les rankings pour une langue
 * @param {string} language - Code langue
 * @param {Array} rankings - Données des rankings
 */
export function setCachedRankings(language, rankings) {
  rankingsCache.set(language, {
    data: rankings,
    timestamp: Date.now()
  });
}

/**
 * Invalide le cache pour une langue spécifique
 * Utile quand un joueur change d'ELO significativement
 * @param {string} language - Code langue
 */
export function invalidateRankingsCache(language) {
  rankingsCache.delete(language);
}

/**
 * Invalide tout le cache
 * Utile pour un reset complet
 */
export function clearRankingsCache() {
  rankingsCache.clear();
}

/**
 * Nettoie les entrées expirées du cache
 * À appeler périodiquement (optionnel, car vérification à chaque get)
 */
export function cleanExpiredCache() {
  const now = Date.now();
  for (const [language, cached] of rankingsCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      rankingsCache.delete(language);
    }
  }
}

