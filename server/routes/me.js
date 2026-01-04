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
    stats: req.user.stats
  });
});

export default router;

