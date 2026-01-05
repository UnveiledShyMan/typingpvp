import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncAllRoles } from './services/roleSync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Nécessaire pour gérer les rôles
  ] 
});

// Collection pour stocker les commandes
client.commands = new Collection();

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
    console.log(`✅ Commande chargée: ${command.default.data.name}`);
  } else {
    console.log(`⚠️ Commande ${file} manque "data" ou "execute"`);
  }
}

// Événement ready (utiliser clientReady pour éviter le warning de dépréciation)
client.once('ready', async () => {
  console.log(`✅ Bot connecté: ${client.user.tag}`);
  console.log(`📊 Bot présent sur ${client.guilds.cache.size} serveur(s)`);
  
  // Définir l'activité du bot
  client.user.setActivity('typingpvp.com | /help', { type: 'PLAYING' });
  
  // Enregistrer les commandes slash
  registerCommands();
  
  // Synchroniser les rôles au démarrage (avec gestion d'erreur si l'API n'est pas disponible)
  const guildId = process.env.GUILD_ID;
  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      // Attendre un peu avant de synchroniser pour laisser le temps à l'API de démarrer
      setTimeout(async () => {
        try {
          console.log('🔄 Synchronisation initiale des rôles...');
          await syncAllRoles(client, guild);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  L\'API n\'est pas disponible. La synchronisation des rôles sera réessayée plus tard.');
            console.log('   Assurez-vous que le serveur est démarré sur le port 3001.');
          } else {
            console.error('❌ Erreur lors de la synchronisation des rôles:', error.message);
          }
        }
      }, 2000); // Attendre 2 secondes
      
      // Synchroniser les rôles toutes les 5 minutes
      setInterval(async () => {
        try {
          console.log('🔄 Synchronisation périodique des rôles...');
          await syncAllRoles(client, guild);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  L\'API n\'est pas disponible. Réessai à la prochaine synchronisation.');
          } else {
            console.error('❌ Erreur lors de la synchronisation périodique:', error.message);
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }
});

// Enregistrer les commandes slash
async function registerCommands() {
  const commands = [];
  
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  
  try {
    console.log('🔄 Enregistrement des commandes slash...');
    
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    
    console.log(`✅ ${data.length} commande(s) enregistrée(s) avec succès`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

// Gérer les interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`❌ Commande ${interaction.commandName} non trouvée`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de ${interaction.commandName}:`, error);
    
    const errorMessage = { 
      content: '❌ Une erreur s\'est produite lors de l\'exécution de cette commande !', 
      ephemeral: true 
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Gérer les erreurs
client.on('error', error => {
  console.error('❌ Erreur du client Discord:', error);
});

// Se connecter
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN non défini dans .env');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);

