import express from 'express';
import { getRankingsByLanguage } from '../db.js';
import { getRankingsByLanguageOptimized } from '../db/getRankingsOptimized.js';
import { getRankFromMMR } from '../utils/ranks.js';

const router = express.Router();

// Obtenir le classement par langue (version optimisée avec colonnes générées si disponibles)
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // Utiliser la version optimisée qui utilise les colonnes générées si disponibles
    // Fallback automatique vers la méthode originale si les colonnes n'existent pas
    const rankings = await getRankingsByLanguageOptimized(language, limit);

    // Ajouter les rangs (tier, rank)
    const rankingsWithRanks = rankings.map(user => ({
      ...user,
      rankInfo: getRankFromMMR(user.mmr)
    }));

    res.json({
      language,
      rankings: rankingsWithRanks,
      total: rankingsWithRanks.length
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

