// Base de données MariaDB
import pool, { getConnection } from './db/connection.js';
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:16',message:'createUser entry',data:{username,email,hasPassword:!!password,provider,providerId,avatar},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const id = nanoid();
  let passwordHash = null;
  
  // Hasher le mot de passe seulement si fourni (authentification locale)
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }
  
  try {
    // MariaDB n'a pas RETURNING, on fait INSERT puis SELECT
    // Inclure tous les champs nécessaires pour éviter les problèmes avec les valeurs par défaut
    // IMPORTANT: L'ordre des colonnes doit correspondre exactement au schéma MariaDB
    const insertParams = [
      id,
      username,
      email ? email.toLowerCase() : null,
      passwordHash,
      avatar || null,
      null, // bio
      null, // gear
      JSON.stringify({}), // social_media
      JSON.stringify([]), // friends
      JSON.stringify([]), // friend_requests_sent
      JSON.stringify([]), // friend_requests_received
      JSON.stringify({}), // MMR vide au départ
      JSON.stringify({
        totalMatches: 0,
        wins: 0,
        losses: 0,
        totalWPM: 0,
        bestWPM: 0,
        averageAccuracy: 0
      }),
      JSON.stringify({ defaultMode: 'solo' }), // preferences
      provider || 'local', // provider (après preferences dans le schéma)
      providerId || null // provider_id (après provider dans le schéma)
    ];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:28',message:'before INSERT',data:{id,username,email:email?.toLowerCase(),hasPasswordHash:!!passwordHash,paramsCount:insertParams.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // L'ordre des colonnes doit correspondre exactement au schéma MariaDB
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, avatar, bio, gear, social_media, friends, friend_requests_sent, friend_requests_received, mmr, stats, preferences, provider, provider_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:58',message:'after INSERT',data:{id,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Récupérer l'utilisateur créé
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:61',message:'before SELECT',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const result = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:64',message:'after SELECT',data:{rowsCount:result?.rows?.length,hasFirstRow:!!result?.rows?.[0],firstRowKeys:result?.rows?.[0]?Object.keys(result.rows[0]):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:65',message:'before rowToUser',data:{rowId:result?.rows?.[0]?.id,rowUsername:result?.rows?.[0]?.username,mmrType:typeof result?.rows?.[0]?.mmr,statsType:typeof result?.rows?.[0]?.stats},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const user = rowToUser(result.rows[0]);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:66',message:'after rowToUser',data:{userId:user?.id,hasUser:!!user,userType:user?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return user;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:68',message:'createUser catch',data:{errorMessage:error?.message,errorCode:error?.code,errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // MariaDB utilise 1062 pour ER_DUP_ENTRY, PostgreSQL utilise 23505
    // Le wrapper dans connection.js convertit déjà 1062 en 23505, mais on vérifie les deux pour sécurité
    if (error.code === '23505' || error.code === 1062 || error.code === 'ER_DUP_ENTRY') {
      // Extraire le nom de la contrainte depuis le message d'erreur MariaDB
      const errorMessage = error.message || '';
      if (errorMessage.includes('username') || error.constraint === 'users_username_key' || errorMessage.includes('PRIMARY')) {
        throw new Error('Username already taken');
      }
      if (errorMessage.includes('email') || error.constraint === 'users_email_key') {
        throw new Error('Email already taken');
      }
      if (errorMessage.includes('provider') || error.constraint === 'idx_users_provider_provider_id' || error.constraint === 'unique_provider_provider_id') {
        throw new Error('Account already exists with this provider');
      }
      // Erreur générique de duplication
      throw new Error('A user with this information already exists');
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
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
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
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
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
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
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
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
    // MariaDB : utiliser JSON_EXTRACT avec une clé dynamique
    // Note: On construit le chemin JSON avec CONCAT pour éviter les injections SQL
    const result = await pool.query(
      `SELECT 
        id, username, avatar, gear, mmr, stats
       FROM users
       ORDER BY COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, CONCAT('$.', JSON_QUOTE(?)))) AS UNSIGNED), 1000) DESC
       LIMIT ?`,
      [language, limit]
    );
    
    return result.rows
      .map((row, index) => {
        // mmr est déjà un JSON, on peut l'utiliser directement
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
    
    // MariaDB : friends et friend_requests sont maintenant JSON au lieu de TEXT[]
    const updateFields = hasPreferences.rows.length > 0
      ? `username = ?, email = ?, password_hash = ?, avatar = ?, 
         bio = ?, gear = ?, social_media = ?, friends = ?, 
         friend_requests_sent = ?, friend_requests_received = ?, 
         mmr = ?, stats = ?, preferences = ?, provider = ?, provider_id = ?`
      : `username = ?, email = ?, password_hash = ?, avatar = ?, 
         bio = ?, gear = ?, social_media = ?, friends = ?, 
         friend_requests_sent = ?, friend_requests_received = ?, 
         mmr = ?, stats = ?, provider = ?, provider_id = ?`;
    
    const params = hasPreferences.rows.length > 0
      ? [
          user.username,
          user.email,
          user.passwordHash,
          user.avatar,
          user.bio,
          user.gear,
          JSON.stringify(user.socialMedia),
          JSON.stringify(user.friends || []), // Convertir en JSON
          JSON.stringify(user.friendRequests.sent || []), // Convertir en JSON
          JSON.stringify(user.friendRequests.received || []), // Convertir en JSON
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
          JSON.stringify(user.friends || []), // Convertir en JSON
          JSON.stringify(user.friendRequests.sent || []), // Convertir en JSON
          JSON.stringify(user.friendRequests.received || []), // Convertir en JSON
          JSON.stringify(user.mmr),
          JSON.stringify(user.stats),
          user.provider || 'local',
          user.providerId || null,
          user.id
        ];
    
    await pool.query(
      `UPDATE users 
       SET ${updateFields}
       WHERE id = ?`,
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
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insérer le match
    await connection.execute(
      `INSERT INTO matches (id, type, language, date, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        matchId,
        matchData.type,
        matchData.language || 'en',
        new Date().toISOString(),
        JSON.stringify(matchData)
      ]
    );
    
    // Insérer les performances de chaque joueur
    // MariaDB : utiliser INSERT IGNORE au lieu de ON CONFLICT
    for (const player of matchData.players) {
      if (player.userId) {
        await connection.execute(
          `INSERT IGNORE INTO user_matches (user_id, match_id, wpm, accuracy, won, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
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
    
    await connection.commit();
    return matchId;
  } catch (error) {
    await connection.rollback();
    console.error('Error recording match:', error);
    throw error;
  } finally {
    connection.release();
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
      WHERE um.user_id = ?
    `;
    
    const params = [userId];
    
    // Filtrer par type si spécifié
    if (type === 'solo') {
      query += ' AND m.type = ?';
      params.push('solo');
    } else if (type === 'multiplayer') {
      query += ' AND m.type != ?';
      params.push('solo');
    }
    
    query += ' ORDER BY m.date DESC LIMIT ?';
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => {
      // Parser le JSON si c'est une string (MariaDB peut retourner JSON comme string)
      let matchData = row.data;
      if (typeof matchData === 'string') {
        try {
          matchData = JSON.parse(matchData);
        } catch (e) {
          console.error('Error parsing match data:', e);
          matchData = {};
        }
      }
      const players = matchData.players || [];
      
      // Trouver le joueur actuel et l'adversaire
      const currentPlayer = players.find(p => p.userId === userId);
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
        position: row.position,
        eloChange: currentPlayer?.eloChange || null,
        eloBefore: currentPlayer?.eloBefore || null,
        eloAfter: currentPlayer?.eloAfter || null
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
    // MariaDB : friends est maintenant JSON, parser si nécessaire
    friends: (() => {
      let friends = row.friends;
      if (typeof friends === 'string') {
        try {
          friends = JSON.parse(friends);
        } catch (e) {
          friends = [];
        }
      }
      return Array.isArray(friends) ? friends : [];
    })(),
    friendRequests: {
      sent: (() => {
        let sent = row.friend_requests_sent;
        if (typeof sent === 'string') {
          try {
            sent = JSON.parse(sent);
          } catch (e) {
            sent = [];
          }
        }
        return Array.isArray(sent) ? sent : [];
      })(),
      received: (() => {
        let received = row.friend_requests_received;
        if (typeof received === 'string') {
          try {
            received = JSON.parse(received);
          } catch (e) {
            received = [];
          }
        }
        return Array.isArray(received) ? received : [];
      })()
    },
    createdAt: row.created_at,
    mmr: mmr,
    stats: stats,
    preferences: preferences
  });
}
