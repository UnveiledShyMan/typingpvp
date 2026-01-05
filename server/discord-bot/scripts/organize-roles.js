/**
 * Script pour réorganiser les rôles dans le bon ordre
 * Les rôles de rang doivent être en haut, suivis des rôles spéciaux
 * 
 * Usage: node scripts/organize-roles.js
 */

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { RANKS, getRankNameForDiscord } from '../utils/constants.js';

dotenv.config();

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ] 
});

client.once('ready', async () => {
  console.log(`✅ Bot connecté: ${client.user.tag}`);
  
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    console.error('❌ GUILD_ID non défini dans .env');
    process.exit(1);
  }
  
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.error('❌ Serveur non trouvé');
    process.exit(1);
  }
  
  console.log(`📋 Réorganisation des rôles sur: ${guild.name}`);
  
  try {
    // Récupérer tous les rôles
    await guild.roles.fetch();
    const allRoles = guild.roles.cache;
    
    // Trouver le rôle @everyone pour connaître la position de base
    const everyoneRole = guild.roles.everyone;
    const basePosition = everyoneRole.position;
    
    // Créer une liste des rôles de rang dans l'ordre (du plus haut au plus bas)
    const rankRoles = [];
    for (const rank of RANKS.reverse()) {
      const rankName = getRankNameForDiscord(rank.threshold);
      const role = allRoles.find(r => r.name === rankName);
      if (role) {
        rankRoles.push(role);
      }
    }
    
    // Rôles spéciaux (à placer après les rôles de rang)
    const specialRoleNames = ['👑 Staff', '🏆 Champion', '⭐ VIP', '🤖 Bot Developer', '🎨 Theme Creator', '🔰 Nouveau'];
    const specialRoles = specialRoleNames
      .map(name => allRoles.find(r => r.name === name))
      .filter(r => r !== undefined);
    
    // Calculer les positions
    // Les rôles de rang doivent être en haut (position élevée)
    // Position de départ: nombre total de rôles - nombre de rôles de rang
    const totalRoles = allRoles.size;
    let currentPosition = totalRoles - rankRoles.length - specialRoles.length;
    
    console.log(`\n📊 Réorganisation des rôles de rang...`);
    for (let i = 0; i < rankRoles.length; i++) {
      const role = rankRoles[i];
      const targetPosition = currentPosition + (rankRoles.length - i);
      
      try {
        if (role.position !== targetPosition) {
          await role.setPosition(targetPosition, { reason: 'Réorganisation automatique des rôles' });
          console.log(`  ✅ ${role.name} → position ${targetPosition}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Délai pour éviter les rate limits
        } else {
          console.log(`  ⏭️  ${role.name} déjà à la bonne position`);
        }
      } catch (error) {
        console.error(`  ❌ Erreur pour ${role.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Réorganisation des rôles spéciaux...`);
    let specialPosition = currentPosition;
    for (const role of specialRoles) {
      try {
        if (role.position !== specialPosition) {
          await role.setPosition(specialPosition, { reason: 'Réorganisation automatique des rôles' });
          console.log(`  ✅ ${role.name} → position ${specialPosition}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`  ⏭️  ${role.name} déjà à la bonne position`);
        }
        specialPosition--;
      } catch (error) {
        console.error(`  ❌ Erreur pour ${role.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Réorganisation terminée !`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    setTimeout(() => {
      client.destroy();
      process.exit(0);
    }, 2000);
  }
});

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN non défini dans .env');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);

