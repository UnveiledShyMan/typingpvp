// Service Socket.io centralisé
// Gère une instance unique de socket pour éviter les connexions multiples
import { io } from 'socket.io-client';

/**
 * Détermine l'URL de l'API pour les connexions Socket.io
 * En production, si VITE_API_URL n'est pas défini, on utilise le même domaine
 * En développement, on utilise localhost:3001 par défaut
 */
function getApiUrl() {
  // Si VITE_API_URL est défini explicitement, l'utiliser
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    console.log('🔧 Utilisation de VITE_API_URL:', url);
    return url;
  }
  
  // En production (quand on est sur un domaine réel, pas localhost)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Utiliser le même domaine que le client
    // En production avec Plesk, le serveur backend est généralement sur le même domaine
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Construire l'URL
    let url;
    if (port && port !== '80' && port !== '443' && port !== '') {
      url = `${protocol}//${hostname}:${port}`;
    } else {
      url = `${protocol}//${hostname}`;
    }
    
    console.log('🔧 URL API détectée automatiquement (production):', url);
    return url;
  }
  
  // En développement, utiliser localhost:3001 par défaut
  const devUrl = 'http://localhost:3001';
  console.log('🔧 URL API (développement):', devUrl);
  return devUrl;
}

const API_URL = getApiUrl();

// Instance unique de socket (singleton)
let socketInstance = null;

/**
 * Configuration standardisée pour tous les sockets
 * Utilise polling uniquement pour compatibilité avec Plesk/Apache
 */
const SOCKET_CONFIG = {
  transports: ['polling'], // Forcer polling pour éviter les problèmes avec Plesk
  upgrade: false, // Désactiver l'upgrade vers WebSocket
  reconnection: true,
  reconnectionDelay: 2000, // Augmenter le délai initial de reconnexion
  reconnectionDelayMax: 10000, // Délai maximum entre les tentatives
  reconnectionAttempts: 10, // Augmenter le nombre de tentatives
  // Ne pas forcer une nouvelle connexion par défaut
  // forceNew sera utilisé uniquement quand nécessaire
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
      // Ajouter le path explicitement pour éviter les problèmes de routage
      path: '/socket.io/',
      // Timeouts plus longs en production pour éviter les erreurs "xhr poll error"
      timeout: 45000, // Augmenté à 45 secondes pour correspondre au serveur
      // Ajouter des options supplémentaires pour la stabilité
      autoConnect: true,
      // Forcer explicitement le transport polling dès le début pour éviter "Transport unknown"
      // Ne pas laisser Socket.io négocier d'autres transports
      rememberUpgrade: false, // Ne pas se souvenir des upgrades précédents
      // Options pour améliorer la stabilité du polling
      withCredentials: false // Désactiver les credentials pour éviter les problèmes CORS
      // Note: transports: ['polling'] et upgrade: false sont déjà dans SOCKET_CONFIG
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
      console.error('❌ Erreur de connexion socket:', error.message);
      console.error('URL tentée:', API_URL);
      console.error('Type d\'erreur:', error.type);
      // Si c'est une erreur de transport, ne pas spammer les reconnexions
      if (error.type === 'TransportError' || error.message.includes('xhr poll error')) {
        console.warn('⚠️ Erreur de transport détectée - la reconnexion sera tentée automatiquement');
      }
    });
    
    // Gérer spécifiquement les erreurs de transport
    socketInstance.io.on('error', (error) => {
      if (error.type === 'TransportError' || error.message?.includes('xhr poll error')) {
        console.warn('⚠️ Erreur de transport polling:', error.message);
        console.warn('⚠️ La reconnexion sera tentée automatiquement');
      } else {
        console.error('❌ Erreur Socket.io:', error.message);
      }
    });
    
    // Logger les tentatives de reconnexion
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Tentative de reconnexion #${attemptNumber}`);
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnexion réussie après ${attemptNumber} tentatives`);
    });
    
    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Échec de toutes les tentatives de reconnexion');
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

