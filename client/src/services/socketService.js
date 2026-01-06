// Service Socket.io centralisé
import { io } from 'socket.io-client';

// Récupérer l'URL de base de l'API
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Si l'URL se termine par /api, on l'enlève pour Socket.IO
if (API_URL.endsWith('/api')) {
  API_URL = API_URL.slice(0, -4);
} else if (API_URL.endsWith('/api/')) {
  API_URL = API_URL.slice(0, -5);
}

/**
 * Crée une nouvelle instance de socket
 */
export function createSocket() {
  const socket = io(API_URL, {
    transports: ['polling'],
    upgrade: false
  });
  
  return socket;
}

/**
 * Obtient ou crée l'instance unique de socket (singleton)
 */
let socketInstance = null;

export function getSocket(forceNew = false) {
  if (forceNew && socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  
  if (!socketInstance) {
    socketInstance = createSocket();
  }
  
  return socketInstance;
}

/**
 * Ferme une connexion socket proprement
 */
export function disconnectSocket(socket) {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  if (socket === socketInstance) {
    socketInstance = null;
  }
}

/**
 * Nettoie tous les listeners d'un socket
 */
export function cleanupSocket(socket, events = []) {
  if (!socket) return;
  
  if (events.length > 0) {
    events.forEach(event => {
      socket.off(event);
    });
  } else {
    socket.removeAllListeners();
  }
}

export default {
  createSocket,
  getSocket,
  disconnectSocket,
  cleanupSocket
};
