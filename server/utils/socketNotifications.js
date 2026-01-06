/**
 * Utilitaires pour envoyer des notifications Socket.io depuis les routes
 * Permet aux routes Express d'émettre des événements Socket.io
 */

let ioInstance = null;
let onlineUsersRef = null;

/**
 * Initialise l'instance Socket.io et onlineUsers pour les notifications
 * @param {Server} io - Instance Socket.io
 * @param {Map} onlineUsers - Map des utilisateurs en ligne (Map<userId, Set<socketId>>)
 */
export function initSocketNotifications(io, onlineUsers) {
  ioInstance = io;
  onlineUsersRef = onlineUsers;
}

/**
 * Envoie une notification à un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur cible
 * @param {string} event - Nom de l'événement
 * @param {object} data - Données à envoyer
 */
export function notifyUser(userId, event, data) {
  if (!ioInstance || !onlineUsersRef) {
    // En développement, on peut logger un avertissement
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Socket.io instance or onlineUsers not initialized for notifications');
    }
    return;
  }
  
  // Récupérer tous les sockets de cet utilisateur depuis onlineUsers
  const userSockets = onlineUsersRef.get(userId);
  if (!userSockets || userSockets.size === 0) {
    // Utilisateur hors ligne, pas de notification
    return;
  }
  
  // Envoyer à tous les sockets de l'utilisateur (peut avoir plusieurs onglets)
  userSockets.forEach(socketId => {
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  });
}

/**
 * Envoie une notification de demande d'ami
 * @param {string} targetUserId - ID de l'utilisateur qui reçoit la demande
 * @param {object} requester - Informations de l'utilisateur qui envoie
 */
export function notifyFriendRequest(targetUserId, requester) {
  notifyUser(targetUserId, 'friend-request-received', {
    from: {
      id: requester.id,
      username: requester.username,
      avatar: requester.avatar
    },
    timestamp: Date.now()
  });
}

/**
 * Envoie une notification d'acceptation de demande d'ami
 * @param {string} targetUserId - ID de l'utilisateur qui a envoyé la demande
 * @param {object} accepter - Informations de l'utilisateur qui accepte
 */
export function notifyFriendAccepted(targetUserId, accepter) {
  notifyUser(targetUserId, 'friend-request-accepted', {
    by: {
      id: accepter.id,
      username: accepter.username,
      avatar: accepter.avatar
    },
    timestamp: Date.now()
  });
}

/**
 * Envoie une notification de rejet de demande d'ami
 * @param {string} targetUserId - ID de l'utilisateur qui a envoyé la demande
 * @param {object} rejecter - Informations de l'utilisateur qui rejette
 */
export function notifyFriendRejected(targetUserId, rejecter) {
  notifyUser(targetUserId, 'friend-request-rejected', {
    by: {
      id: rejecter.id,
      username: rejecter.username
    },
    timestamp: Date.now()
  });
}

