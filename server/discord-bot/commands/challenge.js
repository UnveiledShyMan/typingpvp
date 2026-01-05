import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { COLORS, CONFIG, EMOJIS } from '../utils/constants.js';

const LANGUAGE_NAMES = {
  en: '🇬🇧 Anglais',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Espagnol'
};

export default {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Défier un utilisateur en 1v1')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à défier')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Langue du défi')
        .setRequired(false)
        .addChoices(
          { name: 'Anglais', value: 'en' },
          { name: 'Français', value: 'fr' },
          { name: 'Espagnol', value: 'es' }
        )
    ),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const language = interaction.options.getString('language') || 'en';
    const challenger = interaction.user;
    
    // Ne pas se défier soi-même
    if (targetUser.id === challenger.id) {
      await interaction.reply({
        embeds: [{
          title: `${EMOJIS.CROSS} Erreur`,
          description: 'Vous ne pouvez pas vous défier vous-même !',
          color: COLORS.ERROR,
          footer: { text: CONFIG.FOOTER_TEXT, iconURL: CONFIG.FOOTER_ICON }
        }],
        ephemeral: true
      });
      return;
    }
    
    // Ne pas défier un bot
    if (targetUser.bot) {
      await interaction.reply({
        embeds: [{
          title: `${EMOJIS.CROSS} Erreur`,
          description: 'Vous ne pouvez pas défier un bot !',
          color: COLORS.ERROR,
          footer: { text: CONFIG.FOOTER_TEXT, iconURL: CONFIG.FOOTER_ICON }
        }],
        ephemeral: true
      });
      return;
    }
    
    // Essayer de créer une room via l'API
    let roomUrl = null;
    let roomId = null;
    
    try {
      // Optionnel : créer la room automatiquement
      // const response = await axios.post(`${CONFIG.API_URL}/api/battle/create-room`, {
      //   player1: challenger.id,
      //   player2: targetUser.id,
      //   language
      // });
      // roomUrl = response.data.roomUrl;
      // roomId = response.data.roomId;
    } catch (error) {
      console.error('Erreur lors de la création de la room:', error);
    }
    
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${EMOJIS.SWORD} Défi 1v1`,
        iconURL: CONFIG.LOGO_URL
      })
      .setDescription(`${challenger.toString()} a défié ${targetUser.toString()} en combat de frappe !`)
      .setColor(COLORS.PRIMARY)
      .setThumbnail(CONFIG.LOGO_URL)
      .addFields(
        { 
          name: `${EMOJIS.TARGET} Détails du défi`, 
          value: `**Langue:** ${LANGUAGE_NAMES[language] || language.toUpperCase()}\n**Mode:** 1v1 Battle\n**Défieur:** ${challenger.toString()}\n**Défié:** ${targetUser.toString()}`, 
          inline: false 
        },
        {
          name: `${EMOJIS.INFO} Comment accepter ?`,
          value: roomUrl 
            ? `Cliquez sur le bouton ci-dessous pour rejoindre la room !`
            : `Visitez [typingpvp.com](${CONFIG.SITE_URL}) pour créer une room et défier ${targetUser.toString()} !`,
          inline: false
        }
      )
      .setFooter({ 
        text: CONFIG.FOOTER_TEXT,
        iconURL: CONFIG.FOOTER_ICON
      })
      .setTimestamp();
    
    // Créer les boutons si une room a été créée
    const components = [];
    if (roomUrl) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Rejoindre la battle')
            .setStyle(ButtonStyle.Link)
            .setURL(roomUrl)
            .setEmoji(EMOJIS.SWORD),
          new ButtonBuilder()
            .setLabel('Voir le site')
            .setStyle(ButtonStyle.Link)
            .setURL(CONFIG.SITE_URL)
            .setEmoji(EMOJIS.TYPING)
        );
      components.push(row);
    } else {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Créer une room')
            .setStyle(ButtonStyle.Link)
            .setURL(`${CONFIG.SITE_URL}/battle`)
            .setEmoji(EMOJIS.ROCKET)
        );
      components.push(row);
    }
    
    await interaction.reply({
      content: `${targetUser.toString()}, vous avez été défié ! ${EMOJIS.FIRE}`,
      embeds: [embed],
      components: components.length > 0 ? components : undefined
    });
  }
};

