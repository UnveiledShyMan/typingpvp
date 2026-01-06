/**
 * Version optimisée de getRankingsByLanguage
 * 
 * Utilise les colonnes générées mmr_XX si disponibles (après migration)
 * Sinon, utilise la méthode JSON_EXTRACT (compatible avec l'existant)
 */

import pool from './connection.js';

/**
 * Récupère le classement par langue (version optimisée)
 * @param {string} language - Langue ('en', 'fr', 'es', etc.)
 * @param {number} limit - Nombre de résultats (défaut: 100)
 * @returns {Promise<Array>} Liste des utilisateurs classés
 */
export async function getRankingsByLanguageOptimized(language, limit = 100) {
  try {
    // Vérifier si la colonne mmr_{language} existe (après migration)
    // Sinon, utiliser la méthode JSON_EXTRACT (compatible)
    const columnName = `mmr_${language}`;
    
    // Tentative d'utiliser la colonne générée si disponible
    let query;
    let params;
    
    try {
      // Utiliser la colonne générée (plus rapide)
      query = `SELECT 
        id, username, avatar, gear, mmr, stats, ${columnName} as mmr_value
       FROM users
       WHERE ${columnName} IS NOT NULL
       ORDER BY ${columnName} DESC, 
                CAST(JSON_UNQUOTE(JSON_EXTRACT(stats, '$.totalMatches')) AS UNSIGNED) DESC
       LIMIT ?`;
      params = [limit];
    } catch (error) {
      // Si la colonne n'existe pas, utiliser JSON_EXTRACT (méthode originale)
      query = `SELECT 
        id, username, avatar, gear, mmr, stats
       FROM users
       ORDER BY COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, CONCAT('$.', JSON_QUOTE(?)))) AS UNSIGNED), 1000) DESC,
                CAST(JSON_UNQUOTE(JSON_EXTRACT(stats, '$.totalMatches')) AS UNSIGNED) DESC
       LIMIT ?`;
      params = [language, limit];
    }
    
    const result = await pool.query(query, params);
    
    return result.rows.map((row, index) => {
      // mmr est déjà un JSON, on peut l'utiliser directement
      const mmrObj = row.mmr || {};
      const mmrValue = row.mmr_value || parseInt(mmrObj[language] || 1000);
      const statsObj = row.stats || {};
      
      return {
        id: row.id,
        username: row.username,
        avatar: row.avatar,
        gear: row.gear || '',
        mmr: mmrValue,
        stats: {
          wins: statsObj.wins || 0,
          losses: statsObj.losses || 0,
          bestWPM: statsObj.bestWPM || 0,
          totalMatches: statsObj.totalMatches || 0,
          averageAccuracy: statsObj.averageAccuracy || 0
        },
        rank: index + 1
      };
    });
  } catch (error) {
    console.error('Error getting rankings (optimized):', error);
    // Fallback vers la méthode originale si l'optimisation échoue
    return getRankingsByLanguageFallback(language, limit);
  }
}

/**
 * Méthode fallback (méthode originale)
 */
async function getRankingsByLanguageFallback(language, limit) {
  try {
    const result = await pool.query(
      `SELECT 
        id, username, avatar, gear, mmr, stats
       FROM users
       ORDER BY COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, CONCAT('$.', JSON_QUOTE(?)))) AS UNSIGNED), 1000) DESC
       LIMIT ?`,
      [language, limit]
    );
    
    return result.rows.map((row, index) => {
      const mmrObj = row.mmr || {};
      const mmrValue = parseInt(mmrObj[language] || 1000);
      const statsObj = row.stats || {};
      
      return {
        id: row.id,
        username: row.username,
        avatar: row.avatar,
        gear: row.gear || '',
        mmr: mmrValue,
        stats: {
          wins: statsObj.wins || 0,
          losses: statsObj.losses || 0,
          bestWPM: statsObj.bestWPM || 0,
          totalMatches: statsObj.totalMatches || 0,
          averageAccuracy: statsObj.averageAccuracy || 0
        },
        rank: index + 1
      };
    });
  } catch (error) {
    console.error('Error getting rankings (fallback):', error);
    return [];
  }
}

