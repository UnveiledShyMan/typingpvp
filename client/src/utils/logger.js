/**
 * Logger utilitaire pour remplacer console.log
 * En production, les logs sont désactivés sauf les erreurs
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  
  error: (...args) => {
    // Toujours logger les erreurs, même en production
    console.error('[ERROR]', ...args);
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export default logger;

