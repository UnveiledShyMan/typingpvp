/**
 * Système ELO Amélioré avec K-Factor Adaptatif
 * 
 * Amélioration du système ELO standard avec :
 * - K-factor variable selon le nombre de matchs (plus élevé pour nouveaux joueurs)
 * - K-factor variable selon le niveau (plus bas pour hauts niveaux)
 * - Meilleure stabilité pour les joueurs expérimentés
 * 
 * C'est un compromis entre ELO simple et Glicko-2 :
 * - Plus simple que Glicko-2 (pas de RD, volatilité)
 * - Plus précis que ELO standard avec K fixe
 * - Facile à implémenter et comprendre
 */

// K-factors selon le nombre de matchs
const K_FACTOR_NEW = 48;      // 0-9 matchs : K élevé pour adaptation rapide
const K_FACTOR_INTERMEDIATE = 32;  // 10-29 matchs : K standard
const K_FACTOR_EXPERIENCED = 24;   // 30+ matchs : K plus bas pour stabilité

// K-factors selon le niveau (MMR)
const K_FACTOR_LOW = 40;      // < 1200 MMR : K élevé
const K_FACTOR_MID = 32;      // 1200-2000 MMR : K standard
const K_FACTOR_HIGH = 24;     // > 2000 MMR : K bas pour stabilité

/**
 * Calcule le K-factor adaptatif selon le nombre de matchs et le MMR
 * @param {number} matchCount - Nombre total de matchs joués
 * @param {number} mmr - MMR actuel du joueur
 * @returns {number} K-factor à utiliser
 */
function getAdaptiveKFactor(matchCount, mmr) {
  // Déterminer K selon le nombre de matchs
  let kByMatchCount;
  if (matchCount < 10) {
    kByMatchCount = K_FACTOR_NEW;
  } else if (matchCount < 30) {
    kByMatchCount = K_FACTOR_INTERMEDIATE;
  } else {
    kByMatchCount = K_FACTOR_EXPERIENCED;
  }

  // Déterminer K selon le niveau
  let kByLevel;
  if (mmr < 1200) {
    kByLevel = K_FACTOR_LOW;
  } else if (mmr < 2000) {
    kByLevel = K_FACTOR_MID;
  } else {
    kByLevel = K_FACTOR_HIGH;
  }

  // Utiliser le minimum des deux pour éviter les changements trop importants
  // Mais privilégier l'adaptation rapide pour nouveaux joueurs
  if (matchCount < 10) {
    return Math.max(kByMatchCount, kByLevel);
  }
  
  return Math.min(kByMatchCount, kByLevel);
}

/**
 * Calcule le nouveau MMR après un match (version améliorée)
 * @param {number} playerMMR - MMR actuel du joueur
 * @param {number} opponentMMR - MMR de l'adversaire
 * @param {boolean} won - true si le joueur a gagné
 * @param {number} matchCount - Nombre total de matchs joués par le joueur
 * @returns {number} Nouveau MMR
 */
export function calculateNewMMR(playerMMR, opponentMMR, won, matchCount = 0) {
  // Probabilité attendue de victoire (formule ELO standard)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  
  // Score réel (1 si gagné, 0 si perdu)
  const actualScore = won ? 1 : 0;
  
  // K-factor adaptatif
  const kFactor = getAdaptiveKFactor(matchCount, playerMMR);
  
  // Calcul du nouveau MMR
  const newMMR = Math.round(playerMMR + kFactor * (actualScore - expectedScore));
  
  // MMR minimum de 0
  return Math.max(0, newMMR);
}

/**
 * Calcule le changement de MMR
 * @param {number} oldMMR - Ancien MMR
 * @param {number} newMMR - Nouveau MMR
 * @returns {number} Changement (peut être négatif)
 */
export function getMMRChange(oldMMR, newMMR) {
  return newMMR - oldMMR;
}

/**
 * Version compatible avec l'ancienne fonction (pour rétrocompatibilité)
 * @param {number} playerMMR - MMR actuel du joueur
 * @param {number} opponentMMR - MMR de l'adversaire
 * @param {boolean} won - true si le joueur a gagné
 * @returns {number} Nouveau MMR
 */
export function calculateNewMMRLegacy(playerMMR, opponentMMR, won) {
  return calculateNewMMR(playerMMR, opponentMMR, won, 0);
}

