import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route pour obtenir l'utilisateur connecté
router.get('/', authenticateToken, (req, res) => {
  try {
    console.log('📡 GET /api/me - User:', req.user?.id, req.user?.username);
    
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
  } catch (error) {
    console.error('❌ Erreur dans GET /api/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour mettre à jour les préférences utilisateur
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (preferences && typeof preferences === 'object') {
      // Mettre à jour les préférences
      req.user.preferences = {
        ...(req.user.preferences || { defaultMode: 'solo' }),
        ...preferences
      };
      
      // Mettre à jour directement dans la base de données avec une requête simple
      const pool = (await import('../db/connection.js')).default;
      
      // Vérifier si la colonne preferences existe
      const hasPreferences = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='preferences'
      `);
      
      if (hasPreferences.rows.length > 0) {
        // La colonne existe, on peut la mettre à jour
        await pool.query(
          `UPDATE users 
           SET preferences = ?
           WHERE id = ?`,
          [JSON.stringify(req.user.preferences), req.user.id]
        );
      } else {
        // La colonne n'existe pas, on essaie de l'ajouter
        // MariaDB : utiliser JSON au lieu de JSONB
        try {
          await pool.query(`
            ALTER TABLE users 
            ADD COLUMN preferences JSON DEFAULT (JSON_OBJECT('defaultMode', 'solo'))
          `);
          // Puis mettre à jour
          await pool.query(
            `UPDATE users 
             SET preferences = ?
             WHERE id = ?`,
            [JSON.stringify(req.user.preferences), req.user.id]
          );
        } catch (alterError) {
          // Si l'ajout échoue (colonne existe déjà ou autre erreur), on continue
          console.warn('Could not add preferences column:', alterError.message);
        }
      }
      
      res.json({
        success: true,
        preferences: req.user.preferences
      });
    } else {
      res.status(400).json({ error: 'Invalid preferences format' });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Error updating preferences: ' + error.message });
  }
});

export default router;

