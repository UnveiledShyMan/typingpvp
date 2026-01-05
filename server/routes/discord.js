import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/connection.js';
import { nanoid } from 'nanoid';

const router = express.Router();

/**
 * Génère un code de vérification pour lier un compte Discord
 * POST /api/discord/generate-code
 * Requiert une authentification
 */
router.post('/generate-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { discordId, discordUsername } = req.body;
    
    if (!discordId || !discordUsername) {
      return res.status(400).json({ error: 'discordId et discordUsername sont requis' });
    }
    
    // Vérifier si un lien existe déjà pour ce Discord ID
    const existingLink = await pool.query(
      'SELECT * FROM discord_links WHERE discord_id = $1',
      [discordId]
    );
    
    if (existingLink.rows.length > 0 && existingLink.rows[0].verified) {
      return res.status(400).json({ 
        error: 'Ce compte Discord est déjà lié à un autre compte' 
      });
    }
    
    // Générer un code de vérification unique (6 caractères alphanumériques)
    const verificationCode = nanoid(6).toUpperCase();
    
    // Supprimer les anciens codes non vérifiés pour cet utilisateur
    await pool.query(
      'DELETE FROM discord_links WHERE user_id = $1 AND verified = false',
      [userId]
    );
    
    // Créer ou mettre à jour le lien
    const linkId = nanoid();
    await pool.query(
      `INSERT INTO discord_links (id, user_id, discord_id, discord_username, verification_code, verified)
       VALUES ($1, $2, $3, $4, $5, false)
       ON CONFLICT (discord_id) 
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         discord_username = EXCLUDED.discord_username,
         verification_code = EXCLUDED.verification_code,
         verified = false,
         created_at = CURRENT_TIMESTAMP`,
      [linkId, userId, discordId, discordUsername, verificationCode]
    );
    
    res.json({ 
      success: true, 
      verificationCode,
      message: 'Code de vérification généré. Utilisez /link dans Discord avec ce code.' 
    });
  } catch (error) {
    console.error('Erreur lors de la génération du code:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du code' });
  }
});

/**
 * Vérifie un code de vérification et lie le compte
 * POST /api/discord/verify-code
 * Public (appelé depuis Discord)
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { discordId, verificationCode } = req.body;
    
    if (!discordId || !verificationCode) {
      return res.status(400).json({ error: 'discordId et verificationCode sont requis' });
    }
    
    // Trouver le lien avec ce code
    const linkResult = await pool.query(
      'SELECT * FROM discord_links WHERE verification_code = $1 AND discord_id = $2',
      [verificationCode.toUpperCase(), discordId]
    );
    
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Code de vérification invalide' });
    }
    
    const link = linkResult.rows[0];
    
    // Vérifier que le code n'a pas expiré (24 heures)
    const createdAt = new Date(link.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      // Supprimer le code expiré
      await pool.query('DELETE FROM discord_links WHERE id = $1', [link.id]);
      return res.status(400).json({ error: 'Code de vérification expiré. Générez-en un nouveau.' });
    }
    
    // Vérifier le compte
    await pool.query(
      'UPDATE discord_links SET verified = true, linked_at = CURRENT_TIMESTAMP WHERE id = $1',
      [link.id]
    );
    
    // Récupérer les informations de l'utilisateur pour retourner le rang
    const userResult = await pool.query(
      'SELECT id, username, mmr FROM users WHERE id = $1',
      [link.user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = userResult.rows[0];
    const mmr = user.mmr || {};
    // Utiliser le MMR de la langue par défaut (en) ou le plus élevé
    const maxMMR = Math.max(...Object.values(mmr).map(m => parseInt(m) || 1000), 1000);
    
    res.json({ 
      success: true, 
      userId: user.id,
      username: user.username,
      mmr: maxMMR,
      message: 'Compte lié avec succès !' 
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du code' });
  }
});

/**
 * Récupère les informations d'un utilisateur lié
 * GET /api/discord/user/:discordId
 * Public (appelé depuis Discord)
 */
router.get('/user/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    
    const linkResult = await pool.query(
      `SELECT dl.*, u.username, u.mmr, u.stats, u.avatar
       FROM discord_links dl
       JOIN users u ON dl.user_id = u.id
       WHERE dl.discord_id = $1 AND dl.verified = true`,
      [discordId]
    );
    
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compte Discord non lié' });
    }
    
    const link = linkResult.rows[0];
    const mmr = link.mmr || {};
    // Calculer le MMR maximum (toutes langues confondues)
    const maxMMR = Math.max(...Object.values(mmr).map(m => parseInt(m) || 1000), 1000);
    
    res.json({
      userId: link.user_id,
      username: link.username,
      discordId: link.discord_id,
      discordUsername: link.discord_username,
      mmr: maxMMR,
      mmrByLanguage: mmr,
      stats: link.stats,
      avatar: link.avatar,
      linkedAt: link.linked_at
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
  }
});

/**
 * Délie un compte Discord
 * DELETE /api/discord/unlink
 * Requiert une authentification
 */
router.delete('/unlink', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.query(
      'DELETE FROM discord_links WHERE user_id = $1',
      [userId]
    );
    
    res.json({ success: true, message: 'Compte Discord délié avec succès' });
  } catch (error) {
    console.error('Erreur lors du déliage:', error);
    res.status(500).json({ error: 'Erreur lors du déliage' });
  }
});

export default router;

