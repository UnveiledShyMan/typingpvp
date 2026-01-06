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

  // Gestion améliorée des erreurs de connexion
  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error.message);
    // Ne pas logger les erreurs de type "xhr poll error" trop fréquemment
    if (!error.message.includes('xhr poll error')) {
      console.error('Connection error details:', {
        type: error.type,
        description: error.description
      });
    }
    
    // Si c'est une erreur 400 (session invalide), forcer une reconnexion
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      console.warn('⚠️ Erreur 400 détectée - Session invalide, forcer reconnexion...');
      // Forcer une nouvelle connexion en réinitialisant le socket
      setTimeout(() => {
        if (!socket.connected) {
          socket.disconnect();
          socket.connect();
        }
      }, 1000);
    }
  });
  
  // Intercepter les erreurs au niveau du socket lui-même
  // Certaines erreurs HTTP peuvent ne pas déclencher connect_error
  socket.on('error', (error) => {
    console.error('❌ Socket.IO socket error:', error);
    // Si erreur 400, forcer reconnexion
    if (error && (error.toString().includes('400') || error.toString().includes('Bad Request'))) {
      console.warn('⚠️ Erreur 400 détectée dans le socket - Forcer reconnexion...');
      if (!socket.connected) {
        socket.disconnect();
        socket.connect();
      }
    }
  });

  // Logger les reconnexions réussies
  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempt(s)`);
  });

  // Logger les tentatives de reconnexion
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}`);
  });

  // Logger les échecs de reconnexion
  socket.on('reconnect_error', (error) => {
    console.error('❌ Socket.IO reconnection error:', error.message);
  });

  // Logger les échecs définitifs de reconnexion
  socket.on('reconnect_failed', () => {
    console.error('❌ Socket.IO reconnection failed after all attempts');
  });

  return socket;
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
  
  // Si le socket existe mais n'est pas connecté, vérifier s'il a une erreur persistante
  if (socketInstance && !socketInstance.connected) {
    // Attendre un peu pour voir si la reconnexion automatique fonctionne
    // Si après 5 secondes il n'est toujours pas connecté, recréer le socket
    setTimeout(() => {
      if (socketInstance && !socketInstance.connected) {
        console.warn('⚠️ Socket non connecté après 5s - Recréation du socket...');
        socketInstance.disconnect();
        socketInstance = null;
        socketInstance = createSocket();
      }
    }, 5000);
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
