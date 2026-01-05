import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, CONFIG, EMOJIS } from '../utils/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche l\'aide et les commandes disponibles'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${EMOJIS.INFO} Aide - TypingPVP Bot`,
        iconURL: CONFIG.LOGO_URL
      })
      .setTitle('Commandes disponibles')
      .setDescription('Voici toutes les commandes disponibles pour interagir avec le bot TypingPVP :')
      .setColor(COLORS.PRIMARY)
      .setThumbnail(CONFIG.LOGO_URL)
      .addFields(
        {
          name: `${EMOJIS.CHART} /stats [user]`,
          value: 'Affiche les statistiques de typing d\'un utilisateur (WPM, MMR, rang, etc.)',
          inline: false
        },
        {
          name: `${EMOJIS.TROPHY} /leaderboard [language] [limit]`,
          value: 'Affiche le classement des meilleurs joueurs. Vous pouvez filtrer par langue et limiter le nombre de résultats.',
          inline: false
        },
        {
          name: `${EMOJIS.SWORD} /challenge <user> [language]`,
          value: 'Défie un utilisateur en 1v1. Vous pouvez spécifier la langue du défi.',
          inline: false
        },
        {
          name: `${EMOJIS.INFO} /help`,
          value: 'Affiche ce message d\'aide avec toutes les commandes disponibles.',
          inline: false
        }
      )
      .addFields({
        name: `${EMOJIS.ROCKET} Liens utiles`,
        value: `[Site web](${CONFIG.SITE_URL}) • [Créer un compte](${CONFIG.SITE_URL}/register) • [Classements](${CONFIG.SITE_URL}/rankings)`,
        inline: false
      })
      .setFooter({ 
        text: `${CONFIG.FOOTER_TEXT} • Besoin d'aide ? Rejoignez notre Discord !`,
        iconURL: CONFIG.FOOTER_ICON
      })
      .setTimestamp();
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Visiter le site')
          .setStyle(ButtonStyle.Link)
          .setURL(CONFIG.SITE_URL)
          .setEmoji(EMOJIS.TYPING),
        new ButtonBuilder()
          .setLabel('Créer un compte')
          .setStyle(ButtonStyle.Link)
          .setURL(`${CONFIG.SITE_URL}/register`)
          .setEmoji(EMOJIS.ROCKET)
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};

