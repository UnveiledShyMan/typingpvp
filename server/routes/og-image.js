/**
 * Route pour générer des images Open Graph dynamiques
 * Pour l'instant, retourne une image statique optimisée
 * TODO: Implémenter génération dynamique avec canvas/node-canvas si nécessaire
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { getUserByUsername } from '../db.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * Génère une URL d'image OG pour un profil utilisateur
 * Pour l'instant, retourne l'avatar ou l'image par défaut
 * TODO: Générer une image 1200x630px avec canvas incluant stats, ELO, etc.
 */
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Récupérer l'utilisateur
    const user = await getUserByUsername(username);
    
    if (!user) {
      // Retourner l'image par défaut si utilisateur non trouvé
      const defaultImage = join(__dirname, '..', '..', 'client', 'public', 'logo.png');
      if (existsSync(defaultImage)) {
        return res.sendFile(defaultImage);
      }
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Si l'utilisateur a un avatar, le retourner
    // Sinon, retourner l'image par défaut
    if (user.avatar && user.avatar.startsWith('http')) {
      // Rediriger vers l'avatar externe
      return res.redirect(user.avatar);
    } else if (user.avatar && existsSync(user.avatar)) {
      return res.sendFile(user.avatar);
    }
    
    // Image par défaut
    const defaultImage = join(__dirname, '..', '..', 'client', 'public', 'logo.png');
    if (existsSync(defaultImage)) {
      return res.sendFile(defaultImage);
    }
    
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    logger.error('Error generating OG image for profile:', error);
    // Retourner l'image par défaut en cas d'erreur
    const defaultImage = join(__dirname, '..', '..', 'client', 'public', 'logo.png');
    if (existsSync(defaultImage)) {
      return res.sendFile(defaultImage);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Génère une URL d'image OG pour les rankings
 * TODO: Générer une image 1200x630px avec top 10 joueurs
 */
router.get('/rankings/:lang?', async (req, res) => {
  try {
    // Pour l'instant, retourner l'image par défaut
    // TODO: Générer une image avec le top 10 des rankings
    const defaultImage = join(__dirname, '..', '..', 'client', 'public', 'logo.png');
    if (existsSync(defaultImage)) {
      return res.sendFile(defaultImage);
    }
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    logger.error('Error generating OG image for rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

