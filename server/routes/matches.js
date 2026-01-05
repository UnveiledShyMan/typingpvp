import express from 'express';
import { getUserMatches, recordMatch, updateUser } from '../db.js';
import { getUserById } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Récupère l'historique des matchs de l'utilisateur connecté
 * GET /api/matches?limit=50&type=solo|multiplayer
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // 'solo', 'multiplayer', ou undefined pour tous
    const matches = await getUserMatches(req.user.id, limit, type);
    res.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Enregistre un match solo
 * POST /api/matches/solo
 * IMPORTANT: Cette route doit être avant GET /:userId pour éviter les conflits de routing
 */
router.post('/solo', authenticateToken, async (req, res) => {
  try {
    const { wpm, accuracy, language } = req.body;
    const user = req.user;
    
    if (!wpm || !accuracy || !language) {
      return res.status(400).json({ error: 'Missing required fields: wpm, accuracy, language' });
    }
    
    // Enregistrer le match
    const matchId = await recordMatch({
      type: 'solo',
      language: language,
      players: [{
        userId: user.id,
        username: user.username,
        wpm: wpm,
        accuracy: accuracy,
        won: false // Les matchs solo n'ont pas de concept de victoire
      }]
    });
    
    // Mettre à jour les stats (bestWPM)
    user.updateStats({
      type: 'solo',
      wpm: wpm,
      accuracy: accuracy,
      won: false
    });
    
    // Sauvegarder dans la base de données
    await updateUser(user);
    
    res.json({ success: true, matchId });
  } catch (error) {
    console.error('Error recording solo match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Récupère l'historique des matchs d'un utilisateur spécifique (public)
 * GET /api/matches/user/:userId?limit=50&type=solo|multiplayer
 * Cette route doit être avant GET /:userId pour éviter les conflits
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // 'solo', 'multiplayer', ou undefined pour tous
    const matches = await getUserMatches(userId, limit, type);
    res.json({ matches });
  } catch (error) {
    console.error('Error fetching user matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Récupère l'historique des matchs d'un utilisateur spécifique (public) - route alternative
 * GET /api/matches/:userId?limit=50&type=solo|multiplayer
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // 'solo', 'multiplayer', ou undefined pour tous
    const matches = await getUserMatches(userId, limit, type);
    res.json({ matches });
  } catch (error) {
    console.error('Error fetching user matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

