import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { COLORS, CONFIG, EMOJIS, getRankFromMMR } from '../utils/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques de typing d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à vérifier (optionnel)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
      // Essayer de récupérer les stats depuis l'API
      const response = await axios.get(`${CONFIG.API_URL}/api/users/${targetUser.id}/stats`, {
        validateStatus: () => true
      });
      
      if (response.status === 404) {
        const embed = new EmbedBuilder()
          .setTitle(`${EMOJIS.CHART} Stats de ${targetUser.username}`)
          .setDescription('Cet utilisateur n\'a pas encore de compte sur typingpvp.com')
          .setColor(COLORS.INFO)
          .setThumbnail(CONFIG.LOGO_URL)
          .addFields({
            name: `${EMOJIS.INFO} Comment commencer ?`,
            value: `Visitez [typingpvp.com](${CONFIG.SITE_URL}) pour créer un compte et commencer à améliorer votre vitesse de frappe !`
          })
          .setFooter({ 
            text: CONFIG.FOOTER_TEXT,
            iconURL: CONFIG.FOOTER_ICON
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      
      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const stats = response.data;
      const mmr = stats.mmr || 0;
      const rank = getRankFromMMR(mmr);
      const winRate = stats.gamesPlayed > 0 
        ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
        : 0;
      
      // Calculer le meilleur score
      const bestWpm = stats.bestWpm || stats.avgWpm || 0;
      
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: `${EMOJIS.CHART} Statistiques de ${targetUser.username}`,
          iconURL: targetUser.displayAvatarURL({ dynamic: true })
        })
        .setColor(rank.color)
        .setThumbnail(CONFIG.LOGO_URL)
        .setDescription(`${rank.name} - ${mmr} MMR`)
        .addFields(
          { 
            name: `${EMOJIS.FIRE} Performance`, 
            value: `**WPM Moyen:** ${stats.avgWpm || 0}\n**Meilleur WPM:** ${bestWpm}\n**Précision:** ${stats.accuracy || 0}%`, 
            inline: true 
          },
          { 
            name: `${EMOJIS.TROPHY} Classement`, 
            value: `**Rang:** #${stats.rank || 'N/A'}\n**MMR:** ${mmr}\n**Tier:** ${rank.name}`, 
            inline: true 
          },
          { 
            name: `${EMOJIS.SWORD} Batailles`, 
            value: `**Parties:** ${stats.gamesPlayed || 0}\n**Victoires:** ${stats.wins || 0}\n**Taux de victoire:** ${winRate}%`, 
            inline: true 
          }
        )
        .setFooter({ 
          text: `${CONFIG.FOOTER_TEXT} • Profil de ${targetUser.username}`,
          iconURL: CONFIG.FOOTER_ICON
        })
        .setTimestamp();
      
      // Ajouter un lien vers le profil si disponible
      if (stats.profileUrl) {
        embed.setURL(stats.profileUrl);
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.CROSS} Erreur`)
        .setDescription('Impossible de récupérer les statistiques. L\'API est peut-être indisponible.')
        .setColor(COLORS.ERROR)
        .setThumbnail(CONFIG.LOGO_URL)
        .setFooter({ 
          text: CONFIG.FOOTER_TEXT,
          iconURL: CONFIG.FOOTER_ICON
        })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
  }
};

