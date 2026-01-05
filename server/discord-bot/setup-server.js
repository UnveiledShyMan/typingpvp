import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { RANKS, getRankNameForDiscord, COLORS, CONFIG, EMOJIS } from './utils/constants.js';

dotenv.config();

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ] 
});

// Structure des channels à créer
const serverStructure = [
  {
    category: '📢 INFORMATIONS',
    channels: [
      { name: '📌-règles', type: ChannelType.GuildText },
      { name: '📢-annonces', type: ChannelType.GuildText },
      { name: '🎉-événements', type: ChannelType.GuildText },
      { name: '📊-changelog', type: ChannelType.GuildText }
    ]
  },
  {
    category: '💬 DISCUSSION GÉNÉRALE',
    channels: [
      { name: '💬-général', type: ChannelType.GuildText },
      { name: '🎮-gameplay', type: ChannelType.GuildText },
      { name: '🏆-victoires', type: ChannelType.GuildText },
      { name: '❓-aide', type: ChannelType.GuildText }
    ]
  },
  {
    category: '🎯 MODES DE JEU',
    channels: [
      { name: '⌨️-solo', type: ChannelType.GuildText },
      { name: '🎨-sandbox', type: ChannelType.GuildText },
      { name: '⚔️-1v1', type: ChannelType.GuildText },
      { name: '🎪-competitions', type: ChannelType.GuildText }
    ]
  },
  {
    category: '🤝 COMMUNAUTÉ',
    channels: [
      { name: '👋-présentations', type: ChannelType.GuildText },
      { name: '🎨-créations', type: ChannelType.GuildText },
      { name: '💡-suggestions', type: ChannelType.GuildText },
      { name: '🐛-bugs', type: ChannelType.GuildText }
    ]
  },
  {
    category: '💻 DÉVELOPPEMENT',
    channels: [
      { name: '🤖-bots', type: ChannelType.GuildText },
      { name: '💻-dev', type: ChannelType.GuildText }
    ]
  },
  {
    category: '🎵 DÉTENTE',
    channels: [
      { name: '🎵-musique', type: ChannelType.GuildText },
      { name: '🎬-médias', type: ChannelType.GuildText },
      { name: '🎲-off-topic', type: ChannelType.GuildText }
    ]
  }
];

client.once('ready', async () => {
  console.log(`✅ Bot connecté: ${client.user.tag}`);
  
  // Récupérer le serveur (guild)
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    console.error('❌ GUILD_ID non défini dans .env');
    process.exit(1);
  }
  
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.error('❌ Serveur non trouvé. Vérifiez le GUILD_ID');
    process.exit(1);
  }
  
  console.log(`📋 Configuration du serveur: ${guild.name}`);
  
  try {
    // Vérifier et créer les catégories et channels (éviter les doublons)
    for (const section of serverStructure) {
      console.log(`\n📁 Vérification de la catégorie: ${section.category}`);
      
      // Vérifier si la catégorie existe déjà
      let category = guild.channels.cache.find(
        c => c.name === section.category && c.type === ChannelType.GuildCategory
      );
      
      if (!category) {
        // Créer la catégorie seulement si elle n'existe pas
        category = await guild.channels.create({
          name: section.category,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.SendMessages],
              allow: [PermissionFlagsBits.ViewChannel]
            }
          ]
        });
        console.log(`  ✅ Catégorie créée: ${category.name}`);
      } else {
        console.log(`  ⏭️  Catégorie déjà existante: ${category.name}`);
      }
      
      // Vérifier et créer les channels dans la catégorie
      for (const channelData of section.channels) {
        // Vérifier si le channel existe déjà dans cette catégorie
        const existingChannel = guild.channels.cache.find(
          c => c.name === channelData.name && 
               c.type === channelData.type &&
               c.parentId === category.id
        );
        
        if (!existingChannel) {
          // Créer le channel seulement s'il n'existe pas
          const channel = await guild.channels.create({
            name: channelData.name,
            type: channelData.type,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
              }
            ]
          });
          console.log(`  ✅ Channel créé: ${channel.name}`);
          
          // Petit délai pour éviter les rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log(`  ⏭️  Channel déjà existant: ${channelData.name}`);
        }
      }
    }
    
    // Créer tous les rôles de rang (du plus haut au plus bas pour un meilleur affichage)
    console.log(`\n👥 Création des rôles de rang...`);
    console.log(`   Création de ${RANKS.length} rôles de rang...`);
    
    // Créer les rôles de rang dans l'ordre inverse (du plus haut au plus bas)
    // pour qu'ils s'affichent correctement dans Discord (les rôles créés en dernier apparaissent en haut)
    const ranksToCreate = [...RANKS].reverse();
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const rank of ranksToCreate) {
      const rankName = getRankNameForDiscord(rank.threshold);
      const existingRole = guild.roles.cache.find(r => r.name === rankName);
      
      if (!existingRole) {
        try {
          const role = await guild.roles.create({
            name: rankName,
            color: rank.color,
            hoist: true, // Afficher séparément dans la liste des membres
            mentionable: false,
            reason: 'Rôle de rang créé automatiquement'
          });
          console.log(`  ✅ Rôle créé: ${rankName} (couleur: #${rank.color.toString(16).padStart(6, '0')})`);
          createdCount++;
          await new Promise(resolve => setTimeout(resolve, 600)); // Éviter les rate limits (600ms entre chaque création)
        } catch (error) {
          console.error(`  ❌ Erreur lors de la création du rôle ${rankName}:`, error.message);
        }
      } else {
        console.log(`  ⏭️  Rôle déjà existant: ${rankName}`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Résumé des rôles de rang: ${createdCount} créés, ${skippedCount} déjà existants`);
    
    // Créer les rôles spéciaux (non-rang)
    console.log(`\n👥 Création des rôles spéciaux...`);
    
    const specialRoles = [
      { name: '🏆 Champion', color: 0xFFD700, hoist: true, position: 'high' },
      { name: '⭐ VIP', color: 0x8b5cf6, hoist: true, position: 'high' },
      { name: '🤖 Bot Developer', color: 0x00ff9f, hoist: false, position: 'normal' },
      { name: '🎨 Theme Creator', color: 0xff6b6b, hoist: false, position: 'normal' },
      { name: '👑 Staff', color: 0x8b5cf6, hoist: true, position: 'high' },
      { name: '🔰 Nouveau', color: 0x646669, hoist: false, position: 'normal' }
    ];
    
    for (const roleData of specialRoles) {
      const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
      
      if (!existingRole) {
        try {
          const role = await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist || false,
            mentionable: true,
            reason: 'Rôle spécial créé automatiquement'
          });
          console.log(`  ✅ Rôle créé: ${role.name}`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`  ❌ Erreur lors de la création du rôle ${roleData.name}:`, error.message);
        }
      } else {
        console.log(`  ⏭️  Rôle déjà existant: ${roleData.name}`);
      }
    }
    
    // Configurer le channel règles avec un message (vérifier si un message existe déjà)
    const rulesChannel = guild.channels.cache.find(
      c => c.name === '📌-règles' && c.type === ChannelType.GuildText
    );
    
    if (rulesChannel) {
      const logoUrl = process.env.LOGO_URL || 'https://typingpvp.com/logo.svg';
      
      // Vérifier si un message de règles existe déjà (chercher un message du bot avec "Règles du serveur")
      let rulesMessage = null;
      try {
        const messages = await rulesChannel.messages.fetch({ limit: 10 });
        rulesMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].author?.name?.includes('Règles')
        );
      } catch (error) {
        console.log(`  ⚠️  Impossible de vérifier les messages existants: ${error.message}`);
      }
      
      const rulesEmbed = new EmbedBuilder()
        .setAuthor({ 
          name: '📌 Règles du serveur',
          iconURL: logoUrl
        })
        .setTitle('Bienvenue sur typingpvp.com !')
        .setDescription('Pour maintenir une communauté agréable et respectueuse, veuillez respecter ces règles :')
        .setColor(0x8b5cf6)
        .setThumbnail(logoUrl)
        .addFields(
          {
            name: '1️⃣ Respect mutuel',
            value: 'Soyez respectueux envers tous les membres de la communauté. Aucun harcèlement, discrimination ou comportement toxique ne sera toléré.',
            inline: false
          },
          {
            name: '2️⃣ Pas de spam',
            value: 'Évitez le spam, les messages répétitifs et les liens non sollicités. Gardez les discussions pertinentes.',
            inline: false
          },
          {
            name: '3️⃣ Contenu approprié',
            value: 'Gardez le contenu approprié pour tous les âges. Pas de contenu NSFW, violent ou offensant.',
            inline: false
          },
          {
            name: '4️⃣ Pas de triche',
            value: 'La triche est strictement interdite. Toute tentative de manipulation des scores entraînera un ban permanent.',
            inline: false
          },
          {
            name: '5️⃣ Utilisez les bons channels',
            value: 'Postez dans les channels appropriés. Lisez les descriptions des channels avant de poster.',
            inline: false
          },
          {
            name: '6️⃣ Amusez-vous !',
            value: 'Profitez de la communauté, partagez vos scores, défiez vos amis et améliorez votre vitesse de frappe ! ⌨️',
            inline: false
          }
        )
        .setFooter({ 
          text: 'typingpvp.com - Competitive Typing Battles',
          iconURL: logoUrl
        })
        .setTimestamp();
      
      if (!rulesMessage) {
        // Créer le message seulement s'il n'existe pas
        await rulesChannel.send({ embeds: [rulesEmbed] });
        console.log(`  ✅ Message de règles ajouté`);
      } else {
        // Mettre à jour le message existant
        try {
          await rulesMessage.edit({ embeds: [rulesEmbed] });
          console.log(`  ✅ Message de règles mis à jour`);
        } catch (error) {
          console.log(`  ⚠️  Impossible de mettre à jour le message: ${error.message}`);
        }
      }
    }
    
    // Message de bienvenue dans le channel général (vérifier si un message existe déjà)
    const generalChannel = guild.channels.cache.find(
      c => c.name === '💬-général' && c.type === ChannelType.GuildText
    );
    
    if (generalChannel) {
      const logoUrl = process.env.LOGO_URL || 'https://typingpvp.com/logo.svg';
      const siteUrl = process.env.SITE_URL || 'https://typingpvp.com';
      
      // Vérifier si un message de bienvenue existe déjà
      let welcomeMessage = null;
      try {
        const messages = await generalChannel.messages.fetch({ limit: 10 });
        welcomeMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].author?.name?.includes('Bienvenue')
        );
      } catch (error) {
        console.log(`  ⚠️  Impossible de vérifier les messages existants: ${error.message}`);
      }
      
      const welcomeEmbed = new EmbedBuilder()
        .setAuthor({ 
          name: '🎉 Bienvenue sur typingpvp.com !',
          iconURL: logoUrl
        })
        .setTitle('Serveur Discord Officiel')
        .setDescription(`Bienvenue sur le serveur Discord officiel de **typingpvp.com** ! 🎮\n\nRejoignez une communauté de passionnés de dactylographie et défiez-vous en temps réel !`)
        .setColor(0x8b5cf6)
        .setThumbnail(logoUrl)
        .addFields(
          {
            name: '📋 Démarrage rapide',
            value: `📌 Lisez les règles dans ${rulesChannel ? rulesChannel.toString() : '#📌-règles'}\n💬 Rejoignez la discussion ici !\n🎮 Partagez vos scores dans #🏆-victoires\n❓ Besoin d'aide ? #❓-aide`,
            inline: false
          },
          {
            name: '🎮 Modes de jeu disponibles',
            value: `⌨️ **Solo** - Entraînez-vous seul avec statistiques détaillées\n🎨 **Sandbox** - Mode libre et personnalisable\n⚔️ **1v1** - Défiez vos amis en temps réel\n🎪 **Competitions** - Bientôt disponible !`,
            inline: false
          },
          {
            name: '🤖 Commandes du bot',
            value: `\`/stats\` - Voir vos statistiques détaillées\n\`/leaderboard\` - Voir le classement global\n\`/challenge\` - Défier un joueur en 1v1\n\`/link\` - Lier votre compte Discord\n\`/help\` - Aide et toutes les commandes`,
            inline: false
          },
          {
            name: '🏆 Système de rangs',
            value: `Liez votre compte Discord avec \`/link\` pour obtenir automatiquement votre rôle selon votre MMR !\n\nLes rôles vont de **🌱 Novice IV** à **🔥 Keyboard Destroyer** !`,
            inline: false
          }
        )
        // Pas d'image pour éviter que l'embed soit trop long
        .setFooter({ 
          text: 'typingpvp.com - Competitive Typing Battles',
          iconURL: logoUrl
        })
        .setTimestamp();
      
      if (!welcomeMessage) {
        await generalChannel.send({ embeds: [welcomeEmbed] });
        console.log(`  ✅ Message de bienvenue ajouté`);
      } else {
        try {
          await welcomeMessage.edit({ embeds: [welcomeEmbed] });
          console.log(`  ✅ Message de bienvenue mis à jour`);
        } catch (error) {
          console.log(`  ⚠️  Impossible de mettre à jour le message: ${error.message}`);
        }
      }
    }
    
    // Ajouter un message dans le channel annonces (vérifier si un message existe déjà)
    const announcementsChannel = guild.channels.cache.find(
      c => c.name === '📢-annonces' && c.type === ChannelType.GuildText
    );
    
    if (announcementsChannel) {
      const logoUrl = process.env.LOGO_URL || 'https://typingpvp.com/logo.svg';
      const siteUrl = process.env.SITE_URL || 'https://typingpvp.com';
      
      // Vérifier si un message d'annonces existe déjà
      let announcementMessage = null;
      try {
        const messages = await announcementsChannel.messages.fetch({ limit: 10 });
        announcementMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].author?.name?.includes('Annonces')
        );
      } catch (error) {
        // Ignorer les erreurs de permission
      }
      
      const announcementEmbed = new EmbedBuilder()
        .setAuthor({ 
          name: '📢 Annonces',
          iconURL: logoUrl
        })
        .setTitle('Bienvenue sur typingpvp.com !')
        .setDescription('Ce channel contiendra toutes les annonces importantes concernant le site, les mises à jour, les événements et plus encore !')
        .setColor(0x00ff9f)
        .setThumbnail(logoUrl)
        .addFields({
          name: '🔔 Restez informé',
          value: `Activez les notifications pour ce channel pour ne manquer aucune annonce importante !\n\n[🌐 Visiter le site](${siteUrl})`,
          inline: false
        })
        .setFooter({ 
          text: 'typingpvp.com',
          iconURL: logoUrl
        })
        .setTimestamp();
      
      if (!announcementMessage) {
        await announcementsChannel.send({ embeds: [announcementEmbed] });
        console.log(`  ✅ Message d'annonces ajouté`);
      } else {
        try {
          await announcementMessage.edit({ embeds: [announcementEmbed] });
          console.log(`  ✅ Message d'annonces mis à jour`);
        } catch (error) {
          console.log(`  ⚠️  Impossible de mettre à jour le message: ${error.message}`);
        }
      }
    }
    
    // Ajouter un message dans le channel victoires (vérifier si un message existe déjà)
    const victoriesChannel = guild.channels.cache.find(
      c => c.name === '🏆-victoires' && c.type === ChannelType.GuildText
    );
    
    if (victoriesChannel) {
      const logoUrl = process.env.LOGO_URL || 'https://typingpvp.com/logo.svg';
      
      // Vérifier si un message de victoires existe déjà
      let victoriesMessage = null;
      try {
        const messages = await victoriesChannel.messages.fetch({ limit: 10 });
        victoriesMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].author?.name?.includes('Victoires')
        );
      } catch (error) {
        // Ignorer les erreurs de permission
      }
      
      const victoriesEmbed = new EmbedBuilder()
        .setAuthor({ 
          name: '🏆 Victoires',
          iconURL: logoUrl
        })
        .setTitle('Partagez vos exploits !')
        .setDescription('Ce channel est dédié à la célébration de vos victoires et records !')
        .setColor(0xFFD700)
        .setThumbnail(logoUrl)
        .addFields({
          name: '💬 Partagez vos scores',
          value: `Partagez vos meilleurs scores, vos victoires en 1v1, vos records personnels et plus encore !\n\nUtilisez \`/stats\` pour voir vos statistiques et les partager ici !`,
          inline: false
        })
        .setFooter({ 
          text: 'typingpvp.com',
          iconURL: logoUrl
        })
        .setTimestamp();
      
      if (!victoriesMessage) {
        await victoriesChannel.send({ embeds: [victoriesEmbed] });
        console.log(`  ✅ Message de victoires ajouté`);
      } else {
        try {
          await victoriesMessage.edit({ embeds: [victoriesEmbed] });
          console.log(`  ✅ Message de victoires mis à jour`);
        } catch (error) {
          console.log(`  ⚠️  Impossible de mettre à jour le message: ${error.message}`);
        }
      }
    }
    
    // Ajouter un message dans le channel d'aide (vérifier si un message existe déjà)
    const helpChannel = guild.channels.cache.find(
      c => c.name === '❓-aide' && c.type === ChannelType.GuildText
    );
    
    if (helpChannel) {
      const logoUrl = process.env.LOGO_URL || 'https://typingpvp.com/logo.svg';
      const siteUrl = process.env.SITE_URL || 'https://typingpvp.com';
      
      // Vérifier si un message d'aide existe déjà
      let helpMessage = null;
      try {
        const messages = await helpChannel.messages.fetch({ limit: 10 });
        helpMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].author?.name?.includes('Aide')
        );
      } catch (error) {
        // Ignorer les erreurs de permission
      }
      
      const helpEmbed = new EmbedBuilder()
        .setAuthor({ 
          name: '❓ Aide & Support',
          iconURL: logoUrl
        })
        .setTitle('Besoin d\'aide ?')
        .setDescription('Vous avez une question ? Vous êtes au bon endroit !')
        .setColor(0x00bfff)
        .setThumbnail(logoUrl)
        .addFields(
          {
            name: '🤖 Commandes du bot',
            value: `Utilisez \`/help\` dans n'importe quel channel pour voir toutes les commandes disponibles !`,
            inline: false
          },
          {
            name: '🔗 Liens utiles',
            value: `[🌐 Site web](${siteUrl})\n[📊 Classements](${siteUrl}/rankings)\n[⚔️ 1v1](${siteUrl}/battle)\n[👤 Profil](${siteUrl}/profile)`,
            inline: false
          },
          {
            name: '💡 Questions fréquentes',
            value: `**Comment lier mon compte Discord ?**\nUtilisez \`/link\` avec un code obtenu sur le site.\n\n**Comment obtenir mon rôle de rang ?**\nLiez votre compte avec \`/link\` et votre rôle sera attribué automatiquement selon votre MMR !`,
            inline: false
          }
        )
        .setFooter({ 
          text: 'typingpvp.com',
          iconURL: logoUrl
        })
        .setTimestamp();
      
      if (!helpMessage) {
        await helpChannel.send({ embeds: [helpEmbed] });
        console.log(`  ✅ Message d'aide ajouté`);
      } else {
        try {
          await helpMessage.edit({ embeds: [helpEmbed] });
          console.log(`  ✅ Message d'aide mis à jour`);
        } catch (error) {
          console.log(`  ⚠️  Impossible de mettre à jour le message: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Configuration terminée avec succès !`);
    console.log(`🎉 Votre serveur Discord est maintenant prêt !`);
    console.log(`\n📝 Récapitulatif:`);
    console.log(`   - ${serverStructure.reduce((acc, s) => acc + s.channels.length, 0)} channels créés`);
    console.log(`   - ${RANKS.length} rôles de rang créés`);
    console.log(`   - Messages de bienvenue configurés`);
    console.log(`\n💡 Astuce: Organisez manuellement l'ordre des rôles dans les paramètres du serveur pour un meilleur affichage !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  } finally {
    // Déconnecter le bot après 5 secondes
    setTimeout(() => {
      client.destroy();
      process.exit(0);
    }, 5000);
  }
});

client.on('error', error => {
  console.error('❌ Erreur du client:', error);
});

// Se connecter au bot
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN non défini dans .env');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);

