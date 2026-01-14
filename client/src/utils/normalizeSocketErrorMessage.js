/**
 * Normalize les erreurs Socket.IO en message lisible.
 * Objectif: éviter les toasts "An error occurred" sans détails.
 */
export function normalizeSocketErrorMessage(error, fallback = 'An error occurred') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const message =
    (typeof error.message === 'string' && error.message.trim()) ||
    (typeof error.msg === 'string' && error.msg.trim()) ||
    (typeof error.error === 'string' && error.error.trim()) ||
    (typeof error.reason === 'string' && error.reason.trim());

  if (message) return message;

  if (typeof error.code === 'string' && error.code.trim()) {
    return `${error.code}: ${fallback}`;
  }

  try {
    const json = JSON.stringify(error);
    if (json && json !== '{}' && json !== '""') return json;
  } catch (stringifyError) {
    // Ignorer si la sérialisation échoue.
  }

  return fallback;
}
