/**
 * Constantes pour le bot Discord
 * Configuration centralisée pour les couleurs, URLs, etc.
 */

export const COLORS = {
  PRIMARY: 0x8b5cf6,      // Couleur principale (violet)
  SUCCESS: 0x00ff9f,      // Vert pour les succès
  ERROR: 0xff6b6b,        // Rouge pour les erreurs
  WARNING: 0xffa500,      // Orange pour les avertissements
  INFO: 0x646669,         // Gris pour les infos
  GOLD: 0xFFD700,         // Or pour les champions
  SILVER: 0xC0C0C0,       // Argent
  BRONZE: 0xCD7F32        // Bronze
};

export const CONFIG = {
  // URL du site (à adapter selon votre domaine)
  SITE_URL: process.env.SITE_URL || 'https://typingpvp.com',
  // URL du logo (accessible publiquement)
  LOGO_URL: process.env.LOGO_URL || 'https://typingpvp.com/logo.svg',
  // URL de l'API
  API_URL: process.env.API_URL || 'http://localhost:3001',
  // Nom du bot
  BOT_NAME: 'TypingPVP Bot',
  // Footer text
  FOOTER_TEXT: 'typingpvp.com',
  // Footer icon (logo)
  FOOTER_ICON: process.env.LOGO_URL || 'https://typingpvp.com/logo.svg'
};

export const EMOJIS = {
  TYPING: '⌨️',
  TROPHY: '🏆',
  FIRE: '🔥',
  STAR: '⭐',
  ROCKET: '🚀',
  SWORD: '⚔️',
  TARGET: '🎯',
  CHART: '📊',
  CROWN: '👑',
  MEDAL_GOLD: '🥇',
  MEDAL_SILVER: '🥈',
  MEDAL_BRONZE: '🥉',
  CHECK: '✅',
  CROSS: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️'
};

// Import des rangs depuis le serveur (même logique que le site)
// Note: Ces rangs doivent correspondre à server/utils/ranks.js
export const RANKS = [
  { tier: 'Keyboard Destroyer', rank: '', threshold: 2800, color: 0xFFD700, emoji: '🔥' },
  { tier: 'Speed Demon', rank: '', threshold: 2600, color: 0xFF1493, emoji: '⚡' },
  { tier: 'Type Master', rank: '', threshold: 2400, color: 0x9370DB, emoji: '👑' },
  { tier: 'Lightning Fingers', rank: 'I', threshold: 2200, color: 0x00BFFF, emoji: '⚡' },
  { tier: 'Lightning Fingers', rank: 'II', threshold: 2000, color: 0x00BFFF, emoji: '⚡' },
  { tier: 'Lightning Fingers', rank: 'III', threshold: 1800, color: 0x00BFFF, emoji: '⚡' },
  { tier: 'Lightning Fingers', rank: 'IV', threshold: 1700, color: 0x00BFFF, emoji: '⚡' },
  { tier: 'Word Wizard', rank: 'I', threshold: 1600, color: 0x00CED1, emoji: '🧙' },
  { tier: 'Word Wizard', rank: 'II', threshold: 1500, color: 0x00CED1, emoji: '🧙' },
  { tier: 'Word Wizard', rank: 'III', threshold: 1400, color: 0x00CED1, emoji: '🧙' },
  { tier: 'Word Wizard', rank: 'IV', threshold: 1300, color: 0x00CED1, emoji: '🧙' },
  { tier: 'Key Crusher', rank: 'I', threshold: 1200, color: 0xFFD700, emoji: '💥' },
  { tier: 'Key Crusher', rank: 'II', threshold: 1100, color: 0xFFD700, emoji: '💥' },
  { tier: 'Key Crusher', rank: 'III', threshold: 1000, color: 0xFFD700, emoji: '💥' },
  { tier: 'Key Crusher', rank: 'IV', threshold: 900, color: 0xFFD700, emoji: '💥' },
  { tier: 'Fast Typer', rank: 'I', threshold: 800, color: 0xC0C0C0, emoji: '⌨️' },
  { tier: 'Fast Typer', rank: 'II', threshold: 700, color: 0xC0C0C0, emoji: '⌨️' },
  { tier: 'Fast Typer', rank: 'III', threshold: 600, color: 0xC0C0C0, emoji: '⌨️' },
  { tier: 'Fast Typer', rank: 'IV', threshold: 500, color: 0xC0C0C0, emoji: '⌨️' },
  { tier: 'Novice', rank: 'I', threshold: 400, color: 0xCD7F32, emoji: '🌱' },
  { tier: 'Novice', rank: 'II', threshold: 300, color: 0xCD7F32, emoji: '🌱' },
  { tier: 'Novice', rank: 'III', threshold: 200, color: 0xCD7F32, emoji: '🌱' },
  { tier: 'Novice', rank: 'IV', threshold: 0, color: 0xCD7F32, emoji: '🌱' }
];

/**
 * Obtenir le rang d'un joueur selon son MMR (même logique que le site)
 */
export function getRankFromMMR(mmr) {
  for (const rank of RANKS) {
    if (mmr >= rank.threshold) {
      return rank;
    }
  }
  return RANKS[RANKS.length - 1]; // Retourner le rang le plus bas
}

/**
 * Obtenir le nom complet du rang pour Discord (avec emoji)
 */
export function getRankNameForDiscord(mmr) {
  const rank = getRankFromMMR(mmr);
  const rankText = rank.rank ? `${rank.tier} ${rank.rank}` : rank.tier;
  return `${rank.emoji} ${rankText}`;
}

