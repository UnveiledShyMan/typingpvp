/**
 * Utilitaires pour la navigation vers les profils
 * Valide les IDs et gère les cas d'erreur
 */

/**
 * Valide un userId et retourne true si valide
 * @param {string|number|null|undefined} userId - L'ID utilisateur à valider
 * @returns {boolean} True si l'ID est valide
 */
export function isValidUserId(userId) {
  if (!userId) return false;
  if (userId === 'null' || userId === 'undefined') return false;
  if (typeof userId === 'string' && userId.trim() === '') return false;
  return true;
}

/**
 * Navigue vers un profil si l'ID est valide
 * @param {Function} navigate - Fonction navigate de react-router-dom
 * @param {string|number|null|undefined} userId - L'ID utilisateur
 * @param {Function} onError - Callback optionnel en cas d'erreur
 */
export function navigateToProfile(navigate, userId, onError) {
  if (!isValidUserId(userId)) {
    if (onError) {
      onError('Invalid user ID');
    }
    return false;
  }
  
  navigate(`/profile/${userId}`);
  return true;
}

