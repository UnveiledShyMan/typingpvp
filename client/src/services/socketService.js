// Service Socket.io centralisé
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Crée une nouvelle instance de socket
 * Configuration par défaut (comme avant - version 3404b51)
 */
export function createSocket() {
  return io(API_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}

/**
 * Obtient ou crée l'instance unique de socket (singleton)
 * Pour maintenir la compatibilité avec le code existant
 */
let socketInstance = null;

export function getSocket(forceNew = false) {
  if (forceNew && socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  
  if (!socketInstance || !socketInstance.connected) {
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

/**
 * Vérifie si le socket principal est connecté
 */
export function isSocketConnected() {
  return socketInstance && socketInstance.connected;
}

export default {
  createSocket,
  getSocket,
  disconnectSocket,
  cleanupSocket,
  isSocketConnected,
};
