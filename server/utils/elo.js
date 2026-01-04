// Système ELO/MMR comme League of Legends
// Basé sur le système ELO standard avec K-factor

const K_FACTOR = 32; // Facteur K standard (peut être ajusté)

/**
 * Calcule le nouveau MMR après un match
 * @param {number} playerMMR - MMR actuel du joueur
 * @param {number} opponentMMR - MMR de l'adversaire
 * @param {boolean} won - true si le joueur a gagné
 * @returns {number} Nouveau MMR
 */
export function calculateNewMMR(playerMMR, opponentMMR, won) {
  // Probabilité attendue de victoire
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  
  // Score réel (1 si gagné, 0 si perdu)
  const actualScore = won ? 1 : 0;
  
  // Calcul du nouveau MMR
  const newMMR = Math.round(playerMMR + K_FACTOR * (actualScore - expectedScore));
  
  // MMR minimum de 0
  return Math.max(0, newMMR);
}

/**
 * Calcule le changement de MMR (+ ou -)
 * @param {number} oldMMR - Ancien MMR
 * @param {number} newMMR - Nouveau MMR
 * @returns {number} Changement (peut être négatif)
 */
export function getMMRChange(oldMMR, newMMR) {
  return newMMR - oldMMR;
}

// Import des nouveaux noms de rangs
export { getRankFromMMR } from './ranks.js';

