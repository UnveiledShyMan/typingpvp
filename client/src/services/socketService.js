// Service Socket.io centralisé
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Crée une nouvelle instance de socket
 * Utilise polling pour compatibilité avec Plesk/nginx reverse proxy
 */
export function createSocket() {
  return io(API_URL, {
    transports: ['polling'], // Utiliser polling au lieu de websocket pour Plesk
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}

/**
 * Ferme une connexion socket proprement
 */
export function disconnectSocket(socket) {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Nettoie tous les listeners d'un socket
 */
export function cleanupSocket(socket, events = []) {
  if (!socket) return;
  
  events.forEach(event => {
    socket.off(event);
  });
}

export default {
  createSocket,
  disconnectSocket,
  cleanupSocket,
};

