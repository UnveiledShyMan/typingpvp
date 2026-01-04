// Base de données en mémoire (peut être migrée vers MongoDB/PostgreSQL)
import { User } from './models/User.js';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// Stockage en mémoire
export const users = new Map(); // userId -> User
export const usersByUsername = new Map(); // username -> userId
export const usersByEmail = new Map(); // email -> userId

// Fonctions helper
export async function createUser(username, email, password) {
  const id = nanoid();
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = new User({
    id,
    username,
    email,
    passwordHash,
    mmr: {} // MMR par langue
  });
  
  users.set(id, user);
  usersByUsername.set(username.toLowerCase(), id);
  usersByEmail.set(email.toLowerCase(), id);
  
  return user;
}

export function getUserById(id) {
  return users.get(id);
}

export function getUserByUsername(username) {
  const userId = usersByUsername.get(username.toLowerCase());
  return userId ? users.get(userId) : null;
}

export function getUserByEmail(email) {
  const userId = usersByEmail.get(email.toLowerCase());
  return userId ? users.get(userId) : null;
}

export async function verifyPassword(user, password) {
  return await bcrypt.compare(password, user.passwordHash);
}

export function getAllUsers() {
  return Array.from(users.values());
}

// Récupérer le classement par langue
export function getRankingsByLanguage(language, limit = 100) {
  const allUsers = getAllUsers();
  
  return allUsers
    .map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      gear: user.gear || '',
      mmr: user.getMMR(language),
      stats: user.stats
    }))
    .filter(user => user.mmr > 0)
    .sort((a, b) => b.mmr - a.mmr)
    .slice(0, limit)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
}

// Stockage des matchs (historique)
export const matches = new Map(); // matchId -> Match
export const userMatches = new Map(); // userId -> Array of matchIds

/**
 * Enregistre un match dans l'historique
 * @param {Object} matchData - Données du match
 * @returns {string} matchId
 */
export function recordMatch(matchData) {
  const matchId = nanoid();
  const match = {
    id: matchId,
    type: matchData.type, // 'solo', 'battle', 'matchmaking', 'competition'
    date: new Date().toISOString(),
    language: matchData.language || 'en',
    players: matchData.players, // Array of { userId, username, wpm, accuracy, won }
    ...matchData
  };
  
  matches.set(matchId, match);
  
  // Ajouter le match à l'historique de chaque joueur
  match.players.forEach(player => {
    if (player.userId) {
      if (!userMatches.has(player.userId)) {
        userMatches.set(player.userId, []);
      }
      userMatches.get(player.userId).push(matchId);
    }
  });
  
  return matchId;
}

/**
 * Récupère l'historique des matchs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum de matchs à retourner
 * @param {string} type - Type de match à filtrer ('solo', 'multiplayer', ou undefined pour tous)
 * @returns {Array} Liste des matchs
 */
export function getUserMatches(userId, limit = 50, type = undefined) {
  const matchIds = userMatches.get(userId) || [];
  let filteredMatches = matchIds
    .map(matchId => matches.get(matchId))
    .filter(Boolean);
  
  // Filtrer par type si spécifié
  if (type === 'solo') {
    filteredMatches = filteredMatches.filter(match => match.type === 'solo');
  } else if (type === 'multiplayer') {
    filteredMatches = filteredMatches.filter(match => match.type !== 'solo');
  }
  
  return filteredMatches
    .slice(-limit) // Prendre les N derniers
    .reverse() // Plus récents en premier
    .map(match => {
      // Trouver les données du joueur dans ce match
      const playerData = match.players.find(p => p.userId === userId);
      return {
        id: match.id,
        type: match.type,
        date: match.date,
        language: match.language,
        wpm: playerData?.wpm || 0,
        accuracy: playerData?.accuracy || 0,
        won: playerData?.won || false,
        opponent: match.players.find(p => p.userId !== userId)?.username || null,
        position: match.type === 'competition' ? playerData?.position : null
      };
    });
}

