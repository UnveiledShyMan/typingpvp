// Base de données PostgreSQL
import pool from './db/connection.js';
import { User } from './models/User.js';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

/**
 * Crée un nouvel utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} email - Email
 * @param {string} password - Mot de passe (optionnel pour OAuth)
 * @param {string} provider - Provider d'authentification ('local', 'google', 'x')
 * @param {string} providerId - ID du provider (pour OAuth)
 * @param {string} avatar - URL de l'avatar (optionnel, souvent fourni par OAuth)
 */
export async function createUser(username, email, password = null, provider = 'local', providerId = null, avatar = null) {
  const id = nanoid();
  let passwordHash = null;
  
  // Hasher le mot de passe seulement si fourni (authentification locale)
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO users (id, username, email, password_hash, provider, provider_id, avatar, mmr, stats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        username,
        email ? email.toLowerCase() : null,
        passwordHash,
        provider,
        providerId,
        avatar,
        JSON.stringify({}), // MMR vide au départ
        JSON.stringify({
          totalMatches: 0,
          wins: 0,
          losses: 0,
          totalWPM: 0,
          bestWPM: 0,
          averageAccuracy: 0
        })
      ]
    );
    
    return rowToUser(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      if (error.constraint === 'users_username_key') {
        throw new Error('Username already taken');
      }
      if (error.constraint === 'users_email_key') {
        throw new Error('Email already taken');
      }
      if (error.constraint === 'idx_users_provider_provider_id') {
        throw new Error('Account already exists with this provider');
      }
    }
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

/**
 * Récupère un utilisateur par son username
 */
export async function getUserByUsername(username) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * Récupère un utilisateur par son email
 */
export async function getUserByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Récupère un utilisateur par provider et provider_id (pour OAuth)
 */
export async function getUserByProviderId(provider, providerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
      [provider, providerId]
    );
    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  } catch (error) {
    console.error('Error getting user by provider id:', error);
    return null;
  }
}

/**
 * Vérifie le mot de passe d'un utilisateur
 */
export async function verifyPassword(user, password) {
  return await bcrypt.compare(password, user.passwordHash);
}

/**
 * Récupère tous les utilisateurs
 */
export async function getAllUsers() {
  try {
    const result = await pool.query('SELECT * FROM users');
    return result.rows.map(row => rowToUser(row));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Récupère le classement par langue
 */
export async function getRankingsByLanguage(language, limit = 100) {
  try {
    // Récupérer tous les utilisateurs et calculer leur MMR pour la langue
    // Inclure les utilisateurs qui n'ont pas de MMR pour cette langue (utiliser 1000 par défaut)
    const result = await pool.query(
      `SELECT 
        id, username, avatar, gear, mmr, stats
       FROM users
       ORDER BY COALESCE((mmr->>$1)::INTEGER, 1000) DESC
       LIMIT $2`,
      [language, limit]
    );
    
    return result.rows
      .map((row, index) => {
        // mmr est déjà un JSONB, on peut l'utiliser directement
        const mmrObj = row.mmr || {};
        const mmrValue = parseInt(mmrObj[language] || 1000);
        const statsObj = row.stats || {};
        return {
          id: row.id,
          username: row.username,
          avatar: row.avatar,
          gear: row.gear || '',
          mmr: mmrValue,
          stats: {
            wins: statsObj.wins || 0,
            losses: statsObj.losses || 0,
            bestWPM: statsObj.bestWPM || 0,
            totalMatches: statsObj.totalMatches || 0,
            averageAccuracy: statsObj.averageAccuracy || 0
          },
          rank: index + 1
        };
      })
      .sort((a, b) => b.mmr - a.mmr)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  } catch (error) {
    console.error('Error getting rankings:', error);
    return [];
  }
}

/**
 * Met à jour un utilisateur dans la base de données
 */
export async function updateUser(user) {
  try {
    // Vérifier si la colonne preferences existe, sinon on l'ignore
    const hasPreferences = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='preferences'
    `);
    
    const updateFields = hasPreferences.rows.length > 0
      ? `username = $1, email = $2, password_hash = $3, avatar = $4, 
         bio = $5, gear = $6, social_media = $7, friends = $8, 
         friend_requests_sent = $9, friend_requests_received = $10, 
         mmr = $11, stats = $12, preferences = $13, provider = $14, provider_id = $15`
      : `username = $1, email = $2, password_hash = $3, avatar = $4, 
         bio = $5, gear = $6, social_media = $7, friends = $8, 
         friend_requests_sent = $9, friend_requests_received = $10, 
         mmr = $11, stats = $12, provider = $13, provider_id = $14`;
    
    const params = hasPreferences.rows.length > 0
      ? [
          user.username,
          user.email,
          user.passwordHash,
          user.avatar,
          user.bio,
          user.gear,
          JSON.stringify(user.socialMedia),
          user.friends,
          user.friendRequests.sent,
          user.friendRequests.received,
          JSON.stringify(user.mmr),
          JSON.stringify(user.stats),
          JSON.stringify(user.preferences || { defaultMode: 'solo' }),
          user.provider || 'local',
          user.providerId || null,
          user.id
        ]
      : [
          user.username,
          user.email,
          user.passwordHash,
          user.avatar,
          user.bio,
          user.gear,
          JSON.stringify(user.socialMedia),
          user.friends,
          user.friendRequests.sent,
          user.friendRequests.received,
          JSON.stringify(user.mmr),
          JSON.stringify(user.stats),
          user.provider || 'local',
          user.providerId || null,
          user.id
        ];
    
    await pool.query(
      `UPDATE users 
       SET ${updateFields}
       WHERE id = $${params.length}`,
      params
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Enregistre un match dans l'historique
 */
export async function recordMatch(matchData) {
  const matchId = nanoid();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insérer le match
    await client.query(
      `INSERT INTO matches (id, type, language, date, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        matchId,
        matchData.type,
        matchData.language || 'en',
        new Date().toISOString(),
        JSON.stringify(matchData)
      ]
    );
    
    // Insérer les performances de chaque joueur
    for (const player of matchData.players) {
      if (player.userId) {
        await client.query(
          `INSERT INTO user_matches (user_id, match_id, wpm, accuracy, won, position)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, match_id) DO NOTHING`,
          [
            player.userId,
            matchId,
            player.wpm,
            player.accuracy,
            player.won || false,
            player.position || null
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    return matchId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording match:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupère l'historique des matchs d'un utilisateur
 */
export async function getUserMatches(userId, limit = 50, type = undefined) {
  try {
    let query = `
      SELECT 
        m.id, m.type, m.language, m.date, m.data,
        um.wpm, um.accuracy, um.won, um.position
      FROM user_matches um
      JOIN matches m ON um.match_id = m.id
      WHERE um.user_id = $1
    `;
    
    const params = [userId];
    
    // Filtrer par type si spécifié
    if (type === 'solo') {
      query += ' AND m.type = $2';
      params.push('solo');
    } else if (type === 'multiplayer') {
      query += ' AND m.type != $2';
      params.push('solo');
    }
    
    query += ' ORDER BY m.date DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => {
      const matchData = row.data;
      const players = matchData.players || [];
      
      // Trouver l'adversaire (autre joueur)
      const opponent = players.find(p => p.userId !== userId);
      
      return {
        id: row.id,
        type: row.type,
        date: row.date,
        language: row.language,
        wpm: row.wpm,
        accuracy: parseFloat(row.accuracy),
        won: row.won,
        opponent: opponent?.username || null,
        position: row.position
      };
    });
  } catch (error) {
    console.error('Error getting user matches:', error);
    return [];
  }
}

/**
 * Convertit une ligne de la base de données en objet User
 */
function rowToUser(row) {
  if (!row) return null;
  
  // Parser mmr et stats si ce sont des strings JSON (PostgreSQL JSONB retourne déjà des objets)
  // Mais parfois ils peuvent être des strings, donc on parse si nécessaire
  let mmr = row.mmr;
  if (typeof mmr === 'string') {
    try {
      mmr = JSON.parse(mmr);
    } catch (e) {
      mmr = {};
    }
  }
  if (!mmr || typeof mmr !== 'object') mmr = {};
  
  let stats = row.stats;
  if (typeof stats === 'string') {
    try {
      stats = JSON.parse(stats);
    } catch (e) {
      stats = {};
    }
  }
  if (!stats || typeof stats !== 'object') {
    stats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalWPM: 0,
      bestWPM: 0,
      averageAccuracy: 0
    };
  }
  
  let socialMedia = row.social_media;
  if (typeof socialMedia === 'string') {
    try {
      socialMedia = JSON.parse(socialMedia);
    } catch (e) {
      socialMedia = {};
    }
  }
  if (!socialMedia || typeof socialMedia !== 'object') {
    socialMedia = {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    };
  }
  
  let preferences = row.preferences;
  if (typeof preferences === 'string') {
    try {
      preferences = JSON.parse(preferences);
    } catch (e) {
      preferences = {};
    }
  }
  if (!preferences || typeof preferences !== 'object') {
    preferences = {
      defaultMode: 'solo'
    };
  }
  
  return new User({
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    provider: row.provider || 'local',
    providerId: row.provider_id || null,
    avatar: row.avatar,
    bio: row.bio || '',
    gear: row.gear || '',
    socialMedia: socialMedia,
    friends: row.friends || [],
    friendRequests: {
      sent: row.friend_requests_sent || [],
      received: row.friend_requests_received || []
    },
    createdAt: row.created_at,
    mmr: mmr,
    stats: stats,
    preferences: preferences
  });
}
