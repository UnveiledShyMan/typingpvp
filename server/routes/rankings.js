import express from 'express';
import { getRankingsByLanguage } from '../db.js';
import { getRankFromMMR } from '../utils/ranks.js';

const router = express.Router();

// Obtenir le classement par langue
router.get('/:language', (req, res) => {
  const { language } = req.params;
  const limit = parseInt(req.query.limit) || 100;

  const rankings = getRankingsByLanguage(language, limit);

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
});

export default router;

