import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { COLORS, CONFIG, EMOJIS } from '../utils/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Lier votre compte Discord à votre compte typingpvp.com')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Code de vérification obtenu sur le site')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const code = interaction.options.getString('code');
    const discordId = interaction.user.id;
    const discordUsername = interaction.user.username;
    
    try {
      // Vérifier le code via l'API
      const response = await axios.post(`${CONFIG.API_URL}/api/discord/verify-code`, {
        discordId,
        verificationCode: code
      }, {
        validateStatus: () => true
      });
      
      if (response.status !== 200) {
        const embed = new EmbedBuilder()
          .setTitle(`${EMOJIS.CROSS} Erreur de liaison`)
          .setDescription(response.data.error || 'Code de vérification invalide ou expiré.')
          .setColor(COLORS.ERROR)
          .setThumbnail(CONFIG.LOGO_URL)
          .addFields({
            name: `${EMOJIS.INFO} Comment obtenir un code ?`,
            value: `1. Connectez-vous sur [typingpvp.com](${CONFIG.SITE_URL})\n2. Allez dans votre profil\n3. Cliquez sur "Lier Discord"\n4. Copiez le code et utilisez-le ici !`
          })
          .setFooter({ 
            text: CONFIG.FOOTER_TEXT,
            iconURL: CONFIG.FOOTER_ICON
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      
      const { userId, username, mmr } = response.data;
      
      // Mettre à jour les rôles (sera fait par le service de synchronisation)
      // Pour l'instant, on confirme juste la liaison
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.CHECK} Compte lié avec succès !`)
        .setDescription(`Votre compte Discord est maintenant lié à **${username}** sur typingpvp.com`)
        .setColor(COLORS.SUCCESS)
        .setThumbnail(CONFIG.LOGO_URL)
        .addFields(
          {
            name: `${EMOJIS.CHART} Vos statistiques`,
            value: `**MMR:** ${mmr}\n**Compte:** ${username}`,
            inline: true
          },
          {
            name: `${EMOJIS.INFO} Prochaines étapes`,
            value: `Votre rôle Discord sera mis à jour automatiquement selon votre MMR. Les mises à jour se font toutes les 5 minutes.`,
            inline: false
          }
        )
        .setFooter({ 
          text: CONFIG.FOOTER_TEXT,
          iconURL: CONFIG.FOOTER_ICON
        })
        .setTimestamp();
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Voir mon profil')
            .setStyle(ButtonStyle.Link)
            .setURL(`${CONFIG.SITE_URL}/profile/${userId}`)
            .setEmoji(EMOJIS.CHART)
        );
      
      await interaction.editReply({ 
        embeds: [embed],
        components: [row]
      });
      
    } catch (error) {
      console.error('Erreur lors de la liaison:', error);
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.CROSS} Erreur`)
        .setDescription('Une erreur s\'est produite lors de la liaison. Veuillez réessayer plus tard.')
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

