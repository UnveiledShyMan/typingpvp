import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getUserById, getAllUsers, updateUser, getUserByUsername } from '../db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuration du dossier d'upload
// Créer le dossier uploads/avatars s'il n'existe pas
const uploadsDir = join(__dirname, '..', 'uploads', 'avatars');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer pour les uploads d'images
// Limite la taille à 5MB et accepte uniquement les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp et userId
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    cb(null, `${userId}-${timestamp}.${extension}`);
  }
});

// Filtrer pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Obtenir un utilisateur par username (route spéciale avant /:id)
router.get('/username/:username', optionalAuth, async (req, res) => {
  try {
    // Décoder le username depuis l'URL (caractères spéciaux et espaces)
    // Nettoyer aussi les suffixes bizarres comme ":1" qui peuvent apparaître
    const rawUsername = decodeURIComponent(req.params.username);
    const cleanUsername = rawUsername.split(':')[0].trim();
    
    const user = await getUserByUsername(cleanUsername);

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
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir un utilisateur par ID
router.get('/:id', optionalAuth, async (req, res) => {
  // Vérifier si c'est "username" pour éviter les conflits
  if (req.params.id === 'username') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

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

// Endpoint pour uploader une image de profil
// POST /api/users/:id/avatar
router.post('/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    // Vérifier que l'utilisateur peut modifier son propre profil
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    // Construire l'URL de l'image
    // Utiliser l'URL complète si disponible, sinon URL relative
    // L'URL sera servie statiquement depuis /uploads/avatars/
    const baseUrl = process.env.CLIENT_URL || req.protocol + '://' + req.get('host');
    const imageUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    // Mettre à jour l'avatar de l'utilisateur dans la base de données
    req.user.avatar = imageUrl;
    await updateUser(req.user);

    res.json({
      success: true,
      avatar: imageUrl,
      message: 'Avatar mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'avatar:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'upload de l\'avatar' });
  }
});

export default router;

