import express from 'express';
import { getRankingsByLanguage } from '../db.js';
import { getRankingsByLanguageOptimized } from '../db/getRankingsOptimized.js';
import { getRankFromMMR } from '../utils/ranks.js';
import { getCachedRankings, setCachedRankings } from '../utils/rankingsCache.js';

const router = express.Router();

// Obtenir le classement par langue (version optimisée avec colonnes générées si disponibles + cache)
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // Vérifier le cache d'abord (seulement pour limit <= 100 pour éviter trop de variantes)
    if (limit <= 100) {
      const cached = getCachedRankings(language);
      if (cached) {
        // Retourner les données en cache (déjà avec rankInfo)
        return res.json({
          language,
          rankings: cached,
          total: cached.length,
          cached: true
        });
      }
    }

    // Utiliser la version optimisée qui utilise les colonnes générées si disponibles
    // Fallback automatique vers la méthode originale si les colonnes n'existent pas
    const rankings = await getRankingsByLanguageOptimized(language, limit);

    // Ajouter les rangs (tier, rank)
    const rankingsWithRanks = rankings.map(user => ({
      ...user,
      rankInfo: getRankFromMMR(user.mmr)
    }));

    // Mettre en cache seulement pour limit <= 100 (top 100)
    if (limit <= 100) {
      setCachedRankings(language, rankingsWithRanks);
    }

    res.json({
      language,
      rankings: rankingsWithRanks,
      total: rankingsWithRanks.length,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

