// Service Socket.io centralisé
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Crée une nouvelle instance de socket
 * Configuration optimisée pour production avec polling forcé et meilleure gestion des erreurs
 */
export function createSocket() {
  const socket = io(API_URL, {
    // Forcer polling pour éviter les problèmes avec Plesk/Apache
    transports: ['polling'],
    upgrade: false,
    // Configuration de reconnexion améliorée
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity, // Essayer indéfiniment de se reconnecter
    // Timeouts alignés avec le serveur (augmentés pour les connexions lentes)
    timeout: 60000, // 60 secondes pour la connexion initiale
    // Améliorer la gestion des erreurs
    forceNew: false, // Réutiliser les connexions existantes
    // Désactiver Engine.IO v3 pour éviter les problèmes
    allowEIO3: false
  });

  // Gestion simplifiée des erreurs - éviter les boucles infinies
  // Socket.IO gère déjà la reconnexion automatique, on ne doit pas forcer de reconnexion manuelle
  socket.on('connect_error', (error) => {
    // Ne logger que les erreurs significatives (pas les erreurs de polling normales)
    if (!error.message.includes('xhr poll error') && !error.message.includes('transport close')) {
      console.error('❌ Socket.IO connection error:', error.message);
    }
    // Ne PAS forcer de reconnexion manuelle - laisser Socket.IO gérer
  });

  // Logger les reconnexions réussies
  socket.on('reconnect', (attemptNumber) => {
    if (attemptNumber > 1) {
      console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempt(s)`);
    }
  });

  // Logger les tentatives de reconnexion (seulement après la première)
  socket.on('reconnect_attempt', (attemptNumber) => {
    if (attemptNumber > 3) {
      console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}`);
    }
  });

  return socket;
}

/**
 * Obtient ou crée l'instance unique de socket (singleton)
 * Pour maintenir la compatibilité avec le code existant
 */
let socketInstance = null;

export function getSocket(forceNew = false) {
  // Si on force une nouvelle connexion, déconnecter l'ancienne
  if (forceNew && socketInstance) {
    socketInstance.removeAllListeners(); // Nettoyer tous les listeners avant de déconnecter
    socketInstance.disconnect();
    socketInstance = null;
  }
  
  // Créer le socket s'il n'existe pas
  // Ne PAS recréer s'il existe déjà mais n'est pas connecté - laisser Socket.IO gérer la reconnexion
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

