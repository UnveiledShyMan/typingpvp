import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route pour obtenir l'utilisateur connecté
router.get('/', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    avatar: req.user.avatar,
    bio: req.user.bio,
    gear: req.user.gear || '',
    socialMedia: req.user.socialMedia || {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    },
    mmr: req.user.mmr,
    stats: req.user.stats,
    preferences: req.user.preferences || {
      defaultMode: 'solo'
    }
  });
});

// Route pour mettre à jour les préférences utilisateur
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (preferences && typeof preferences === 'object') {
      req.user.preferences = {
        ...(req.user.preferences || { defaultMode: 'solo' }),
        ...preferences
      };
      
      const { updateUser } = await import('../db.js');
      await updateUser(req.user);
      
      res.json({
        success: true,
        preferences: req.user.preferences
      });
    } else {
      res.status(400).json({ error: 'Invalid preferences format' });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Error updating preferences' });
  }
});

export default router;

