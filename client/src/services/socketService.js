// Service Socket.io centralisé
// Gère une instance unique de socket pour éviter les connexions multiples
import { io } from 'socket.io-client';

// URL API - version simple qui fonctionnait
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Instance unique de socket (singleton)
let socketInstance = null;

/**
 * Configuration standardisée pour tous les sockets
 * Utilise polling uniquement pour compatibilité avec Plesk/Apache
 */
// Configuration Socket.io simplifiée
const SOCKET_CONFIG = {
  transports: ['polling'],
  upgrade: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
};

/**
 * Obtient ou crée l'instance unique de socket
 * @param {boolean} forceNew - Si true, crée une nouvelle connexion même si une existe déjà
 * @returns {Socket} Instance de socket
 */
export function getSocket(forceNew = false) {
  // Si on force une nouvelle connexion, fermer l'ancienne d'abord
  if (forceNew && socketInstance) {
    console.log('🔄 Fermeture de la connexion socket existante pour créer une nouvelle');
    socketInstance.disconnect();
    socketInstance = null;
  }
  
  // Si aucune instance n'existe ou si elle n'est pas connectée, en créer une
  if (!socketInstance || !socketInstance.connected) {
    console.log('🔌 Création d\'une nouvelle connexion socket vers:', API_URL);
    socketInstance = io(API_URL, {
      ...SOCKET_CONFIG,
      forceNew: forceNew,
      autoConnect: true
    });
    
    // Ajouter des listeners pour le debugging
    socketInstance.on('connect', () => {
      console.log('✅ Socket connecté:', socketInstance.id, 'URL:', API_URL);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ Socket déconnecté:', reason);
      // Ne pas réinitialiser socketInstance ici car la reconnexion automatique va essayer
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Erreur connexion socket:', error.message);
    });
  }
  
  return socketInstance;
}

/**
 * Crée une nouvelle instance de socket (pour cas spéciaux)
 * À utiliser uniquement quand vous avez besoin d'une connexion séparée
 * @returns {Socket} Nouvelle instance de socket
 */
export function createSocket() {
  console.log('🔌 Création d\'une nouvelle instance de socket (non partagée)');
  return io(API_URL, SOCKET_CONFIG);
}

/**
 * Ferme la connexion socket principale proprement
 */
export function disconnectSocket() {
  if (socketInstance && socketInstance.connected) {
    console.log('🔌 Fermeture de la connexion socket principale');
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Nettoie tous les listeners d'un socket
 * @param {Socket} socket - Instance de socket à nettoyer
 * @param {string[]} events - Liste des événements à retirer
 */
export function cleanupSocket(socket, events = []) {
  if (!socket) return;
  
  if (events.length > 0) {
    // Retirer des événements spécifiques
    events.forEach(event => {
      socket.off(event);
    });
  } else {
    // Si aucun événement spécifié, retirer tous les listeners
    socket.removeAllListeners();
  }
}

/**
 * Vérifie si le socket principal est connecté
 * @returns {boolean} True si connecté
 */
export function isSocketConnected() {
  return socketInstance && socketInstance.connected;
}

export default {
  getSocket,
  createSocket,
  disconnectSocket,
  cleanupSocket,
  isSocketConnected,
};

