/**
 * Logger conditionnel pour le serveur
 * - En développement : affiche tous les logs (console.log, console.error, etc.)
 * - En production : n'affiche que les erreurs critiques
 * 
 * Utilisation :
 *   import logger from './utils/logger.js';
 *   logger.info('Message informatif');
 *   logger.error('Message d\'erreur');
 *   logger.debug('Message de debug (seulement en dev)');
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  /**
   * Log informatif (toujours affiché)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log d'erreur (toujours affiché, même en production)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log de debug (seulement en développement)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log d'avertissement (toujours affiché)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    } else {
      // En production, on log aussi les warnings mais de manière moins verbeuse
      console.error('[WARN]', ...args);
    }
  },

  /**
   * Log de succès (seulement en développement)
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  }
};

export default logger;

