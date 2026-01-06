/**
 * Utilitaires pour la navigation vers les profils
 * Utilise maintenant les usernames dans les URLs au lieu des IDs
 */

/**
 * Valide un userId/username et retourne true si valide
 * @param {string|number|null|undefined} identifier - L'ID ou username utilisateur à valider
 * @returns {boolean} True si l'identifiant est valide
 */
export function isValidUserId(identifier) {
  if (!identifier) return false;
  if (identifier === 'null' || identifier === 'undefined') return false;
  if (typeof identifier === 'string' && identifier.trim() === '') return false;
  return true;
}

/**
 * Navigue vers un profil en utilisant le username si disponible, sinon l'ID
 * Cette fonction doit être appelée avec un objet user qui contient username et id
 * @param {Function} navigate - Fonction navigate de react-router-dom
 * @param {string|number|null|undefined} userId - L'ID utilisateur (utilisé si username non disponible)
 * @param {string|undefined} username - Le username de l'utilisateur (prioritaire)
 * @param {Function} onError - Callback optionnel en cas d'erreur
 */
export function navigateToProfile(navigate, userId, username, onError) {
  // Vérifier que navigate est une fonction valide
  if (!navigate || typeof navigate !== 'function') {
    console.error('navigateToProfile: navigate function is not valid');
    if (onError) {
      onError('Navigation function is not valid');
    }
    return false;
  }

  // Si username est fourni et valide, l'utiliser (prioritaire)
  if (username && typeof username === 'string' && username.trim() !== '' && isValidUserId(username)) {
    try {
      navigate(`/profile/${username.trim()}`);
      return true;
    } catch (error) {
      console.error('Error navigating to profile with username:', error);
      if (onError) {
        onError('Navigation error');
      }
      return false;
    }
  }
  
  // Sinon, utiliser userId si valide
  if (isValidUserId(userId)) {
    try {
      // On utilise userId temporairement, Profile.jsx redirigera vers username si disponible
      navigate(`/profile/${userId}`);
      return true;
    } catch (error) {
      console.error('Error navigating to profile with userId:', error);
      if (onError) {
        onError('Navigation error');
      }
      return false;
    }
  }
  
  // Aucun identifiant valide
  console.warn('navigateToProfile: No valid user identifier provided', { userId, username });
  if (onError) {
    onError('Invalid user identifier');
  }
  return false;
}

