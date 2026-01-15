/**
 * Cache en mémoire pour les rankings
 * Réduit drastiquement les requêtes DB pour les top 100
 * 
 * TTL (Time To Live) : 5 minutes
 * Invalidation automatique après TTL
 */

import { getRedisClient } from './redisClient.js';

// Structure du cache : Map<language, { data: rankings, timestamp: number }>
const rankingsCache = new Map();

// TTL en millisecondes (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Récupère les rankings depuis le cache ou null si expiré/inexistant
 * @param {string} language - Code langue ('en', 'fr', etc.)
 * @returns {Array|null} Rankings ou null si pas en cache/expiré
 */
export async function getCachedRankings(language) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(`rankings:${language}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (error) {
      // Fallback mémoire si Redis échoue
    }
  }

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
export async function setCachedRankings(language, rankings) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const ttlSeconds = Math.max(1, Math.floor(CACHE_TTL / 1000));
      await redis.set(`rankings:${language}`, JSON.stringify(rankings), { EX: ttlSeconds });
    } catch (error) {
      // Fallback mémoire si Redis échoue
    }
  }

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
export async function invalidateRankingsCache(language) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.del(`rankings:${language}`);
    } catch (error) {
      // Ignore Redis errors
    }
  }
  rankingsCache.delete(language);
}

/**
 * Invalide tout le cache
 * Utile pour un reset complet
 */
export async function clearRankingsCache() {
  const redis = await getRedisClient();
  if (redis) {
    try {
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { MATCH: 'rankings:*', COUNT: 100 });
        cursor = Number(result.cursor);
        const keys = result.keys || [];
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      // Ignore Redis errors
    }
  }
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

