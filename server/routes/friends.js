import express from 'express';
import { getUserById, getUserByUsername, getAllUsers } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Référence à onlineUsers sera injectée depuis index.js
let onlineUsersRef = null;
export function setOnlineUsers(onlineUsers) {
  onlineUsersRef = onlineUsers;
}

function isUserOnline(userId) {
  if (!onlineUsersRef) return false;
  return onlineUsersRef.has(userId) && onlineUsersRef.get(userId).size > 0;
}

// Obtenir la liste d'amis
router.get('/', authenticateToken, (req, res) => {
  const user = req.user;
  
  if (!user.friends || user.friends.length === 0) {
    return res.json({ friends: [] });
  }
  
  const friends = user.friends
    .map(friendId => getUserById(friendId))
    .filter(friend => friend !== undefined)
    .map(friend => ({
      id: friend.id,
      username: friend.username,
      avatar: friend.avatar,
      mmr: friend.mmr,
      stats: friend.stats,
      isOnline: isUserOnline(friend.id)
    }));
  
  res.json({ friends });
});

// Obtenir les demandes d'amis
router.get('/requests', authenticateToken, (req, res) => {
  const user = req.user;
  
  const sent = (user.friendRequests?.sent || [])
    .map(userId => getUserById(userId))
    .filter(u => u !== undefined)
    .map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar
    }));
  
  const received = (user.friendRequests?.received || [])
    .map(userId => getUserById(userId))
    .filter(u => u !== undefined)
    .map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar
    }));
  
  res.json({ sent, received });
});

// Envoyer une demande d'ami
router.post('/request/:userId', authenticateToken, (req, res) => {
  const currentUser = req.user;
  const targetUserId = req.params.userId;
  
  if (currentUser.id === targetUserId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }
  
  const targetUser = getUserById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Vérifier si déjà amis
  if (currentUser.friends && currentUser.friends.includes(targetUserId)) {
    return res.status(400).json({ error: 'Already friends' });
  }
  
  // Vérifier si une demande existe déjà
  if (currentUser.friendRequests?.sent?.includes(targetUserId)) {
    return res.status(400).json({ error: 'Friend request already sent' });
  }
  
  // Initialiser les structures si elles n'existent pas
  if (!currentUser.friendRequests) {
    currentUser.friendRequests = { sent: [], received: [] };
  }
  if (!targetUser.friendRequests) {
    targetUser.friendRequests = { sent: [], received: [] };
  }
  if (!currentUser.friends) {
    currentUser.friends = [];
  }
  if (!targetUser.friends) {
    targetUser.friends = [];
  }
  
  // Ajouter la demande
  if (!currentUser.friendRequests.sent.includes(targetUserId)) {
    currentUser.friendRequests.sent.push(targetUserId);
  }
  if (!targetUser.friendRequests.received.includes(currentUser.id)) {
    targetUser.friendRequests.received.push(currentUser.id);
  }
  
  res.json({ message: 'Friend request sent', user: {
    id: targetUser.id,
    username: targetUser.username,
    avatar: targetUser.avatar
  }});
});

// Accepter une demande d'ami
router.post('/accept/:userId', authenticateToken, (req, res) => {
  const currentUser = req.user;
  const senderUserId = req.params.userId;
  
  const senderUser = getUserById(senderUserId);
  if (!senderUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Vérifier si la demande existe
  if (!currentUser.friendRequests?.received?.includes(senderUserId)) {
    return res.status(400).json({ error: 'Friend request not found' });
  }
  
  // Initialiser les structures si nécessaire
  if (!currentUser.friends) {
    currentUser.friends = [];
  }
  if (!senderUser.friends) {
    senderUser.friends = [];
  }
  
  // Ajouter comme amis
  if (!currentUser.friends.includes(senderUserId)) {
    currentUser.friends.push(senderUserId);
  }
  if (!senderUser.friends.includes(currentUser.id)) {
    senderUser.friends.push(currentUser.id);
  }
  
  // Retirer des demandes
  if (currentUser.friendRequests) {
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => id !== senderUserId);
    currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(id => id !== senderUserId);
  }
  if (senderUser.friendRequests) {
    senderUser.friendRequests.sent = senderUser.friendRequests.sent.filter(id => id !== currentUser.id);
    senderUser.friendRequests.received = senderUser.friendRequests.received.filter(id => id !== currentUser.id);
  }
  
  res.json({ message: 'Friend request accepted', user: {
    id: senderUser.id,
    username: senderUser.username,
    avatar: senderUser.avatar
  }});
});

// Refuser/Retirer une demande d'ami
router.delete('/request/:userId', authenticateToken, (req, res) => {
  const currentUser = req.user;
  const targetUserId = req.params.userId;
  
  const targetUser = getUserById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Retirer des demandes reçues (refuser)
  if (currentUser.friendRequests?.received?.includes(targetUserId)) {
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => id !== targetUserId);
    if (targetUser.friendRequests?.sent) {
      targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(id => id !== currentUser.id);
    }
  }
  
  // Retirer des demandes envoyées (annuler)
  if (currentUser.friendRequests?.sent?.includes(targetUserId)) {
    currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(id => id !== targetUserId);
    if (targetUser.friendRequests?.received) {
      targetUser.friendRequests.received = targetUser.friendRequests.received.filter(id => id !== currentUser.id);
    }
  }
  
  res.json({ message: 'Friend request removed' });
});

// Retirer un ami
router.delete('/:userId', authenticateToken, (req, res) => {
  const currentUser = req.user;
  const friendUserId = req.params.userId;
  
  const friendUser = getUserById(friendUserId);
  if (!friendUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Retirer des listes d'amis
  if (currentUser.friends) {
    currentUser.friends = currentUser.friends.filter(id => id !== friendUserId);
  }
  if (friendUser.friends) {
    friendUser.friends = friendUser.friends.filter(id => id !== currentUser.id);
  }
  
  res.json({ message: 'Friend removed' });
});

// Rechercher des utilisateurs (pour ajouter des amis)
router.get('/search', authenticateToken, (req, res) => {
  const query = req.query.q || '';
  const currentUser = req.user;
  
  if (query.length < 2) {
    return res.json({ users: [] });
  }
  
  const allUsers = getAllUsers();
  const searchResults = allUsers
    .filter(user => {
      if (user.id === currentUser.id) return false;
      const username = user.username.toLowerCase();
      return username.includes(query.toLowerCase());
    })
    .slice(0, 10)
    .map(user => {
      const isFriend = currentUser.friends?.includes(user.id) || false;
      const hasSentRequest = currentUser.friendRequests?.sent?.includes(user.id) || false;
      const hasReceivedRequest = currentUser.friendRequests?.received?.includes(user.id) || false;
      
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        mmr: user.mmr,
        stats: user.stats,
        isFriend,
        hasSentRequest,
        hasReceivedRequest
      };
    });
  
  res.json({ users: searchResults });
});

export default router;

