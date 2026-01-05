import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { COLORS, CONFIG, EMOJIS } from '../utils/constants.js';
import { removeAllRankRoles } from '../services/roleSync.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Délier votre compte Discord de votre compte typingpvp.com'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const discordId = interaction.user.id;
    
    try {
      // Récupérer les infos du compte lié
      const userResponse = await axios.get(`${CONFIG.API_URL}/api/discord/user/${discordId}`, {
        validateStatus: () => true
      });
      
      if (userResponse.status !== 200) {
        const embed = new EmbedBuilder()
          .setTitle(`${EMOJIS.CROSS} Compte non lié`)
          .setDescription('Votre compte Discord n\'est pas lié à un compte typingpvp.com.')
          .setColor(COLORS.INFO)
          .setThumbnail(CONFIG.LOGO_URL)
          .setFooter({ 
            text: CONFIG.FOOTER_TEXT,
            iconURL: CONFIG.FOOTER_ICON
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      
      // Délier via l'API (nécessite un token, donc on ne peut pas le faire directement depuis Discord)
      // L'utilisateur devra le faire depuis le site
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.INFO} Délier votre compte`)
        .setDescription(`Pour délier votre compte Discord, vous devez le faire depuis votre profil sur [typingpvp.com](${CONFIG.SITE_URL}).`)
        .setColor(COLORS.WARNING)
        .setThumbnail(CONFIG.LOGO_URL)
        .addFields({
          name: `${EMOJIS.INFO} Étapes`,
          value: `1. Connectez-vous sur [typingpvp.com](${CONFIG.SITE_URL})\n2. Allez dans votre profil\n3. Cliquez sur "Délier Discord"\n4. Votre rôle Discord sera automatiquement retiré`
        })
        .setFooter({ 
          text: CONFIG.FOOTER_TEXT,
          iconURL: CONFIG.FOOTER_ICON
        })
        .setTimestamp();
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Aller au profil')
            .setStyle(ButtonStyle.Link)
            .setURL(`${CONFIG.SITE_URL}/profile`)
            .setEmoji(EMOJIS.CHART)
        );
      
      await interaction.editReply({ 
        embeds: [embed],
        components: [row]
      });
      
    } catch (error) {
      console.error('Erreur lors de la vérification du lien:', error);
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.CROSS} Erreur`)
        .setDescription('Une erreur s\'est produite. Veuillez réessayer plus tard.')
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

