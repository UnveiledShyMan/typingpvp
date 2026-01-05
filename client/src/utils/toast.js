/**
 * Utilitaire global pour afficher des toasts
 * Peut être utilisé depuis n'importe où dans l'application
 */

let toastHandler = null;

export function setToastHandler(handler) {
  toastHandler = handler;
}

export function showToast(message, type = 'info', duration = 4000) {
  if (toastHandler) {
    return toastHandler(message, type, duration);
  } else {
    // Fallback vers alert si le handler n'est pas encore initialisé
    console.warn('Toast handler not initialized, using alert fallback');
    alert(message);
  }
}

// Fonctions de convenance
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
};

