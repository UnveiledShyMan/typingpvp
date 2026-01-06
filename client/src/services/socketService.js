// Service Socket.io centralisé
import { io } from 'socket.io-client';

// Récupérer l'URL de base de l'API
// IMPORTANT: Socket.IO utilise le path par défaut /socket.io/, donc l'URL ne doit PAS inclure /api
// Si VITE_API_URL contient /api, on doit l'enlever pour Socket.IO
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Si l'URL se termine par /api, on l'enlève pour Socket.IO
// Socket.IO se connectera à la racine du serveur, pas à /api/socket.io
if (API_URL.endsWith('/api')) {
  API_URL = API_URL.slice(0, -4); // Enlever '/api'
} else if (API_URL.endsWith('/api/')) {
  API_URL = API_URL.slice(0, -5); // Enlever '/api/'
}

// Logger l'URL utilisée pour Socket.IO (uniquement en développement)
if (import.meta.env.DEV) {
  console.log('🔌 Socket.IO URL:', API_URL);
  console.log('🔌 Socket.IO path:', '/socket.io/');
}

/**
 * Crée une nouvelle instance de socket
 * Configuration optimisée pour production avec polling forcé et meilleure gestion des erreurs
 */
export function createSocket() {
  // Forcer explicitement le path Socket.IO pour éviter toute confusion
  const socket = io(API_URL, {
    // Forcer polling pour éviter les problèmes avec Plesk/Apache
    transports: ['polling'],
    upgrade: false,
    // IMPORTANT: Forcer explicitement le path Socket.IO pour éviter /api/socket.io
    path: '/socket.io/',
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
  
  // Logger la configuration pour debug
  console.log('🔌 Socket.IO créé avec:', {
    url: API_URL,
    path: '/socket.io/',
    socketId: socket.id || 'connecting...'
  });

  // Logger les connexions réussies
  socket.on('connect', () => {
    console.log('✅ Socket.IO connecté:', {
      socketId: socket.id,
      url: API_URL,
      path: '/socket.io/'
    });
  });

  // Gestion simplifiée des erreurs - éviter les boucles infinies
  // Socket.IO gère déjà la reconnexion automatique, on ne doit pas forcer de reconnexion manuelle
  socket.on('connect_error', (error) => {
    // Logger toutes les erreurs pour debug en production
    console.error('❌ Socket.IO connection error:', {
      message: error.message,
      type: error.type,
      description: error.description,
      url: API_URL,
      path: '/socket.io/'
    });
    // Ne PAS forcer de reconnexion manuelle - laisser Socket.IO gérer
  });

  // Logger les reconnexions réussies
  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempt(s)`, {
      socketId: socket.id,
      url: API_URL,
      path: '/socket.io/'
    });
  });

  // Logger les tentatives de reconnexion
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}`, {
      url: API_URL,
      path: '/socket.io/',
      timestamp: new Date().toISOString()
    });
  });
  
  // Logger les déconnexions pour comprendre pourquoi les sessions expirent
  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket.IO disconnected:', {
      reason: reason,
      socketId: socket.id,
      url: API_URL,
      path: '/socket.io/',
      timestamp: new Date().toISOString()
    });
    
    // Si la déconnexion est due à une erreur 400 (session invalide), forcer une nouvelle connexion
    if (reason === 'transport close' || reason === 'ping timeout') {
      console.warn('💡 Déconnexion due à un problème de transport - Socket.IO va tenter de se reconnecter automatiquement');
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

