/**
 * Service de synchronisation des rôles Discord avec les rangs du site
 * Met à jour automatiquement les rôles Discord selon le MMR des joueurs
 */

import axios from 'axios';
import { CONFIG, getRankFromMMR, getRankNameForDiscord } from '../utils/constants.js';

/**
 * Synchronise les rôles Discord pour tous les utilisateurs liés
 * @param {Client} client - Client Discord
 * @param {Guild} guild - Serveur Discord
 */
export async function syncAllRoles(client, guild) {
  try {
    // Récupérer tous les utilisateurs liés depuis l'API
    const response = await axios.get(`${CONFIG.API_URL}/api/discord/linked-users`, {
      validateStatus: () => true,
      timeout: 5000 // Timeout de 5 secondes
    });
    
    if (response.status !== 200) {
      if (response.status === 0 || response.code === 'ECONNREFUSED') {
        throw new Error('API non disponible');
      }
      console.error(`Erreur HTTP ${response.status} lors de la récupération des utilisateurs liés`);
      return;
    }
    
    const linkedUsers = response.data;
    
    if (!Array.isArray(linkedUsers)) {
      console.error('Réponse API invalide: attendu un tableau');
      return;
    }
    
    // Créer/mettre à jour les rôles de rang si nécessaire
    await ensureRankRoles(guild);
    
    // Synchroniser chaque utilisateur
    for (const user of linkedUsers) {
      await syncUserRole(guild, user);
    }
    
    console.log(`✅ Synchronisation des rôles terminée pour ${linkedUsers.length} utilisateur(s)`);
  } catch (error) {
    // Relancer l'erreur pour que l'appelant puisse la gérer
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      throw error; // Relancer pour gestion spécifique dans index.js
    }
    console.error('Erreur lors de la synchronisation des rôles:', error.message || error);
    throw error;
  }
}

/**
 * Synchronise le rôle d'un utilisateur spécifique
 * @param {Guild} guild - Serveur Discord
 * @param {Object} user - Utilisateur avec discordId et mmr
 */
export async function syncUserRole(guild, user) {
  try {
    const member = await guild.members.fetch(user.discordId).catch(() => null);
    if (!member) {
      console.log(`Utilisateur ${user.discordId} non trouvé sur le serveur`);
      return;
    }
    
    const mmr = user.mmr || 1000;
    const rank = getRankFromMMR(mmr);
    const rankRoleName = getRankNameForDiscord(mmr);
    
    // Trouver ou créer le rôle correspondant
    let rankRole = guild.roles.cache.find(r => r.name === rankRoleName);
    
    if (!rankRole) {
      rankRole = await guild.roles.create({
        name: rankRoleName,
        color: rank.color,
        mentionable: false,
        hoist: true, // Afficher séparément dans la liste des membres
        reason: 'Rôle de rang créé automatiquement'
      });
      console.log(`✅ Rôle créé: ${rankRoleName}`);
    }
    
    // Retirer tous les autres rôles de rang
    const allRankRoles = guild.roles.cache.filter(r => {
      // Vérifier si le rôle correspond à un rang
      return RANKS.some(rank => {
        const rankName = getRankNameForDiscord(rank.threshold);
        return r.name === rankName;
      });
    });
    
    for (const role of allRankRoles.values()) {
      if (member.roles.cache.has(role.id) && role.id !== rankRole.id) {
        await member.roles.remove(role, 'Mise à jour du rang');
      }
    }
    
    // Ajouter le nouveau rôle si l'utilisateur ne l'a pas déjà
    if (!member.roles.cache.has(rankRole.id)) {
      await member.roles.add(rankRole, 'Mise à jour du rang');
      console.log(`✅ Rôle ${rankRoleName} attribué à ${member.user.username}`);
    }
    
  } catch (error) {
    console.error(`Erreur lors de la synchronisation du rôle pour ${user.discordId}:`, error);
  }
}

/**
 * S'assure que tous les rôles de rang existent sur le serveur
 * @param {Guild} guild - Serveur Discord
 */
async function ensureRankRoles(guild) {
  const { RANKS } = await import('../utils/constants.js');
  
  for (const rank of RANKS) {
    const rankName = getRankNameForDiscord(rank.threshold);
    const existingRole = guild.roles.cache.find(r => r.name === rankName);
    
    if (!existingRole) {
      await guild.roles.create({
        name: rankName,
        color: rank.color,
        mentionable: false,
        hoist: true,
        reason: 'Rôle de rang créé automatiquement'
      });
      console.log(`✅ Rôle créé: ${rankName}`);
    }
  }
}

/**
 * Retire tous les rôles de rang d'un utilisateur
 * @param {Guild} guild - Serveur Discord
 * @param {string} discordId - ID Discord de l'utilisateur
 */
export async function removeAllRankRoles(guild, discordId) {
  try {
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return;
    
    const allRankRoles = guild.roles.cache.filter(r => {
      return RANKS.some(rank => {
        const rankName = getRankNameForDiscord(rank.threshold);
        return r.name === rankName;
      });
    });
    
    for (const role of allRankRoles.values()) {
      if (member.roles.cache.has(role.id)) {
        try {
          await member.roles.remove(role, 'Déliage du compte');
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Erreur lors du retrait du rôle ${role.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du retrait des rôles pour ${discordId}:`, error);
  }
}

