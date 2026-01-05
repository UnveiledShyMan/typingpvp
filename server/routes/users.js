import express from 'express';
import { getUserById, getAllUsers, updateUser } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Obtenir un utilisateur par ID
router.get('/:id', optionalAuth, async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Ne pas envoyer le hash du mot de passe
  res.json({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    gear: user.gear || '',
    socialMedia: user.socialMedia || {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    },
    mmr: user.mmr,
    stats: user.stats,
    preferences: user.preferences || {
      defaultMode: 'solo'
    },
    createdAt: user.createdAt
  });
});

// Mettre à jour le profil (nécessite authentification)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { bio, avatar, gear, socialMedia } = req.body;

  if (bio !== undefined) {
    req.user.bio = bio;
  }

  if (avatar !== undefined) {
    req.user.avatar = avatar;
  }

  if (gear !== undefined) {
    req.user.gear = gear;
  }

  if (socialMedia !== undefined) {
    req.user.socialMedia = {
      ...(req.user.socialMedia || {}),
      ...socialMedia
    };
  }

  // Sauvegarder dans la base de données
  await updateUser(req.user);

  res.json({
    id: req.user.id,
    username: req.user.username,
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

