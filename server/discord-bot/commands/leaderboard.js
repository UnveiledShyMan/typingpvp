import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { COLORS, CONFIG, EMOJIS, getRankFromMMR } from '../utils/constants.js';

const LANGUAGE_NAMES = {
  en: '🇬🇧 Anglais',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Espagnol'
};

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement des meilleurs joueurs')
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Langue du classement')
        .setRequired(false)
        .addChoices(
          { name: 'Anglais', value: 'en' },
          { name: 'Français', value: 'fr' },
          { name: 'Espagnol', value: 'es' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Nombre de joueurs à afficher (max 20)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const language = interaction.options.getString('language') || 'en';
    const limit = interaction.options.getInteger('limit') || 10;
    
    try {
      const response = await axios.get(`${CONFIG.API_URL}/api/rankings/${language}`, {
        params: { limit },
        validateStatus: () => true
      });
      
      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const rankings = response.data;
      
      if (!rankings || rankings.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(`${EMOJIS.TROPHY} Classement`)
          .setDescription('Aucun joueur dans le classement pour le moment.')
          .setColor(COLORS.INFO)
          .setThumbnail(CONFIG.LOGO_URL)
          .addFields({
            name: `${EMOJIS.ROCKET} Soyez le premier !`,
            value: `Visitez [typingpvp.com](${CONFIG.SITE_URL}) pour commencer à jouer et apparaître dans le classement !`
          })
          .setFooter({ 
            text: CONFIG.FOOTER_TEXT,
            iconURL: CONFIG.FOOTER_ICON
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      
      // Formater le classement avec des emojis et un meilleur formatage
      const leaderboardText = rankings
        .map((player, index) => {
          const medal = index === 0 ? EMOJIS.MEDAL_GOLD : 
                       index === 1 ? EMOJIS.MEDAL_SILVER : 
                       index === 2 ? EMOJIS.MEDAL_BRONZE : 
                       `${index + 1}.`;
          
          const rank = getRankFromMMR(player.mmr || 0);
          const wpm = player.avg_wpm || 0;
          
          return `${medal} **${player.username}**\n\`${player.mmr || 0} MMR\` • \`${wpm} WPM\` • ${rank.name}`;
        })
        .join('\n\n');
      
      // Calculer les stats du top 3
      const top3 = rankings.slice(0, 3);
      const avgMMR = Math.round(rankings.reduce((sum, p) => sum + (p.mmr || 0), 0) / rankings.length);
      const avgWPM = Math.round(rankings.reduce((sum, p) => sum + (p.avg_wpm || 0), 0) / rankings.length);
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.TROPHY} Classement - ${LANGUAGE_NAMES[language] || language.toUpperCase()}`)
        .setDescription(leaderboardText)
        .setColor(COLORS.PRIMARY)
        .setThumbnail(CONFIG.LOGO_URL)
        .addFields({
          name: `${EMOJIS.CHART} Statistiques du classement`,
          value: `**MMR moyen:** ${avgMMR}\n**WPM moyen:** ${avgWPM}\n**Total de joueurs:** ${rankings.length}`,
          inline: true
        })
        .setFooter({ 
          text: `${CONFIG.FOOTER_TEXT} • Top ${limit} joueurs`,
          iconURL: CONFIG.FOOTER_ICON
        })
        .setTimestamp()
        .setURL(`${CONFIG.SITE_URL}/rankings`);
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.CROSS} Erreur`)
        .setDescription('Impossible de récupérer le classement. L\'API est peut-être indisponible.')
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

