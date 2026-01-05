/**
 * Calcul du nouveau MMR (ELO) après un match
 * Utilise la formule standard ELO avec facteur K = 32
 * 
 * @param {number} currentMMR - MMR actuel du joueur
 * @param {number} opponentMMR - MMR de l'adversaire
 * @param {number} result - Résultat : 1 = victoire, 0.5 = égalité, 0 = défaite
 * @param {number} kFactor - Facteur K (défaut: 32)
 * @returns {number} - Nouveau MMR
 * 
 * @example
 * const newMMR = calculateNewMMR(1500, 1600, 1); // Victoire contre joueur plus fort
 */
export function calculateNewMMR(currentMMR, opponentMMR, result, kFactor = 32) {
  // Calculer l'espérance de victoire (expected score)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - currentMMR) / 400));
  
  // Calculer le nouveau MMR
  const newMMR = Math.round(currentMMR + kFactor * (result - expectedScore));
  
  // S'assurer que le MMR ne descend pas en dessous de 0
  return Math.max(0, newMMR);
}

/**
 * Calcule le changement de MMR après un match
 * 
 * @param {number} currentMMR - MMR actuel du joueur
 * @param {number} opponentMMR - MMR de l'adversaire
 * @param {number} result - Résultat : 1 = victoire, 0.5 = égalité, 0 = défaite
 * @param {number} kFactor - Facteur K (défaut: 32)
 * @returns {number} - Changement de MMR (peut être négatif)
 * 
 * @example
 * const change = getMMRChange(1500, 1600, 1); // +25 (gain de 25 points)
 */
export function getMMRChange(currentMMR, opponentMMR, result, kFactor = 32) {
  const newMMR = calculateNewMMR(currentMMR, opponentMMR, result, kFactor);
  return newMMR - currentMMR;
}

